import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Encerra todas as sessões ativas de TimeSheet de uma OS
// Chamada quando a OS muda para status 'concluido' ou 'cancelado'
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { os_id } = body;

    if (!os_id) return Response.json({ error: 'os_id é obrigatório' }, { status: 400 });

    const ordens = await base44.asServiceRole.entities.OrdemServico.filter({ id: os_id });
    const os = ordens[0];
    if (!os) return Response.json({ error: 'OS não encontrada' }, { status: 404 });

    // Verificar se o usuário tem acesso à OS (é líder, executor ou admin)
    const pessoa = await base44.entities.Pessoa.filter({ user_id: user.id }).then(p => p[0]);
    const temAcesso = user.role === 'admin' ||
      os.lider_id === pessoa?.id ||
      (os.executores_ids || []).includes(pessoa?.id) ||
      pessoa?.funcoes?.includes('gestor');
    if (!temAcesso) {
      return Response.json({ error: 'Sem permissão para encerrar TimeSheet desta OS' }, { status: 403 });
    }

    const sessoesAtivas = os.timesheet_sessoes_ativas || [];

    // Nenhuma sessão ativa — nada a fazer
    if (sessoesAtivas.length === 0) {
      return Response.json({ success: true, message: 'Nenhuma sessão ativa', sessoes_encerradas: 0 });
    }

    const agora = new Date().toISOString();
    let totalMinutosAdicionados = 0;

    // Fechar cada TimeSheetEntry ativo
    for (const sessao of sessoesAtivas) {
      const inicioDate = new Date(sessao.inicio);
      const duracaoMinutos = Math.round((new Date(agora) - inicioDate) / 60000);
      totalMinutosAdicionados += duracaoMinutos;

      if (sessao.entry_id) {
        await base44.asServiceRole.entities.TimeSheetEntry.update(sessao.entry_id, {
          fim: agora,
          duracao_minutos: duracaoMinutos,
          status: 'closed',
          tipo_encerramento: 'stop',
          pessoa_id_pausa: user.id,
          pessoa_nome_pausa: 'Sistema (OS concluída/cancelada)'
        });
      }
    }

    // Atualizar OS: zerar sessões ativas, acumular minutos, status idle
    const novoTotal = (os.timesheet_total_minutos || 0) + totalMinutosAdicionados;
    const osAtualizada = await base44.asServiceRole.entities.OrdemServico.update(os_id, {
      timesheet_status: 'idle',
      timesheet_sessoes_ativas: [],
      timesheet_total_minutos: novoTotal
    });

    await base44.asServiceRole.entities.AuditLog.create({
      action: 'timesheet_stop_conclusao',
      entity_type: 'OrdemServico',
      entity_id: os_id,
      user_id: user.id,
      details: JSON.stringify({
        descricao: 'TimeSheet encerrado por mudança de status para concluído/cancelado',
        sessoes_encerradas: sessoesAtivas.length,
        minutos_adicionados: totalMinutosAdicionados
      }),
      timestamp: agora
    });

    return Response.json({ success: true, sessoes_encerradas: sessoesAtivas.length, minutos_adicionados: totalMinutosAdicionados, os: osAtualizada });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});