import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

async function recalcularProjeto(base44, projeto_id) {
  const todasOS = await base44.asServiceRole.entities.OrdemServico.list();
  const osVinculadas = todasOS.filter(os =>
    Array.isArray(os.projetos_ids) && os.projetos_ids.includes(projeto_id)
  );

  let data_inicial_execucao = null;
  let data_final_execucao = null;

  if (osVinculadas.length > 0) {
    const datasIniciais = osVinculadas.map(os => os.data_inicial).filter(d => d);
    const datasConclusao = osVinculadas.map(os => os.data_conclusao).filter(d => d);

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

  return { data_inicial_execucao, data_final_execucao };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Autenticação obrigatória
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json().catch(() => ({}));

    // Chamada direta (frontend): { projeto_id }
    if (payload.projeto_id) {
      const result = await recalcularProjeto(base44, payload.projeto_id);
      return Response.json({ success: true, ...result });
    }

    // Chamada via automação de entidade: { event, data, old_data }
    if (payload.event && payload.event.entity_name === 'OrdemServico') {
      const osData = payload.data || {};
      const osOldData = payload.old_data || {};

      // Coletar todos os projeto_ids afetados (OS atual e anterior, caso tenha mudado)
      const projetoIds = new Set([
        ...(osData.projetos_ids || []),
        ...(osOldData.projetos_ids || [])
      ]);

      const results = [];
      for (const projeto_id of projetoIds) {
        const result = await recalcularProjeto(base44, projeto_id);
        results.push({ projeto_id, ...result });
      }

      return Response.json({ success: true, recalculados: results });
    }

    return Response.json({ error: 'Payload inválido: informe projeto_id ou evento de entidade OrdemServico' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});