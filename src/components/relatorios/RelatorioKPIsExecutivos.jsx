import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ClipboardList, CheckCircle, Clock, TrendingUp, Target, Timer } from 'lucide-react';

const KPICard = ({ label, value, sublabel, icon: Icon, color }) => (
  <Card className="bg-white dark:bg-slate-800 border-slate-200/60 dark:border-slate-700 shadow-none">
    <CardContent className="p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">{label}</p>
          <p className="text-3xl font-semibold mt-2 tracking-tight text-slate-900 dark:text-white">{value}</p>
          {sublabel && <p className="text-xs text-slate-500 mt-1">{sublabel}</p>}
        </div>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}12` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function RelatorioKPIsExecutivos({ kpis }) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 tracking-tight">Indicadores-Chave de Desempenho</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <KPICard label="Total de OS" value={kpis.totalOS} sublabel="No período" icon={ClipboardList} color="#0000FF" />
        <KPICard label="Concluídas" value={kpis.osConcluidas} sublabel={`${kpis.percConclusao}% do total`} icon={CheckCircle} color="#10b981" />
        <KPICard label="Em Execução" value={kpis.osEmExecucao} sublabel="Em andamento" icon={Clock} color="#FF6B00" />
        <KPICard label="Taxa de Cumprimento" value={`${kpis.onTimeRate}%`} sublabel="OS no prazo" icon={Target} color="#7A95BA" />
        <KPICard label="Tempo Médio Resolução" value={`${kpis.avgResolutionDays}d`} sublabel="Para conclusão" icon={Timer} color="#6366f1" />
        <KPICard label="Progresso Médio" value={`${kpis.avgProgress}%`} sublabel="Geral" icon={TrendingUp} color="#ec4899" />
      </div>
    </div>
  );
}