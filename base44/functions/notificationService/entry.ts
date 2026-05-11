// Serviço de notificação — apenas notificações in-app
// E-mail de alertas de OS desativado (mantido apenas para aprovação de usuários)

function validarPessoa(pessoa) {
  if (!pessoa) return { valid: false, error: 'Pessoa não encontrada' };
  if (!pessoa.id) return { valid: false, error: 'ID da pessoa não encontrado' };
  return { valid: true };
}

function validarOrdem(os) {
  if (!os) return { valid: false, error: 'OS não encontrada' };
  if (!os.id) return { valid: false, error: 'ID da OS não encontrado' };
  if (!os.codigo) return { valid: false, error: 'Código da OS não encontrado' };
  return { valid: true };
}

async function alertaJaEnviadoHoje(base44, osId, tipoAlerta, liderId) {
  try {
    const hojeStr = new Date().toISOString().split('T')[0];
    // Filtro server-side: traz apenas registros específicos em vez de listar tudo
    const alertasExistentes = await base44.entities.AlertaEnviado.filter({
      os_id: osId,
      tipo_alerta: tipoAlerta,
      lider_id: liderId,
      data_envio: hojeStr
    });
    return alertasExistentes && alertasExistentes.length > 0;
  } catch {
    return false;
  }
}

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
  } catch { /* ignorar erros de registro */ }
}

export async function enviarNotificacaoEmail(config) {
  const { base44, destinatario, tipo, referencia_id, referencia_tipo, mensagem } = config;

  const validacaoPessoa = validarPessoa(destinatario);
  if (!validacaoPessoa.valid) {
    return { success: false, error: validacaoPessoa.error };
  }

  const jaEnviado = await alertaJaEnviadoHoje(base44, referencia_id, tipo, destinatario.id);
  if (jaEnviado) {
    return { success: true, skipped: true };
  }

  try {
    // Apenas notificação in-app — e-mail de alerta de OS desativado
    await base44.entities.Notificacao.create({
      destinatario_id: destinatario.id,
      tipo: 'mudanca_status',
      referencia_id,
      referencia_tipo,
      mensagem,
      lida: false
    });

    await registrarAlertaEnviado(base44, referencia_id, tipo, destinatario.id, true);
    return { success: true };
  } catch (error) {
    const erroMsg = error.message || 'Erro desconhecido';
    await registrarAlertaEnviado(base44, referencia_id, tipo, destinatario.id, false, erroMsg);
    return { success: false, error: erroMsg };
  }
}

export { validarPessoa, validarOrdem };