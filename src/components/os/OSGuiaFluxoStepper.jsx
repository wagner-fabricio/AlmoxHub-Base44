import React from 'react';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Stepper vertical compacto para o painel guia.
 * Mostra etapas como ✅ concluída / 🔵 atual / ⚪ pendente.
 */
export default function OSGuiaFluxoStepper({ etapas }) {
  return (
    <ol className="space-y-2.5">
      {etapas.map((etapa, idx) => {
        const isLast = idx === etapas.length - 1;
        let Icon, iconColor, textColor, lineColor;
        if (etapa.completa) {
          Icon = CheckCircle2;
          iconColor = 'text-green-500';
          textColor = 'text-slate-700 dark:text-slate-200 font-medium';
          lineColor = 'bg-green-500';
        } else if (etapa.atual) {
          Icon = Clock;
          iconColor = 'text-blue-500';
          textColor = 'text-blue-700 dark:text-blue-300 font-semibold';
          lineColor = 'bg-slate-200 dark:bg-slate-700';
        } else {
          Icon = Circle;
          iconColor = 'text-slate-300 dark:text-slate-600';
          textColor = 'text-slate-400 dark:text-slate-500';
          lineColor = 'bg-slate-200 dark:bg-slate-700';
        }

        return (
          <li key={etapa.id} className="relative flex items-start gap-2.5">
            {!isLast && (
              <span
                aria-hidden
                className={`absolute left-[7px] top-5 w-0.5 h-[calc(100%+2px)] ${lineColor}`}
              />
            )}
            <Icon className={`w-4 h-4 mt-0.5 shrink-0 relative z-10 ${iconColor} ${etapa.atual ? 'animate-pulse' : ''}`} />
            <div className="flex-1 min-w-0 pb-1">
              <div className={`text-xs leading-tight ${textColor}`}>
                {etapa.label}
              </div>
              {etapa.completa && etapa.data && (
                <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                  {(() => {
                    try { return format(new Date(etapa.data), 'dd/MM HH:mm', { locale: ptBR }); }
                    catch { return ''; }
                  })()}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}