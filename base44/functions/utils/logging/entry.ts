/**
 * Sistema de logging estruturado para funções backend
 */

/**
 * Formata e loga mensagens estruturadas
 * @param {string} nivel - 'ERROR', 'WARN', 'INFO'
 * @param {string} funcao - Nome da função que está logando
 * @param {Object} contexto - Contexto adicional (IDs, dados relevantes)
 * @param {string} mensagem - Mensagem descritiva
 * @param {Error} [error] - Objeto de erro, se houver
 */
export function logEstruturado(nivel, funcao, contexto, mensagem, error = null) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    nivel,
    funcao,
    contexto: sanitizarContexto(contexto),
    mensagem
  };
  
  if (error) {
    logEntry.erro = {
      mensagem: error.message,
      stack: error.stack
    };
  }
  
  // Log formatado
  const logString = JSON.stringify(logEntry, null, 2);
  
  switch (nivel) {
    case 'ERROR':
      console.error(logString);
      break;
    case 'WARN':
      console.warn(logString);
      break;
    case 'INFO':
    default:
      console.log(logString);
      break;
  }
  
  return logEntry;
}

/**
 * Remove campos sensíveis do contexto antes de logar
 */
function sanitizarContexto(contexto) {
  if (!contexto || typeof contexto !== 'object') {
    return contexto;
  }
  
  const sanitizado = { ...contexto };
  const camposSensiveis = ['password', 'senha', 'token', 'api_key', 'apiKey', 'secret'];
  
  camposSensiveis.forEach(campo => {
    if (sanitizado[campo]) {
      sanitizado[campo] = '***REDACTED***';
    }
  });
  
  return sanitizado;
}

/**
 * Cria um log agregado de múltiplas operações
 */
export function logAgregado(funcao, operacoes) {
  const resumo = {
    timestamp: new Date().toISOString(),
    funcao,
    total: operacoes.length,
    sucessos: operacoes.filter(op => op.success).length,
    falhas: operacoes.filter(op => !op.success).length,
    operacoes: operacoes.map(op => ({
      tipo: op.tipo,
      success: op.success,
      erro: op.error || null
    }))
  };
  
  console.log('📊 Resumo de Operações:', JSON.stringify(resumo, null, 2));
  return resumo;
}