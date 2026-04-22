import React, { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { format, addDays, addWeeks, startOfWeek, differenceInDays, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import BacklogChart from './BacklogChart';

const TOOLTIP_STYLE = {
  backgroundColor: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
};

function SectionHeader({ title }) {
  return (
    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-6 flex items-center gap-2">
      <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(to bottom, #0000FF, #4169E1)' }} />
      {title}
    </h3>
  );
}

function EmptyState({ msg = 'Dados insuficientes para exibir' }) {
  return (
    <div className="h-60 flex items-center justify-center text-slate-400 text-sm">{msg}</div>
  );
}

function parseDateSafe(d) {
  if (!d) return null;
  const dt = typeof d === 'string' ? parseISO(d) : new Date(d);
  return isValid(dt) ? dt : null;
}

function buildTimePoints(startDate, endDate, usarSemanas) {
  const points = [];
  let current = new Date(startDate);
  if (usarSemanas) {
    current = startOfWeek(current, { weekStartsOn: 1 });
  }
  while (current <= endDate) {
    points.push(new Date(current));
    if (usarSemanas) {
      current = addWeeks(current, 1);
    } else {
      current = addDays(current, 1);
    }
  }
  // Garantir que o último ponto cubra até endDate
  if (points.length === 0 || points[points.length - 1] < endDate) {
    points.push(new Date(endDate));
  }
  return points;
}

export default function BurndownBurnupChart({ filteredOrdens, filters }) {
  const { burndownData, burnupData, usarSemanas, maiorPrazo, hasPrazo, tickInterval } = useMemo(() => {
    if (!filteredOrdens || filteredOrdens.length === 0) {
      return { burndownData: [], burnupData: [], usarSemanas: false, maiorPrazo: null, hasPrazo: false, tickInterval: 1 };
    }

    // Determinar início e fim do período
    const hoje = new Date();
    hoje.setHours(23, 59, 59, 999);

    let periodoStart = null;
    let periodoEnd = hoje;

    if (filters?.periodo === 'mes_atual') {
      const now = new Date();
      periodoStart = new Date(now.getFullYear(), now.getMonth(), 1);
      periodoEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      periodoEnd.setHours(23, 59, 59, 999);
    } else if (filters?.periodo === 'customizado') {
      if (filters.dataInicio) periodoStart = new Date(filters.dataInicio);
      if (filters.dataFim) {
        periodoEnd = new Date(filters.dataFim);
        periodoEnd.setHours(23, 59, 59, 999);
      }
    } else if (filters?.periodo && filters.periodo !== 'all') {
      const dias = parseInt(filters.periodo);
      periodoStart = new Date();
      periodoStart.setDate(periodoStart.getDate() - dias);
      periodoStart.setHours(0, 0, 0, 0);
    }

    // Se não tem inicio do filtro, usar a menor created_date das OS
    if (!periodoStart) {
      const datas = filteredOrdens
        .map(os => parseDateSafe(os.created_date))
        .filter(Boolean);
      periodoStart = datas.length > 0 ? new Date(Math.min(...datas)) : new Date();
    }

    // Maior prazo entre as OS filtradas
    const prazos = filteredOrdens
      .map(os => parseDateSafe(os.prazo))
      .filter(Boolean);
    const maiorPrazoDate = prazos.length > 0 ? new Date(Math.max(...prazos)) : null;

    // Granularidade automática
    const diffDias = differenceInDays(periodoEnd, periodoStart);
    const usarSemanas = diffDias > 30;

    // Pontos de tempo do início até hoje (ou fim do período)
    const endForAxis = periodoEnd > hoje ? hoje : periodoEnd;
    const timePoints = buildTimePoints(periodoStart, endForAxis, usarSemanas);

    const formatLabel = (d) => {
      try {
        return usarSemanas
          ? format(d, 'dd/MM', { locale: ptBR })
          : format(d, 'dd/MM', { locale: ptBR });
      } catch {
        return '';
      }
    };

    // ── BURNDOWN ──────────────────────────────────────────────────────────────
    // Total inicial: OS criadas no período inteiro
    const totalOSPeriodo = filteredOrdens.length;

    // Linha ideal: de (periodoStart, totalOSPeriodo) até (maiorPrazo, 0)
    const idealEndDate = maiorPrazoDate || endForAxis;
    const idealTotalDias = differenceInDays(idealEndDate, periodoStart) || 1;

    const burndownData = timePoints.map((pt) => {
      // Real: criadas até pt - (concluídas + canceladas até pt)
      const criadas = filteredOrdens.filter(os => {
        const d = parseDateSafe(os.created_date);
        return d && d <= pt;
      }).length;

      const finalizadas = filteredOrdens.filter(os => {
        if (os.status !== 'concluido' && os.status !== 'cancelado') return false;
        const dConc = parseDateSafe(os.data_conclusao) || parseDateSafe(os.updated_date);
        return dConc && dConc <= pt;
      }).length;

      const restante = Math.max(0, criadas - finalizadas);

      // Ideal: decréscimo linear de totalOSPeriodo até 0 entre periodoStart e maiorPrazo
      const diasDecorridos = differenceInDays(pt, periodoStart);
      const idealRestante = maiorPrazoDate
        ? Math.max(0, Math.round(totalOSPeriodo - (totalOSPeriodo * diasDecorridos / idealTotalDias)))
        : null;

      return {
        label: formatLabel(pt),
        real: restante,
        ...(idealRestante !== null ? { ideal: idealRestante } : {}),
      };
    });

    // ── BURNUP ────────────────────────────────────────────────────────────────
    const burnupData = timePoints.map((pt) => {
      // Demanda crescente: acumulado de OS criadas até pt
      const demanda = filteredOrdens.filter(os => {
        const d = parseDateSafe(os.created_date);
        return d && d <= pt;
      }).length;

      // Entregas: acumulado de OS concluídas ou canceladas até pt
      const entregas = filteredOrdens.filter(os => {
        if (os.status !== 'concluido' && os.status !== 'cancelado') return false;
        const dConc = parseDateSafe(os.data_conclusao) || parseDateSafe(os.updated_date);
        return dConc && dConc <= pt;
      }).length;

      // Planejado: linha reta de 0 até totalOSPeriodo entre periodoStart e maiorPrazo
      const diasDecorridos = differenceInDays(pt, periodoStart);
      const planejado = maiorPrazoDate
        ? Math.min(totalOSPeriodo, Math.round(totalOSPeriodo * diasDecorridos / idealTotalDias))
        : null;

      return {
        label: formatLabel(pt),
        demanda,
        entregas,
        ...(planejado !== null ? { planejado: Math.max(0, planejado) } : {}),
      };
    });

    // Calcular intervalo ideal para o eixo X (máx ~10 ticks visíveis)
    const maxTicks = 10;
    const tickInterval = Math.max(1, Math.ceil(timePoints.length / maxTicks));

    return { burndownData, burnupData, usarSemanas, maiorPrazo: maiorPrazoDate, hasPrazo: !!maiorPrazoDate, tickInterval };
  }, [filteredOrdens, filters]);

  if (!filteredOrdens || filteredOrdens.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <SectionHeader title="Velocidade & Progresso" />
        <EmptyState msg="Nenhuma OS encontrada para os filtros aplicados" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
      <SectionHeader title="Velocidade & Progresso" />

      {!hasPrazo && (
        <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2 mb-6">
          Nenhuma OS possui campo "Prazo" preenchido — a linha de meta ideal não será exibida.
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* ── Burndown ── */}
        <div>
          <div className="mb-3">
            <p className="text-base font-semibold text-slate-800 dark:text-slate-200">Burndown — Quanto falta terminar</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Trabalho restante ao longo do tempo. Deve tender a zero.
            </p>
          </div>
          {burndownData.length < 2 ? (
            <EmptyState />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={burndownData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  interval={tickInterval - 1}
                  angle={usarSemanas ? -35 : 0}
                  textAnchor={usarSemanas ? 'end' : 'middle'}
                  height={usarSemanas ? 45 : 30}
                />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(v, n) => [v, n === 'real' ? 'OS Restantes (Real)' : 'Meta Ideal']}
                />
                <Legend
                  formatter={v => v === 'real' ? 'OS Restantes (Real)' : 'Meta Ideal'}
                />
                {hasPrazo && (
                  <Line
                    type="monotone"
                    dataKey="ideal"
                    stroke="#10b981"
                    strokeWidth={2}
                    strokeDasharray="6 3"
                    dot={false}
                    name="ideal"
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="real"
                  stroke="#ef4444"
                  strokeWidth={2.5}
                  dot={{ fill: '#ef4444', r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                  name="real"
                />
                <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ── Burnup ── */}
        <div>
          <div className="mb-3">
            <p className="text-base font-semibold text-slate-800 dark:text-slate-200">Burnup — Quanto foi feito vs total</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Entregas realizadas vs demanda total acumulada ao longo do tempo.
            </p>
          </div>
          {burnupData.length < 2 ? (
            <EmptyState />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={burnupData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  interval={tickInterval - 1}
                  angle={usarSemanas ? -35 : 0}
                  textAnchor={usarSemanas ? 'end' : 'middle'}
                  height={usarSemanas ? 45 : 30}
                />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(v, n) => [
                    v,
                    n === 'demanda' ? 'Demanda Total' : n === 'entregas' ? 'Concluídas/Canceladas' : 'Meta Planejada',
                  ]}
                />
                <Legend
                  formatter={v =>
                    v === 'demanda' ? 'Demanda Total' :
                    v === 'entregas' ? 'Concluídas/Canceladas' : 'Meta Planejada'
                  }
                />
                <Line
                  type="monotone"
                  dataKey="demanda"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={false}
                  name="demanda"
                />
                {hasPrazo && (
                  <Line
                    type="monotone"
                    dataKey="planejado"
                    stroke="#10b981"
                    strokeWidth={2}
                    strokeDasharray="6 3"
                    dot={false}
                    name="planejado"
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="entregas"
                  stroke="#FF6B00"
                  strokeWidth={2.5}
                  dot={{ fill: '#FF6B00', r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                  name="entregas"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <div className="w-8 h-0.5 bg-red-500" />
          <span>Real (Burndown) / Entregas (Burnup)</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <div className="w-8 h-0.5 bg-red-500 opacity-60" style={{ borderTop: '2px solid #ef4444' }} />
          <span>Demanda Total acumulada</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <div className="w-8 border-t-2 border-dashed border-green-500" />
          <span>Meta Ideal (baseada no maior Prazo)</span>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700">
        <BacklogChart filteredOrdens={filteredOrdens} />
      </div>
    </div>
  );
}