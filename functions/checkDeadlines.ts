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

    // Criar todas as notificações in-app de uma vez (bulk)
    const todasNotificacoes = [];
    for (const os of ordensProximasPrazo) {
      const destinatarios = [os.lider_id, ...(os.executores_ids || [])].filter(Boolean);
      const destinatariosUnicos = [...new Set(destinatarios)];
      const diasRestantes = differenceInDays(new Date(os.prazo), hoje);
      const mensagem = diasRestantes === 0 
        ? `URGENTE: O prazo da OS ${os.codigo} vence HOJE!`
        : `A OS ${os.codigo} tem prazo em ${diasRestantes} dia${diasRestantes > 1 ? 's' : ''}`;

      destinatariosUnicos.forEach(pessoaId => {
        todasNotificacoes.push({
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
      });
    }

    // Criar todas as notificações de uma vez
    if (todasNotificacoes.length > 0) {
      await base44.asServiceRole.entities.Notificacao.bulkCreate(todasNotificacoes);
    }

    // Enviar push notifications com rate limiting agressivo
    const DELAY_ENTRE_PUSH = 500; // 500ms entre cada push
    let pushEnviados = 0;

    for (const os of ordensProximasPrazo) {
      const destinatarios = [os.lider_id, ...(os.executores_ids || [])].filter(Boolean);
      const destinatariosUnicos = [...new Set(destinatarios)];
      const diasRestantes = differenceInDays(new Date(os.prazo), hoje);
      const mensagem = diasRestantes === 0 
        ? `URGENTE: O prazo da OS ${os.codigo} vence HOJE!`
        : `A OS ${os.codigo} tem prazo em ${diasRestantes} dia${diasRestantes > 1 ? 's' : ''}`;

      for (const pessoaId of destinatariosUnicos) {
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
          pushEnviados++;
          // Delay entre cada push
          await new Promise(resolve => setTimeout(resolve, DELAY_ENTRE_PUSH));
        } catch (err) {
          console.error(`Erro ao enviar push para ${pessoaId}:`, err.message);
        }
      }
    }

    return Response.json({ 
      ordens_verificadas: ordensProximasPrazo.length,
      notificacoes_criadas: todasNotificacoes.length,
      push_enviados: pushEnviados
    });

  } catch (error) {
    console.error('Error checking deadlines:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});