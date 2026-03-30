import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Automação: Envia lembrete às 17h para pessoas com OS em play
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Buscar todas as OS em playing
    const osEmPlay = await base44.asServiceRole.entities.OrdemServico.filter({ timesheet_status: 'playing' });

    if (!osEmPlay || osEmPlay.length === 0) {
      return Response.json({ message: 'Nenhuma OS em play. Nenhuma notificação enviada.' });
    }

    // Agrupar por pessoa para enviar uma notificação consolidada
    const porPessoa = {};
    for (const os of osEmPlay) {
      for (const sessao of (os.timesheet_sessoes_ativas || [])) {
        if (!porPessoa[sessao.pessoa_id]) {
          porPessoa[sessao.pessoa_id] = { pessoa_nome: sessao.pessoa_nome, os_list: [] };
        }
        porPessoa[sessao.pessoa_id].os_list.push(os.codigo);
      }
    }

    // Enviar notificação para cada pessoa
    for (const [pessoa_id, dados] of Object.entries(porPessoa)) {
      const qtd = dados.os_list.length;
      const body = qtd === 1
        ? `Lembrete: você tem 1 OS ativa (${dados.os_list[0]}). Não esqueça de pausar ao final do expediente às 18h.`
        : `Lembrete: você tem ${qtd} OS ativas. Não esqueça de pausar ao final do expediente às 18h.`;

      await base44.asServiceRole.functions.invoke('sendPushNotification', {
        pessoa_id,
        title: '⏰ Lembrete TimeSheet',
        body,
        url: '/OrdensServico?view=timesheet'
      }).catch(() => {});
    }

    return Response.json({ success: true, pessoas_notificadas: Object.keys(porPessoa).length });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});