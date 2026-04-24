import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Consulta logs de auditoria — apenas admins
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Acesso negado: privilégios de administrador necessários' }, { status: 403 });
    }

    const { filters = {}, limit = 100, skip = 0 } = await req.json();

    const logs = await base44.asServiceRole.entities.AuditLog.list();

    let filteredLogs = logs;
    if (filters.user_id) filteredLogs = filteredLogs.filter(log => log.user_id === filters.user_id);
    if (filters.action) filteredLogs = filteredLogs.filter(log => log.action === filters.action);
    if (filters.entity_type) filteredLogs = filteredLogs.filter(log => log.entity_type === filters.entity_type);
    if (filters.start_date) filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= new Date(filters.start_date));
    if (filters.end_date) filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= new Date(filters.end_date));

    filteredLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const paginatedLogs = filteredLogs.slice(skip, skip + limit);

    return Response.json({ logs: paginatedLogs, total: filteredLogs.length, skip, limit });

  } catch (error) {
    console.error('Erro ao buscar logs de auditoria');
    return Response.json({ error: 'Erro ao buscar logs' }, { status: 500 });
  }
});