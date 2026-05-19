import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';
import { getIndicadoresPorAba } from '@/lib/osIndicadores';
import OSIndicadorCard from './OSIndicadorCard';

/**
 * Painel retrátil de Indicadores (KPIs) contextuais por aba do formulário de OS.
 * Renderizado abaixo do OSGuiaFluxoPainel, no painel lateral direito.
 * Só aparece em OS com fluxo definido (expedição ou recebimento).
 */
export default function OSIndicadoresPainel({
  formData,
  activeTab,
  usaFluxoExpedicao,
  usaFluxoRecebimento,
  subcategoriasAll,
}) {
  const [collapsed, setCollapsed] = useState(false);

  const indicadores = useMemo(
    () => getIndicadoresPorAba({
      os: formData,
      aba: activeTab,
      contexto: { subcategoriasAll },
    }),
    [formData, activeTab, subcategoriasAll]
  );

  // Só renderiza para OS com fluxo e quando há indicadores aplicáveis
  if (!usaFluxoExpedicao && !usaFluxoRecebimento) return null;
  if (!indicadores.length) return null;

  return (
    <div className="mt-3">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <button
          type="button"
          onClick={() => setCollapsed(c => !c)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-gradient-to-r from-emerald-50 to-slate-50 dark:from-emerald-900/20 dark:to-slate-800 border-b border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
          aria-expanded={!collapsed}
        >
          <div className="flex items-center gap-2 min-w-0">
            <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wide truncate">
              indicadores
            </span>
          </div>
          {collapsed ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronUp className="w-4 h-4 text-slate-500" />}
        </button>

        {!collapsed && (
          <div className="p-3 space-y-2">
            {indicadores.map((ind, i) => (
              <OSIndicadorCard key={`${activeTab}-${i}`} {...ind} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}