import React, { useMemo } from 'react';
import React, { useMemo, useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ReferenceLine, LabelList } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Clock, Package, TrendingUp } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SortableTableHead, useTableSort, useColumnFilters } from '@/components/ui/table-sortable';
import { useApp } from '@/components/contexts/AppContext';
import { base44 } from '@/api/base44Client';
import OSDetailModal from '@/components/os/OSDetailModal';
import OSFormModal from '@/components/os/OSFormModal';
// NOTE: Link/createPageUrl removed — modal opened inline

const safeFormat = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return format(d, 'dd/MM/yy');
};

const COLOR_SUCCESS = '#10b981';
const COLOR_FAIL = '#ef4444';
const COLOR_OTIF = '#0000FF';
const COLOR_OT = '#FF6B00';
const COLOR_IF = '#10b981';

function calcularOTIF(osExpedicao) {
  const entregues = osExpedicao.filter(os => os.status_separacao === 'entregue');

  const isOnTime = (os) => {
    if (!os.data_entrega || !os.data_necessidade) return false;
    return new Date(os.data_entrega) <= new Date(os.data_necessidade);
  };

  const isInFull = (os) => {
    const itens = os.itens_documento || [];
    if (itens.length === 0) return false;
    const qtdSol = itens.reduce((sum, i) => sum + (i.quantidade || 0), 0);
    const qtdSep = itens.reduce((sum, i) => sum + (i.quantidade_separada || 0), 0);
    return qtdSep >= qtdSol && qtdSol > 0;
  };

  const totalOT = entregues.filter(os => os.data_necessidade).length;
  const totalIF = entregues.filter(os => (os.itens_documento || []).length > 0).length;
  const totalOTIF = entregues.filter(os => os.data_necessidade && (os.itens_documento || []).length > 0).length;

  const otCount = entregues.filter(isOnTime).length;
  const ifCount = entregues.filter(isInFull).length;
  const otifCount = entregues.filter(os => isOnTime(os) && isInFull(os)).length;

  const otRate = totalOT > 0 ? Math.round((otCount / totalOT) * 100) : 0;
  const ifRate = totalIF > 0 ? Math.round((ifCount / totalIF) * 100) : 0;
  const otifRate = totalOTIF > 0 ? Math.round((otifCount / totalOTIF) * 100) : 0;

  return { otRate, ifRate, otifRate, otCount, ifCount, otifCount, totalOT, totalIF, totalOTIF, entregues, isOnTime, isInFull };
}

function DonutChart({ value, color, size = 200, innerRadius = 60, outerRadius = 85 }) {
  const data = [
    { value },
    { value: 100 - value }
  ];
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={innerRadius} outerRadius={outerRadius} startAngle={90} endAngle={-270} dataKey="value" paddingAngle={2}>
            <Cell fill={color} />
            <Cell fill="#e2e8f0" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-bold text-slate-900 dark:text-white" style={{ fontSize: size > 150 ? 28 : 20 }}>{value}%</span>
      </div>
    </div>
  );
}

