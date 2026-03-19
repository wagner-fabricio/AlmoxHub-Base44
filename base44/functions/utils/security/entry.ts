/**
 * Utilitários de segurança para validação e sanitização de entrada
 */

/**
 * Sanitiza entrada de texto para prevenir XSS
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return input;
  }
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove tags HTML básicas
    .substring(0, 5000); // Limita tamanho máximo
}

/**
 * Sanitiza HTML para uso em templates de e-mail
 */
export function sanitizeHTML(str) {
  if (typeof str !== 'string') {
    return str;
  }
  
  const entities = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;'
  };
  
  return str.replace(/[&<>"'/]/g, (char) => entities[char]);
}

/**
 * Sanitiza e normaliza e-mail
 */
export function sanitizeEmail(email) {
  if (typeof email !== 'string') {
    return '';
  }
  
  return email
    .toLowerCase()
    .trim()
    .substring(0, 255);
}

/**
 * Valida se o e-mail tem formato válido
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitiza entrada de busca para prevenir injection
 */
export function sanitizeSearchInput(search) {
  if (typeof search !== 'string') {
    return '';
  }
  
  return search
    .trim()
    .replace(/[^\w\s\-@.]/g, '') // Apenas alfanuméricos, espaços, hífen, @ e .
    .substring(0, 100);
}

/**
 * Valida tipo MIME de arquivo
 */
export function validateFileMimeType(file, allowedTypes = ['image/jpeg', 'image/png', 'image/gif']) {
  if (!file || !file.type) {
    return false;
  }
  
  return allowedTypes.includes(file.type);
}

/**
 * Valida tamanho de arquivo
 */
export function validateFileSize(file, maxSizeMB = 5) {
  if (!file || !file.size) {
    return false;
  }
  
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

/**
 * Log seguro que não expõe dados sensíveis
 */
export function safeLog(message, data = {}) {
  const sanitized = { ...data };
  
  // Remover campos sensíveis
  const sensitiveFields = ['password', 'token', 'apiKey', 'api_key', 'secret', 'authorization'];
  sensitiveFields.forEach(field => {
    delete sanitized[field];
  });
  
  console.log(message, sanitized);
}

/**
 * Valida ID de entidade (formato MongoDB ObjectId)
 */
export function isValidEntityId(id) {
  if (typeof id !== 'string') {
    return false;
  }
  
  return /^[a-f0-9]{24}$/i.test(id);
}