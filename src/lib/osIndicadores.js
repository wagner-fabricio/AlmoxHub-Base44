/**
 * Cálculo de indicadores (KPIs) contextuais por aba do formulário de OS.
 *
 * Convenções:
 *  - Funções retornam objeto: { status, valor, detalhe, regra }
 *      status: 'no_prazo' | 'fora_prazo' | 'pendente' | 'sem_dados' | 'info' | 'ok' | 'alerta'
 *      valor: string curta para exibir como número/percentual
 *      detalhe: string com previsto × realizado, ou complemento
 *      regra: texto curto para tooltip
 *  - Datas são strings 'yyyy-MM-dd' ou ISO. Parser tolerante.
 */

const parseData = (d) => {
  if (!d) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return new Date(d + 'T12:00:00');
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? null : dt;
};

const diasCorridos = (de, ate) => {
  const d1 = parseData(de);
  const d2 = parseData(ate);
  if (!d1 || !d2) return null;
  return Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
};

const diasUteis = (de, ate) => {
  const d1 = parseData(de);
  const d2 = parseData(ate);
  if (!d1 || !d2) return null;
  if (d2 < d1) return 0;
  let count = 0;
  const cur = new Date(d1);
  while (cur <= d2) {
    const dia = cur.getDay();
    if (dia !== 0 && dia !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return Math.max(0, count - 1);
};

const maiorData = (...datas) => {
  const valid = datas.map(parseData).filter(Boolean);
  if (!valid.length) return null;
  return new Date(Math.max(...valid.map(d => d.getTime())));
};

// SLA da Separação por complexidade
const slaSeparacaoPorComplexidade = (complexidade) => {
  if (complexidade === 'baixa') return 2;
  if (complexidade === 'alta') return 4;
  return 3; // media (padrão)
};

// SLA da Reserva por prioridade (mesma regra do indicador mensal)
const slaReservaPorPrioridade = (prioridade) =>
  prioridade === 'urgente' ? 1 : 7;

// SLA de Regularização (Receb → MIGO) por subcategoria
const slaRegularizacaoRecebimento = (subcategoriasIds, subcategoriasAll) => {
  const nomes = (subcategoriasIds || [])
    .map(id => subcategoriasAll?.find(s => s.id === id)?.nome?.toLowerCase() || '')
    .join(' ');
  if (nomes.includes('estoque')) return 7;
  if (nomes.includes('aplicação específica') || nomes.includes('aplicacao especifica')) return 14;
  return 7;
};

const SEM_DADOS = { status: 'sem_dados', valor: 'Sem dados', detalhe: '', regra: '' };

// ───────────────────────────────────────────────────────── Dados Gerais

export const calcConclusaoOS = (os) => {
  if (!os?.prazo) return SEM_DADOS;
  const prazo = parseData(os.prazo);
  const inicio = parseData(os.data_inicial) || parseData(os.created_date);
  const fim = parseData(os.data_conclusao);
  const previstoDias = inicio && prazo ? diasCorridos(inicio, prazo) : null;

  if (os.status === 'cancelado') {
    return { status: 'info', valor: 'Cancelada', detalhe: '', regra: 'OS cancelada' };
  }

  if (fim) {
    const realizadoDias = inicio ? diasCorridos(inicio, fim) : null;
    const noPrazo = fim <= prazo;
    return {
      status: noPrazo ? 'no_prazo' : 'fora_prazo',
      valor: noPrazo ? 'No prazo' : 'Fora do prazo',
      detalhe: previstoDias !== null && realizadoDias !== null
        ? `${previstoDias}d previstos × ${realizadoDias}d realizados`
        : '',
      regra: 'Data de conclusão vs prazo.',
    };
  }

  // Em andamento
  const hoje = new Date();
  const atrasada = hoje > prazo;
  const decorridos = inicio ? diasCorridos(inicio, hoje) : null;
  return {
    status: atrasada ? 'fora_prazo' : 'pendente',
    valor: atrasada ? 'Atrasada' : 'Em andamento',
    detalhe: previstoDias !== null && decorridos !== null
      ? `${previstoDias}d previstos × ${decorridos}d decorridos`
      : '',
    regra: 'OS ainda não concluída. Comparação contra a data de hoje.',
  };
};

// ───────────────────────────────────────────────────────── Documento (Expedição)

export const calcAtendimentoReserva = (os) => {
  const inicio = maiorData(os.data_reserva, os.data_ressuprimento, os.data_aprovacao_epi);
  const fim = parseData(os.data_migo);
  if (!inicio) return SEM_DADOS;
  const sla = slaReservaPorPrioridade(os.prioridade);

  if (!fim) {
    const hoje = new Date();
    const decorridos = diasUteis(inicio, hoje);
    return {
      status: decorridos !== null && decorridos > sla ? 'fora_prazo' : 'pendente',
      valor: 'Aguardando MIGO',
      detalhe: decorridos !== null ? `SLA ${sla}d úteis × ${decorridos}d úteis decorridos` : '',
      regra: `Início: maior data entre Reserva/Ressuprimento/Aprovação EPI. Fim: Data MIGO. SLA ${sla} dias úteis (prioridade ${os.prioridade || 'media'}).`,
    };
  }

  const realizado = diasUteis(inicio, fim);
  const noPrazo = realizado !== null && realizado <= sla;
  return {
    status: noPrazo ? 'no_prazo' : 'fora_prazo',
    valor: noPrazo ? 'No prazo' : 'Fora do prazo',
    detalhe: `SLA ${sla}d úteis × ${realizado}d úteis realizados`,
    regra: `Início: maior data entre Reserva/Ressuprimento/Aprovação EPI. Fim: Data MIGO. SLA ${sla} dias úteis (prioridade ${os.prioridade || 'media'}).`,
  };
};

// ───────────────────────────────────────────────────────── Materiais (Expedição)

export const calcInFull = (os) => {
  const itens = os?.itens_documento || [];
  if (!itens.length) return SEM_DADOS;
  const completos = itens.filter(i => {
    const qSep = Number(i.quantidade_separada || 0);
    const qSol = Number(i.quantidade || 0);
    return i.separado || (qSol > 0 && qSep >= qSol);
  }).length;
  const total = itens.length;
  const perc = total ? Math.round((completos / total) * 100) : 0;
  const inFull = perc === 100;
  return {
    status: inFull ? 'no_prazo' : (perc >= 80 ? 'alerta' : 'fora_prazo'),
    valor: `${perc}%`,
    detalhe: `${completos} de ${total} itens completos`,
    regra: 'In-Full: % de itens com quantidade separada ≥ solicitada (ou marcados como separados).',
  };
};

// ───────────────────────────────────────────────────────── Volumes (Expedição)

export const calcCicloSeparacao = (os) => {
  if (!os?.data_separacao || !os?.separacao_concluida_em) return SEM_DADOS;
  const dias = diasUteis(os.data_separacao, os.separacao_concluida_em);
  const sla = slaSeparacaoPorComplexidade(os.complexidade);
  if (dias === null) return SEM_DADOS;
  const noPrazo = dias <= sla;
  return {
    status: noPrazo ? 'no_prazo' : 'fora_prazo',
    valor: `${dias}d úteis`,
    detalhe: `SLA ${sla}d úteis (complexidade ${os.complexidade || 'media'})`,
    regra: 'Tempo de Ciclo de Separação: Data Início Separação → Concluída Em. SLA por complexidade: baixa 2d, média 3d, alta 4d.',
  };
};

// ───────────────────────────────────────────────────────── Expedição

export const calcOnTime = (os) => {
  if (!os?.data_necessidade) return SEM_DADOS;
  if (!os.data_entrega) {
    const hoje = new Date();
    const necessidade = parseData(os.data_necessidade);
    return {
      status: hoje > necessidade ? 'fora_prazo' : 'pendente',
      valor: 'Aguardando entrega',
      detalhe: '',
      regra: 'On-Time: Data Entrega ≤ Data Necessidade.',
    };
  }
  const entrega = parseData(os.data_entrega);
  const necessidade = parseData(os.data_necessidade);
  const noPrazo = entrega <= necessidade;
  const diff = diasCorridos(necessidade, entrega);
  return {
    status: noPrazo ? 'no_prazo' : 'fora_prazo',
    valor: noPrazo ? 'On-Time' : 'Atrasada',
    detalhe: diff !== null ? (diff === 0 ? 'No dia' : (diff > 0 ? `+${diff}d` : `${diff}d`)) : '',
    regra: 'On-Time: Data Entrega ≤ Data Necessidade.',
  };
};

export const calcOTIF = (os) => {
  const onTime = calcOnTime(os);
  const inFull = calcInFull(os);
  if (onTime.status === 'sem_dados' || inFull.status === 'sem_dados') return SEM_DADOS;
  const isOnTime = onTime.status === 'no_prazo';
  const isInFull = inFull.status === 'no_prazo';
  const otif = isOnTime && isInFull;
  return {
    status: otif ? 'no_prazo' : (onTime.status === 'pendente' ? 'pendente' : 'fora_prazo'),
    valor: otif ? 'OTIF' : 'Não OTIF',
    detalhe: `On-Time: ${isOnTime ? '✓' : '✗'}  |  In-Full: ${isInFull ? '✓' : '✗'}`,
    regra: 'OTIF: entrega no prazo (On-Time) E completa (In-Full) simultaneamente.',
  };
};

// ───────────────────────────────────────────────────────── Recebimento — Dados

export const calcQualidadeRecebimento = (os) => {
  if (os?.problema_recebimento === null || os?.problema_recebimento === undefined) return SEM_DADOS;
  if (os.problema_recebimento === false) {
    return { status: 'no_prazo', valor: 'Sem problemas', detalhe: '', regra: 'Recebimento sem problemas reportados.' };
  }
  const resolvido = !!os.data_solucao;
  return {
    status: resolvido ? 'alerta' : 'fora_prazo',
    valor: resolvido ? 'Resolvido' : 'Em aberto',
    detalhe: `${os.problemas_recebimento_ids?.length || 0} problema(s)`,
    regra: 'Indicador de qualidade do recebimento. Resolvido = possui data de solução.',
  };
};

// ───────────────────────────────────────────────────────── Recebimento — Documento

export const calcTempoRegularizacao = (os, subcategoriasAll) => {
  const inicio = parseData(os?.data_recebimento);
  const fim = parseData(os?.data_migo_receb);
  if (!inicio) return SEM_DADOS;
  const sla = slaRegularizacaoRecebimento(os.subcategorias_ids, subcategoriasAll);

  if (!fim) {
    const hoje = new Date();
    const decorridos = diasUteis(inicio, hoje);
    return {
      status: decorridos !== null && decorridos > sla ? 'fora_prazo' : 'pendente',
      valor: 'Aguardando MIGO',
      detalhe: decorridos !== null ? `SLA ${sla}d úteis × ${decorridos}d úteis decorridos` : '',
      regra: `Tempo de Regularização: Data Recebimento → Data MIGO. SLA ${sla} dias úteis (Compra - ${sla === 7 ? 'Estoque' : 'Aplicação Específica'}).`,
    };
  }

  const realizado = diasUteis(inicio, fim);
  const noPrazo = realizado !== null && realizado <= sla;
  return {
    status: noPrazo ? 'no_prazo' : 'fora_prazo',
    valor: noPrazo ? 'No prazo' : 'Fora do prazo',
    detalhe: `SLA ${sla}d úteis × ${realizado}d úteis realizados`,
    regra: `Tempo de Regularização: Data Recebimento → Data MIGO. SLA ${sla} dias úteis.`,
  };
};

// ───────────────────────────────────────────────────────── Indicadores por aba

export function getIndicadoresPorAba({ os, aba, contexto }) {
  if (!os) return [];
  const { subcategoriasAll } = contexto || {};

  switch (aba) {
    case 'geral':
      return [
        { titulo: 'Conclusão da OS', ...calcConclusaoOS(os) },
      ];
    case 'documento':
      return [
        { titulo: 'Atendimento de Reserva', ...calcAtendimentoReserva(os) },
      ];
    case 'materiais':
      return [
        { titulo: 'In-Full', ...calcInFull(os) },
      ];
    case 'volumes':
      return [
        { titulo: 'Ciclo de Separação', ...calcCicloSeparacao(os) },
      ];
    case 'expedicao':
      return [
        { titulo: 'On-Time', ...calcOnTime(os) },
        { titulo: 'OTIF', ...calcOTIF(os) },
      ];
    case 'receb-dados':
      return [
        { titulo: 'Qualidade do Recebimento', ...calcQualidadeRecebimento(os) },
      ];
    case 'receb-documento':
      return [
        { titulo: 'Tempo de Regularização', ...calcTempoRegularizacao(os, subcategoriasAll) },
      ];
    default:
      return [];
  }
}