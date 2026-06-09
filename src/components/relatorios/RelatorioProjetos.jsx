import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FolderKanban, CheckCircle2, AlertTriangle, Pause } from 'lucide-react';

const Stat = ({ label, value, sub, color = '#0f172a' }) => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700 p-5">
    <p className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">{label}</p>
    <p className="text-3xl font-semibold mt-1 tracking-tight" style={{ color }}>{value}</p>
    {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
  </div>
);

export default function RelatorioProjetos({ projetos }) {
  if (!projetos) return null;

  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 tracking-tight flex items-center gap-2">
        <FolderKanban className="w-5 h-5 text-slate-700 dark:text-slate-300" />
        Projetos
      </h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Stat label="Concluídos no Período" value={projetos.totalConcluidos} sub={`${projetos.taxaNoPrazo}% no prazo`} color="#10b981" />
        <Stat label="Em Aberto" value={projetos.totalAbertos} sub={`${projetos.abertosAtrasados} atrasados`} color="#0000FF" />
        <Stat label="Parados" value={projetos.parados} sub="Status: parado" color="#f59e0b" />
        <Stat label="Duração Média" value={`${projetos.duracaoMediaDias}d`} sub="Projetos concluídos" color="#6366f1" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-white dark:bg-slate-800 border-slate-200/60 dark:border-slate-700 shadow-none">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Concluídos no Período</h3>
            </div>
            {projetos.listaConcluidos.length > 0 ? (
              <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                {projetos.listaConcluidos.map((p, i) => (
                  <li key={i} className="py-2 flex items-center justify-between text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900 dark:text-white truncate">{p.nome}</p>
                      <p className="text-xs text-slate-500">{p.regional} • {p.duracao ?? '—'} dias</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${p.noPrazo === false ? 'bg-red-50 text-red-600' : p.noPrazo ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                      {p.noPrazo === false ? 'Atrasado' : p.noPrazo ? 'No prazo' : '—'}
                    </span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-slate-400 py-6 text-center">Nenhum projeto concluído</p>}
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800 border-slate-200/60 dark:border-slate-700 shadow-none">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Em Aberto</h3>
            </div>
            {projetos.listaAbertos.length > 0 ? (
              <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                {projetos.listaAbertos.map((p, i) => (
                  <li key={i} className="py-2 flex items-center justify-between text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900 dark:text-white truncate">{p.nome}</p>
                      <p className="text-xs text-slate-500">{p.regional}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${p.status === 'parado' ? 'bg-amber-50 text-amber-700' : p.atrasado ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                      {p.status === 'parado' && <Pause className="w-3 h-3" />}
                      {p.status === 'parado' ? 'Parado' : p.atrasado ? 'Atrasado' : 'Ativo'}
                    </span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-slate-400 py-6 text-center">Nenhum projeto em aberto</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}