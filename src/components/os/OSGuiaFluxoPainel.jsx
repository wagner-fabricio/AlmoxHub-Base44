import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Compass } from 'lucide-react';
import { getFluxoState } from '@/lib/osFluxoValidator';
import OSGuiaFluxoStepper from './OSGuiaFluxoStepper';
import OSGuiaFluxoPendencias from './OSGuiaFluxoPendencias';

/**
 * Painel guia lateral fixo (sticky) com:
 *  - Progresso geral
 *  - Stepper vertical das etapas do fluxo
 *  - Lista de pendências da etapa atual (clicáveis)
 *
 * Visível somente para OS com fluxo (usaFluxoExpedicao || usaFluxoRecebimento).
 * Renderizado dentro da área de conteúdo do OSFormModal.
 */
export default function OSGuiaFluxoPainel({
  formData,
  usaFluxoExpedicao,
  usaFluxoRecebimento,
  fluxoEstrito = true,
  onNavigateTab,
  defaultCollapsed = false,
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const state = useMemo(
    () => getFluxoState(formData, { usaFluxoExpedicao, usaFluxoRecebimento, fluxoEstrito }),
    [formData, usaFluxoExpedicao, usaFluxoRecebimento, fluxoEstrito]
  );

  if (!state) return null;

  const { etapas, pendencias, etapaAtual, progresso, tipo } = state;
  const tituloTipo = tipo === 'expedicao' ? 'Expedição' : 'Recebimento';

  return (
    <aside aria-label="Guia do fluxo da OS" className="w-full">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* Header */}
          <button
            type="button"
            onClick={() => setCollapsed(c => !c)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-gradient-to-r from-blue-50 to-slate-50 dark:from-blue-900/20 dark:to-slate-800 border-b border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
            aria-expanded={!collapsed}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Compass className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wide truncate">
                Guia {tituloTipo}
              </span>
            </div>
            {collapsed ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronUp className="w-4 h-4 text-slate-500" />}
          </button>

          {!collapsed && (
            <div className="p-3 space-y-4">
              {/* Progresso geral */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold">
                    Progresso
                  </span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    {progresso}%
                  </span>
                </div>
                <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${progresso}%` }}
                  />
                </div>
                {etapaAtual && (
                  <div className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    Etapa atual: <span className="font-medium text-slate-700 dark:text-slate-200">{etapaAtual.label}</span>
                  </div>
                )}
              </div>

              {/* Stepper */}
              <div>
                <div className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold mb-2">
                  Etapas
                </div>
                <OSGuiaFluxoStepper etapas={etapas} />
              </div>

              {/* Pendências */}
              <div>
                <div className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold mb-2">
                  Campos pendentes da etapa atual
                </div>
                <OSGuiaFluxoPendencias
                  pendencias={pendencias}
                  etapaAtual={etapaAtual}
                  onNavigateTab={onNavigateTab}
                />
              </div>
            </div>
          )}
      </div>
    </aside>
  );
}