import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const payload = await req.json().catch(() => ({}));
    const { projeto_id } = payload;

    if (!projeto_id) {
      return Response.json({ error: 'projeto_id é obrigatório' }, { status: 400 });
    }

    // Buscar todas as OS vinculadas ao projeto
    const todasOS = await base44.asServiceRole.entities.OrdemServico.list();
    const osVinculadas = todasOS.filter(os =>
      Array.isArray(os.projetos_ids) && os.projetos_ids.includes(projeto_id)
    );

    let data_inicial_execucao = null;
    let data_final_execucao = null;

    if (osVinculadas.length > 0) {
      const datasIniciais = osVinculadas
        .map(os => os.data_inicial)
        .filter(d => d);
      const datasConclusao = osVinculadas
        .map(os => os.data_conclusao)
        .filter(d => d);

      if (datasIniciais.length > 0) {
        data_inicial_execucao = datasIniciais.sort()[0];
      }
      if (datasConclusao.length > 0) {
        data_final_execucao = datasConclusao.sort().reverse()[0];
      }
    }

    await base44.asServiceRole.entities.Projeto.update(projeto_id, {
      data_inicial_execucao: data_inicial_execucao || null,
      data_final_execucao: data_final_execucao || null
    });

    return Response.json({ success: true, data_inicial_execucao, data_final_execucao });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});