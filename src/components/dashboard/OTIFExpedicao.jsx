import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ReferenceLine } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Clock, Package, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  const osExpedicao = filteredOrdens; // já filtrado para expedição pelo Dashboard

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
    </div>
  );
}