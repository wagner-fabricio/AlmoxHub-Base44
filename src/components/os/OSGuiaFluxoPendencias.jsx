import React from 'react';
import { CheckCircle2, ArrowRight } from 'lucide-react';

// Rótulos legíveis das abas (mesmas chaves usadas no validator)
const TAB_LABELS = {
  geral: 'Dados Gerais',
  documento: 'Documento',
  materiais: 'Materiais',
  volumes: 'Volumes',
  expedicao: 'Expedição',
  anexos: 'Anexos',
  'receb-dados': 'Dados Recebimento',
  'receb-documento': 'Documento',
  'receb-doc': 'Cabeçalho NF',
  'receb-mat': 'Materiais',
  'receb-transp': 'Transportador',
  'receb-rodape': 'Rodapé NF',
};

/**
 * Lista clicável de pendências da ETAPA ATUAL.
 * Cabeçalho destacado: "Faltam N campos para concluir ETAPA X — NOME"
 * Cada item leva à aba correspondente quando clicado.
 * À medida que campos são preenchidos, eles somem; quando a etapa zera,
 * o validador automaticamente avança para a próxima etapa pendente.
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

  const total = pendencias.length;
  const etapaLabel = etapaAtual?.label?.toUpperCase() || '';
  const etapaNum = etapaAtual?.id || '';

  // Agrupa pendências por aba, preservando a ordem de primeira aparição
  const grupos = [];
  const indexPorTab = new Map();
  pendencias.forEach((p) => {
    const tab = p.tab || 'outros';
    if (!indexPorTab.has(tab)) {
      indexPorTab.set(tab, grupos.length);
      grupos.push({ tab, itens: [] });
    }
    grupos[indexPorTab.get(tab)].itens.push(p);
  });

  return (
    <div className="space-y-2">
      {/* Cabeçalho destacado */}
      <div className="text-[11px] font-bold text-slate-800 dark:text-slate-100 leading-snug">
        Faltam{' '}
        <span className="text-red-500 text-sm">{total}</span>{' '}
        {total === 1 ? 'campo' : 'campos'} para concluir{' '}
        <span className="uppercase">ETAPA {etapaNum} — {etapaLabel}</span>
      </div>

      {/* Grupos por aba */}
      <div className="space-y-3">
        {grupos.map((g) => (
          <div key={g.tab}>
            <button
              type="button"
              onClick={() => onNavigateTab?.(g.tab)}
              className="group w-full flex items-center gap-1.5 mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
            >
              <span>Aba: {TAB_LABELS[g.tab] || g.tab}</span>
              <span className="inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full text-[9px] font-bold bg-amber-500 text-white">
                {g.itens.length}
              </span>
              <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
            </button>
            <ul className="space-y-1">
              {g.itens.map((p, idx) => (
                <li key={idx}>
                  <button
                    type="button"
                    onClick={() => onNavigateTab?.(p.tab)}
                    className="group w-full text-left flex items-start gap-2 p-2 rounded-md hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors border border-transparent hover:border-amber-200 dark:hover:border-amber-800"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                    <span className="flex-1 text-xs text-slate-700 dark:text-slate-300 leading-snug">
                      {p.label}
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-amber-600 dark:group-hover:text-amber-400 mt-0.5 shrink-0 transition-colors" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}