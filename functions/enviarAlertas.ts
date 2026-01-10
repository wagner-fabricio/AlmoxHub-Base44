import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { requireAuth, checkRateLimit } from './middleware/auth.js';

/**
 * Função para enviar alertas automáticos sobre OSs críticas
 * Executa diariamente para identificar e notificar sobre problemas
 * REQUER: Autenticação e perfil de gestor ou admin
 */
export default async function enviarAlertas(req) {
  // Verificar autenticação e autorização
  const auth = await requireAuth(req, { requiredRole: 'gestor' });
  
  if (auth.error) {
    return auth.response;
  }
  
  const { user, pessoa, base44 } = auth;
  
  // Rate limiting: máximo 5 requisições por hora
  const rateLimit = checkRateLimit(user.id, 5, 3600000);
  if (!rateLimit.allowed) {
    return rateLimit.response;
  }
  
  try {
    // Buscar todas as OSs ativas
    const ordens = await base44.asServiceRole.entities.OrdemServico.list();
    const pessoas = await base44.asServiceRole.entities.Pessoa.list();
    const categorias = await base44.asServiceRole.entities.Categoria.list();
    
    const hoje = new Date();
    const categoriaExpedicao = categorias.find(c => c.nome?.toLowerCase().includes('expedi'));
    
    // 1. ALTA PRIORIDADE: Ordens Atrasadas
    const ordensAtrasadas = ordens.filter(os => 
      os.prazo && 
      os.status !== 'concluido' && 
      os.status !== 'cancelado' &&
      new Date(os.prazo) < hoje
    );
    
    for (const os of ordensAtrasadas) {
      const lider = pessoas.find(p => p.id === os.lider_id);
      if (lider?.email) {
        const diasAtraso = Math.floor((hoje - new Date(os.prazo)) / (1000 * 60 * 60 * 24));
        
        await base44.asServiceRole.integrations.Core.SendEmail({
          from_name: 'AlmoxHub - Sistema de Alertas',
          to: lider.email,
          subject: `⚠️ URGENTE: OS ${os.codigo} está atrasada`,
          body: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #ffffff; padding: 30px; border: 2px solid #dc2626; }
                .alert-box { background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
                .info { background: #f9f9f9; padding: 15px; margin: 20px 0; border-radius: 8px; }
                .info-item { margin: 8px 0; }
                .label { font-weight: bold; color: #dc2626; }
                .footer { background: #f5f5f5; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; color: #666; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>⚠️ Alerta de Atraso</h1>
                  <p style="font-size: 18px; margin: 10px 0 0 0;">Ordem de Serviço Atrasada</p>
                </div>
                <div class="content">
                  <p>Olá <strong>${lider.nome}</strong>,</p>
                  
                  <div class="alert-box">
                    <h3 style="margin-top: 0; color: #dc2626;">⚠️ Atenção Necessária</h3>
                    <p>A Ordem de Serviço sob sua responsabilidade está <strong>${diasAtraso} dia${diasAtraso > 1 ? 's' : ''} atrasada</strong> e requer ação imediata.</p>
                  </div>
                  
                  <div class="info">
                    <h3 style="margin-top: 0; color: #dc2626;">Detalhes da OS</h3>
                    <div class="info-item"><span class="label">Código:</span> ${os.codigo}</div>
                    <div class="info-item"><span class="label">Prazo Original:</span> ${new Date(os.prazo).toLocaleDateString('pt-BR')}</div>
                    <div class="info-item"><span class="label">Dias em Atraso:</span> ${diasAtraso} dia${diasAtraso > 1 ? 's' : ''}</div>
                    <div class="info-item"><span class="label">Status Atual:</span> ${os.status === 'elaboracao' ? 'Em Elaboração' : 'Em Execução'}</div>
                    <div class="info-item"><span class="label">Progresso:</span> ${os.progresso || 0}%</div>
                  </div>
                  
                  <p><strong>Ações Recomendadas:</strong></p>
                  <ul>
                    <li>Verifique o status atual da OS no sistema</li>
                    <li>Atualize o progresso e as informações relevantes</li>
                    <li>Se necessário, reavalie o prazo ou realoque recursos</li>
                    <li>Entre em contato com a equipe se houver impedimentos</li>
                  </ul>
                  
                  <p style="margin-top: 30px;">Atenciosamente,<br><strong>Sistema AlmoxHub</strong></p>
                </div>
                <div class="footer">
                  <p>Este é um alerta automático do sistema AlmoxHub. Por favor, não responda a este e-mail.</p>
                  <p style="color: #0000FF; font-weight: bold; margin-top: 10px;">Axia Energia</p>
                </div>
              </div>
            </body>
            </html>
          `
        });
        
        // Criar notificação no sistema
        await base44.asServiceRole.entities.Notificacao.create({
          destinatario_id: lider.id,
          tipo: 'mudanca_status',
          referencia_id: os.id,
          referencia_tipo: 'tarefa',
          mensagem: `A OS ${os.codigo} está ${diasAtraso} dia${diasAtraso > 1 ? 's' : ''} atrasada`,
          lida: false
        });
      }
    }
    
    // 2. MÉDIA PRIORIDADE: Ordens Paradas (sem atualização há 7+ dias)
    const ordensParadas = ordens.filter(os =>
      os.status !== 'concluido' && 
      os.status !== 'cancelado' &&
      os.updated_date && 
      Math.floor((hoje - new Date(os.updated_date)) / (1000 * 60 * 60 * 24)) > 7
    );
    
    for (const os of ordensParadas) {
      const lider = pessoas.find(p => p.id === os.lider_id);
      if (lider?.email) {
        const diasParada = Math.floor((hoje - new Date(os.updated_date)) / (1000 * 60 * 60 * 24));
        
        await base44.asServiceRole.integrations.Core.SendEmail({
          from_name: 'AlmoxHub - Sistema de Alertas',
          to: lider.email,
          subject: `📊 OS ${os.codigo} sem movimentação há ${diasParada} dias`,
          body: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #ffffff; padding: 30px; border: 2px solid #f59e0b; }
                .warning-box { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
                .info { background: #f9f9f9; padding: 15px; margin: 20px 0; border-radius: 8px; }
                .label { font-weight: bold; color: #f59e0b; }
                .footer { background: #f5f5f5; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; color: #666; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>📊 Alerta de Inatividade</h1>
                  <p style="font-size: 18px; margin: 10px 0 0 0;">OS sem Movimentação</p>
                </div>
                <div class="content">
                  <p>Olá <strong>${lider.nome}</strong>,</p>
                  
                  <div class="warning-box">
                    <p>A OS <strong>${os.codigo}</strong> não possui atualizações há <strong>${diasParada} dias</strong>.</p>
                  </div>
                  
                  <div class="info">
                    <p><span class="label">Código:</span> ${os.codigo}</p>
                    <p><span class="label">Última Atualização:</span> ${new Date(os.updated_date).toLocaleDateString('pt-BR')}</p>
                    <p><span class="label">Status:</span> ${os.status === 'elaboracao' ? 'Em Elaboração' : 'Em Execução'}</p>
                  </div>
                  
                  <p>Por favor, verifique se há algum impedimento ou se é necessário atualizar o status desta OS.</p>
                  
                  <p style="margin-top: 30px;">Atenciosamente,<br><strong>Sistema AlmoxHub</strong></p>
                </div>
                <div class="footer">
                  <p>Este é um alerta automático do sistema AlmoxHub.</p>
                  <p style="color: #0000FF; font-weight: bold; margin-top: 10px;">Axia Energia</p>
                </div>
              </div>
            </body>
            </html>
          `
        });
      }
    }
    
    // 3. MÉDIA PRIORIDADE: Expedições sem Seguro
    const expedicoesSemSeguro = ordens.filter(os => 
      os.categoria_id === categoriaExpedicao?.id &&
      os.status !== 'concluido' && 
      os.status !== 'cancelado' &&
      os.detalhamento_expedicao?.some(exp => !exp.usar_seguro)
    );
    
    for (const os of expedicoesSemSeguro) {
      const lider = pessoas.find(p => p.id === os.lider_id);
      if (lider?.email) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          from_name: 'AlmoxHub - Sistema de Alertas',
          to: lider.email,
          subject: `🛡️ Expedição ${os.codigo} sem cobertura de seguro`,
          body: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #ffffff; padding: 30px; border: 2px solid #3b82f6; }
                .info-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; }
                .footer { background: #f5f5f5; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; color: #666; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🛡️ Alerta de Seguro</h1>
                </div>
                <div class="content">
                  <p>Olá <strong>${lider.nome}</strong>,</p>
                  
                  <div class="info-box">
                    <p>A expedição <strong>${os.codigo}</strong> possui transporte <strong>sem cobertura de seguro ativada</strong>.</p>
                  </div>
                  
                  <p>Recomendamos avaliar a necessidade de ativar o seguro para proteger os materiais durante o transporte.</p>
                  
                  <p style="margin-top: 30px;">Atenciosamente,<br><strong>Sistema AlmoxHub</strong></p>
                </div>
                <div class="footer">
                  <p>Este é um alerta automático do sistema AlmoxHub.</p>
                  <p style="color: #0000FF; font-weight: bold; margin-top: 10px;">Axia Energia</p>
                </div>
              </div>
            </body>
            </html>
          `
        });
      }
    }
    
    // 4. MÉDIA PRIORIDADE: Expedições sem Transporte Definido
    const expedicoesSemTransporte = ordens.filter(os => 
      os.categoria_id === categoriaExpedicao?.id &&
      os.status !== 'concluido' && 
      os.status !== 'cancelado' &&
      (!os.detalhamento_expedicao || os.detalhamento_expedicao.length === 0)
    );
    
    for (const os of expedicoesSemTransporte) {
      const lider = pessoas.find(p => p.id === os.lider_id);
      if (lider?.email) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          from_name: 'AlmoxHub - Sistema de Alertas',
          to: lider.email,
          subject: `🚚 Expedição ${os.codigo} sem transporte definido`,
          body: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #ffffff; padding: 30px; border: 2px solid #6366f1; }
                .info-box { background: #eef2ff; border-left: 4px solid #6366f1; padding: 15px; margin: 20px 0; }
                .footer { background: #f5f5f5; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; color: #666; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🚚 Alerta de Transporte</h1>
                </div>
                <div class="content">
                  <p>Olá <strong>${lider.nome}</strong>,</p>
                  
                  <div class="info-box">
                    <p>A expedição <strong>${os.codigo}</strong> ainda <strong>não possui informações de transporte</strong> cadastradas.</p>
                  </div>
                  
                  <p>Por favor, complete o detalhamento da expedição com as informações de transporte, transportadora, veículo e motorista.</p>
                  
                  <p style="margin-top: 30px;">Atenciosamente,<br><strong>Sistema AlmoxHub</strong></p>
                </div>
                <div class="footer">
                  <p>Este é um alerta automático do sistema AlmoxHub.</p>
                  <p style="color: #0000FF; font-weight: bold; margin-top: 10px;">Axia Energia</p>
                </div>
              </div>
            </body>
            </html>
          `
        });
      }
    }
    
    // Registrar auditoria
    await base44.asServiceRole.entities.AuditLog.create({
      action: 'enviar_alertas',
      entity_type: 'OrdemServico',
      entity_id: null,
      user_id: user.id,
      details: JSON.stringify({
        ordensAtrasadas: ordensAtrasadas.length,
        ordensParadas: ordensParadas.length,
        expedicoesSemSeguro: expedicoesSemSeguro.length,
        expedicoesSemTransporte: expedicoesSemTransporte.length
      }),
      timestamp: new Date().toISOString()
    });
    
    return Response.json({
      success: true,
      summary: {
        ordensAtrasadas: ordensAtrasadas.length,
        ordensParadas: ordensParadas.length,
        expedicoesSemSeguro: expedicoesSemSeguro.length,
        expedicoesSemTransporte: expedicoesSemTransporte.length,
        totalAlertasEnviados: ordensAtrasadas.length + ordensParadas.length + 
                              expedicoesSemSeguro.length + expedicoesSemTransporte.length
      }
    });
    
  } catch (error) {
    console.error('Erro ao enviar alertas:', error);
    return Response.json({ success: false, error: 'Erro ao processar alertas' }, { status: 500 });
  }
}