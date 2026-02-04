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

    // Processar em lotes de 10 para evitar timeout
    const LOTE_TAMANHO = 10;
    const notificacoesEnviadas = [];
    
    for (let i = 0; i < ordensProximasPrazo.length; i += LOTE_TAMANHO) {
      const lote = ordensProximasPrazo.slice(i, i + LOTE_TAMANHO);
      
      // Processar todas as OS do lote em paralelo
      const resultadosLote = await Promise.allSettled(
        lote.map(async (os) => {
          const destinatarios = [os.lider_id, ...(os.executores_ids || [])].filter(Boolean);
          const destinatariosUnicos = [...new Set(destinatarios)];

          const diasRestantes = differenceInDays(new Date(os.prazo), hoje);
          const mensagem = diasRestantes === 0 
            ? `URGENTE: O prazo da OS ${os.codigo} vence HOJE!`
            : `A OS ${os.codigo} tem prazo em ${diasRestantes} dia${diasRestantes > 1 ? 's' : ''}`;

          // Criar todas as notificações em paralelo
          const notificacoes = destinatariosUnicos.map(pessoaId => ({
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
          }));

          // Bulk create notificações
          if (notificacoes.length > 0) {
            await base44.asServiceRole.entities.Notificacao.bulkCreate(notificacoes);
          }

          // Enviar push notifications em paralelo
          const pushResults = await Promise.allSettled(
            destinatariosUnicos.map(pessoaId => 
              base44.asServiceRole.functions.invoke('sendPushNotification', {
                pessoa_id: pessoaId,
                notification_type: 'deadline_approaching',
                title: diasRestantes === 0 ? '⏰ Prazo vencendo HOJE' : `📅 Prazo em ${diasRestantes} dia${diasRestantes > 1 ? 's' : ''}`,
                body: mensagem,
                data: {
                  os_id: os.id,
                  os_codigo: os.codigo,
                  url: `/OrdensServico?os_id=${os.id}`
                }
              }).catch(err => ({ error: err.message }))
            )
          );

          return {
            os_codigo: os.codigo,
            notificacoes_criadas: notificacoes.length,
            push_enviados: pushResults.filter(r => r.status === 'fulfilled').length
          };
        })
      );

      // Coletar resultados bem-sucedidos
      resultadosLote.forEach(result => {
        if (result.status === 'fulfilled') {
          notificacoesEnviadas.push(result.value);
        }
      });
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