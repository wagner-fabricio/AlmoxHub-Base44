import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const body = await req.json().catch(() => ({}));
  const modo = body.modo || 'pause'; // 'pause' | 'lembrete'

  // Buscar todas OS com status playing
  const ordensPlaying = await base44.asServiceRole.entities.OrdemServico.filter({
    timesheet_status: 'playing'
  });

  if (!ordensPlaying || ordensPlaying.length === 0) {
    return Response.json({ success: true, message: 'Nenhuma OS em play', total: 0 });
  }

  const agora = new Date().toISOString();
  let processadas = 0;

  for (const os of ordensPlaying) {
    const sessoesAtivas = os.timesheet_sessoes_ativas || [];
    if (sessoesAtivas.length === 0) continue;

    if (modo === 'lembrete') {
      // Enviar notificação para cada pessoa com sessão ativa
      for (const sessao of sessoesAtivas) {
        try {
          await base44.asServiceRole.entities.Notificacao.create({
            destinatario_id: sessao.pessoa_id,
            tipo: 'mencao',
            mensagem: `⏰ Lembrete: você tem uma atividade em andamento na OS ${os.codigo}. O sistema pausará automaticamente às 18h.`,
            lida: false,
            contexto_adicional: { os_id: os.id, os_codigo: os.codigo }
          });
        } catch (e) {
          // não bloquear
        }
      }
    } else {
      // Pausar cada sessão ativa
      let totalMinutosAdicionados = 0;

      for (const sessao of sessoesAtivas) {
        const inicioMs = new Date(sessao.inicio).getTime();
        const duracaoMinutos = Math.round((Date.now() - inicioMs) / 60000);
        totalMinutosAdicionados += duracaoMinutos;

        try {
          await base44.asServiceRole.entities.TimeSheetEntry.update(sessao.entrada_id, {
            fim: agora,
            duracao_minutos: duracaoMinutos,
            tipo_encerramento: 'auto_fim_expediente',
            status: 'closed'
          });
        } catch (e) {
          // entrada pode já estar fechada
        }
      }

      const novoTotal = (os.timesheet_total_minutos || 0) + totalMinutosAdicionados;

      await base44.asServiceRole.entities.OrdemServico.update(os.id, {
        timesheet_status: 'paused',
        timesheet_sessoes_ativas: [],
        timesheet_total_minutos: novoTotal
      });
    }

    processadas++;
  }

  return Response.json({
    success: true,
    modo,
    total_os_processadas: processadas,
    timestamp: agora
  });
});