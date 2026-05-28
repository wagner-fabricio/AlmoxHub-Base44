// Validador centralizado de fluxos de OS (Expedição e Recebimento).
// Funções puras — recebem formData e retornam estado das etapas + pendências.
// Usado pelo OSGuiaFluxoPainel (informativo) e pode ser usado pelo OSFormModal (validação).

// ─────────────────────────────────────────────────────────────────────────────
// EXPEDIÇÃO — 5 etapas: Solicitação → Separação → Preparação → Envio → Entrega
// ─────────────────────────────────────────────────────────────────────────────

// Deriva o estado real das etapas a partir do conteúdo do formData (e não somente
// das flags persistidas em fluxo_expedicao, que só são atualizadas pelo backend
// ao salvar). Isso garante que o guia reflita a realidade enquanto o usuário
// ainda está editando uma OS nova/não salva.
// fluxoEstrito = true quando a subcategoria é "Com Reserva" ou "Sem Reserva".
// Para demais subcategorias de Expedição, apenas Origem/Destino são obrigatórios na etapa 1.
function isEtapaCompletaExpedicao(etapaId, formData, fluxoEstrito = true) {
  const fluxo = formData.fluxo_expedicao || {};
  switch (etapaId) {
    case 1: {
      // Solicitação: campos básicos sempre obrigatórios
      const basicos = !!(
        formData.categoria_id &&
        formData.subcategorias_ids?.length &&
        formData.regional_id &&
        formData.almoxarifado_id &&
        formData.lider_id &&
        formData.prazo &&
        formData.complexidade &&
        formData.instalacao_origem_id &&
        (formData.destino_externo ? !!formData.destino_externo_descricao : !!formData.instalacao_destino_id)
      );
      if (!basicos) return false;
      // Campos estritos só para "Com Reserva" e "Sem Reserva"
      if (fluxoEstrito) {
        return !!(
          formData.num_reserva &&
          formData.data_reserva &&
          formData.usuario_reserva &&
          formData.orgao &&
          formData.vinculacao
        );
      }
      return true;
    }
    case 2: {
      // Separação: itens existem e todos com SEPARAÇÃO TRATADA — total OU parcial
      // (separação a menor ou a maior também conclui a etapa; o indicador "Parcial"
      // continua sinalizando a divergência sem bloquear o fluxo).
      const itens = formData.itens_documento || [];
      if (itens.length === 0) return false;
      const todosTratados = itens.every(i => i.separado || (i.quantidade_separada || 0) > 0);
      if (!todosTratados) return false;
      if ((formData.volumes?.length || 0) > 0) {
        if (!formData.responsavel_separacao) return false;
        if (!formData.data_separacao) return false;
        if (!formData.separacao_concluida_em) return false;
      }
      return true;
    }
    case 3: {
      // Preparação: volumes e detalhamento de expedição cadastrados
      return !!(formData.volumes?.length > 0 && formData.detalhamento_expedicao?.length > 0);
    }
    case 4: {
      // Envio: data de expedição em pelo menos um detalhamento
      return (formData.detalhamento_expedicao || []).some(e => e.data_expedicao);
    }
    case 5: {
      // Entrega: data de necessidade e data de entrega preenchidas
      return !!(formData.data_necessidade && formData.data_entrega);
    }
    default:
      return false;
  }
}

// Ocorrência (etapa transversal): por padrão concluída; só "abre" quando o usuário
// marca "Houve um problema? = Sim" na aba Ocorrências e ainda não informou a data de solução.
export function isOcorrenciaExpedicaoCompleta(formData) {
  if (formData.houve_ocorrencia_expedicao !== true) return true;
  return !!formData.data_solucao_expedicao;
}

