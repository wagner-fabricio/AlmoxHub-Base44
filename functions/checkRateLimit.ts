import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Verifica rate limiting de tentativas de login
 * Retorna se o login é permitido e se requer CAPTCHA
 * 
 * Payload:
 * {
 *   email: string,
 *   ip_address: string,
 *   user_agent: string
 * }
 * 
 * Response:
 * {
 *   allowed: boolean,
 *   requiresCaptcha: boolean,
 *   remainingAttempts: number,
 *   message: string
 * }
 */

Deno.serve(async (req) => {
  try {
    const { email, ip_address, user_agent } = await req.json();

    if (!email || !ip_address) {
      return Response.json({ 
        error: 'email and ip_address are required' 
      }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    // Buscar tentativas nos últimos 15 minutos
    const quinzeMinutosAtras = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    
    const tentativas = await base44.asServiceRole.entities.LoginAttempt.filter({
      email: email,
      created_date: { $gte: quinzeMinutosAtras }
    });

    // Contar falhas
    const falhas = tentativas.filter(t => !t.sucesso);
    const numFalhas = falhas.length;

    // Lógica de rate limiting
    const MAX_TENTATIVAS = 3;
    const remainingAttempts = Math.max(0, MAX_TENTATIVAS - numFalhas);
    const requiresCaptcha = numFalhas >= MAX_TENTATIVAS;
    const allowed = numFalhas < 10; // Bloquear completamente após 10 falhas

    let message = '';
    if (!allowed) {
      message = 'Muitas tentativas falhadas. Aguarde 15 minutos.';
    } else if (requiresCaptcha) {
      message = 'Complete o CAPTCHA para continuar.';
    } else if (numFalhas > 0) {
      message = `${remainingAttempts} tentativa(s) restante(s) antes do CAPTCHA.`;
    } else {
      message = 'Você pode fazer login normalmente.';
    }

    return Response.json({
      allowed,
      requiresCaptcha,
      remainingAttempts,
      numFalhas,
      message
    });

  } catch (error) {
    console.error('Erro em checkRateLimit:', error);
    return Response.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});