import React, { useState, useEffect, useMemo } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, LineChart, Line, ReferenceLine, LabelList,
  AreaChart, Area
} from 'recharts';
import { Target, Clock, Package, TrendingUp, DollarSign, Shield, Box, Navigation, Truck } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SortableTableHead, useTableSort, useColumnFilters } from '@/components/ui/table-sortable';
import { useApp } from '@/components/contexts/AppContext';
import { base44 } from '@/api/base44Client';
import OSDetailModal from '@/components/os/OSDetailModal';
import OSFormModal from '@/components/os/OSFormModal';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const safeFormat = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? '—' : format(dt, 'dd/MM/yy');
};

const TOOLTIP_STYLE = {
  backgroundColor: '#fff', border: '1px solid #e2e8f0',
  borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
};

const MODAL_COLORS = {
  'Terrestre': '#0000FF', 'Aéreo': '#FF6B00', 'Marítimo': '#10b981', 'Misto': '#6366F1',
};
const RESP_COLORS = {
  'Transportadora': '#0000FF', 'Arrematante': '#FF6B00', 'Empreiteira': '#10b981',
  'Locadora': '#6366F1', 'Portador': '#f59e0b', 'Axia': '#0A003C', 'Correios': '#ef4444',
};
const VINC_COLORS = { 'Custeio': '#0000FF', 'Investimento': '#FF6B00', 'Não definido': '#94a3b8' };

