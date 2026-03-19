import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { requireAuth } from './middleware/auth.js';

/**
 * Consulta logs de auditoria
 * Apenas admins podem acessar
 */
Deno.serve(async (req) => {
  // Verificar autenticação e autorização
  const auth = await requireAuth(req, { requireAdmin: true });
  
  if (auth.error) {
    return auth.response;
  }
  
  const { user, base44 } = auth;
  
  try {
    const { filters = {}, limit = 100, skip = 0 } = await req.json();
    
    // Buscar logs de auditoria
    const logs = await base44.asServiceRole.entities.AuditLog.list();
    
    // Filtrar por parâmetros
    let filteredLogs = logs;
    
    if (filters.user_id) {
      filteredLogs = filteredLogs.filter(log => log.user_id === filters.user_id);
    }
    
    if (filters.action) {
      filteredLogs = filteredLogs.filter(log => log.action === filters.action);
    }
    
    if (filters.entity_type) {
      filteredLogs = filteredLogs.filter(log => log.entity_type === filters.entity_type);
    }
    
    if (filters.start_date) {
      filteredLogs = filteredLogs.filter(log => 
        new Date(log.timestamp) >= new Date(filters.start_date)
      );
    }
    
    if (filters.end_date) {
      filteredLogs = filteredLogs.filter(log => 
        new Date(log.timestamp) <= new Date(filters.end_date)
      );
    }
    
    // Ordenar por data (mais recentes primeiro)
    filteredLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Paginar
    const paginatedLogs = filteredLogs.slice(skip, skip + limit);
    
    return Response.json({
      logs: paginatedLogs,
      total: filteredLogs.length,
      skip,
      limit
    });
    
  } catch (error) {
    console.error('Erro ao buscar logs de auditoria');
    return Response.json({ error: 'Erro ao buscar logs' }, { status: 500 });
  }
});