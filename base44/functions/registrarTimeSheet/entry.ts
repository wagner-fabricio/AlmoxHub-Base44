import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { acao, os_id } = body; // acao: "play" | "pause" | "stop"

    if (!os_id || !acao) return Response.json({ error: 'os_id e acao são obrigatórios' }, { status: 400 });

    // Buscar OS e pessoa em paralelo
    const [ordens, pessoas] = await Promise.all([
      base44.asServiceRole.entities.OrdemServico.filter({ id: os_id }),
      base44.asServiceRole.entities.Pessoa.filter({ user_id: user.id })
    ]);

    const os = ordens[0];
    if (!os) return Response.json({ error: 'OS não encontrada' }, { status: 404 });

    const pessoa = pessoas[0];
    if (!pessoa) return Response.json({ error: 'Pessoa não encontrada' }, { status: 404 });

    // OS concluída ou cancelada não pode ter play
    if (acao === 'play' && (os.status === 'concluido' || os.status === 'cancelado')) {
      return Response.json({ error: 'Não é possível iniciar TimeSheet em OS concluída ou cancelada' }, { status: 400 });
    }

    const agora = new Date().toISOString();

    if (acao === 'play') {
      // Verificar se essa pessoa já tem sessão ativa nessa OS
      const sessoesAtivas = os.timesheet_sessoes_ativas || [];
      const jaTemSessao = sessoesAtivas.some(s => s.pessoa_id === pessoa.id);
      if (jaTemSessao) return Response.json({ message: 'Já em play', os }, { status: 200 });

      // Criar entrada no TimeSheetEntry
      const entry = await base44.asServiceRole.entities.TimeSheetEntry.create({
        os_id,
        os_codigo: os.codigo,
        pessoa_id: pessoa.id,
        pessoa_nome: pessoa.nome,
        inicio: agora,
        status: 'playing',
        iniciado_por_edicao: body.iniciado_por_edicao || false
      });

      const novasSessoes = [...sessoesAtivas, {
        pessoa_id: pessoa.id,
        pessoa_nome: pessoa.nome,
        inicio: agora,
        entry_id: entry.id
      }];

      // Merge em um único update: timesheet + mudança de status se for a primeira sessão em elaboracao
      const updatePayload = {
        timesheet_status: 'playing',
        timesheet_sessoes_ativas: novasSessoes
      };
      if (sessoesAtivas.length === 0 && os.status === 'elaboracao') {
        updatePayload.status = 'execucao';
      }

      const osAtualizada = await base44.asServiceRole.entities.OrdemServico.update(os_id, updatePayload);

      // Registrar no audit log
      await base44.asServiceRole.entities.AuditLog.create({
        action: 'timesheet_play',
        entity_type: 'OrdemServico',
        entity_id: os_id,
        user_id: user.id,
        details: JSON.stringify({ pessoa_nome: pessoa.nome, inicio: agora }),
        timestamp: agora
      });

      return Response.json({ success: true, acao: 'play', entry, os: osAtualizada });

    } else if (acao === 'pause' || acao === 'stop') {
      // Quem pode pausar: própria pessoa ou gestor da regional
      const sessoesAtivas = os.timesheet_sessoes_ativas || [];

      // Encontrar sessão da pessoa que pediu o pause (ou do outro usuário se gestor pausar todos)
      const pessoa_id_alvo = body.pessoa_id_alvo || pessoa.id;
      const sessao = sessoesAtivas.find(s => s.pessoa_id === pessoa_id_alvo);

      if (!sessao) return Response.json({ error: 'Nenhuma sessão ativa encontrada para esta pessoa' }, { status: 404 });

      // Calcular duração
      const inicioDate = new Date(sessao.inicio);
      const fimDate = new Date(agora);
      const duracaoMinutos = Math.round((fimDate - inicioDate) / 60000);

      // Fechar o TimeSheetEntry
      await base44.asServiceRole.entities.TimeSheetEntry.update(sessao.entry_id, {
        fim: agora,
        duracao_minutos: duracaoMinutos,
        status: 'closed',
        tipo_encerramento: acao,
        pessoa_id_pausa: pessoa.id,
        pessoa_nome_pausa: pessoa.nome
      });

      // Remover sessão da lista e atualizar total de minutos
      const novasSessoes = sessoesAtivas.filter(s => s.pessoa_id !== pessoa_id_alvo);
      const novoTotal = (os.timesheet_total_minutos || 0) + duracaoMinutos;
      const novoStatus = novasSessoes.length > 0 ? 'playing' : (acao === 'stop' ? 'idle' : 'paused');

      const osAtualizada = await base44.asServiceRole.entities.OrdemServico.update(os_id, {
        timesheet_total_minutos: novoTotal,
        timesheet_status: novoStatus,
        timesheet_sessoes_ativas: novasSessoes
      });

      // Registrar no audit log
      await base44.asServiceRole.entities.AuditLog.create({
        action: `timesheet_${acao}`,
        entity_type: 'OrdemServico',
        entity_id: os_id,
        user_id: user.id,
        details: JSON.stringify({
          pessoa_nome_inicio: sessao.pessoa_nome,
          pessoa_nome_pausa: pessoa.nome,
          inicio: sessao.inicio,
          fim: agora,
          duracao_minutos: duracaoMinutos
        }),
        timestamp: agora
      });

      return Response.json({ success: true, acao, duracaoMinutos, os: osAtualizada });
    }

    return Response.json({ error: 'Ação inválida' }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});