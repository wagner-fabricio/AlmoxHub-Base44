import React from 'react';
import { CheckCircle2, XCircle, Clock, AlertTriangle, Info, HelpCircle, MinusCircle } from 'lucide-react';

const STATUS_STYLE = {
  no_prazo:  { Icon: CheckCircle2,  color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-900/20',  border: 'border-emerald-200 dark:border-emerald-800' },
  fora_prazo:{ Icon: XCircle,       color: 'text-red-700 dark:text-red-300',         bg: 'bg-red-50 dark:bg-red-900/20',          border: 'border-red-200 dark:border-red-800' },
  pendente:  { Icon: Clock,         color: 'text-amber-700 dark:text-amber-300',     bg: 'bg-amber-50 dark:bg-amber-900/20',      border: 'border-amber-200 dark:border-amber-800' },
  alerta:    { Icon: AlertTriangle, color: 'text-orange-700 dark:text-orange-300',   bg: 'bg-orange-50 dark:bg-orange-900/20',    border: 'border-orange-200 dark:border-orange-800' },
  info:      { Icon: Info,          color: 'text-slate-700 dark:text-slate-300',     bg: 'bg-slate-50 dark:bg-slate-800',         border: 'border-slate-200 dark:border-slate-700' },
  ok:        { Icon: CheckCircle2,  color: 'text-blue-700 dark:text-blue-300',       bg: 'bg-blue-50 dark:bg-blue-900/20',        border: 'border-blue-200 dark:border-blue-800' },
  sem_dados: { Icon: MinusCircle,   color: 'text-slate-500 dark:text-slate-400',     bg: 'bg-slate-50 dark:bg-slate-800/50',      border: 'border-slate-200 dark:border-slate-700' },
};

export default function OSIndicadorCard({ titulo, status = 'sem_dados', valor, detalhe, regra }) {
  const style = STATUS_STYLE[status] || STATUS_STYLE.sem_dados;
  const { Icon } = style;

  return (
    <div className={`rounded-lg border ${style.border} ${style.bg} p-2.5`}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[10px] uppercase tracking-wide font-semibold text-slate-600 dark:text-slate-300 truncate">
            {titulo}
          </span>
          {regra && (
            <span className="relative group inline-flex items-center" tabIndex={0}>
              <HelpCircle className="w-3 h-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-help shrink-0" />
              <span className="invisible group-hover:visible group-focus-within:visible absolute right-5 top-1/2 -translate-y-1/2 z-50 w-64 p-2 bg-slate-900 text-white text-[11px] font-normal normal-case tracking-normal rounded-md shadow-xl pointer-events-none">
                {regra}
              </span>
            </span>
          )}
        </div>
        <Icon className={`w-4 h-4 ${style.color} shrink-0`} />
      </div>
      <div className={`text-sm font-bold ${style.color} truncate`} title={valor}>
        {valor || '—'}
      </div>
      {detalhe && (
        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate" title={detalhe}>
          {detalhe}
        </div>
      )}
    </div>
  );
}