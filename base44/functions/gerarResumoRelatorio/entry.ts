import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Verifica se é gestor ou admin
    const pessoas = await base44.asServiceRole.entities.Pessoa.filter({ user_id: user.id });
    const pessoa = pessoas[0];
    const isGestor = pessoa?.funcoes?.includes('gestor');
    const isAdmin = user.role === 'admin';
    if (!isGestor && !isAdmin) {
      return Response.json({ error: 'Acesso restrito a gestores' }, { status: 403 });
    }

    const body = await req.json();
    const { dados, filtrosAplicados } = body;

    if (!dados) return Response.json({ error: 'Dados obrigatórios' }, { status: 400 });

    const prompt = `Você é um especialista sênior em Logística e Recursos Humanos, com 20 anos de experiência em gestão de operações de almoxarifado e expedição em empresas do setor de energia. Você analisará indicadores operacionais e produzirá um resumo executivo direcionado a gestores e diretores.

# CONTEXTO
Dados consolidados de Ordens de Serviço (OS) do AlmoxHub - Axia Energia, conforme filtros aplicados:
${JSON.stringify(filtrosAplicados, null, 2)}

# INDICADORES CONSOLIDADOS
${JSON.stringify(dados, null, 2)}

# INSTRUÇÕES
Produza um relatório gerencial com linguagem executiva, objetiva, profissional e voltada à tomada de decisão. Use dados concretos dos indicadores. Seja específico, evite generalidades.

Sua análise deve cobrir:
1. **Sumário Executivo**: 2-3 parágrafos sintetizando o desempenho operacional do período, principais resultados e tendências relevantes.
2. **Destaques Positivos**: 3-5 pontos quantificados que merecem reconhecimento (ex: "Regional X superou meta em 15%").
3. **Destaques Negativos**: 3-5 pontos quantificados que demandam atenção (ex: "Tempo médio de recebimento aumentou para X dias").
4. **Pontos de Atenção**: 3-5 riscos operacionais identificados (gargalos, backlog, sobrecarga de equipes, atrasos sistêmicos).
5. **Sugestões de Melhoria**: 4-6 ações práticas e priorizadas (logística + RH/produtividade), incluindo redistribuição de equipes, revisão de processos, capacitação, etc.
6. **Análise de Produtividade e RH**: 1-2 parágrafos sobre carga de trabalho por pessoa/líder, equilíbrio de equipes e produtividade.
7. **Conclusão Estratégica**: 1 parágrafo final com recomendação principal.

Use português brasileiro formal. Cite números específicos. Não invente dados.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      model: 'claude_sonnet_4_6',
      response_json_schema: {
        type: 'object',
        properties: {
          sumario_executivo: { type: 'string' },
          destaques_positivos: { type: 'array', items: { type: 'string' } },
          destaques_negativos: { type: 'array', items: { type: 'string' } },
          pontos_atencao: { type: 'array', items: { type: 'string' } },
          sugestoes_melhorias: { type: 'array', items: { type: 'string' } },
          analise_produtividade_rh: { type: 'string' },
          conclusao_estrategica: { type: 'string' }
        },
        required: [
          'sumario_executivo',
          'destaques_positivos',
          'destaques_negativos',
          'pontos_atencao',
          'sugestoes_melhorias',
          'analise_produtividade_rh',
          'conclusao_estrategica'
        ]
      }
    });

    return Response.json({ success: true, analise: result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});