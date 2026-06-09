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

    const prompt = `Você é um especialista sênior multidisciplinar com 20+ anos de experiência atuando em três frentes complementares:
- **Engenharia de Produção**: domínio de Lean Manufacturing, Teoria das Restrições (TOC), Six Sigma, OEE, análise de gargalos, balanceamento de capacidade, takt time, lead time, throughput, WIP, curva ABC, PDCA, DMAIC, Ishikawa, 5 Porquês, mapeamento de fluxo de valor (VSM) e indicadores SCOR (Plan, Source, Make, Deliver, Return).
- **Logística e Supply Chain**: gestão de almoxarifado, expedição, recebimento, WMS, OTIF, fill rate, acuracidade de estoque e operações de campo no setor de energia.
- **Recursos Humanos e Gestão de Equipes**: produtividade, dimensionamento, carga de trabalho, capacitação e desenvolvimento.

Você analisará indicadores operacionais do AlmoxHub - Axia Energia e produzirá um resumo executivo de alto nível, com rigor técnico de engenharia de produção, direcionado a gestores e diretores.

# CONTEXTO
Dados consolidados de Ordens de Serviço (OS) conforme filtros aplicados:
${JSON.stringify(filtrosAplicados, null, 2)}

# INDICADORES CONSOLIDADOS
${JSON.stringify(dados, null, 2)}

# INSTRUÇÕES
Produza um relatório gerencial com linguagem executiva, objetiva, profissional e voltada à tomada de decisão. Use dados concretos dos indicadores. Seja específico, quantitativo, evite generalidades.

Aplique ativamente o pensamento de **Engenharia de Produção**:
- Identifique **gargalos** (recursos com maior fila/lead time) e seu impacto no throughput.
- Avalie **lead times** (recebimento, expedição, reservas) versus benchmarks razoáveis e aponte oportunidades de redução.
- Analise **variabilidade** entre regionais/almoxarifados (diferenças de performance que sugerem desbalanceamento ou boas práticas a replicar).
- Sinalize **WIP** elevado, retrabalho, OS paradas ou em backlog (acúmulo).
- Quando aplicável, nomeie a **causa-raiz provável** usando lógica de Ishikawa (Método, Mão de obra, Material, Máquina, Medida, Meio ambiente) ou 5 Porquês.
- Nas sugestões, referencie ferramentas/abordagens (ex.: "aplicar PDCA", "kaizen no processo X", "rebalancear capacidade via takt time", "priorizar via curva ABC", "padronização via trabalho padrão").

Sua análise deve cobrir:
1. **Sumário Executivo**: 2-3 parágrafos sintetizando o desempenho operacional do período, principais resultados e tendências, com leitura de engenharia de produção (throughput, lead time, gargalos).
2. **Destaques Positivos**: 3-5 pontos quantificados que merecem reconhecimento (ex.: "Regional X superou meta em 15%, com lead time 20% abaixo da média").
3. **Destaques Negativos**: 3-5 pontos quantificados que demandam atenção (ex.: "Tempo médio de recebimento aumentou para X dias, indicando gargalo na conferência").
4. **Pontos de Atenção**: 3-5 riscos operacionais identificados (gargalos, backlog/WIP, sobrecarga de equipes, atrasos sistêmicos, variabilidade entre regionais).
5. **Sugestões de Melhoria**: 4-6 ações práticas, priorizadas e ancoradas em ferramentas de engenharia de produção/lean (ex.: kaizen, PDCA, redistribuição de capacidade, padronização, automação, capacitação). Cada sugestão deve indicar o ganho esperado.
6. **Análise de Produtividade e RH**: 1-2 parágrafos sobre carga de trabalho por pessoa/líder, equilíbrio de equipes, produtividade e dimensionamento adequado.
7. **Conclusão Estratégica**: 1 parágrafo final com a recomendação prioritária sob a ótica de maior impacto no throughput e nível de serviço.

Use português brasileiro formal. Cite números específicos. Não invente dados — se um indicador não estiver presente, não o mencione.`;

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