import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Registra uma tentativa de login para rate limiting
 * 
 * Payload:
 * {
 *   email: string,
 *   ip_address: string,
 *   user_agent: string,
 *   sucesso: boolean
 * }
 */

Deno.serve(async (req) => {
  try {
    const { email, ip_address, user_agent, sucesso } = await req.json();

    if (!email || !ip_address || sucesso === undefined) {
      return Response.json({ 
        error: 'email, ip_address, and sucesso are required' 
      }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    // Registrar tentativa
    await base44.asServiceRole.entities.LoginAttempt.create({
      email,
      ip_address,
      user_agent: user_agent || 'Unknown',
      sucesso,
      timestamp: new Date().toISOString()
    });

    // Se login foi bem-sucedido, limpar tentativas antigas deste email
    if (sucesso) {
      const tentativasAnteriores = await base44.asServiceRole.entities.LoginAttempt.filter({
        email: email,
        sucesso: false
      });

      for (const tentativa of tentativasAnteriores) {
        await base44.asServiceRole.entities.LoginAttempt.delete(tentativa.id);
      }
    }

    return Response.json({ 
      success: true,
      message: sucesso ? 'Login registrado e tentativas antigas limpas' : 'Tentativa falhada registrada'
    });

  } catch (error) {
    console.error('Erro em registrarLoginAttempt:', error);
    return Response.json({
      error: error.message
    }, { status: 500 });
  }
});