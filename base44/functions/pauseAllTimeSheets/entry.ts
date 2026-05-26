import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Budget de tempo total da função (deixa margem antes do timeout HTTP de ~180s)
const TIME_BUDGET_MS = 150000;

// Wrapper com retry e backoff exponencial + jitter para rate limit
async function withRetry(operation, maxRetries = 4) {
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
      // Backoff: 800ms, 1.6s, 3.2s + jitter
      const base = Math.pow(2, attempt) * 800;
      const jitter = Math.floor(Math.random() * 400);
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
    const falhas = [];
    let interrompido = false;

    // Processar em pares (concorrência 2) para limitar rate limit
    const CONCURRENCY = 2;
    for (let i = 0; i < osEmPlay.length; i += CONCURRENCY) {
      // Verifica budget de tempo antes de iniciar próximo lote
      if (Date.now() - inicioExecucao > TIME_BUDGET_MS) {
        interrompido = true;
        const restantes = osEmPlay.slice(i);
        restantes.forEach(os => falhas.push({ os_id: os.id, codigo: os.codigo, erro: 'time_budget_exceeded' }));
        break;
      }

      const lote = osEmPlay.slice(i, i + CONCURRENCY);
      const resultados = await Promise.allSettled(lote.map(os => processarOS(base44, os, agora)));
      resultados.forEach((r, idx) => {
        if (r.status === 'fulfilled') {
          sucessos.push(r.value);
        } else {
          falhas.push({
            os_id: lote[idx].id,
            codigo: lote[idx].codigo,
            erro: r.reason?.message || String(r.reason)
          });
        }
      });
    }

    return Response.json({
      success: true,
      total_os_em_play: osEmPlay.length,
      total_os_pausadas: sucessos.length,
      total_falhas: falhas.length,
      interrompido_por_tempo: interrompido,
      duracao_ms: Date.now() - inicioExecucao,
      falhas: falhas.slice(0, 20) // limita resposta
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});