// ─── OTIF calc ────────────────────────────────────────────────────────────────
function calcularOTIF(osExpedicao) {
  const entregues = osExpedicao.filter(os => os.status_separacao === 'entregue');
  const isOnTime = (os) => os.data_entrega && os.data_necessidade
    ? new Date(os.data_entrega) <= new Date(os.data_necessidade) : false;
  const isInFull = (os) => {
    const itens = os.itens_documento || [];
    if (itens.length === 0) return false;
    if (itens.every(i => i.separado === true)) return true;
    const qtdSol = itens.reduce((s, i) => s + (i.quantidade || 0), 0);
    const qtdSep = itens.reduce((s, i) => s + (i.quantidade_separada || 0), 0);
    return qtdSep >= qtdSol && qtdSol > 0;
  };
  const totalOT = entregues.filter(os => os.data_necessidade).length;
  const totalIF = entregues.filter(os => (os.itens_documento || []).length > 0).length;
  const totalOTIF = entregues.filter(os => os.data_necessidade && (os.itens_documento || []).length > 0).length;
  const otCount = entregues.filter(isOnTime).length;
  const ifCount = entregues.filter(isInFull).length;
  const otifCount = entregues.filter(os => isOnTime(os) && isInFull(os)).length;
  return {
    otRate: totalOT > 0 ? Math.round((otCount / totalOT) * 100) : 0,
    ifRate: totalIF > 0 ? Math.round((ifCount / totalIF) * 100) : 0,
    otifRate: totalOTIF > 0 ? Math.round((otifCount / totalOTIF) * 100) : 0,
    otCount, ifCount, otifCount, totalOT, totalIF, totalOTIF, entregues, isOnTime, isInFull,
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function KPICard({ title, value, subtitle, gradient, icon: Icon }) {
  return (
    <div className="relative rounded-2xl p-5 shadow-lg flex flex-col justify-between min-h-[120px]"
      style={{ background: gradient }}>
      <div className="flex items-start justify-between mb-2">
        <p className="text-white/80 text-xs font-medium leading-tight pr-2">{title}</p>
        <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      <div>
        <p className="text-3xl font-bold text-white">{value}</p>
        <p className="text-xs text-white/60 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

function SectionHeader({ title }) {
  return (
    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-6 flex items-center gap-2">
      <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(to bottom, #0000FF, #4169E1)' }} />
      {title}
    </h3>
  );
}

function DonutChart({ value, color, size = 200, innerRadius = 60, outerRadius = 85 }) {
  const data = [{ value }, { value: 100 - value }];
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={innerRadius} outerRadius={outerRadius}
            startAngle={90} endAngle={-270} dataKey="value" paddingAngle={2}>
            <Cell fill={color} /><Cell fill="#e2e8f0" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-bold text-slate-900 dark:text-white" style={{ fontSize: size > 150 ? 28 : 20 }}>{value}%</span>
      </div>
    </div>
  );
}

const EmptyState = ({ msg = 'Dados insuficientes para exibir' }) => (
  <div className="h-40 flex items-center justify-center text-slate-400 text-sm">{msg}</div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PainelExpedicao({ filteredOrdens, almoxarifados }) {
  const { regionais, categorias, subcategorias, pessoas } = useApp();
  const [selectedOS, setSelectedOS] = useState(null);
  const [editingOS, setEditingOS] = useState(null);
  const [instalacoes, setInstalacoes] = useState([]);
  const [projetos, setProjetos] = useState([]);

  useEffect(() => {
    base44.entities.Instalacao.list().then(setInstalacoes).catch(() => {});
    base44.entities.Projeto.list().then(setProjetos).catch(() => {});
  }, []);

  // ── OTIF ──────────────────────────────────────────────────────────────────
  const { otRate, ifRate, otifRate, otCount, ifCount, otifCount, totalOT, totalIF, totalOTIF, entregues, isOnTime, isInFull } =
    useMemo(() => calcularOTIF(filteredOrdens), [filteredOrdens]);

  // ── Todas as expedições (detalhamento) ────────────────────────────────────
  const todasExpedicoes = useMemo(() =>
    filteredOrdens.flatMap(os => (os.detalhamento_expedicao || []).map(exp => ({ ...exp, os }))),
    [filteredOrdens]);

  // ── TCS: Ciclo de Separação ───────────────────────────────────────────────
  const osComSep = useMemo(() =>
    filteredOrdens.filter(os => os.data_separacao && os.separacao_concluida_em), [filteredOrdens]);
  const tcs = osComSep.length > 0
    ? (osComSep.reduce((s, os) => s + Math.abs(differenceInDays(new Date(os.separacao_concluida_em), new Date(os.data_separacao))), 0) / osComSep.length).toFixed(1)
    : null;

  // ── TCR-MIGO: Ciclo Reserva → MIGO ───────────────────────────────────────
  const osComMigo = useMemo(() =>
    filteredOrdens.filter(os => os.data_reserva && os.data_migo), [filteredOrdens]);
  const tcrMigo = osComMigo.length > 0
    ? (osComMigo.reduce((s, os) => s + Math.abs(differenceInDays(new Date(os.data_migo), new Date(os.data_reserva))), 0) / osComMigo.length).toFixed(1)
    : null;

  // ── Mix Modal ─────────────────────────────────────────────────────────────
  const mixModal = useMemo(() => {
    const map = {};
    todasExpedicoes.forEach(e => { if (e.modal_transporte) map[e.modal_transporte] = (map[e.modal_transporte] || 0) + 1; });
    const total = Object.values(map).reduce((s, v) => s + v, 0);
    return Object.entries(map).map(([k, v]) => ({ name: k, value: v, pct: total > 0 ? Math.round((v / total) * 100) : 0 })).sort((a, b) => b.value - a.value);
  }, [todasExpedicoes]);

  // ── Mix Responsável ───────────────────────────────────────────────────────
  const mixResponsavel = useMemo(() => {
    const map = {};
    todasExpedicoes.forEach(e => { if (e.responsavel_transporte) map[e.responsavel_transporte] = (map[e.responsavel_transporte] || 0) + 1; });
    const total = Object.values(map).reduce((s, v) => s + v, 0);
    return Object.entries(map).map(([k, v]) => ({ name: k, value: v, pct: total > 0 ? Math.round((v / total) * 100) : 0 })).sort((a, b) => b.value - a.value);
  }, [todasExpedicoes]);

  // ── TACarona ──────────────────────────────────────────────────────────────
  const caronaCount = todasExpedicoes.filter(e => e.aproveitando_carona === true).length;
  const taCarona = todasExpedicoes.length > 0 ? Math.round((caronaCount / todasExpedicoes.length) * 100) : 0;

  // ── TCS-Seg: Cobertura de Seguro ──────────────────────────────────────────
  const osComSeguravel = filteredOrdens.filter(os => (os.itens_documento || []).some(i => i.seguravel));
  const comSeguro = osComSeguravel.filter(os => (os.detalhamento_expedicao || []).some(e => e.usar_seguro)).length;
  const tcsSeg = osComSeguravel.length > 0 ? Math.round((comSeguro / osComSeguravel.length) * 100) : null;

  // ── CMF + frete total ─────────────────────────────────────────────────────
  const expComFrete = todasExpedicoes.filter(e => (e.transportadora?.valor_frete || 0) > 0);
  const freteTotal = expComFrete.reduce((s, e) => s + (e.transportadora.valor_frete || 0), 0);
  const cmf = expComFrete.length > 0 ? freteTotal / expComFrete.length : null;

  // ── TME: Ticket Médio ─────────────────────────────────────────────────────
  const expComValor = todasExpedicoes.filter(e => (e.valor_total || 0) > 0);
  const tme = expComValor.length > 0
    ? expComValor.reduce((s, e) => s + (e.valor_total || 0), 0) / expComValor.length : null;

  // ── Volume ────────────────────────────────────────────────────────────────
  const volumeM3Total = filteredOrdens.reduce((s, os) => s + (os.volumes || []).reduce((a, v) => a + (v.m3 || 0), 0), 0);
  const pesoTotalKg = filteredOrdens.reduce((s, os) => s + (os.volumes || []).reduce((a, v) => a + (v.peso_bruto || 0), 0), 0);

  // ── Vinculação ────────────────────────────────────────────────────────────
  const vinculacaoData = useMemo(() => {
    const c = filteredOrdens.filter(os => os.vinculacao === 'custeio').length;
    const inv = filteredOrdens.filter(os => os.vinculacao === 'investimento').length;
    const nd = filteredOrdens.filter(os => !os.vinculacao).length;
    return [{ name: 'Custeio', value: c }, { name: 'Investimento', value: inv }, { name: 'Não definido', value: nd }].filter(d => d.value > 0);
  }, [filteredOrdens]);
  const totalVinc = vinculacaoData.reduce((s, d) => s + d.value, 0);

  // ── Ranking Transportadoras ───────────────────────────────────────────────
  const rankingTransp = useMemo(() => {
    const map = {};
    todasExpedicoes.forEach(e => {
      const nome = e.transportadora?.razao_social;
      if (!nome) return;
      if (!map[nome]) map[nome] = { nome, qtd: 0, frete: 0 };
      map[nome].qtd++;
      map[nome].frete += e.transportadora?.valor_frete || 0;
    });
    return Object.values(map).sort((a, b) => b.qtd - a.qtd).slice(0, 8).map(t => ({
      ...t, name: t.nome.length > 24 ? t.nome.substring(0, 22) + '…' : t.nome, nomeCompleto: t.nome,
    }));
  }, [todasExpedicoes]);

  // ── OTIF por Almoxarifado ─────────────────────────────────────────────────
  const otifPorAlmoxarifado = useMemo(() => {
    return almoxarifados.map(almox => {
      const osAlmox = entregues.filter(os => os.almoxarifado_id === almox.id && os.data_necessidade && (os.itens_documento || []).length > 0);
      if (osAlmox.length === 0) return null;
      const cnt = osAlmox.filter(os => isOnTime(os) && isInFull(os)).length;
      const pct = Math.round((cnt / osAlmox.length) * 100);
      return { name: almox.nome.length > 20 ? almox.nome.substring(0, 18) + '…' : almox.nome, nomeCompleto: almox.nome, otif: pct, naoOtif: 100 - pct, total: osAlmox.length };
    }).filter(Boolean).sort((a, b) => b.otif - a.otif);
  }, [entregues, almoxarifados]);

  // ── Volume Mensal ─────────────────────────────────────────────────────────
  const volumeMensal = useMemo(() => {
    const map = {};
    filteredOrdens.forEach(os => {
      if (!os.created_date) return;
      const key = os.created_date.substring(0, 7);
      if (!map[key]) map[key] = { m3: 0, peso: 0 };
      (os.volumes || []).forEach(v => { map[key].m3 += v.m3 || 0; map[key].peso += v.peso_bruto || 0; });
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).slice(-12)
      .map(([key, v]) => {
        const dt = new Date(key + '-15');
        return { mes: isNaN(dt.getTime()) ? key : format(dt, 'MMM/yy', { locale: ptBR }), m3: parseFloat(v.m3.toFixed(1)), peso: parseFloat(v.peso.toFixed(0)) };
      })
      .filter(d => d.m3 > 0 || d.peso > 0);
  }, [filteredOrdens]);

  // ── Frete & Ticket Mensal ─────────────────────────────────────────────────
  const freteMensal = useMemo(() => {
    const map = {};
    todasExpedicoes.forEach(e => {
      if (!e.os?.created_date) return;
      const key = e.os.created_date.substring(0, 7);
      if (!map[key]) map[key] = { frete: 0, valor: 0, qtd: 0 };
      map[key].frete += e.transportadora?.valor_frete || 0;
      map[key].valor += e.valor_total || 0;
      map[key].qtd++;
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).slice(-12)
      .map(([key, v]) => {
        const dt = new Date(key + '-15');
        return { mes: isNaN(dt.getTime()) ? key : format(dt, 'MMM/yy', { locale: ptBR }), frete: Math.round(v.frete), ticket: v.qtd > 0 ? Math.round(v.valor / v.qtd) : 0 };
      })
      .filter(d => d.frete > 0 || d.ticket > 0);
  }, [todasExpedicoes]);

  // ── Ciclo MIGO Mensal ─────────────────────────────────────────────────────
  const cicloMigoMensal = useMemo(() => {
    const map = {};
    osComMigo.forEach(os => {
      const key = os.data_reserva.substring(0, 7);
      if (!map[key]) map[key] = { total: 0, dias: 0 };
      map[key].total++;
      map[key].dias += Math.abs(differenceInDays(new Date(os.data_migo), new Date(os.data_reserva)));
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).slice(-12)
      .map(([key, v]) => {
        const dt = new Date(key + '-15');
        return { mes: isNaN(dt.getTime()) ? key : format(dt, 'MMM/yy', { locale: ptBR }), dias: parseFloat((v.dias / v.total).toFixed(1)) };
      });
  }, [osComMigo]);

  // ── Tendência OTIF Mensal ─────────────────────────────────────────────────
  const tendenciaMensal = useMemo(() => {
    const map = {};
    entregues.forEach(os => {
      if (!os.data_entrega || !os.data_necessidade || !(os.itens_documento || []).length) return;
      const key = os.data_entrega.substring(0, 7);
      if (!map[key]) map[key] = { total: 0, otif: 0 };
      map[key].total++;
      if (isOnTime(os) && isInFull(os)) map[key].otif++;
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).slice(-12)
      .map(([key, v]) => {
        const dt = new Date(key + '-15');
        return { mes: isNaN(dt.getTime()) ? key : format(dt, 'MMM/yy', { locale: ptBR }), otif: Math.round((v.otif / v.total) * 100) };
      });
  }, [entregues]);

  // ── Distribuição Tempo Entrega ────────────────────────────────────────────
  const distribuicaoTempoEntrega = useMemo(() => {
    const buckets = [
      { label: '-15d to -10d', min: -Infinity, max: -10 }, { label: '-10d to -5d', min: -10, max: -5 },
      { label: '-5d to -1d', min: -5, max: -1 }, { label: 'On Time', min: -1, max: 0 },
      { label: '1d - 5d', min: 0, max: 5 }, { label: '5d - 10d', min: 5, max: 10 },
      { label: '10d - 15d', min: 10, max: 15 }, { label: 'more than 15d', min: 15, max: Infinity },
    ];
    const osComDatas = entregues.filter(os => os.data_entrega && os.data_necessidade);
    const total = osComDatas.length;
    if (total === 0) return [];
    return buckets.map(b => {
      const count = osComDatas.filter(os => {
        const dias = differenceInDays(new Date(os.data_entrega), new Date(os.data_necessidade));
        return dias > b.min && dias <= b.max;
      }).length;
      return { label: b.label, pct: total > 0 ? Math.round((count / total) * 100) : 0, count, isOnTime: b.label === 'On Time' };
    }).filter(b => b.count > 0 || b.label === 'On Time');
  }, [entregues]);

  // ── Tabela de OS ──────────────────────────────────────────────────────────
  const { sortConfig, handleSort } = useTableSort();
  const { columnFilters, toggleFilter, clearFilter } = useColumnFilters();

  const osTabela = useMemo(() => {
    return filteredOrdens.filter(os => os.status_separacao && os.status_separacao !== 'pendente').map(os => {
      const itens = os.itens_documento || [];
      const qtdSol = itens.reduce((s, i) => s + (i.quantidade || 0), 0);
      const qtdSep = itens.reduce((s, i) => s + (i.quantidade_separada || 0), 0);
      const tempoEntrega = (os.data_entrega && os.data_necessidade) ? differenceInDays(new Date(os.data_entrega), new Date(os.data_necessidade)) : null;
      const almox = almoxarifados.find(a => a.id === os.almoxarifado_id);
      return { os, almox, qtdSol, qtdSep, tempoEntrega };
    });
  }, [filteredOrdens, almoxarifados]);

  const osTabelaFiltrada = useMemo(() => {
    let rows = [...osTabela];
    Object.entries(columnFilters).forEach(([col, values]) => {
      if (!values || values.length === 0) return;
      rows = rows.filter(({ os, almox, tempoEntrega }) => {
        if (col === 'almox') return values.includes(almox?.nome || '—');
        if (col === 'data_reserva') return values.includes(safeFormat(os.data_reserva));
        if (col === 'data_migo') return values.includes(safeFormat(os.data_migo));
        if (col === 'data_necessidade') return values.includes(safeFormat(os.data_necessidade));
        if (col === 'data_entrega') return values.includes(safeFormat(os.data_entrega));
        if (col === 'tempoEntrega') {
          const label = tempoEntrega === null ? '—' : (tempoEntrega === 0 ? 'No prazo' : `${tempoEntrega > 0 ? '+' : ''}${tempoEntrega}d`);
          return values.includes(label);
        }
        return true;
      });
    });
    if (sortConfig.column && sortConfig.direction) {
      rows.sort((a, b) => {
        let va, vb;
        const col = sortConfig.column;
        if (col === 'codigo') { va = a.os.codigo || ''; vb = b.os.codigo || ''; }
        else if (col === 'almox') { va = a.almox?.nome || ''; vb = b.almox?.nome || ''; }
        else if (col === 'data_reserva') { va = a.os.data_reserva || ''; vb = b.os.data_reserva || ''; }
        else if (col === 'data_migo') { va = a.os.data_migo || ''; vb = b.os.data_migo || ''; }
        else if (col === 'qtdSol') { va = a.qtdSol; vb = b.qtdSol; }
        else if (col === 'qtdSep') { va = a.qtdSep; vb = b.qtdSep; }
        else if (col === 'data_necessidade') { va = a.os.data_necessidade || ''; vb = b.os.data_necessidade || ''; }
        else if (col === 'data_entrega') { va = a.os.data_entrega || ''; vb = b.os.data_entrega || ''; }
        else if (col === 'tempoEntrega') { va = a.tempoEntrega ?? Infinity; vb = b.tempoEntrega ?? Infinity; }
        else { va = ''; vb = ''; }
        if (va < vb) return sortConfig.direction === 'asc' ? -1 : 1;
        if (va > vb) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return rows;
  }, [osTabela, sortConfig, columnFilters]);

  const getUniqueValues = (col) => {
    const vals = osTabela.map(({ os, almox, tempoEntrega }) => {
      if (col === 'almox') return almox?.nome || '—';
      if (col === 'data_reserva') return safeFormat(os.data_reserva);
      if (col === 'data_migo') return safeFormat(os.data_migo);
      if (col === 'data_necessidade') return safeFormat(os.data_necessidade);
      if (col === 'data_entrega') return safeFormat(os.data_entrega);
      if (col === 'tempoEntrega') return tempoEntrega === null ? '—' : (tempoEntrega === 0 ? 'No prazo' : `${tempoEntrega > 0 ? '+' : ''}${tempoEntrega}d`);
      return '—';
    });
    return [...new Set(vals)].sort();
  };

  const temDados = entregues.length > 0;

  return (
    <>
    <div className="space-y-6">

      {/* ── KPI Row 1: OTIF, On-Time, In-Full, TCS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KPICard title="OTIF" value={`${otifRate}%`}
          subtitle={`${otifCount} de ${totalOTIF} entregas`}
          gradient="linear-gradient(135deg, #0000FF 0%, #0A003C 100%)" icon={Target} />
        <KPICard title="On-Time" value={`${otRate}%`}
          subtitle={`${otCount} de ${totalOT} no prazo`}
          gradient="linear-gradient(135deg, #FF6B00 0%, #FF8C00 100%)" icon={Clock} />
        <KPICard title="In-Full" value={`${ifRate}%`}
          subtitle={`${ifCount} de ${totalIF} completos`}
          gradient="linear-gradient(135deg, #059669 0%, #10B981 100%)" icon={Package} />
        <KPICard title="Ciclo Separação (TCS)"
          value={tcs !== null ? `${tcs}d` : '—'}
          subtitle={`${osComSep.length} OS medidas`}
          gradient="linear-gradient(135deg, #5B21B6 0%, #7C3AED 100%)" icon={TrendingUp} />
      </div>

      {/* ── KPI Row 2: TCR-MIGO, CMF, TME, Volume ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KPICard title="Ciclo Reserva→MIGO"
          value={tcrMigo !== null ? `${tcrMigo}d` : '—'}
          subtitle={`${osComMigo.length} OS medidas`}
          gradient="linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)" icon={Navigation} />
        <KPICard title="Custo Médio Frete"
          value={cmf !== null ? `R$${Math.round(cmf).toLocaleString('pt-BR')}` : '—'}
          subtitle={`${expComFrete.length} exp. com frete`}
          gradient="linear-gradient(135deg, #6366F1 0%, #818CF8 100%)" icon={DollarSign} />
        <KPICard title="Ticket Médio"
          value={tme !== null ? `R$${Math.round(tme).toLocaleString('pt-BR')}` : '—'}
          subtitle={`${expComValor.length} exp. com valor`}
          gradient="linear-gradient(135deg, #0284C7 0%, #0EA5E9 100%)" icon={DollarSign} />
        <KPICard title="Volume Total"
          value={volumeM3Total > 0 ? `${volumeM3Total.toFixed(1)}m³` : `${pesoTotalKg.toFixed(0)}kg`}
          subtitle={volumeM3Total > 0 ? `${pesoTotalKg.toFixed(0)} kg peso bruto` : 'sem dados de volume'}
          gradient="linear-gradient(135deg, #64748b 0%, #94a3b8 100%)" icon={Box} />
      </div>

      {/* ── Visão Geral OTIF (donuts) ── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <SectionHeader title="Visão Geral OTIF" />
        {!temDados ? (
          <EmptyState msg="Sem entregas registradas no período" />
        ) : (
          <div className="flex flex-col lg:flex-row items-center justify-around gap-8">
            <div className="flex flex-col items-center gap-3">
              <DonutChart value={otifRate} color="#0000FF" size={220} innerRadius={70} outerRadius={95} />
              <div className="text-center">
                <p className="font-semibold text-slate-900 dark:text-white">% OTIF</p>
                <p className="text-xs text-slate-500">{otifCount} entregas completas e no prazo</p>
              </div>
            </div>
            <div className="hidden lg:block w-px h-48 bg-slate-200 dark:bg-slate-700" />
            <div className="flex flex-row lg:flex-col gap-8">
              <div className="flex flex-col items-center gap-2">
                <DonutChart value={otRate} color="#FF6B00" size={140} innerRadius={45} outerRadius={62} />
                <div className="text-center">
                  <p className="font-semibold text-slate-900 dark:text-white text-sm">% On-Time</p>
                  <p className="text-xs text-slate-500">{otCount}/{totalOT} no prazo</p>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <DonutChart value={ifRate} color="#10b981" size={140} innerRadius={45} outerRadius={62} />
                <div className="text-center">
                  <p className="font-semibold text-slate-900 dark:text-white text-sm">% In-Full</p>
                  <p className="text-xs text-slate-500">{ifCount}/{totalIF} completas</p>
                </div>
              </div>
            </div>
            <div className="hidden lg:block w-px h-48 bg-slate-200 dark:bg-slate-700" />
            <div className="flex flex-col gap-3 text-sm min-w-[160px]">
              {[
                { label: 'OTIF', value: `${otifRate}%`, color: '#0000FF', bg: 'bg-blue-50 dark:bg-blue-900/10' },
                { label: 'On-Time', value: `${otRate}%`, color: '#FF6B00', bg: 'bg-orange-50 dark:bg-orange-900/10' },
                { label: 'In-Full', value: `${ifRate}%`, color: '#10b981', bg: 'bg-green-50 dark:bg-green-900/10' },
              ].map(item => (
                <div key={item.label} className={`flex items-center justify-between gap-4 p-3 rounded-lg ${item.bg}`}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{item.label}</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">{item.value}</span>
                </div>
              ))}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700/30 text-xs text-slate-500">
                Total entregues: <strong>{entregues.length}</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Mix Modal + Mix Responsável ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <SectionHeader title="Mix por Modal de Transporte" />
          {mixModal.length === 0 ? <EmptyState /> : (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="shrink-0">
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie data={mixModal} cx="50%" cy="50%" innerRadius={55} outerRadius={82} paddingAngle={2} dataKey="value">
                      {mixModal.map((e, i) => <Cell key={i} fill={MODAL_COLORS[e.name] || `hsl(${i*60},70%,50%)`} />)}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2 w-full">
                {mixModal.map(e => (
                  <div key={e.name} className="flex items-center justify-between text-xs p-2.5 rounded-lg"
                    style={{ backgroundColor: `${MODAL_COLORS[e.name] || '#94a3b8'}18` }}>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: MODAL_COLORS[e.name] || '#94a3b8' }} />
                      <span className="text-slate-700 dark:text-slate-300 font-medium">{e.name}</span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white ml-2">{e.value} ({e.pct}%)</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <SectionHeader title="Mix por Responsável pelo Transporte" />
          {mixResponsavel.length === 0 ? <EmptyState /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={mixResponsavel} layout="vertical" margin={{ top: 5, right: 50, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} width={115} />
                <Tooltip contentStyle={TOOLTIP_STYLE}
                  formatter={(v, n, p) => [`${v} (${p.payload.pct}%)`, 'Expedições']} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {mixResponsavel.map((e, i) => <Cell key={i} fill={RESP_COLORS[e.name] || `hsl(${i*45},65%,50%)`} />)}
                  <LabelList dataKey="value" position="right" style={{ fill: '#475569', fontSize: 11, fontWeight: 600 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── TACarona + TCS-Seg + Vinculação ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <SectionHeader title="Aproveitamento de Carona" />
          <div className="flex flex-col items-center">
            <DonutChart value={taCarona} color="#FF6B00" size={160} innerRadius={50} outerRadius={72} />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-3 text-center">
              {caronaCount} de {todasExpedicoes.length} expedições
            </p>
            <p className="text-xs text-slate-400 mt-1 text-center">aproveitaram transporte compartilhado</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <SectionHeader title="Cobertura de Seguro" />
          {tcsSeg === null ? (
            <EmptyState msg="Nenhum item segurável encontrado" />
          ) : (
            <div className="flex flex-col items-center">
              <DonutChart value={tcsSeg} color="#059669" size={160} innerRadius={50} outerRadius={72} />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-3 text-center">
                {comSeguro} de {osComSeguravel.length} OS com itens seguráveis
              </p>
              <p className="text-xs text-slate-400 mt-1 text-center">utilizaram seguro</p>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <SectionHeader title="Custeio vs Investimento" />
          {vinculacaoData.length === 0 ? <EmptyState /> : (
            <div className="flex flex-col items-center">
              <div className="relative">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie data={vinculacaoData} cx="50%" cy="50%" innerRadius={50} outerRadius={72} paddingAngle={2} dataKey="value">
                      {vinculacaoData.map((e, i) => <Cell key={i} fill={VINC_COLORS[e.name] || '#94a3b8'} />)}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 space-y-1.5 w-full">
                {vinculacaoData.map(e => (
                  <div key={e.name} className="flex items-center justify-between text-xs p-2 rounded"
                    style={{ backgroundColor: `${VINC_COLORS[e.name]}18` }}>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: VINC_COLORS[e.name] }} />
                      <span className="text-slate-700 dark:text-slate-300">{e.name}</span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {e.value} ({totalVinc > 0 ? Math.round((e.value / totalVinc) * 100) : 0}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── OTIF por Almoxarifado ── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <SectionHeader title="% OTIF por Almoxarifado" />
        {otifPorAlmoxarifado.length === 0 ? <EmptyState /> : (
          <ResponsiveContainer width="100%" height={Math.max(280, otifPorAlmoxarifado.length * 48)}>
            <BarChart data={otifPorAlmoxarifado} layout="vertical" margin={{ top: 5, right: 60, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `${v}%`} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} width={120} />
              <Tooltip contentStyle={TOOLTIP_STYLE}
                formatter={(v, n) => [`${v}%`, n === 'otif' ? '% OTIF' : '% Não-OTIF']}
                labelFormatter={(l, p) => p?.[0]?.payload?.nomeCompleto || l} />
              <Legend formatter={v => v === 'otif' ? '% OTIF' : '% Não-OTIF'} />
              <Bar dataKey="otif" stackId="a" name="otif" radius={[0, 0, 0, 0]}>
                {otifPorAlmoxarifado.map((e, i) => <Cell key={i} fill={e.otif >= 80 ? '#10b981' : e.otif >= 60 ? '#f59e0b' : '#ef4444'} />)}
              </Bar>
              <Bar dataKey="naoOtif" stackId="a" fill="#ef444428" name="naoOtif" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Ranking de Transportadoras ── */}
      {rankingTransp.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <SectionHeader title="Ranking de Transportadoras" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-3">Por Frequência (nº expedições)</p>
              <ResponsiveContainer width="100%" height={Math.max(200, rankingTransp.length * 36)}>
                <BarChart data={rankingTransp} layout="vertical" margin={{ top: 5, right: 50, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} width={130} />
                  <Tooltip contentStyle={TOOLTIP_STYLE}
                    labelFormatter={(l, p) => p?.[0]?.payload?.nomeCompleto || l}
                    formatter={v => [v, 'Expedições']} />
                  <Bar dataKey="qtd" radius={[0, 4, 4, 0]}>
                    {rankingTransp.map((_, i) => <Cell key={i} fill={`hsl(220, ${80 - i * 5}%, ${58 - i * 3}%)`} />)}
                    <LabelList dataKey="qtd" position="right" style={{ fill: '#475569', fontSize: 11, fontWeight: 600 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-3">Por Valor de Frete (R$)</p>
              {rankingTransp.some(t => t.frete > 0) ? (
                <ResponsiveContainer width="100%" height={Math.max(200, rankingTransp.length * 36)}>
                  <BarChart data={rankingTransp} layout="vertical" margin={{ top: 5, right: 50, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} width={130} />
                    <Tooltip contentStyle={TOOLTIP_STYLE}
                      labelFormatter={(l, p) => p?.[0]?.payload?.nomeCompleto || l}
                      formatter={v => [`R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Frete Total']} />
                    <Bar dataKey="frete" radius={[0, 4, 4, 0]}>
                      {rankingTransp.map((_, i) => <Cell key={i} fill={`hsl(150, ${70 - i * 4}%, ${48 - i * 3}%)`} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState msg="Valores de frete não informados" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Volume Expedido Mensal ── */}
      {volumeMensal.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <SectionHeader title="Volume Expedido Mensal (M³ e Peso)" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-3">Volume (m³)</p>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={volumeMensal} margin={{ top: 15, right: 20, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="gradM3exp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0000FF" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#0000FF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="mes" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `${v}m³`} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => [`${v} m³`, 'Volume']} />
                  <Area type="monotone" dataKey="m3" stroke="#0000FF" strokeWidth={2} fill="url(#gradM3exp)"
                    dot={{ fill: '#0000FF', r: 3, strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-3">Peso Bruto (kg)</p>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={volumeMensal} margin={{ top: 15, right: 20, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="gradPesoexp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF6B00" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#FF6B00" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="mes" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `${v}kg`} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => [`${v} kg`, 'Peso']} />
                  <Area type="monotone" dataKey="peso" stroke="#FF6B00" strokeWidth={2} fill="url(#gradPesoexp)"
                    dot={{ fill: '#FF6B00', r: 3, strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── Frete + Ticket Médio Mensal ── */}
      {freteMensal.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <SectionHeader title="Evolução de Custos — Frete e Ticket Médio" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-3">Custo Total de Frete Mensal (R$)</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={freteMensal} margin={{ top: 15, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => [`R$ ${v.toLocaleString('pt-BR')}`, 'Frete Total']} />
                  <Bar dataKey="frete" fill="#6366F1" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="frete" position="top"
                      formatter={v => v > 0 ? `R$${(v / 1000).toFixed(1)}k` : ''}
                      style={{ fill: '#475569', fontSize: 10, fontWeight: 600 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-3">Ticket Médio por Expedição (R$)</p>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={freteMensal} margin={{ top: 15, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="mes" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => [`R$ ${v.toLocaleString('pt-BR')}`, 'Ticket Médio']} />
                  <Line type="monotone" dataKey="ticket" stroke="#0284C7" strokeWidth={2.5}
                    dot={{ fill: '#0284C7', r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── Ciclo Reserva → MIGO Mensal ── */}
      {cicloMigoMensal.length >= 2 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <SectionHeader title="Evolução Ciclo Reserva → MIGO (dias)" />
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={cicloMigoMensal} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="mes" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `${v}d`} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => [`${v} dias`, 'Ciclo Médio']} />
              <Bar dataKey="dias" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="dias" position="top" formatter={v => `${v}d`}
                  style={{ fill: '#475569', fontSize: 11, fontWeight: 600 }} />
                {cicloMigoMensal.map((e, i) => (
                  <Cell key={i} fill={e.dias <= 5 ? '#10b981' : e.dias <= 10 ? '#f59e0b' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-slate-400 mt-2">Verde ≤5d · Amarelo ≤10d · Vermelho &gt;10d</p>
        </div>
      )}

      {/* ── Tendência OTIF Mensal ── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <SectionHeader title="Tendência OTIF Mensal" />
        {tendenciaMensal.length < 2 ? (
          <EmptyState msg="Dados insuficientes para tendência mensal" />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={tendenciaMensal} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="mes" tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={v => `${v}%`} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => [`${v}%`, '% OTIF']} />
              <ReferenceLine y={80} stroke="#94a3b8" strokeDasharray="5 5"
                label={{ value: 'Meta: 80%', position: 'right', fill: '#94a3b8', fontSize: 11 }} />
              <Line type="monotone" dataKey="otif" stroke="#0000FF" strokeWidth={2.5}
                dot={{ fill: '#0000FF', r: 5, strokeWidth: 0 }} activeDot={{ r: 7 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Distribuição por Tempo de Entrega ── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <SectionHeader title="Distribuição por Tempo de Entrega" />
        {distribuicaoTempoEntrega.length === 0 ? (
          <EmptyState msg="Sem entregas com datas preenchidas" />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={distribuicaoTempoEntrega} margin={{ top: 30, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis hide />
              <Tooltip contentStyle={TOOLTIP_STYLE}
                formatter={(v, n, p) => [`${v}% (${p.payload.count} OS)`, 'Entregas']} />
              <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="pct" position="top"
                  formatter={v => v > 0 ? `${v}%` : ''} style={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} />
                {distribuicaoTempoEntrega.map((e, i) => {
                  let color = '#ef4444';
                  if (e.label === 'On Time') color = '#10b981';
                  else if (e.label.startsWith('-')) color = '#10b981';
                  else if (e.label === '1d - 5d') color = '#f59e0b';
                  return <Cell key={i} fill={color} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Tabela de OS ── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <SectionHeader title={`OS utilizadas nos indicadores (${osTabelaFiltrada.length}${osTabelaFiltrada.length !== osTabela.length ? ` de ${osTabela.length}` : ''})`} />
        {osTabela.length === 0 ? (
          <EmptyState msg="Nenhuma OS com movimentação encontrada" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300">
                  {[
                    { col: 'codigo', label: 'Nº OS', filter: false, width: 'w-48' },
                    { col: 'almox', label: 'Almoxarifado', filter: true, width: 'w-36' },
                    { col: 'data_reserva', label: 'Reserva', filter: true, width: 'w-24' },
                    { col: 'data_migo', label: 'MIGO', filter: true, width: 'w-24' },
                    { col: 'qtdSol', label: 'Sol.', filter: false, width: 'w-16' },
                    { col: 'qtdSep', label: 'Sep.', filter: false, width: 'w-16' },
                    { col: 'data_necessidade', label: 'Necessidade', filter: true, width: 'w-24' },
                    { col: 'data_entrega', label: 'Entrega', filter: true, width: 'w-24' },
                    { col: 'tempoEntrega', label: 'Tempo', filter: true, width: 'w-20' },
                  ].map(({ col, label, filter, width }) => (
                    <th key={col} className={`px-2 py-2 font-semibold border-b border-slate-200 dark:border-slate-600 text-left ${width} whitespace-nowrap`}>
                      <SortableTableHead label={label} column={col} sortConfig={sortConfig} onSort={handleSort}
                        filterConfig={filter ? columnFilters : null}
                        onToggleFilter={toggleFilter} onClearFilter={clearFilter} getUniqueValues={getUniqueValues} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {osTabelaFiltrada.map(({ os, almox, qtdSol, qtdSep, tempoEntrega }, idx) => {
                  let tempoColor = 'text-slate-600 dark:text-slate-400';
                  if (tempoEntrega !== null) {
                    if (tempoEntrega <= 0) tempoColor = 'text-green-600 font-semibold';
                    else if (tempoEntrega <= 5) tempoColor = 'text-yellow-600 font-semibold';
                    else tempoColor = 'text-red-600 font-semibold';
                  }
                  return (
                    <tr key={os.id} className={`border-b border-slate-100 dark:border-slate-700/50 ${idx % 2 !== 0 ? 'bg-slate-50/50 dark:bg-slate-700/20' : ''} hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors`}>
                      <td className="px-2 py-2 whitespace-nowrap">
                        <button onClick={() => setSelectedOS(os)}
                          className="font-mono text-blue-600 dark:text-blue-400 hover:underline text-left">
                          {os.codigo || os.id?.substring(0, 8)}
                        </button>
                      </td>
                      <td className="px-2 py-2 text-slate-700 dark:text-slate-300 max-w-[144px] truncate">{almox?.nome || '—'}</td>
                      <td className="px-2 py-2 text-center whitespace-nowrap">{safeFormat(os.data_reserva)}</td>
                      <td className="px-2 py-2 text-center whitespace-nowrap">{safeFormat(os.data_migo)}</td>
                      <td className="px-2 py-2 text-right">{qtdSol > 0 ? qtdSol.toLocaleString('pt-BR') : '—'}</td>
                      <td className="px-2 py-2 text-right">{qtdSep > 0 ? qtdSep.toLocaleString('pt-BR') : '—'}</td>
                      <td className="px-2 py-2 text-center whitespace-nowrap">{safeFormat(os.data_necessidade)}</td>
                      <td className="px-2 py-2 text-center whitespace-nowrap">{safeFormat(os.data_entrega)}</td>
                      <td className={`px-2 py-2 text-center whitespace-nowrap ${tempoColor}`}>
                        {tempoEntrega !== null ? (tempoEntrega === 0 ? 'No prazo' : `${tempoEntrega > 0 ? '+' : ''}${tempoEntrega}d`) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>

    {selectedOS && (
      <OSDetailModal open={!!selectedOS} onClose={() => setSelectedOS(null)} os={selectedOS}
        regionais={regionais} almoxarifados={almoxarifados} pessoas={pessoas}
        categorias={categorias} subcategorias={subcategorias}
        instalacoes={instalacoes} projetos={projetos}
        onEdit={() => { setEditingOS(selectedOS); setSelectedOS(null); }}
        onDelete={() => setSelectedOS(null)} canDelete={false} onRefresh={() => {}} />
    )}
    {editingOS && (
      <OSFormModal open={!!editingOS} onClose={() => setEditingOS(null)} os={editingOS}
        regionais={regionais} almoxarifados={almoxarifados} pessoas={pessoas}
        categorias={categorias} subcategorias={subcategorias}
        instalacoes={instalacoes} onSave={() => setEditingOS(null)} />
    )}
    </>
  );
}