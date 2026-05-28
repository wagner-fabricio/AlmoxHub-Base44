import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Budget de tempo total da função (deixa margem antes do timeout HTTP de ~180s)
const TIME_BUDGET_MS = 150000;

// Wrapper com retry e backoff exponencial + jitter para rate limit
async function withRetry(operation, maxRetries = 6) {
  let lastError;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const msg = (error?.message || '').toLowerCase();
      const status = error?.response?.status || error?.status;
      const isRateLimit = status === 429 || msg.includes('rate limit') || msg.includes('429') || msg.includes('too many');
      if (!isRateLimit || attempt === maxRetries - 1) {
        throw error;
      }
      // Backoff mais agressivo: 1.5s, 3s, 6s, 12s, 24s + jitter
      const base = Math.pow(2, attempt) * 1500;
      const jitter = Math.floor(Math.random() * 600);
      await sleep(base + jitter);
    }
  }
  throw lastError;
}

// Processa uma OS individualmente
async function processarOS(base44, os, agora) {
  const sessoesAtivas = os.timesheet_sessoes_ativas || [];
  let totalMinutosAdicionados = 0;

  // Fechar TimeSheetEntries sequencialmente (evita rate limit dentro da OS)
  for (const sessao of sessoesAtivas) {
    const inicioDate = new Date(sessao.inicio);
    const fimDate = new Date(agora);
    const duracaoMinutos = Math.round((fimDate - inicioDate) / 60000);
    totalMinutosAdicionados += duracaoMinutos;

    if (sessao.entry_id) {
      await withRetry(() => base44.asServiceRole.entities.TimeSheetEntry.update(sessao.entry_id, {
        fim: agora,
        duracao_minutos: duracaoMinutos,
        status: 'closed',
        tipo_encerramento: 'auto_fim_expediente',
        pessoa_id_pausa: 'sistema',
        pessoa_nome_pausa: 'Sistema (corte automático 18h)'
      }));
    }

    // Fire and forget push notification
    base44.asServiceRole.functions.invoke('sendPushNotification', {
      pessoa_id: sessao.pessoa_id,
      title: 'TimeSheet pausado automaticamente',
      body: `Sua atividade na OS ${os.codigo} foi pausada às 18h. Lembre-se de retomar amanhã se necessário.`,
      url: `/OrdensServico?os_id=${os.id}`
    }).catch(() => {});
  }

  // Atualizar OS
  const novoTotal = (os.timesheet_total_minutos || 0) + totalMinutosAdicionados;
  await withRetry(() => base44.asServiceRole.entities.OrdemServico.update(os.id, {
    timesheet_status: 'paused',
    timesheet_sessoes_ativas: [],
    timesheet_total_minutos: novoTotal
  }));

  // Audit log (fire and forget - não crítico para o fluxo)
  base44.asServiceRole.entities.AuditLog.create({
    action: 'timesheet_auto_pause',
    entity_type: 'OrdemServico',
    entity_id: os.id,
    user_id: 'sistema',
    details: JSON.stringify({
      descricao: 'Pausado automaticamente às 18h',
      sessoes_pausadas: sessoesAtivas.length,
      minutos_adicionados: totalMinutosAdicionados
    }),
    timestamp: agora
  }).catch(() => {});

  return { os_id: os.id, codigo: os.codigo, sessoes: sessoesAtivas.length };
}

// Automação: Pausa todas as OS em play às 18h (America/Bahia)
Deno.serve(async (req) => {
  const inicioExecucao = Date.now();
  try {
    const base44 = createClientFromRequest(req);

    const osEmPlay = await withRetry(() =>
      base44.asServiceRole.entities.OrdemServico.filter({ timesheet_status: 'playing' })
    );

    if (!osEmPlay || osEmPlay.length === 0) {
      return Response.json({ message: 'Nenhuma OS em play. Nenhuma ação necessária.' });
    }

    const agora = new Date().toISOString();
    const sucessos = [];
    let falhas = [];
    let interrompido = false;

    // Processar SEQUENCIALMENTE (concorrência 1) com pequeno delay entre OS
    // para evitar rate limit. Cada OS faz ~3-4 chamadas internas.
    const DELAY_ENTRE_OS_MS = 250;
    for (let i = 0; i < osEmPlay.length; i++) {
      if (Date.now() - inicioExecucao > TIME_BUDGET_MS) {
        interrompido = true;
        const restantes = osEmPlay.slice(i);
        restantes.forEach(os => falhas.push({ os: os, erro: 'time_budget_exceeded' }));
        break;
      }
      try {
        const r = await processarOS(base44, osEmPlay[i], agora);
        sucessos.push(r);
      } catch (err) {
        falhas.push({ os: osEmPlay[i], erro: err?.message || String(err) });
      }
      if (i < osEmPlay.length - 1) await sleep(DELAY_ENTRE_OS_MS);
    }

    // Segunda passada: retentar OS que falharam por rate limit (uma vez, com delay maior)
    const recuperados = [];
    const falhasFinais = [];
    if (falhas.length > 0 && Date.now() - inicioExecucao < TIME_BUDGET_MS - 10000) {
      await sleep(3000); // pausa antes de retentar
      for (const f of falhas) {
        const msg = (f.erro || '').toLowerCase();
        const ehRateLimit = msg.includes('rate limit') || msg.includes('429') || msg.includes('too many');
        if (!ehRateLimit || f.erro === 'time_budget_exceeded') {
          falhasFinais.push({ os_id: f.os.id, codigo: f.os.codigo, erro: f.erro });
          continue;
        }
        if (Date.now() - inicioExecucao > TIME_BUDGET_MS) {
          falhasFinais.push({ os_id: f.os.id, codigo: f.os.codigo, erro: 'time_budget_exceeded' });
          continue;
        }
        try {
          const r = await processarOS(base44, f.os, agora);
          recuperados.push(r);
        } catch (err) {
          falhasFinais.push({ os_id: f.os.id, codigo: f.os.codigo, erro: err?.message || String(err) });
        }
        await sleep(500);
      }
    } else {
      falhas.forEach(f => falhasFinais.push({ os_id: f.os.id, codigo: f.os.codigo, erro: f.erro }));
    }

    return Response.json({
      success: true,
      total_os_em_play: osEmPlay.length,
      total_os_pausadas: sucessos.length + recuperados.length,
      total_falhas: falhasFinais.length,
      recuperados_na_segunda_passada: recuperados.length,
      interrompido_por_tempo: interrompido,
      duracao_ms: Date.now() - inicioExecucao,
      falhas: falhasFinais.slice(0, 20)
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});