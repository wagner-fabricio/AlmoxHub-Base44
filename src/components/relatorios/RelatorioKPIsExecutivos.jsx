import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ClipboardList, CheckCircle, Clock, TrendingUp, Target, Timer } from 'lucide-react';

const KPICard = ({ label, value, sublabel, icon: Icon, gradient }) => (
  <Card className="border-0 shadow-md" style={{ background: gradient }}>
    <CardContent className="p-5">
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1">
          <p className="text-white/80 text-xs font-medium uppercase tracking-wide">{label}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
        </div>
        <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      {sublabel && <p className="text-white/70 text-xs">{sublabel}</p>}
    </CardContent>
  </Card>
);

export default function RelatorioKPIsExecutivos({ kpis }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">📊 Indicadores-Chave de Desempenho</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard label="Total de OS" value={kpis.totalOS} sublabel="No período" icon={ClipboardList} gradient="linear-gradient(135deg, #0000FF 0%, #0A003C 100%)" />
        <KPICard label="Concluídas" value={kpis.osConcluidas} sublabel={`${kpis.percConclusao}% do total`} icon={CheckCircle} gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)" />
        <KPICard label="Em Execução" value={kpis.osEmExecucao} sublabel="Em andamento" icon={Clock} gradient="linear-gradient(135deg, #FF6B00 0%, #FF8C00 100%)" />
        <KPICard label="Taxa de Cumprimento" value={`${kpis.onTimeRate}%`} sublabel="OS no prazo" icon={Target} gradient="linear-gradient(135deg, #A0B4D2 0%, #7A95BA 100%)" />
        <KPICard label="Tempo Médio Resolução" value={`${kpis.avgResolutionDays} dias`} sublabel="Para conclusão" icon={Timer} gradient="linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)" />
        <KPICard label="Progresso Médio" value={`${kpis.avgProgress}%`} sublabel="Geral" icon={TrendingUp} gradient="linear-gradient(135deg, #ec4899 0%, #be185d 100%)" />
      </div>
    </div>
  );
}