export function getEtapasExpedicao(formData, fluxoEstrito = true) {
  const fluxo = formData.fluxo_expedicao || {};
  const etapas = [
    { id: 1, key: 'solicitacao', label: 'Solicitação', completa: isEtapaCompletaExpedicao(1, formData, fluxoEstrito), data: fluxo.solicitacao_data },
    { id: 2, key: 'separacao',   label: 'Separação',   completa: isEtapaCompletaExpedicao(2, formData, fluxoEstrito), data: fluxo.separacao_data },
    { id: 3, key: 'preparacao',  label: 'Preparação',  completa: isEtapaCompletaExpedicao(3, formData, fluxoEstrito), data: fluxo.preparacao_data },
    { id: 4, key: 'envio',       label: 'Envio',       completa: isEtapaCompletaExpedicao(4, formData, fluxoEstrito), data: fluxo.envio_data },
    { id: 5, key: 'entrega',     label: 'Entrega',     completa: isEtapaCompletaExpedicao(5, formData, fluxoEstrito), data: fluxo.entrega_data },
    { id: 6, key: 'ocorrencia',  label: 'Ocorrências', completa: isOcorrenciaExpedicaoCompleta(formData), data: formData.data_relato_expedicao },
  ];

  // Etapa atual = primeira não completa, ou 6 (última) se tudo completo.
  // Como "Ocorrências" é a última e por padrão começa completa, ela só vira "atual"
  // se realmente houver uma ocorrência aberta (sem data de solução).
  const proxima = etapas.find(e => !e.completa);
  const etapaAtualId = proxima ? proxima.id : 6;
  etapas.forEach(e => { e.atual = e.id === etapaAtualId && !e.completa; });

  return etapas;
}

export function getPendenciasExpedicao(formData, fluxoEstrito = true) {
  const pendencias = [];

  // Etapa 1 — Solicitação
  const pend1 = [];
  if (!formData.categoria_id) pend1.push({ etapa: 1, tab: 'geral', label: 'Categoria' });
  if (!formData.subcategorias_ids?.length) pend1.push({ etapa: 1, tab: 'geral', label: 'Subcategoria' });
  if (!formData.regional_id) pend1.push({ etapa: 1, tab: 'geral', label: 'Regional' });
  if (!formData.almoxarifado_id) pend1.push({ etapa: 1, tab: 'geral', label: 'Almoxarifado' });
  if (!formData.lider_id) pend1.push({ etapa: 1, tab: 'geral', label: 'Líder' });
  if (!formData.prazo) pend1.push({ etapa: 1, tab: 'geral', label: 'Prazo' });
  if (!formData.complexidade) pend1.push({ etapa: 1, tab: 'geral', label: 'Complexidade' });
  if (fluxoEstrito) {
    if (!formData.num_reserva) pend1.push({ etapa: 1, tab: 'documento', label: 'Nº do Documento' });
    if (!formData.data_reserva) pend1.push({ etapa: 1, tab: 'documento', label: 'Data da Reserva' });
    if (!formData.usuario_reserva) pend1.push({ etapa: 1, tab: 'documento', label: 'Nome do Usuário' });
    if (!formData.orgao) pend1.push({ etapa: 1, tab: 'documento', label: 'Área do Usuário' });
    if (!formData.vinculacao) pend1.push({ etapa: 1, tab: 'documento', label: 'Vinculação (Custeio/Investimento)' });
  }
  if (!formData.instalacao_origem_id) pend1.push({ etapa: 1, tab: 'documento', label: 'Instalação Origem' });
  if (formData.destino_externo) {
    if (!formData.destino_externo_descricao) pend1.push({ etapa: 1, tab: 'documento', label: 'Dados do Destinatário (fora da Axia)' });
  } else {
    if (!formData.instalacao_destino_id) pend1.push({ etapa: 1, tab: 'documento', label: 'Instalação Destino' });
  }
  pendencias.push(...pend1);
  if (pend1.length > 0) return pendencias;

  // Etapa 2 — Separação
  if (!isEtapaCompletaExpedicao(2, formData, fluxoEstrito)) {
    const itens = formData.itens_documento || [];
    if (itens.length === 0) {
      pendencias.push({ etapa: 2, tab: 'materiais', label: 'Adicione itens ao documento (aba Materiais)' });
    } else {
      // Pendentes = nem marcado como separado nem com quantidade separada informada
      const naoTratados = itens.filter(i => !i.separado && !((i.quantidade_separada || 0) > 0));
      if (naoTratados.length > 0) {
        pendencias.push({
          etapa: 2,
          tab: 'materiais',
          label: `Informe a quantidade separada de ${naoTratados.length} ${naoTratados.length === 1 ? 'item' : 'itens'} (parcial, total ou a maior)`,
        });
      }
    }
    if ((formData.volumes?.length || 0) > 0) {
      if (!formData.responsavel_separacao) pendencias.push({ etapa: 2, tab: 'volumes', label: 'Responsável pela separação' });
      if (!formData.data_separacao) pendencias.push({ etapa: 2, tab: 'volumes', label: 'Data de início da separação' });
      if (!formData.separacao_concluida_em) pendencias.push({ etapa: 2, tab: 'volumes', label: 'Data de conclusão da separação' });
    }
    return pendencias;
  }

  // Etapa 3 — Preparação
  if (!isEtapaCompletaExpedicao(3, formData, fluxoEstrito)) {
    if (!(formData.volumes?.length > 0)) {
      pendencias.push({ etapa: 3, tab: 'volumes', label: 'Adicione pelo menos um volume' });
    }
    if (!(formData.detalhamento_expedicao?.length > 0)) {
      pendencias.push({ etapa: 3, tab: 'expedicao', label: 'Adicione detalhamento de expedição' });
    }
    return pendencias;
  }

  // Etapa 4 — Envio
  if (!isEtapaCompletaExpedicao(4, formData, fluxoEstrito)) {
    pendencias.push({ etapa: 4, tab: 'expedicao', label: 'Preencha a data de expedição no detalhamento' });
    return pendencias;
  }

  // Etapa 5 — Entrega
  if (!isEtapaCompletaExpedicao(5, formData, fluxoEstrito)) {
    if (!formData.data_necessidade) pendencias.push({ etapa: 5, tab: 'expedicao', label: 'Data de necessidade' });
    if (!formData.data_entrega) pendencias.push({ etapa: 5, tab: 'expedicao', label: 'Data de entrega' });
    return pendencias;
  }

  // Etapa 6 — Ocorrências (transversal: só gera pendência quando há ocorrência aberta)
  if (!isOcorrenciaExpedicaoCompleta(formData)) {
    pendencias.push({ etapa: 6, tab: 'ocorrencias', label: 'Informe a Data de Solução da ocorrência' });
    return pendencias;
  }

  return pendencias;
}

