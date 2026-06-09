import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FolderKanban, CheckCircle2, AlertTriangle, Pause, Clock, TrendingUp, Activity, Target } from 'lucide-react';
import { AXIA } from './axiaColors';

const Stat = ({ label, value, sub, color = '#0f172a', icon: Icon }) => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700 p-5">
    <div className="flex items-center justify-between">
      <p className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">{label}</p>
      {Icon && <Icon className="w-4 h-4 text-slate-400" />}
    </div>
    <p className="text-3xl font-semibold mt-2 tracking-tight" style={{ color }}>{value}</p>
    {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
  </div>
);

const MixBar = ({ label, value, total, color }) => {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="text-slate-600 dark:text-slate-300 font-medium">{label}</span>
        <span className="text-slate-500">{value} <span className="text-slate-400">· {pct}%</span></span>
      </div>
      <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
};

export default function RelatorioProjetos({ projetos }) {
  const indicadores = useMemo(() => {
    if (!projetos) return { ativos: 0, saudeAbertos: 0, throughput: 0, duracaoMin: 0, duracaoMax: 0 };
    const ativos = projetos.totalAbertos - projetos.parados;
    const saudeAbertos = projetos.totalAbertos > 0
      ? Math.round(((projetos.totalAbertos - projetos.abertosAtrasados - projetos.parados) / projetos.totalAbertos) * 100)
      : 0;
    const totalAvaliado = projetos.totalConcluidos + projetos.totalAbertos;
    const throughput = totalAvaliado > 0 ? Math.round((projetos.totalConcluidos / totalAvaliado) * 100) : 0;

    // Variabilidade de duração (mín/máx entre concluídos)
    const duracoes = (projetos.listaConcluidos || []).map(p => p.duracao).filter(d => d != null);
    const duracaoMin = duracoes.length > 0 ? Math.min(...duracoes) : 0;
    const duracaoMax = duracoes.length > 0 ? Math.max(...duracoes) : 0;

    return { ativos, saudeAbertos, throughput, duracaoMin, duracaoMax };
  }, [projetos]);

  if (!projetos) return null;

  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 tracking-tight flex items-center gap-2">
        <FolderKanban className="w-5 h-5 text-slate-700 dark:text-slate-300" />
        Indicadores de Projetos
      </h2>

      {/* KPIs principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Stat icon={CheckCircle2} label="Concluídos no Período" value={projetos.totalConcluidos} sub={`${projetos.taxaNoPrazo}% entregues no prazo`} color={AXIA.success} />
        <Stat icon={Activity} label="Em Aberto" value={projetos.totalAbertos} sub={`${indicadores.ativos} ativos · ${projetos.parados} parados`} color={AXIA.primary} />
        <Stat icon={AlertTriangle} label="Em Atraso" value={projetos.abertosAtrasados} sub="Prazo previsto vencido" color={AXIA.danger} />
        <Stat icon={Clock} label="Duração Média" value={`${projetos.duracaoMediaDias}d`} sub="Projetos concluídos" color={AXIA.indigo} />
      </div>

      {/* KPIs secundários */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Stat icon={Target} label="Taxa de Cumprimento" value={`${projetos.taxaNoPrazo}%`} sub={`${projetos.noPrazo} de ${projetos.totalConcluidos} no prazo`} color={AXIA.success} />
        <Stat icon={TrendingUp} label="Throughput" value={`${indicadores.throughput}%`} sub="Concluídos / total avaliado" color={AXIA.primary} />
        <Stat icon={Activity} label="Saúde do Backlog" value={`${indicadores.saudeAbertos}%`} sub="Ativos no prazo / em aberto" color={AXIA.cyan} />
        <Stat icon={Clock} label="Variabilidade" value={indicadores.duracaoMax > 0 ? `${indicadores.duracaoMin}–${indicadores.duracaoMax}d` : '—'} sub="Menor e maior duração" color={AXIA.purple} />
      </div>

      {/* Composição visual */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-white dark:bg-slate-800 border-slate-200/60 dark:border-slate-700 shadow-none">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Composição dos Projetos em Aberto</h3>
            {projetos.totalAbertos > 0 ? (
              <div className="space-y-3">
                <MixBar label="Ativos no prazo" value={Math.max(0, indicadores.ativos - projetos.abertosAtrasados)} total={projetos.totalAbertos} color={AXIA.success} />
                <MixBar label="Atrasados" value={projetos.abertosAtrasados} total={projetos.totalAbertos} color={AXIA.danger} />
                <MixBar label="Parados" value={projetos.parados} total={projetos.totalAbertos} color={AXIA.warning} />
              </div>
            ) : <p className="text-sm text-slate-400 py-6 text-center">Nenhum projeto em aberto</p>}
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800 border-slate-200/60 dark:border-slate-700 shadow-none">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Entregas no Período</h3>
            {projetos.totalConcluidos > 0 ? (
              <div className="space-y-3">
                <MixBar label="Entregues no prazo" value={projetos.noPrazo} total={projetos.totalConcluidos} color={AXIA.success} />
                <MixBar label="Entregues com atraso" value={projetos.atrasados} total={projetos.totalConcluidos} color={AXIA.danger} />
                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-700 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-slate-500">Duração média</p>
                    <p className="text-slate-900 dark:text-white font-semibold text-base mt-0.5">{projetos.duracaoMediaDias}d</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Faixa de duração</p>
                    <p className="text-slate-900 dark:text-white font-semibold text-base mt-0.5">
                      {indicadores.duracaoMax > 0 ? `${indicadores.duracaoMin}–${indicadores.duracaoMax}d` : '—'}
                    </p>
                  </div>
                </div>
              </div>
            ) : <p className="text-sm text-slate-400 py-6 text-center">Nenhum projeto concluído no período</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}