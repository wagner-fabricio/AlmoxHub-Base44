import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Buscar todas configurações de alerta ativas
    const configs = await base44.asServiceRole.entities.AlertaConfig.filter({ ativo: true });
    
    if (!configs || configs.length === 0) {
      return Response.json({ message: 'Nenhuma configuração de alerta ativa', alertas_disparados: 0 });
    }

    let alertasDisparados = 0;
    const hoje = new Date();

    // Para cada configuração de alerta
    for (const config of configs) {
      let osParaAlertar = [];
      
      // Buscar OS com base nos filtros
      let query = {};
      if (config.filtros?.regional_id) query.regional_id = config.filtros.regional_id;
      if (config.filtros?.almoxarifado_id) query.almoxarifado_id = config.filtros.almoxarifado_id;
      if (config.filtros?.categoria_id) query.categoria_id = config.filtros.categoria_id;

      const ordens = await base44.asServiceRole.entities.OrdemServico.filter(query);

      // Verificar condição por tipo de alerta
      for (const os of ordens) {
        let shouldAlert = false;

        switch (config.tipo_alerta) {
          case 'atraso_os':
            // OS em execução com prazo vencido
            if (os.status === 'execucao' && os.prazo) {
              const prazo = new Date(os.prazo);
              if (hoje > prazo) shouldAlert = true;
            }
            break;

          case 'prazo_proximo':
            // OS com prazo próximo (threshold_dias dias)
            if (os.status !== 'concluido' && os.prazo && config.threshold_dias) {
              const prazo = new Date(os.prazo);
              const diasRestantes = Math.ceil((prazo - hoje) / (1000 * 60 * 60 * 24));
              if (diasRestantes <= config.threshold_dias && diasRestantes >= 0) {
                shouldAlert = true;
              }
            }
            break;

          case 'progresso_baixo':
            // OS com progresso abaixo do threshold
            if (os.status === 'execucao' && config.threshold_percentual) {
              if ((os.progresso || 0) < config.threshold_percentual) {
                shouldAlert = true;
              }
            }
            break;

          case 'inatividade':
            // OS sem atualização há X dias
            if (os.status === 'execucao' && config.threshold_dias) {
              const updated = new Date(os.updated_date);
              const diasSemUpdate = Math.floor((hoje - updated) / (1000 * 60 * 60 * 24));
              if (diasSemUpdate >= config.threshold_dias) {
                shouldAlert = true;
              }
            }
            break;

          case 'sem_movimentacao':
            // OS em elaboração há muito tempo
            if (os.status === 'elaboracao' && config.threshold_dias) {
              const created = new Date(os.created_date);
              const diasEmElaboracao = Math.floor((hoje - created) / (1000 * 60 * 60 * 24));
              if (diasEmElaboracao >= config.threshold_dias) {
                shouldAlert = true;
              }
            }
            break;
        }

        if (shouldAlert) {
          osParaAlertar.push(os);
        }
      }

      // Se encontrou OS para alertar, criar notificações + push consolidado
      if (osParaAlertar.length > 0) {
        const destinatarios = config.destinatarios_ids || [];

        // 1. Criar TODAS as notificações in-app de uma vez (bulkCreate)
        const notificacoesParaCriar = [];
        for (const destinatarioId of destinatarios) {
          for (const os of osParaAlertar) {
            notificacoesParaCriar.push({
              destinatario_id: destinatarioId,
              remetente_id: config.user_id,
              tipo: 'mudanca_status',
              referencia_id: os.id,
              referencia_tipo: 'tarefa',
              mensagem: `Alerta "${config.nome}": OS ${os.codigo} - ${getTipoAlertaMessage(config.tipo_alerta, os, config)}`,
              lida: false,
              contexto_adicional: {
                alerta_config_id: config.id,
                tipo_alerta: config.tipo_alerta
              }
            });
            alertasDisparados++;
          }
        }

        if (notificacoesParaCriar.length > 0) {
          await base44.asServiceRole.entities.Notificacao.bulkCreate(notificacoesParaCriar);
        }

        // 2. Push consolidado: 1 push por destinatário (em vez de N×M pushes)
        if (config.canal === 'push' || config.canal === 'todos') {
          const recipients = destinatarios.map(destinatarioId => {
            const qtd = osParaAlertar.length;
            const body = qtd === 1
              ? `OS ${osParaAlertar[0].codigo} requer atenção`
              : `${qtd} OSs requerem atenção (alerta "${config.nome}")`;
            return {
              pessoa_id: destinatarioId,
              notification_type: 'deadline_approaching',
              title: `Alerta: ${config.nome}`,
              body,
              data: { tipo: 'alerta_customizado', alerta_config_id: config.id }
            };
          });

          if (recipients.length > 0) {
            try {
              await base44.asServiceRole.functions.invoke('sendPushNotification', { recipients });
            } catch (e) {
              console.log('Push notification error:', e.message);
            }
          }
        }

        // E-mails de notificação desativados por política — não enviar.
      }
    }

    return Response.json({ 
      message: 'Alertas processados com sucesso',
      configs_verificadas: configs.length,
      alertas_disparados: alertasDisparados
    });

  } catch (error) {
    console.error('Error checking custom alerts:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function getTipoAlertaMessage(tipo, os, config) {
  const hoje = new Date();
  
  switch (tipo) {
    case 'atraso_os':
      return `OS atrasada. Prazo: ${new Date(os.prazo).toLocaleDateString('pt-BR')}`;
    case 'prazo_proximo':
      const prazo = new Date(os.prazo);
      const dias = Math.ceil((prazo - hoje) / (1000 * 60 * 60 * 24));
      return `Prazo se aproximando (${dias} dias restantes)`;
    case 'progresso_baixo':
      return `Progresso baixo: ${os.progresso || 0}% (threshold: ${config.threshold_percentual}%)`;
    case 'inatividade':
      const updated = new Date(os.updated_date);
      const diasSemUpdate = Math.floor((hoje - updated) / (1000 * 60 * 60 * 24));
      return `Sem atualização há ${diasSemUpdate} dias`;
    case 'sem_movimentacao':
      const created = new Date(os.created_date);
      const diasEmElaboracao = Math.floor((hoje - created) / (1000 * 60 * 60 * 24));
      return `Em elaboração há ${diasEmElaboracao} dias`;
    default:
      return 'Condição de alerta atendida';
  }
}