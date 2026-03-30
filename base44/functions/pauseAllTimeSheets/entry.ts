import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Automação: Pausa todas as OS em play às 18h (America/Bahia)
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Buscar todas as OS em playing
    const osEmPlay = await base44.asServiceRole.entities.OrdemServico.filter({ timesheet_status: 'playing' });

    if (!osEmPlay || osEmPlay.length === 0) {
      return Response.json({ message: 'Nenhuma OS em play. Nenhuma ação necessária.' });
    }

    const agora = new Date().toISOString();
    const resultados = [];

    for (const os of osEmPlay) {
      const sessoesAtivas = os.timesheet_sessoes_ativas || [];
      let totalMinutosAdicionados = 0;

      for (const sessao of sessoesAtivas) {
        const inicioDate = new Date(sessao.inicio);
        const fimDate = new Date(agora);
        const duracaoMinutos = Math.round((fimDate - inicioDate) / 60000);
        totalMinutosAdicionados += duracaoMinutos;

        // Fechar o TimeSheetEntry
        if (sessao.entry_id) {
          await base44.asServiceRole.entities.TimeSheetEntry.update(sessao.entry_id, {
            fim: agora,
            duracao_minutos: duracaoMinutos,
            status: 'closed',
            tipo_encerramento: 'auto_fim_expediente',
            pessoa_id_pausa: 'sistema',
            pessoa_nome_pausa: 'Sistema (corte automático 18h)'
          });
        }

        // Enviar notificação push para a pessoa
        base44.asServiceRole.functions.invoke('sendPushNotification', {
          pessoa_id: sessao.pessoa_id,
          title: 'TimeSheet pausado automaticamente',
          body: `Sua atividade na OS ${os.codigo} foi pausada às 18h. Lembre-se de retomar amanhã se necessário.`,
          url: `/OrdensServico?os_id=${os.id}`
        }).catch(() => {});
      }

      // Atualizar OS
      const novoTotal = (os.timesheet_total_minutos || 0) + totalMinutosAdicionados;
      await base44.asServiceRole.entities.OrdemServico.update(os.id, {
        timesheet_status: 'paused',
        timesheet_sessoes_ativas: [],
        timesheet_total_minutos: novoTotal
      });

      // Registrar no audit log
      await base44.asServiceRole.entities.AuditLog.create({
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
      });

      resultados.push({ os_id: os.id, codigo: os.codigo, sessoes: sessoesAtivas.length });
    }

    return Response.json({ success: true, total_os_pausadas: osEmPlay.length, resultados });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});