// ─────────────────────────────────────────────────────────────────────────────
// RECEBIMENTO — 4 etapas: XML → Conferência → Divergências → Armazenagem
// ─────────────────────────────────────────────────────────────────────────────

export function getEtapasRecebimento(formData) {
  const fluxo = formData.fluxo_recebimento || {};
  // Etapa 3 (Divergências) é considerada completa se:
  // - flag persistida diz que sim, OU
  // - usuário respondeu "Não" ao "Houve um problema?" (problema_recebimento === false explícito), OU
  // - usuário respondeu "Sim" e preencheu problemas + data de solução
  const divergenciasCompleta = !!fluxo.validacao_divergencias_completa
    || (formData.problema_recebimento === false)
    || (formData.problema_recebimento === true
        && (formData.problemas_recebimento_ids?.length > 0)
        && !!formData.data_solucao);
  const etapas = [
    { id: 1, key: 'xml', label: 'Importar XML', completa: !!fluxo.xml_importado },
    { id: 2, key: 'conferencia', label: 'Conferência Manual', completa: !!fluxo.conferencia_manual_completa },
    { id: 3, key: 'divergencias', label: 'Divergências', completa: divergenciasCompleta },
    { id: 4, key: 'armazenagem', label: 'Armazenagem', completa: !!fluxo.armazenagem_completa },
  ];

  const proxima = etapas.find(e => !e.completa);
  const etapaAtualId = proxima ? proxima.id : 4;
  etapas.forEach(e => { e.atual = e.id === etapaAtualId && !e.completa; });

  return etapas;
}

