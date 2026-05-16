import React from 'react';
import { AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

/**
 * Lista clicável de pendências para avançar a etapa atual.
 * Cada item leva à aba correspondente quando clicado.
 */
export default function OSGuiaFluxoPendencias({ pendencias, etapaAtual, onNavigateTab }) {
  if (!pendencias || pendencias.length === 0) {
    return (
      <div className="flex items-start gap-2 p-2.5 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
        <div className="text-xs text-green-700 dark:text-green-300 leading-snug">
          {etapaAtual?.completa
            ? 'Todas as etapas concluídas! 🎉'
            : 'Nenhuma pendência nesta etapa.'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-amber-700 dark:text-amber-400 font-semibold mb-1">
        <AlertCircle className="w-3 h-3" />
        Faltam {pendencias.length} {pendencias.length === 1 ? 'item' : 'itens'}
      </div>
      <ul className="space-y-1">
        {pendencias.map((p, idx) => (
          <li key={idx}>
            <button
              type="button"
              onClick={() => onNavigateTab?.(p.tab)}
              className="group w-full text-left flex items-start gap-2 p-2 rounded-md hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors border border-transparent hover:border-amber-200 dark:hover:border-amber-800"
            >
              <span className="w-1 h-1 rounded-full bg-amber-500 mt-1.5 shrink-0" />
              <span className="flex-1 text-xs text-slate-700 dark:text-slate-300 leading-snug">
                {p.label}
              </span>
              <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-amber-600 dark:group-hover:text-amber-400 mt-0.5 shrink-0 transition-colors" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}