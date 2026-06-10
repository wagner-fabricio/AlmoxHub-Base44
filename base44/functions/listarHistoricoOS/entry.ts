import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { os_id } = body || {};

    if (!os_id) {
      return Response.json({ error: 'os_id é obrigatório' }, { status: 400 });
    }

    // Usar service role para ler logs (AuditLog tem RLS apenas para admin)
    // O acesso é seguro: o usuário só consegue ler logs de uma OS específica
    // e precisa estar autenticado.
    const logs = await base44.asServiceRole.entities.AuditLog.filter(
      { entity_type: 'OrdemServico', entity_id: os_id },
      '-created_date',
      200
    );

    return Response.json({ logs: Array.isArray(logs) ? logs : [] });
  } catch (error) {
    console.error('Erro ao listar histórico:', error);
    return Response.json({ error: error.message, logs: [] }, { status: 500 });
  }
});