export function getPendenciasRecebimento(formData) {
  const fluxo = formData.fluxo_recebimento || {};
  const pendencias = [];

  // Etapa 1 — Importar XML (ou preencher manualmente)
  if (!fluxo.xml_importado) {
    pendencias.push({ etapa: 1, tab: 'anexos', label: 'Importe o XML da NFe (aba Anexos) ou preencha o cabeçalho manualmente' });
    if (!formData.nfe_numero_receb) pendencias.push({ etapa: 1, tab: 'receb-documento', label: 'Número da NF' });
    return pendencias;
  }

  // Etapa 2 — Conferência manual de materiais
  if (!fluxo.conferencia_manual_completa) {
    const itens = formData.nfe_itens_conferencia || [];
    if (itens.length === 0) {
      pendencias.push({ etapa: 2, tab: 'receb-mat', label: 'Confira os itens (aba Materiais)' });
    } else {
      const naoConferidos = itens.filter(i => !i.conferido);
      if (naoConferidos.length > 0) {
        pendencias.push({
          etapa: 2,
          tab: 'receb-mat',
          label: `Conferir ${naoConferidos.length} ${naoConferidos.length === 1 ? 'item' : 'itens'}`,
        });
      }
    }
    return pendencias;
  }

  // Etapa 3 — Validação de divergências
  // Considera completa se: flag persistida ok, OU usuário respondeu "Não" (false explícito),
  // OU respondeu "Sim" e preencheu problemas + data de solução.
  const etapa3Completa = !!fluxo.validacao_divergencias_completa
    || (formData.problema_recebimento === false)
    || (formData.problema_recebimento === true
        && (formData.problemas_recebimento_ids?.length > 0)
        && !!formData.data_solucao);
  if (!etapa3Completa) {
    if (formData.problema_recebimento === true) {
      if (!(formData.problemas_recebimento_ids?.length > 0)) {
        pendencias.push({ etapa: 3, tab: 'receb-dados', label: 'Selecione o(s) problema(s) identificado(s)' });
      }
      if (!formData.data_solucao) {
        pendencias.push({ etapa: 3, tab: 'receb-dados', label: 'Data de solução do problema' });
      }
    } else {
      pendencias.push({ etapa: 3, tab: 'receb-dados', label: 'Confirme se houve problema (Sim/Não)' });
    }
    return pendencias;
  }

  // Etapa 4 — Armazenagem
  if (!fluxo.armazenagem_completa) {
    pendencias.push({ etapa: 4, tab: 'receb-mat', label: 'Defina a armazenagem dos itens' });
    if (!formData.data_recebimento) pendencias.push({ etapa: 4, tab: 'receb-dados', label: 'Data de recebimento' });
    if (formData.numero_migo_receb && !formData.data_migo_receb) {
      pendencias.push({ etapa: 4, tab: 'receb-documento', label: 'Data MIGO (obrigatória quando há Nº MIGO)' });
    }
    return pendencias;
  }

  return pendencias;
}

// ─────────────────────────────────────────────────────────────────────────────
// API unificada
// ─────────────────────────────────────────────────────────────────────────────

// Reconcilia o estado de "completa" das etapas com as pendências reais.
// Uma etapa só é considerada completa se: a flag do fluxo dizia que sim
// E não há mais nenhuma pendência apontada por aquela etapa.
// Isso evita que uma OS nova apareça com etapas marcadas como concluídas
// sem que os campos obrigatórios tenham sido preenchidos.
function reconciliarEtapas(etapas, pendencias) {
  const pendentesPorEtapa = new Set((pendencias || []).map(p => p.etapa));
  const reconciliadas = etapas.map(e => ({
    ...e,
    completa: e.completa && !pendentesPorEtapa.has(e.id),
  }));
  const proxima = reconciliadas.find(e => !e.completa);
  const etapaAtualId = proxima ? proxima.id : reconciliadas[reconciliadas.length - 1].id;
  reconciliadas.forEach(e => { e.atual = e.id === etapaAtualId && !e.completa; });
  return reconciliadas;
}

export function getFluxoState(formData, { usaFluxoExpedicao, usaFluxoRecebimento, fluxoEstrito = true }) {
  if (usaFluxoExpedicao) {
    const pendencias = getPendenciasExpedicao(formData, fluxoEstrito);
    const etapas = reconciliarEtapas(getEtapasExpedicao(formData, fluxoEstrito), pendencias);
    const etapaAtual = etapas.find(e => e.atual) || etapas[etapas.length - 1];
    return { tipo: 'expedicao', etapas, pendencias, etapaAtual, progresso: formData.progresso || 0 };
  }
  if (usaFluxoRecebimento) {
    const pendencias = getPendenciasRecebimento(formData);
    const etapas = reconciliarEtapas(getEtapasRecebimento(formData), pendencias);
    const etapaAtual = etapas.find(e => e.atual) || etapas[etapas.length - 1];
    return { tipo: 'recebimento', etapas, pendencias, etapaAtual, progresso: formData.progresso || 0 };
  }
  return null;
}