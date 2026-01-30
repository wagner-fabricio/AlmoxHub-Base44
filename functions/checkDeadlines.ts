import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { differenceInDays } from 'npm:date-fns@3.6.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    // Apenas admin pode executar esta função agendada
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const hoje = new Date();
    
    // Buscar OS ativas com prazo nos próximos 3 dias
    const ordens = await base44.asServiceRole.entities.OrdemServico.filter({
      status: { $in: ['elaboracao', 'execucao'] }
    });

    const ordensProximasPrazo = ordens.filter(os => {
      if (!os.prazo) return false;
      const diasRestantes = differenceInDays(new Date(os.prazo), hoje);
      return diasRestantes >= 0 && diasRestantes <= 3;
    });

    const notificacoesEnviadas = [];

    for (const os of ordensProximasPrazo) {
      // Notificar líder e executores
      const destinatarios = [os.lider_id, ...(os.executores_ids || [])].filter(Boolean);
      const destinatariosUnicos = [...new Set(destinatarios)];

      const diasRestantes = differenceInDays(new Date(os.prazo), hoje);
      const mensagem = diasRestantes === 0 
        ? `URGENTE: O prazo da OS ${os.codigo} vence HOJE!`
        : `A OS ${os.codigo} tem prazo em ${diasRestantes} dia${diasRestantes > 1 ? 's' : ''}`;

      for (const pessoaId of destinatariosUnicos) {
        // Criar notificação in-app
        await base44.asServiceRole.entities.Notificacao.create({
          destinatario_id: pessoaId,
          tipo: 'mudanca_status',
          referencia_id: os.id,
          referencia_tipo: 'tarefa',
          mensagem,
          lida: false,
          contexto_adicional: {
            os_codigo: os.codigo,
            prazo: os.prazo,
            dias_restantes: diasRestantes
          }
        });

        // Enviar push notification
        try {
          await base44.asServiceRole.functions.invoke('sendPushNotification', {
            pessoa_id: pessoaId,
            notification_type: 'deadline_approaching',
            title: diasRestantes === 0 ? '⏰ Prazo vencendo HOJE' : `📅 Prazo em ${diasRestantes} dia${diasRestantes > 1 ? 's' : ''}`,
            body: mensagem,
            data: {
              os_id: os.id,
              os_codigo: os.codigo,
              url: `/OrdensServico?os_id=${os.id}`
            }
          });
          notificacoesEnviadas.push({ os_codigo: os.codigo, pessoa_id: pessoaId });
        } catch (pushError) {
          console.error('Erro ao enviar push:', pushError);
        }
      }
    }

    return Response.json({ 
      ordens_verificadas: ordensProximasPrazo.length,
      notificacoes_enviadas: notificacoesEnviadas.length,
      detalhes: notificacoesEnviadas
    });

  } catch (error) {
    console.error('Error checking deadlines:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});