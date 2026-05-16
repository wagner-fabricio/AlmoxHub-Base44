// Validador centralizado de fluxos de OS (Expedição e Recebimento).
// Funções puras — recebem formData e retornam estado das etapas + pendências.
// Usado pelo OSGuiaFluxoPainel (informativo) e pode ser usado pelo OSFormModal (validação).

// ─────────────────────────────────────────────────────────────────────────────
// EXPEDIÇÃO — 5 etapas: Solicitação → Separação → Preparação → Envio → Entrega
// ─────────────────────────────────────────────────────────────────────────────

export function getEtapasExpedicao(formData) {
  const fluxo = formData.fluxo_expedicao || {};
  const etapas = [
    {
      id: 1,
      key: 'solicitacao',
      label: 'Solicitação',
      completa: !!fluxo.solicitacao_completa,
      data: fluxo.solicitacao_data,
    },
    {
      id: 2,
      key: 'separacao',
      label: 'Separação',
      completa: !!fluxo.separacao_completa,
      data: fluxo.separacao_data,
    },
    {
      id: 3,
      key: 'preparacao',
      label: 'Preparação',
      completa: !!fluxo.preparacao_completa,
      data: fluxo.preparacao_data,
    },
    {
      id: 4,
      key: 'envio',
      label: 'Envio',
      completa: !!fluxo.envio_completo,
      data: fluxo.envio_data,
    },
    {
      id: 5,
      key: 'entrega',
      label: 'Entrega',
      completa: !!fluxo.entrega_completa,
      data: fluxo.entrega_data,
    },
  ];

  // Etapa atual = primeira não completa, ou 5 se tudo completo
  const proxima = etapas.find(e => !e.completa);
  const etapaAtualId = proxima ? proxima.id : 5;
  etapas.forEach(e => { e.atual = e.id === etapaAtualId && !e.completa; });

  return etapas;
}

