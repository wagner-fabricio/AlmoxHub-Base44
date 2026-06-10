import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { action } = body;

    if (action === 'create') {
      const { dados } = body;
      if (!dados?.tipo || !dados?.titular_nome || !dados?.titular_email || !dados?.titular_cpf || !dados?.descricao) {
        return Response.json({ error: 'Campos obrigatórios faltando' }, { status: 400 });
      }

      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 10000);
      const protocolo = `LGPD-${timestamp}-${random}`;

      const prazoLegal = new Date();
      prazoLegal.setDate(prazoLegal.getDate() + 15);

      const novaSolicitacao = await base44.asServiceRole.entities.SolicitacaoTitular.create({
        tipo: dados.tipo,
        titular_nome: dados.titular_nome,
        titular_email: dados.titular_email,
        titular_cpf: dados.titular_cpf,
        titular_telefone: dados.titular_telefone || '',
        descricao: dados.descricao,
        protocolo,
        anexos: dados.anexos || [],
        data_solicitacao: new Date().toISOString(),
        prazo_legal: prazoLegal.toISOString().split('T')[0],
        status: 'pendente'
      });

      return Response.json({ protocolo, prazo_legal: prazoLegal.toISOString().split('T')[0], id: novaSolicitacao.id });
    }

    if (action === 'track') {
      const { protocolo, email } = body;
      if (!protocolo || !email) {
        return Response.json({ error: 'Protocolo e email são obrigatórios' }, { status: 400 });
      }

      const results = await base44.asServiceRole.entities.SolicitacaoTitular.filter({
        protocolo,
        titular_email: email
      });

      if (results.length === 0) {
        return Response.json({ found: false });
      }

      return Response.json({ found: true, solicitacao: results[0] });
    }

    return Response.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});