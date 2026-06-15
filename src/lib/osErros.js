// Detecção de erros de preenchimento de OS, atribuídos ao atendente.
//
// Tipos de erro detectados:
//  - migo_expedicao: OS de expedição "Com Reserva" sem Número ou Data MIGO
//  - migo_recebimento: OS de recebimento "Compra - Estoque/Aplicação Específica" sem Número/Data MIGO Receb.
//  - status_nao_concluido: fluxo chegou a 100% mas status != concluído
//  - concluido_sem_fluxo: status concluído mas fluxo não chegou a 100%
//  - valor_material: itens de material sem valor preenchido
//  - peso_volume: volumes sem peso bruto
//  - dimensao_volume: volumes sem largura/altura/comprimento

export const TIPOS_ERRO = [
  { key: 'migo_expedicao',      label: 'MIGO Expedição (nº/data)',     cor: '#ef4444' },
  { key: 'migo_recebimento',    label: 'MIGO Recebimento (nº/data)',   cor: '#f97316' },
  { key: 'status_nao_concluido',label: 'Fluxo 100% sem Concluído',     cor: '#eab308' },
  { key: 'concluido_sem_fluxo', label: 'Concluído sem fim do fluxo',   cor: '#8b5cf6' },
  { key: 'valor_material',      label: 'Material sem valor',           cor: '#0ea5e9' },
  { key: 'peso_volume',         label: 'Volume sem peso',              cor: '#ec4899' },
  { key: 'dimensao_volume',     label: 'Volume sem dimensões',         cor: '#14b8a6' },
];

const norm = (s) => (s || '').toLowerCase();

function getSubcatNomes(os, subcategorias) {
  return (os.subcategorias_ids || [])
    .map(sid => subcategorias?.find(s => s.id === sid)?.nome)
    .filter(Boolean)
    .map(norm);
}

// Detecta a lista de erros (keys) de uma OS.
export function detectarErrosOS(os, { categorias, subcategorias }) {
  const erros = [];
  const categoria = categorias?.find(c => c.id === os.categoria_id);
  const catNome = norm(categoria?.nome);
  const isExpedicao = catNome.includes('expedição') || catNome.includes('expedicao');
  const isRecebimento = catNome.includes('recebimento');
  const subcatNomes = getSubcatNomes(os, subcategorias);

  const usaFluxoExpedicao = isExpedicao;
  const usaFluxoExpedicaoEstrito = isExpedicao && subcatNomes.some(n => n.includes('com reserva'));
  const usaFluxoRecebimento = isRecebimento && subcatNomes.some(n =>
    n.includes('aplicação específica') || n.includes('aplicacao especifica') || n.includes('estoque')
  );

  // 1. MIGO de expedição (Com Reserva) — número e data obrigatórios
  if (usaFluxoExpedicaoEstrito) {
    if (!os.num_migo || !os.data_migo) erros.push('migo_expedicao');
  }

  // 2. MIGO de recebimento (Compra Estoque/Aplicação Específica)
  if (usaFluxoRecebimento) {
    if (!os.numero_migo_receb || !os.data_migo_receb) erros.push('migo_recebimento');
  }

  // 3 e 4. Coerência status x fim do fluxo (apenas OS com fluxo)
  if (usaFluxoExpedicao || usaFluxoRecebimento) {
    const fimFluxo = usaFluxoRecebimento
      ? os.fluxo_recebimento?.armazenagem_completa === true
      : os.fluxo_expedicao?.entrega_completa === true;
    const progresso = Math.round(os.progresso || 0);
    const concluido = os.status === 'concluido';
    const cancelado = os.status === 'cancelado';
    if (!cancelado) {
      if ((fimFluxo || progresso >= 100) && !concluido) erros.push('status_nao_concluido');
      if (concluido && !(fimFluxo || progresso >= 100)) erros.push('concluido_sem_fluxo');
    }
  }

  // 5. Material sem valor (itens de documento de expedição)
  if (usaFluxoExpedicao) {
    const itens = os.itens_documento || [];
    if (itens.length > 0 && itens.some(it => {
      const v = it.r_total ?? it.r_unit;
      return v === undefined || v === null || Number(v) === 0;
    })) erros.push('valor_material');
  }

  // 6 e 7. Volumes sem peso / dimensões
  const volumes = os.volumes || [];
  if (volumes.length > 0) {
    if (volumes.some(v => !v.peso_bruto || Number(v.peso_bruto) === 0)) erros.push('peso_volume');
    if (volumes.some(v => !v.largura || !v.altura || !v.comprimento)) erros.push('dimensao_volume');
  }

  return erros;
}

// Lista as OS que possuem ao menos um erro, com os rótulos dos erros detectados.
// Retorna [{ os, erros: [keys], errosLabels: [labels] }] ordenado por nº de erros desc.
export function listarOSComErros(ordens, { categorias, subcategorias }) {
  const labelDe = (k) => TIPOS_ERRO.find(t => t.key === k)?.label || k;
  return ordens
    .map(os => {
      const erros = detectarErrosOS(os, { categorias, subcategorias });
      return erros.length > 0 ? { os, erros, errosLabels: erros.map(labelDe) } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.erros.length - a.erros.length);
}

// Agrega erros por atendente. Retorna array ordenado por total de erros desc.
export function rankingErrosPorAtendente(ordens, { categorias, subcategorias }) {
  const mapa = new Map();
  ordens.forEach(os => {
    const nome = (os.atendente_nome || '').trim();
    if (!nome) return;
    const erros = detectarErrosOS(os, { categorias, subcategorias });
    if (erros.length === 0) return;
    if (!mapa.has(nome)) {
      const base = { atendente: nome, total: 0 };
      TIPOS_ERRO.forEach(t => { base[t.key] = 0; });
      mapa.set(nome, base);
    }
    const reg = mapa.get(nome);
    erros.forEach(k => { reg[k] += 1; reg.total += 1; });
  });
  return Array.from(mapa.values()).sort((a, b) => b.total - a.total);
}