import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { os_id } = await req.json();
    if (!os_id) {
      return Response.json({ error: 'os_id é obrigatório' }, { status: 400 });
    }

    // Buscar a OS
    const os = await base44.asServiceRole.entities.OrdemServico
      .filter({ id: os_id })
      .then(r => r[0])
      .catch(() => null);
    if (!os) {
      return Response.json({ error: 'OS não encontrada' }, { status: 404 });
    }

    // Resolver a Pessoa do usuário atual
    const pessoa = await base44.asServiceRole.entities.Pessoa.filter({ user_id: user.id }).then(r => r[0]);
    const funcoes = pessoa?.funcoes || [];

    // Regras de permissão (espelham canDeleteOS da interface)
    let permitido = false;
    if (user.role === 'admin') {
      permitido = true;
    } else if (pessoa) {
      const isGestor = funcoes.includes('gestor');
      const isLiderDaOS = funcoes.includes('lider') && os.lider_id === pessoa.id;
      const isAtendenteDaOS = os.atendente_nome && pessoa.nome &&
        os.atendente_nome.trim().toLowerCase() === pessoa.nome.trim().toLowerCase();
      permitido = isGestor || isLiderDaOS || isAtendenteDaOS;
    }

    if (!permitido) {
      return Response.json({ error: 'Você não tem permissão para excluir esta OS' }, { status: 403 });
    }

    await base44.asServiceRole.entities.OrdemServico.delete(os_id);

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});