import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function sanitizeEmail(email) {
  if (typeof email !== 'string') return '';
  return email.toLowerCase().trim().substring(0, 255);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Valida disponibilidade de e-mail antes de criar cadastro
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { email } = await req.json();

    if (!isValidEmail(email)) {
      return Response.json({ available: false, error: 'Formato de e-mail inválido' });
    }

    const emailPadronizado = sanitizeEmail(email);

    const existentes = await base44.entities.Pessoa.filter({ email: emailPadronizado });
    const available = !existentes || existentes.length === 0;

    return Response.json({
      available,
      email: emailPadronizado,
      message: available ? 'E-mail disponível' : 'E-mail já cadastrado'
    });

  } catch (error) {
    console.error('Erro na validação de email');
    return Response.json({ error: 'Erro ao validar e-mail' }, { status: 500 });
  }
});