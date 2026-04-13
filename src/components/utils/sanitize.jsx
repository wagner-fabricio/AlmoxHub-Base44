import DOMPurify from 'dompurify';

/**
 * Sanitiza HTML para prevenir XSS
 */
export function sanitizeHTML(html) {
  if (typeof html !== 'string') {
    return '';
  }
  
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'p', 'br', 'ul', 'ol', 'li', 'a'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false
  });
}

/**
 * Sanitiza texto simples
 */
export function sanitizeText(text) {
  if (typeof text !== 'string') {
    return '';
  }
  
  return text
    .trim()
    .replace(/[<>]/g, '')
    .substring(0, 5000);
}

/**
 * Sanitiza e-mail
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
 * Sanitiza entrada de busca
 */
export function sanitizeSearch(search) {
  if (typeof search !== 'string') {
    return '';
  }
  
  return search
    .trim()
    .replace(/[^\w\s\-@.]/g, '')
    .substring(0, 100);
}

/**
 * Valida formato de e-mail
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Log seguro que não expõe dados sensíveis
 */
export function safeLog(message, data = {}) {
  if (import.meta.env.DEV) {
    const sanitized = { ...data };
    
    const sensitiveFields = ['password', 'token', 'apiKey', 'api_key', 'secret', 'authorization'];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    });
    
    console.log(message, sanitized);
  }
}

/**
 * Trata erros de forma segura sem expor detalhes internos
 */
export function handleError(error, userMessage = 'Ocorreu um erro. Tente novamente.') {
  safeLog('Erro:', { message: error.message, stack: error.stack });
  return userMessage;
}