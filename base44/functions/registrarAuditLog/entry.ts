import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, entity_type, entity_id, details } = await req.json();

    if (!action || !entity_type || !entity_id) {
      return Response.json({ 
        error: 'Missing required fields: action, entity_type, entity_id' 
      }, { status: 400 });
    }

    // Whitelist de ações permitidas via frontend
    const ACOES_PERMITIDAS = [
      'create', 'update', 'delete', 'view', 'export',
      'status_change', 'separacao_update', 'timesheet_start', 'timesheet_pause', 'timesheet_stop',
      'upload_file', 'invite_user', 'approval_change'
    ];
    if (!ACOES_PERMITIDAS.includes(action)) {
      return Response.json({ error: `Ação '${action}' não permitida` }, { status: 400 });
    }

    // Criar log de auditoria
    const auditLog = await base44.asServiceRole.entities.AuditLog.create({
      action,
      entity_type,
      entity_id,
      user_id: user.id,
      details: typeof details === 'string' ? details : JSON.stringify(details),
      timestamp: new Date().toISOString(),
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      user_agent: req.headers.get('user-agent') || 'unknown'
    });

    return Response.json({ 
      success: true, 
      log_id: auditLog.id 
    });

  } catch (error) {
    console.error('Error registering audit log:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});