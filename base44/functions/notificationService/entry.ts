import { ALERT_CONFIG } from './alertConfig.js';
import { logEstruturado } from './utils/logging.js';

/**
 * Valida os dados de uma pessoa antes de enviar notificação
 */
function validarPessoa(pessoa) {
  if (!pessoa) return { valid: false, error: 'Pessoa não encontrada' };
  if (!pessoa.email || pessoa.email.trim() === '') {
    return { valid: false, error: 'E-mail inválido ou vazio' };
  }
  if (!pessoa.id) return { valid: false, error: 'ID da pessoa não encontrado' };
  return { valid: true };
}

/**
 * Valida os dados de uma ordem de serviço
 */
function validarOrdem(os) {
  if (!os) return { valid: false, error: 'OS não encontrada' };
  if (!os.id) return { valid: false, error: 'ID da OS não encontrado' };
  if (!os.codigo) return { valid: false, error: 'Código da OS não encontrado' };
  return { valid: true };
}

/**
 * Verifica se um alerta já foi enviado hoje
 */
async function alertaJaEnviadoHoje(base44, osId, tipoAlerta, liderId) {
  try {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const hojeFim = new Date();
    hojeFim.setHours(23, 59, 59, 999);
    
    const alertasExistentes = await base44.entities.AlertaEnviado.list();
    
    const jaEnviado = alertasExistentes.some(alerta => {
      const dataEnvio = new Date(alerta.data_envio);
      return (
        alerta.os_id === osId &&
        alerta.tipo_alerta === tipoAlerta &&
        alerta.lider_id === liderId &&
        dataEnvio >= hoje &&
        dataEnvio <= hojeFim
      );
    });
    
    return jaEnviado;
  } catch (error) {
    logEstruturado('WARN', 'notificationService', 
      { osId, tipoAlerta, liderId }, 
      'Erro ao verificar idempotência', error);
    return false; // Em caso de erro, permite o envio
  }
}

/**
 * Registra o envio de um alerta
 */
async function registrarAlertaEnviado(base44, osId, tipoAlerta, liderId, success, erro = null) {
  try {
    await base44.entities.AlertaEnviado.create({
      os_id: osId,
      tipo_alerta: tipoAlerta,
      lider_id: liderId,
      data_envio: new Date().toISOString().split('T')[0],
      success,
      erro: erro || undefined
    });
  } catch (error) {
    logEstruturado('ERROR', 'notificationService', 
      { osId, tipoAlerta, liderId }, 
      'Erro ao registrar alerta enviado', error);
  }
}

/**
 * Envia notificação por e-mail e cria notificação no sistema
 * @param {Object} config - Configuração da notificação
 * @param {Object} config.base44 - Cliente Base44
 * @param {Object} config.destinatario - Pessoa destinatária
 * @param {string} config.tipo - Tipo do alerta
 * @param {string} config.assunto - Assunto do e-mail
 * @param {string} config.corpo - Corpo do e-mail (HTML)
 * @param {string} config.referencia_id - ID da referência (OS)
 * @param {string} config.referencia_tipo - Tipo da referência ('tarefa')
 * @param {string} config.mensagem - Mensagem da notificação do sistema
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function enviarNotificacaoEmail(config) {
  const {
    base44,
    destinatario,
    tipo,
    assunto,
    corpo,
    referencia_id,
    referencia_tipo,
    mensagem
  } = config;
  
  // Validar destinatário
  const validacaoPessoa = validarPessoa(destinatario);
  if (!validacaoPessoa.valid) {
    const erro = `Validação falhou: ${validacaoPessoa.error}`;
    logEstruturado('WARN', 'enviarNotificacaoEmail', 
      { destinatarioId: destinatario?.id, tipo }, 
      erro);
    return { success: false, error: erro };
  }
  
  // Verificar idempotência (se já foi enviado hoje)
  const jaEnviado = await alertaJaEnviadoHoje(
    base44, 
    referencia_id, 
    tipo, 
    destinatario.id
  );
  
  if (jaEnviado) {
    logEstruturado('INFO', 'enviarNotificacaoEmail', 
      { destinatarioEmail: destinatario.email, tipo, referencia_id }, 
      'Alerta já enviado hoje - pulando');
    return { success: true, skipped: true };
  }
  
  try {
    // Enviar e-mail
    await base44.integrations.Core.SendEmail({
      from_name: ALERT_CONFIG.EMAIL_FROM_NAME,
      to: destinatario.email,
      subject: assunto,
      body: corpo
    });
    
    // Criar notificação no sistema
    await base44.entities.Notificacao.create({
      destinatario_id: destinatario.id,
      tipo: 'mudanca_status',
      referencia_id,
      referencia_tipo,
      mensagem,
      lida: false
    });
    
    // Registrar sucesso
    await registrarAlertaEnviado(base44, referencia_id, tipo, destinatario.id, true);
    
    logEstruturado('INFO', 'enviarNotificacaoEmail', 
      { destinatarioEmail: destinatario.email, tipo, referencia_id }, 
      'Alerta enviado com sucesso');
    
    return { success: true };
  } catch (error) {
    const erroMsg = error.message || 'Erro desconhecido ao enviar notificação';
    
    logEstruturado('ERROR', 'enviarNotificacaoEmail', 
      { destinatarioEmail: destinatario.email, tipo, referencia_id }, 
      'Erro ao enviar notificação', error);
    
    // Registrar falha
    await registrarAlertaEnviado(base44, referencia_id, tipo, destinatario.id, false, erroMsg);
    
    return { success: false, error: erroMsg };
  }
}

/**
 * Valida e exporta funções auxiliares
 */
export { validarPessoa, validarOrdem };