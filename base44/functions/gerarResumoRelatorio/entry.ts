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

    const prompt = `Você é um analista sênior em Engenharia de Produção e Logística com 20+ anos de experiência. Domina: Lean Manufacturing, Teoria das Restrições (TOC), Six Sigma, OEE, análise de gargalos, balanceamento de capacidade, takt time, lead time, throughput, WIP, curva ABC, PDCA, DMAIC, Ishikawa, 5 Porquês, VSM, SCOR, WMS, OTIF, fill rate e acuracidade de estoque.

Você analisará indicadores operacionais do AlmoxHub - Axia Energia e produzirá um resumo executivo de alto nível, com rigor técnico, direcionado a gestores e diretores.

# CONTEXTO (Filtros aplicados)
${JSON.stringify(filtrosAplicados, null, 2)}

# INDICADORES CONSOLIDADOS
${JSON.stringify(dados, null, 2)}

# INSTRUÇÕES
Produza um relatório gerencial com linguagem executiva, objetiva, profissional e voltada à tomada de decisão. Use dados concretos. Seja específico, quantitativo, evite generalidades. Não invente dados — se um indicador não estiver presente, não o mencione.

Aplique ativamente o pensamento de **Engenharia de Produção**:
- Identifique **gargalos** (recursos com maior fila/lead time) e seu impacto no throughput.
- Avalie **lead times** versus benchmarks razoáveis e aponte oportunidades de redução.
- Analise **variabilidade** entre regionais/almoxarifados.
- Sinalize **WIP** elevado, retrabalho, OS paradas, backlog.
- Cite causa-raiz provável usando Ishikawa ou 5 Porquês quando aplicável.
- Referencie ferramentas (PDCA, kaizen, takt time, curva ABC, trabalho padrão, DMAIC, etc.).

Sua análise deve cobrir:
1. **Sumário Executivo**: 2-3 parágrafos sintetizando desempenho, resultados e tendências.
2. **Destaques Positivos**: 3-5 pontos quantificados.
3. **Destaques Negativos**: 3-5 pontos quantificados.
4. **Pontos de Atenção**: 3-5 riscos operacionais.
5. **Sugestões de Melhoria**: 4-6 ações práticas com ganho esperado.
6. **Recomendações de Engenharia de Produção**: 4-6 recomendações específicas e tecnicamente fundamentadas em metodologias de engenharia de produção (Lean, TOC, Six Sigma, VSM, kaizen, takt time, curva ABC, DMAIC, padronização, balanceamento de capacidade, redução de WIP, etc.). Para cada recomendação cite a metodologia, o problema-alvo e o resultado esperado.
7. **Análise de Projetos**: 1-2 parágrafos avaliando os projetos concluídos no período e os projetos em aberto (status_projeto = ativo ou parado). Avalie taxa de cumprimento de prazo, duração média, projetos atrasados ou parados, e impacto no throughput operacional. Cite números concretos.
8. **Análise de Produtividade**: 1-2 parágrafos sobre carga de trabalho, equilíbrio de equipes e dimensionamento.
9. **Conclusão Estratégica**: 1 parágrafo com a recomendação prioritária de maior impacto.

Use português brasileiro formal. Cite números específicos.`;

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
          recomendacoes_engenharia_producao: { type: 'array', items: { type: 'string' } },
          analise_projetos: { type: 'string' },
          analise_produtividade_rh: { type: 'string' },
          conclusao_estrategica: { type: 'string' }
        },
        required: [
          'sumario_executivo',
          'destaques_positivos',
          'destaques_negativos',
          'pontos_atencao',
          'sugestoes_melhorias',
          'recomendacoes_engenharia_producao',
          'analise_projetos',
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