export function getPendenciasExpedicao(formData) {
  const fluxo = formData.fluxo_expedicao || {};
  const pendencias = [];

  // Etapa 1 — Solicitação: dados gerais obrigatórios
  if (!fluxo.solicitacao_completa) {
    if (!formData.categoria_id) pendencias.push({ etapa: 1, tab: 'geral', label: 'Categoria' });
    if (!formData.subcategorias_ids?.length) pendencias.push({ etapa: 1, tab: 'geral', label: 'Subcategoria' });
    if (!formData.regional_id) pendencias.push({ etapa: 1, tab: 'geral', label: 'Regional' });
    if (!formData.almoxarifado_id) pendencias.push({ etapa: 1, tab: 'geral', label: 'Almoxarifado' });
    if (!formData.lider_id) pendencias.push({ etapa: 1, tab: 'geral', label: 'Líder' });
    if (!formData.prazo) pendencias.push({ etapa: 1, tab: 'geral', label: 'Prazo' });
    if (!formData.complexidade) pendencias.push({ etapa: 1, tab: 'geral', label: 'Complexidade' });
    if (!formData.num_reserva) pendencias.push({ etapa: 1, tab: 'geral', label: 'Nº da Reserva' });
    if (!formData.data_reserva) pendencias.push({ etapa: 1, tab: 'geral', label: 'Data da Reserva' });
    if (!formData.usuario_reserva) pendencias.push({ etapa: 1, tab: 'geral', label: 'Nome do Usuário' });
    if (!formData.orgao) pendencias.push({ etapa: 1, tab: 'geral', label: 'Órgão' });
    if (!formData.vinculacao) pendencias.push({ etapa: 1, tab: 'geral', label: 'Vinculação (Custeio/Investimento)' });
    if (!formData.instalacao_origem_id) pendencias.push({ etapa: 1, tab: 'geral', label: 'Instalação Origem' });
    if (!formData.instalacao_destino_id) pendencias.push({ etapa: 1, tab: 'geral', label: 'Instalação Destino' });
    return pendencias;
  }

  // Etapa 2 — Separação: todos os itens marcados como separados
  if (!fluxo.separacao_completa) {
    const itens = formData.itens_documento || [];
    if (itens.length === 0) {
      pendencias.push({ etapa: 2, tab: 'materiais', label: 'Adicione itens ao documento (aba Materiais)' });
    } else {
      const naoSeparados = itens.filter(i => !i.separado);
      if (naoSeparados.length > 0) {
        pendencias.push({
          etapa: 2,
          tab: 'materiais',
          label: `Marque ${naoSeparados.length} ${naoSeparados.length === 1 ? 'item' : 'itens'} como separado(s)`,
        });
      }
    }
    // Campos administrativos da separação (se já há volumes)
    if ((formData.volumes?.length || 0) > 0) {
      if (!formData.responsavel_separacao) pendencias.push({ etapa: 2, tab: 'volumes', label: 'Responsável pela separação' });
      if (!formData.data_separacao) pendencias.push({ etapa: 2, tab: 'volumes', label: 'Data de início da separação' });
      if (!formData.separacao_concluida_em) pendencias.push({ etapa: 2, tab: 'volumes', label: 'Data de conclusão da separação' });
    }
    return pendencias;
  }

  // Etapa 3 — Preparação: volumes + detalhamento de expedição
  if (!fluxo.preparacao_completa) {
    if (!(formData.volumes?.length > 0)) {
      pendencias.push({ etapa: 3, tab: 'volumes', label: 'Adicione pelo menos um volume' });
    }
    if (!(formData.detalhamento_expedicao?.length > 0)) {
      pendencias.push({ etapa: 3, tab: 'expedicao', label: 'Adicione detalhamento de expedição' });
    }
    return pendencias;
  }

  // Etapa 4 — Envio: data de expedição em pelo menos um detalhamento
  if (!fluxo.envio_completo) {
    const temDataExp = (formData.detalhamento_expedicao || []).some(e => e.data_expedicao);
    if (!temDataExp) {
      pendencias.push({ etapa: 4, tab: 'expedicao', label: 'Preencha a data de expedição no detalhamento' });
    }
    return pendencias;
  }

  // Etapa 5 — Entrega: data_entrega preenchida
  if (!fluxo.entrega_completa) {
    if (!formData.data_necessidade) pendencias.push({ etapa: 5, tab: 'expedicao', label: 'Data de necessidade' });
    if (!formData.data_entrega) pendencias.push({ etapa: 5, tab: 'expedicao', label: 'Data de entrega' });
    return pendencias;
  }

  return pendencias;
}

// ─────────────────────────────────────────────────────────────────────────────
// RECEBIMENTO — 4 etapas: XML → Conferência → Divergências → Armazenagem
// ─────────────────────────────────────────────────────────────────────────────

export function getEtapasRecebimento(formData) {
  const fluxo = formData.fluxo_recebimento || {};
  const etapas = [
    { id: 1, key: 'xml', label: 'Importar XML', completa: !!fluxo.xml_importado },
    { id: 2, key: 'conferencia', label: 'Conferência Manual', completa: !!fluxo.conferencia_manual_completa },
    { id: 3, key: 'divergencias', label: 'Divergências', completa: !!fluxo.validacao_divergencias_completa },
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
  if (!fluxo.validacao_divergencias_completa) {
    if (formData.problema_recebimento) {
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

export function getFluxoState(formData, { usaFluxoExpedicao, usaFluxoRecebimento }) {
  if (usaFluxoExpedicao) {
    const etapas = getEtapasExpedicao(formData);
    const pendencias = getPendenciasExpedicao(formData);
    const etapaAtual = etapas.find(e => e.atual) || etapas[etapas.length - 1];
    return { tipo: 'expedicao', etapas, pendencias, etapaAtual, progresso: formData.progresso || 0 };
  }
  if (usaFluxoRecebimento) {
    const etapas = getEtapasRecebimento(formData);
    const pendencias = getPendenciasRecebimento(formData);
    const etapaAtual = etapas.find(e => e.atual) || etapas[etapas.length - 1];
    return { tipo: 'recebimento', etapas, pendencias, etapaAtual, progresso: formData.progresso || 0 };
  }
  return null;
}