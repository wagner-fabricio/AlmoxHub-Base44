import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Middleware de autenticação e autorização
 * Valida que o usuário está autenticado e tem as permissões necessárias
 */
export async function requireAuth(req, options = {}) {
  const { requiredRole = null, requireAdmin = false } = options;
  
  const base44 = createClientFromRequest(req);
  
  // Verificar autenticação
  let user;
  try {
    user = await base44.auth.me();
  } catch (error) {
    return { 
      error: 'Unauthorized', 
      status: 401,
      response: Response.json({ error: 'Autenticação necessária' }, { status: 401 })
    };
  }
  
  if (!user) {
    return { 
      error: 'Unauthorized', 
      status: 401,
      response: Response.json({ error: 'Autenticação necessária' }, { status: 401 })
    };
  }
  
  // Verificar se requer admin
  if (requireAdmin && user.role !== 'admin') {
    return { 
      error: 'Forbidden', 
      status: 403,
      response: Response.json({ error: 'Acesso negado: privilégios de administrador necessários' }, { status: 403 })
    };
  }
  
  // Verificar papel específico (gestor, lider, almoxarife)
  if (requiredRole) {
    const pessoa = await base44.entities.Pessoa.filter({ 
      user_id: user.id 
    }).then(p => p[0]);
    
    if (!pessoa) {
      return { 
        error: 'Forbidden', 
        status: 403,
        response: Response.json({ error: 'Cadastro não encontrado' }, { status: 403 })
      };
    }
    
    const hasRole = pessoa.funcoes?.includes(requiredRole);
    const isAdmin = user.role === 'admin';
    
    if (!hasRole && !isAdmin) {
      return { 
        error: 'Forbidden', 
        status: 403,
        response: Response.json({ error: `Acesso negado: perfil ${requiredRole} necessário` }, { status: 403 })
      };
    }
    
    return { user, pessoa, base44 };
  }
  
  // Carregar pessoa para uso geral
  const pessoa = await base44.entities.Pessoa.filter({ 
    user_id: user.id 
  }).then(p => p[0]);
  
  return { user, pessoa, base44 };
}

/**
 * Middleware de auditoria
 * Registra ações importantes para auditoria de segurança
 */
export async function auditLog(base44, action, entityType, entityId, userId, details = {}) {
  try {
    await base44.asServiceRole.entities.AuditLog.create({
      action,
      entity_type: entityType,
      entity_id: entityId,
      user_id: userId,
      details: JSON.stringify(details),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao registrar auditoria:', error);
  }
}

/**
 * Rate limiting simples em memória
 */
const rateLimits = new Map();

export function checkRateLimit(userId, maxRequests = 10, windowMs = 60000) {
  const now = Date.now();
  const userRequests = rateLimits.get(userId) || [];
  
  // Limpar requisições antigas
  const recentRequests = userRequests.filter(time => now - time < windowMs);
  
  if (recentRequests.length >= maxRequests) {
    return { 
      allowed: false, 
      response: Response.json({ error: 'Limite de requisições excedido. Tente novamente em alguns segundos.' }, { status: 429 })
    };
  }
  
  recentRequests.push(now);
  rateLimits.set(userId, recentRequests);
  
  return { allowed: true };
}