import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, ReferenceLine, LabelList
} from 'recharts';
import { differenceInDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  CheckCircle, AlertTriangle, Clock, Package, TrendingUp, Activity,
  BarChart2, Timer
} from 'lucide-react';

// ─── Sub-components ─────────────────────────────────────────────────────────

function KPICard({ title, value, subtitle, gradient, icon: Icon }) {
  return (
    <div
      className="relative rounded-2xl p-5 shadow-lg flex flex-col justify-between min-h-[120px]"
      style={{ background: gradient }}
    >
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

const EMPTY = (
  <div className="h-40 flex items-center justify-center text-slate-400 text-sm">
    Dados insuficientes para exibir
  </div>
);

const TOOLTIP_STYLE = {
  backgroundColor: '#fff', border: '1px solid #e2e8f0',
  borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
};

const STATUS_COLORS = { completo: '#10b981', parcial: '#f59e0b', pendente: '#94a3b8', excedente: '#ef4444' };
const STATUS_LABELS = { completo: 'Completo', parcial: 'Parcial', pendente: 'Pendente', excedente: 'Excedente' };

// ─── Main Component ──────────────────────────────────────────────────────────

export default function PainelRecebimento({
  filteredOrdens,
  categoriaRecebimento,
  almoxarifados,
  problemasRecebimento,
}) {
  // Filtrar apenas OS de recebimento
  const osReceb = useMemo(
    () => filteredOrdens.filter(os => os.categoria_id === categoriaRecebimento?.id),
    [filteredOrdens, categoriaRecebimento]
  );

  const totalReceb = osReceb.length;

  // ── 1. TCR ──────────────────────────────────────────────────────────────────
  const osComProblemaArr = useMemo(() => osReceb.filter(os => os.problema_recebimento === true), [osReceb]);
  const tcr = totalReceb > 0 ? Math.round(((totalReceb - osComProblemaArr.length) / totalReceb) * 100) : 0;

  // ── 2. TAC ──────────────────────────────────────────────────────────────────
  const todosItens = useMemo(() => osReceb.flatMap(os => os.nfe_itens_conferencia || []), [osReceb]);
  const itensCompletos = todosItens.filter(i => i.status_conferencia === 'completo').length;
  const tac = todosItens.length > 0 ? Math.round((itensCompletos / todosItens.length) * 100) : 0;

  // ── 3. LTR ──────────────────────────────────────────────────────────────────
  const osComLTR = useMemo(
    () => osReceb.filter(os => os.nfe_data_receb && os.data_migo_receb),
    [osReceb]
  );
  const ltr = osComLTR.length > 0
    ? (osComLTR.reduce((s, os) =>
        s + Math.max(0, differenceInDays(new Date(os.data_migo_receb), new Date(os.nfe_data_receb))), 0
      ) / osComLTR.length).toFixed(1)
    : null;

  // ── 4. TCF ──────────────────────────────────────────────────────────────────
  const osFluxoConcluido = osReceb.filter(os => os.fluxo_recebimento?.armazenagem_completa === true).length;
  const tcf = totalReceb > 0 ? Math.round((osFluxoConcluido / totalReceb) * 100) : 0;

  // ── 5. TDQ ──────────────────────────────────────────────────────────────────
  const itensDivergentes = todosItens.filter(i =>
    i.status_conferencia === 'parcial' || i.status_conferencia === 'excedente'
  ).length;
  const tdq = todosItens.length > 0 ? Math.round((itensDivergentes / todosItens.length) * 100) : 0;

  // ── 6. Backlog ───────────────────────────────────────────────────────────────
  const backlog = osReceb.filter(os => os.nfe_data_receb && !os.data_migo_receb).length;

  // ── 7. IRP ──────────────────────────────────────────────────────────────────
  const osSolucionadas = osComProblemaArr.filter(os => os.data_solucao).length;
  const irp = osComProblemaArr.length > 0 ? Math.round((osSolucionadas / osComProblemaArr.length) * 100) : 100;

  // ── 8. TMRP ─────────────────────────────────────────────────────────────────
  const osResolvidasComData = osComProblemaArr.filter(os => os.data_solucao && os.data_recebimento);
  const tmrp = osResolvidasComData.length > 0
    ? (osResolvidasComData.reduce((s, os) =>
        s + Math.abs(differenceInDays(new Date(os.data_solucao), new Date(os.data_recebimento))), 0
      ) / osResolvidasComData.length).toFixed(1)
    : null;

  // ── Chart: TCR Mensal (linha) ─────────────────────────────────────────────
  const tcrMensal = useMemo(() => {
    const map = {};
    osReceb.forEach(os => {
      if (!os.created_date) return;
      const key = os.created_date.substring(0, 7);
      if (!map[key]) map[key] = { total: 0, ok: 0 };
      map[key].total++;
      if (!os.problema_recebimento) map[key].ok++;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([key, v]) => ({
        mes: format(new Date(key + '-01'), 'MMM/yy', { locale: ptBR }),
        tcr: v.total > 0 ? Math.round((v.ok / v.total) * 100) : 0,
      }));
  }, [osReceb]);

  // ── Chart: TAC por status de conferência (donut) ──────────────────────────
  const tacPorStatus = useMemo(() => {
    const map = { completo: 0, parcial: 0, pendente: 0, excedente: 0 };
    todosItens.forEach(i => {
      if (i.status_conferencia && map[i.status_conferencia] !== undefined)
        map[i.status_conferencia]++;
    });
    return Object.entries(map)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => ({ name: k, value: v }));
  }, [todosItens]);

  // ── Chart: Lead Time Mensal (barras) ─────────────────────────────────────
  const ltrMensal = useMemo(() => {
    const map = {};
    osComLTR.forEach(os => {
      const key = os.nfe_data_receb.substring(0, 7);
      if (!map[key]) map[key] = { total: 0, dias: 0 };
      map[key].total++;
      map[key].dias += Math.max(0, differenceInDays(new Date(os.data_migo_receb), new Date(os.nfe_data_receb)));
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([key, v]) => ({
        mes: format(new Date(key + '-01'), 'MMM/yy', { locale: ptBR }),
        diasMedio: v.total > 0 ? parseFloat((v.dias / v.total).toFixed(1)) : 0,
      }));
  }, [osComLTR]);

  // ── Chart: Backlog por Almoxarifado (barras horizontais) ─────────────────
  const backlogPorAlmox = useMemo(() =>
    almoxarifados.map(a => ({
      name: a.nome.length > 22 ? a.nome.substring(0, 20) + '…' : a.nome,
      nomeCompleto: a.nome,
      backlog: osReceb.filter(os => os.almoxarifado_id === a.id && os.nfe_data_receb && !os.data_migo_receb).length,
    }))
    .filter(d => d.backlog > 0)
    .sort((a, b) => b.backlog - a.backlog)
    .slice(0, 10),
  [osReceb, almoxarifados]);

  // ── Chart: IRP Mensal (linha) ─────────────────────────────────────────────
  const irpMensal = useMemo(() => {
    const map = {};
    osComProblemaArr.forEach(os => {
      if (!os.data_recebimento) return;
      const key = os.data_recebimento.substring(0, 7);
      if (!map[key]) map[key] = { total: 0, resolvidos: 0 };
      map[key].total++;
      if (os.data_solucao) map[key].resolvidos++;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([key, v]) => ({
        mes: format(new Date(key + '-01'), 'MMM/yy', { locale: ptBR }),
        irp: v.total > 0 ? Math.round((v.resolvidos / v.total) * 100) : 0,
        tmrp: (() => {
          const resolved = osComProblemaArr.filter(os =>
            os.data_recebimento?.startsWith(key) && os.data_solucao && os.data_recebimento
          );
          if (!resolved.length) return null;
          const avg = resolved.reduce((s, os) =>
            s + Math.abs(differenceInDays(new Date(os.data_solucao), new Date(os.data_recebimento))), 0
          ) / resolved.length;
          return parseFloat(avg.toFixed(1));
        })(),
      }));
  }, [osComProblemaArr]);

  // ── Chart: Ranking Problemas ──────────────────────────────────────────────
  const problemasChartData = useMemo(() => {
    const pMap = {};
    problemasRecebimento.forEach(p => { pMap[p.id] = p; });
    const contagem = {};
    osComProblemaArr.forEach(os => {
      (os.problemas_recebimento_ids || []).forEach(pid => {
        const p = pMap[pid];
        if (p) {
          const nome = p.descricao_resumida || p.nome;
          contagem[nome] = (contagem[nome] || 0) + 1;
        }
      });
    });
    return Object.entries(contagem)
      .filter(([n]) => n && n !== 'undefined')
      .map(([nome, quantidade]) => ({ nome, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade);
  }, [osComProblemaArr, problemasRecebimento]);

  if (!categoriaRecebimento) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-400">
        Categoria de recebimento não encontrada. Verifique o cadastro de categorias.
      </div>
    );
  }

  if (totalReceb === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-400">
        Nenhuma OS de recebimento encontrada para os filtros aplicados.
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KPICard
          title="Conformidade (TCR)"
          value={`${tcr}%`}
          subtitle={`${totalReceb - osComProblemaArr.length} de ${totalReceb} OS`}
          gradient="linear-gradient(135deg, #0000FF 0%, #0A003C 100%)"
          icon={CheckCircle}
        />
        <KPICard
          title="Acuracidade (TAC)"
          value={`${tac}%`}
          subtitle={`${itensCompletos} de ${todosItens.length} itens`}
          gradient="linear-gradient(135deg, #059669 0%, #10B981 100%)"
          icon={Package}
        />
        <KPICard
          title="Conclusão Fluxo (TCF)"
          value={`${tcf}%`}
          subtitle={`${osFluxoConcluido} OS armazenadas`}
          gradient="linear-gradient(135deg, #5B21B6 0%, #7C3AED 100%)"
          icon={Activity}
        />
        <KPICard
          title="Divergência (TDQ)"
          value={`${tdq}%`}
          subtitle={`${itensDivergentes} itens divergentes`}
          gradient="linear-gradient(135deg, #DC2626 0%, #EF4444 100%)"
          icon={AlertTriangle}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KPICard
          title="Lead Time (LTR)"
          value={ltr !== null ? `${ltr}d` : '—'}
          subtitle={`${osComLTR.length} OS medidas`}
          gradient="linear-gradient(135deg, #FF6B00 0%, #FF8C00 100%)"
          icon={Clock}
        />
        <KPICard
          title="Backlog"
          value={backlog}
          subtitle="NF-e sem MIGO lançado"
          gradient="linear-gradient(135deg, #EA580C 0%, #F97316 100%)"
          icon={BarChart2}
        />
        <KPICard
          title="Resolução Prob. (IRP)"
          value={`${irp}%`}
          subtitle={`${osSolucionadas} de ${osComProblemaArr.length} resolvidos`}
          gradient="linear-gradient(135deg, #0284C7 0%, #0EA5E9 100%)"
          icon={TrendingUp}
        />
        <KPICard
          title="Tempo Resolução (TMRP)"
          value={tmrp !== null ? `${tmrp}d` : '—'}
          subtitle={`${osResolvidasComData.length} problemas medidos`}
          gradient="linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)"
          icon={Timer}
        />
      </div>

      {/* ── TCR Mensal + TAC Donut ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <SectionHeader title="Taxa de Conformidade Mensal (TCR)" />
          {tcrMensal.length < 2 ? EMPTY : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={tcrMensal} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="mes" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `${v}%`} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => [`${v}%`, '% TCR']} />
                <ReferenceLine y={90} stroke="#94a3b8" strokeDasharray="5 5"
                  label={{ value: 'Meta: 90%', position: 'right', fill: '#94a3b8', fontSize: 11 }} />
                <Line type="monotone" dataKey="tcr" stroke="#0000FF" strokeWidth={2.5}
                  dot={{ fill: '#0000FF', r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <SectionHeader title="Status de Conferência (TAC)" />
          {tacPorStatus.length === 0 ? EMPTY : (
            <div className="flex flex-col items-center">
              <div className="relative">
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie data={tacPorStatus} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                      paddingAngle={2} dataKey="value">
                      {tacPorStatus.map((e, i) => (
                        <Cell key={i} fill={STATUS_COLORS[e.name] || '#94a3b8'} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE}
                      formatter={(v, n) => [v, STATUS_LABELS[n] || n]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">{tac}%</span>
                  <span className="text-xs text-slate-500">completos</span>
                </div>
              </div>
              <div className="mt-4 space-y-2 w-full">
                {tacPorStatus.map(e => (
                  <div key={e.name} className="flex items-center justify-between text-xs p-2 rounded-lg"
                    style={{ backgroundColor: `${STATUS_COLORS[e.name]}18` }}>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[e.name] }} />
                      <span className="text-slate-700 dark:text-slate-300 font-medium">{STATUS_LABELS[e.name] || e.name}</span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {e.value} ({todosItens.length > 0 ? Math.round((e.value / todosItens.length) * 100) : 0}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Lead Time Mensal + Backlog por Almox ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <SectionHeader title="Lead Time de Recebimento Mensal (LTR)" />
          {ltrMensal.length === 0 ? EMPTY : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={ltrMensal} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="mes" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `${v}d`} />
                <Tooltip contentStyle={TOOLTIP_STYLE}
                  formatter={v => [`${v} dias`, 'Média Lead Time']} />
                <Bar dataKey="diasMedio" radius={[4, 4, 0, 0]} name="diasMedio">
                  <LabelList dataKey="diasMedio" position="top"
                    formatter={v => v > 0 ? `${v}d` : ''} style={{ fill: '#475569', fontSize: 11, fontWeight: 600 }} />
                  {ltrMensal.map((e, i) => (
                    <Cell key={i}
                      fill={e.diasMedio <= 3 ? '#10b981' : e.diasMedio <= 7 ? '#f59e0b' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          <p className="text-xs text-slate-400 mt-2">Verde ≤3d · Amarelo ≤7d · Vermelho >7d</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <SectionHeader title={`Backlog por Almoxarifado (${backlog} total)`} />
          {backlogPorAlmox.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-green-500 text-sm font-medium">
              ✓ Nenhum backlog pendente
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={backlogPorAlmox} layout="vertical"
                margin={{ top: 5, right: 50, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} width={120} />
                <Tooltip contentStyle={TOOLTIP_STYLE}
                  labelFormatter={(l, p) => p?.[0]?.payload?.nomeCompleto || l}
                  formatter={v => [v, 'OS em backlog']} />
                <Bar dataKey="backlog" fill="#FF6B00" radius={[0, 4, 4, 0]}>
                  <LabelList dataKey="backlog" position="right"
                    style={{ fill: '#475569', fontSize: 11, fontWeight: 600 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── IRP + TMRP Mensal ── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <SectionHeader title="Evolução de Resolução de Problemas (IRP & TMRP)" />
        {irpMensal.length < 2 ? (
          osComProblemaArr.length === 0
            ? <div className="h-40 flex items-center justify-center text-green-500 text-sm font-medium">✓ Nenhum problema de recebimento registrado</div>
            : EMPTY
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* IRP linha */}
            <div>
              <p className="text-xs font-medium text-slate-500 mb-3 uppercase tracking-wide">% IRP — Índice de Resolução</p>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={irpMensal} margin={{ top: 15, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="mes" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `${v}%`} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => [`${v}%`, '% IRP']} />
                  <ReferenceLine y={80} stroke="#94a3b8" strokeDasharray="5 5"
                    label={{ value: 'Meta: 80%', position: 'right', fill: '#94a3b8', fontSize: 11 }} />
                  <Line type="monotone" dataKey="irp" stroke="#0284C7" strokeWidth={2.5}
                    dot={{ fill: '#0284C7', r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {/* TMRP barras */}
            <div>
              <p className="text-xs font-medium text-slate-500 mb-3 uppercase tracking-wide">Dias Médios — Tempo de Resolução (TMRP)</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={irpMensal.filter(d => d.tmrp !== null)}
                  margin={{ top: 15, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `${v}d`} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => [`${v} dias`, 'TMRP']} />
                  <Bar dataKey="tmrp" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="tmrp" position="top"
                      formatter={v => v != null ? `${v}d` : ''} style={{ fill: '#475569', fontSize: 11, fontWeight: 600 }} />
                    {irpMensal.filter(d => d.tmrp !== null).map((e, i) => (
                      <Cell key={i}
                        fill={e.tmrp <= 3 ? '#10b981' : e.tmrp <= 7 ? '#f59e0b' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* ── Ranking de Problemas (último) ── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <SectionHeader title="Ranking de Principais Problemas de Regularização" />
        {problemasChartData.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-green-500 text-sm font-medium">
            ✓ Nenhum problema registrado
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={Math.max(240, problemasChartData.length * 44)}>
              <BarChart data={problemasChartData} layout="vertical"
                margin={{ top: 5, right: 60, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="nome" tick={{ fill: '#64748b', fontSize: 11 }} width={160}
                  tickFormatter={v => v.length > 22 ? v.substring(0, 20) + '…' : v} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => [v, 'Ocorrências']} />
                <Bar dataKey="quantidade" radius={[0, 4, 4, 0]} fill="#0000FF">
                  {problemasChartData.map((_, i) => {
                    const t = problemasChartData.length;
                    const ratio = i / t;
                    const l = Math.round(80 - ratio * 50);
                    return <Cell key={i} fill={`hsl(220, 80%, ${l}%)`} />;
                  })}
                  <LabelList dataKey="quantidade" position="right"
                    style={{ fill: '#475569', fontSize: 11, fontWeight: 600 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-slate-400 mt-2">
              Total de OS com problemas: {osComProblemaArr.length}
            </p>
          </>
        )}
      </div>

    </div>
  );
}