export default function OTIFExpedicao({ filteredOrdens, almoxarifados }) {
  const osExpedicao = filteredOrdens;
  const { regionais, categorias, subcategorias, pessoas } = useApp();
  const [selectedOS, setSelectedOS] = useState(null);
  const [editingOS, setEditingOS] = useState(null);
  const [instalacoes, setInstalacoes] = useState([]);
  const [projetos, setProjetos] = useState([]);

  useEffect(() => {
    base44.entities.Instalacao.list().then(setInstalacoes).catch(() => {});
    base44.entities.Projeto.list().then(setProjetos).catch(() => {});
  }, []);

  const { otRate, ifRate, otifRate, otCount, ifCount, otifCount, totalOT, totalIF, totalOTIF, entregues, isOnTime, isInFull } = useMemo(
    () => calcularOTIF(osExpedicao),
    [osExpedicao]
  );

  // OTIF por almoxarifado
  const otifPorAlmoxarifado = useMemo(() => {
    return almoxarifados.map(almox => {
      const osAlmox = entregues.filter(os => os.almoxarifado_id === almox.id && os.data_necessidade && (os.itens_documento || []).length > 0);
      if (osAlmox.length === 0) return null;
      const otifCount = osAlmox.filter(os => isOnTime(os) && isInFull(os)).length;
      const otifPct = Math.round((otifCount / osAlmox.length) * 100);
      return {
        name: almox.nome.length > 20 ? almox.nome.substring(0, 18) + '…' : almox.nome,
        nomeCompleto: almox.nome,
        otif: otifPct,
        naoOtif: 100 - otifPct,
        total: osAlmox.length
      };
    }).filter(Boolean).sort((a, b) => b.otif - a.otif);
  }, [entregues, almoxarifados]);

  // Tendência OTIF mensal
  const tendenciaMensal = useMemo(() => {
    const mesesMap = {};
    entregues.forEach(os => {
      if (!os.data_entrega || !os.data_necessidade || !(os.itens_documento || []).length) return;
      const key = os.data_entrega.substring(0, 7); // YYYY-MM
      if (!mesesMap[key]) mesesMap[key] = { total: 0, otif: 0 };
      mesesMap[key].total++;
      if (isOnTime(os) && isInFull(os)) mesesMap[key].otif++;
    });
    return Object.entries(mesesMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([key, val]) => ({
        mes: format(new Date(key + '-01'), 'MMM/yy', { locale: ptBR }),
        otif: Math.round((val.otif / val.total) * 100)
      }));
  }, [entregues]);

  const temDados = entregues.length > 0;

  // Tempo de entrega (dias entre data_necessidade e data_entrega; negativo = adiantado)
  const distribuicaoTempoEntrega = useMemo(() => {
    const buckets = [
      { label: '-15d to -10d', min: -Infinity, max: -10 },
      { label: '-10d to -5d', min: -10, max: -5 },
      { label: '-5d to -1d', min: -5, max: -1 },
      { label: 'On Time', min: -1, max: 0 },
      { label: '1d - 5d', min: 0, max: 5 },
      { label: '5d - 10d', min: 5, max: 10 },
      { label: '10d - 15d', min: 10, max: 15 },
      { label: 'more than 15d', min: 15, max: Infinity },
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

  const { sortConfig, handleSort } = useTableSort();
  const { columnFilters, toggleFilter, clearFilter } = useColumnFilters();

  // OS base da tabela (todas com status_separacao e dados relevantes)
  const osTabela = useMemo(() => {
    return filteredOrdens.filter(os => os.status_separacao && os.status_separacao !== 'pendente').map(os => {
      const itens = os.itens_documento || [];
      const qtdSol = itens.reduce((s, i) => s + (i.quantidade || 0), 0);
      const qtdSep = itens.reduce((s, i) => s + (i.quantidade_separada || 0), 0);
      const tempoEntrega = (os.data_entrega && os.data_necessidade)
        ? differenceInDays(new Date(os.data_entrega), new Date(os.data_necessidade))
        : null;
      const almox = almoxarifados.find(a => a.id === os.almoxarifado_id);
      return { os, almox, qtdSol, qtdSep, tempoEntrega };
    });
  }, [filteredOrdens, almoxarifados]);

  // Filtrar e ordenar osTabela
  const osTabelaFiltrada = useMemo(() => {
    let rows = [...osTabela];

    // Aplicar filtros
    Object.entries(columnFilters).forEach(([col, values]) => {
      if (!values || values.length === 0) return;
      rows = rows.filter(({ os, almox, tempoEntrega }) => {
        if (col === 'almox') return values.includes(almox?.nome || '—');
        if (col === 'status_separacao') return values.includes(os.status_separacao || '—');
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

    // Aplicar ordenação
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

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl p-5 shadow-lg" style={{ background: 'linear-gradient(135deg, #0000FF 0%, #0A003C 100%)' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-white/80 text-sm font-medium">OTIF</p>
            <Target className="w-5 h-5 text-white/60" />
          </div>
          <p className="text-4xl font-bold text-white">{otifRate}%</p>
          <p className="text-xs text-white/60 mt-1">{otifCount} de {totalOTIF} entregas</p>
        </div>
        <div className="rounded-2xl p-5 shadow-lg" style={{ background: 'linear-gradient(135deg, #FF6B00 0%, #FF8C00 100%)' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-white/80 text-sm font-medium">On-Time</p>
            <Clock className="w-5 h-5 text-white/60" />
          </div>
          <p className="text-4xl font-bold text-white">{otRate}%</p>
          <p className="text-xs text-white/60 mt-1">{otCount} de {totalOT} com data necessidade</p>
        </div>
        <div className="rounded-2xl p-5 shadow-lg" style={{ background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-white/80 text-sm font-medium">In-Full</p>
            <Package className="w-5 h-5 text-white/60" />
          </div>
          <p className="text-4xl font-bold text-white">{ifRate}%</p>
          <p className="text-xs text-white/60 mt-1">{ifCount} de {totalIF} com itens</p>
        </div>
      </div>

      {/* Overview - Donuts */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-6 flex items-center gap-2">
          <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(to bottom, #0000FF, #4169E1)' }}></div>
          Visão Geral OTIF
        </h3>

        {!temDados ? (
          <div className="h-48 flex items-center justify-center text-slate-400">Sem entregas registradas no período</div>
        ) : (
          <div className="flex flex-col lg:flex-row items-center justify-around gap-8">
            {/* OTIF Grande */}
            <div className="flex flex-col items-center gap-3">
              <DonutChart value={otifRate} color={COLOR_OTIF} size={220} innerRadius={70} outerRadius={95} />
              <div className="text-center">
                <p className="font-semibold text-slate-900 dark:text-white">% OTIF</p>
                <p className="text-xs text-slate-500">{otifCount} entregas completas e no prazo</p>
              </div>
            </div>

            {/* Separador vertical */}
            <div className="hidden lg:block w-px h-48 bg-slate-200 dark:bg-slate-700" />

            {/* On-Time e In-Full menores */}
            <div className="flex flex-row lg:flex-col gap-8">
              <div className="flex flex-col items-center gap-2">
                <DonutChart value={otRate} color={COLOR_OT} size={140} innerRadius={45} outerRadius={62} />
                <div className="text-center">
                  <p className="font-semibold text-slate-900 dark:text-white text-sm">% On-Time</p>
                  <p className="text-xs text-slate-500">{otCount}/{totalOT} no prazo</p>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <DonutChart value={ifRate} color={COLOR_IF} size={140} innerRadius={45} outerRadius={62} />
                <div className="text-center">
                  <p className="font-semibold text-slate-900 dark:text-white text-sm">% In-Full</p>
                  <p className="text-xs text-slate-500">{ifCount}/{totalIF} completas</p>
                </div>
              </div>
            </div>

            {/* Legenda */}
            <div className="hidden lg:block w-px h-48 bg-slate-200 dark:bg-slate-700" />
            <div className="flex flex-col gap-3 text-sm min-w-[160px]">
              <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">OTIF</span>
                </div>
                <span className="font-bold text-slate-900 dark:text-white">{otifRate}%</span>
              </div>
              <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-orange-50 dark:bg-orange-900/10">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">On-Time</span>
                </div>
                <span className="font-bold text-slate-900 dark:text-white">{otRate}%</span>
              </div>
              <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/10">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">In-Full</span>
                </div>
                <span className="font-bold text-slate-900 dark:text-white">{ifRate}%</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700/30 text-xs text-slate-500 dark:text-slate-400">
                <p>Total entregues: <strong>{entregues.length}</strong></p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* OTIF por Almoxarifado */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-6 flex items-center gap-2">
          <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(to bottom, #0000FF, #4169E1)' }}></div>
          % OTIF por Almoxarifado
        </h3>
        {otifPorAlmoxarifado.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-slate-400">Sem dados suficientes</div>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(300, otifPorAlmoxarifado.length * 48)}>
            <BarChart data={otifPorAlmoxarifado} layout="vertical" margin={{ top: 5, right: 60, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} width={120} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                formatter={(value, name) => [`${value}%`, name === 'otif' ? '% OTIF' : '% Não-OTIF']}
                labelFormatter={(label, payload) => payload?.[0]?.payload?.nomeCompleto || label}
              />
              <Legend formatter={(v) => v === 'otif' ? '% OTIF' : '% Não-OTIF'} />
              <Bar dataKey="otif" stackId="a" fill={COLOR_SUCCESS} name="otif" radius={[0, 0, 0, 0]}>
                {otifPorAlmoxarifado.map((entry, index) => (
                  <Cell key={index} fill={entry.otif >= 80 ? '#10b981' : entry.otif >= 60 ? '#f59e0b' : '#ef4444'} />
                ))}
              </Bar>
              <Bar dataKey="naoOtif" stackId="a" fill={COLOR_FAIL} name="naoOtif" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Distribuição Tempo de Entrega */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-6 flex items-center gap-2">
          <div className="w-1 h-5 rounded-full bg-blue-600"></div>
          Distribuição por Tempo de Entrega
        </h3>
        {distribuicaoTempoEntrega.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-slate-400">Sem entregas com datas preenchidas</div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={distribuicaoTempoEntrega} margin={{ top: 30, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                formatter={(value, name, props) => [`${value}% (${props.payload.count} OS)`, 'Entregas']}
              />
              <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="pct" position="top" formatter={(v) => v > 0 ? `${v}%` : ''} style={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} />
                {distribuicaoTempoEntrega.map((entry, index) => {
                  let color = '#ef4444';
                  if (entry.label === 'On Time') color = '#10b981';
                  else if (entry.label.startsWith('-')) color = '#10b981';
                  else if (entry.label === '1d - 5d') color = '#f59e0b';
                  return <Cell key={index} fill={color} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Tendência OTIF Mensal */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-6 flex items-center gap-2">
          <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(to bottom, #0000FF, #4169E1)' }}></div>
          Tendência OTIF Mensal
        </h3>
        {tendenciaMensal.length < 2 ? (
          <div className="h-48 flex items-center justify-center text-slate-400">Dados insuficientes para tendência mensal</div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={tendenciaMensal} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="mes" tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                formatter={(value) => [`${value}%`, '% OTIF']}
              />
              <ReferenceLine y={80} stroke="#94a3b8" strokeDasharray="5 5" label={{ value: 'Meta: 80%', position: 'right', fill: '#94a3b8', fontSize: 11 }} />
              <Line
                type="monotone"
                dataKey="otif"
                stroke={COLOR_OTIF}
                strokeWidth={2.5}
                dot={{ fill: COLOR_OTIF, r: 5, strokeWidth: 0 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Tabela de OS */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-4 flex items-center gap-2">
          <div className="w-1 h-5 rounded-full bg-blue-600"></div>
          OS utilizadas nos indicadores ({osTabelaFiltrada.length}{osTabelaFiltrada.length !== osTabela.length ? ` de ${osTabela.length}` : ''})
        </h3>
        {osTabela.length === 0 ? (
          <div className="h-24 flex items-center justify-center text-slate-400 text-sm">Nenhuma OS com movimentação encontrada</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300">
                  {[
                   { col: 'codigo', label: 'Nº OS', align: 'left', filter: false, width: 'w-48' },
                   { col: 'almox', label: 'Almoxarifado', align: 'left', filter: true, width: 'w-36' },
                   { col: 'data_reserva', label: 'Reserva', align: 'center', filter: true, width: 'w-24' },
                   { col: 'data_migo', label: 'MIGO', align: 'center', filter: true, width: 'w-24' },
                   { col: 'qtdSol', label: 'Sol.', align: 'right', filter: false, width: 'w-16' },
                   { col: 'qtdSep', label: 'Sep.', align: 'right', filter: false, width: 'w-16' },
                   { col: 'data_necessidade', label: 'Necessidade', align: 'center', filter: true, width: 'w-24' },
                   { col: 'data_entrega', label: 'Entrega', align: 'center', filter: true, width: 'w-24' },
                   { col: 'tempoEntrega', label: 'Tempo', align: 'center', filter: true, width: 'w-20' },
                  ].map(({ col, label, align, filter, width }) => (
                   <th key={col} className={`px-2 py-2 font-semibold border-b border-slate-200 dark:border-slate-600 text-${align} ${width} whitespace-nowrap`}>
                      <SortableTableHead
                        label={label}
                        column={col}
                        sortConfig={sortConfig}
                        onSort={handleSort}
                        filterConfig={filter ? columnFilters : null}
                        onToggleFilter={toggleFilter}
                        onClearFilter={clearFilter}
                        getUniqueValues={getUniqueValues}
                      />
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
                       <button
                         onClick={() => setSelectedOS(os)}
                         className="font-mono text-blue-600 dark:text-blue-400 hover:underline hover:text-blue-800 dark:hover:text-blue-300 transition-colors text-left"
                       >
                         {os.codigo || os.id?.substring(0, 8)}
                       </button>
                      </td>
                      <td className="px-2 py-2 text-slate-700 dark:text-slate-300 max-w-[144px] truncate">{almox?.nome || '—'}</td>
                      <td className="px-2 py-2 text-center text-slate-600 dark:text-slate-400 whitespace-nowrap">{safeFormat(os.data_reserva)}</td>
                      <td className="px-2 py-2 text-center text-slate-600 dark:text-slate-400 whitespace-nowrap">{safeFormat(os.data_migo)}</td>
                      <td className="px-2 py-2 text-right text-slate-700 dark:text-slate-300">{qtdSol > 0 ? qtdSol.toLocaleString('pt-BR') : '—'}</td>
                      <td className="px-2 py-2 text-right text-slate-700 dark:text-slate-300">{qtdSep > 0 ? qtdSep.toLocaleString('pt-BR') : '—'}</td>
                      <td className="px-2 py-2 text-center text-slate-600 dark:text-slate-400 whitespace-nowrap">{safeFormat(os.data_necessidade)}</td>
                      <td className="px-2 py-2 text-center text-slate-600 dark:text-slate-400 whitespace-nowrap">{safeFormat(os.data_entrega)}</td>
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

    <>
    {selectedOS && (
      <OSDetailModal
        open={!!selectedOS}
        onClose={() => setSelectedOS(null)}
        os={selectedOS}
        regionais={regionais}
        almoxarifados={almoxarifados}
        pessoas={pessoas}
        categorias={categorias}
        subcategorias={subcategorias}
        instalacoes={instalacoes}
        projetos={projetos}
        onEdit={() => { setEditingOS(selectedOS); setSelectedOS(null); }}
        onDelete={() => setSelectedOS(null)}
        canDelete={false}
        onRefresh={() => {}}
      />
    )}

    {editingOS && (
      <OSFormModal
        open={!!editingOS}
        onClose={() => setEditingOS(null)}
        os={editingOS}
        regionais={regionais}
        almoxarifados={almoxarifados}
        pessoas={pessoas}
        categorias={categorias}
        subcategorias={subcategorias}
        instalacoes={instalacoes}
        onSave={() => setEditingOS(null)}
      />
    )}
  );
}