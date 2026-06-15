import React, { useMemo, useState } from 'react';
import { useApp } from '@/components/contexts/AppContext';
import { listarOSComErros, TIPOS_ERRO } from '@/lib/osErros';
import OSFormModal from '@/components/os/OSFormModal';

const corDe = (key) => TIPOS_ERRO.find(t => t.key === key)?.cor || '#94a3b8';

export default function OSErrosTabela({ ordens, categorias, subcategorias, almoxarifados, tiposErroFiltro = [] }) {
  const { regionais, pessoas, instalacoes, projetos } = useApp();
  const [selectedOS, setSelectedOS] = useState(null);

  const linhas = useMemo(() => {
    const todas = listarOSComErros(ordens || [], { categorias, subcategorias });
    if (!tiposErroFiltro || tiposErroFiltro.length === 0) return todas;
    return todas
      .filter(l => l.erros.some(k => tiposErroFiltro.includes(k)))
      .map(l => {
        const erros = l.erros.filter(k => tiposErroFiltro.includes(k));
        return {
          ...l,
          erros,
          errosLabels: erros.map(k => TIPOS_ERRO.find(t => t.key === k)?.label),
        };
      });
  }, [ordens, categorias, subcategorias, tiposErroFiltro]);

  const totalErros = useMemo(() => linhas.reduce((s, l) => s + l.erros.length, 0), [linhas]);

  const nomeCategoria = (id) => categorias?.find(c => c.id === id)?.nome || '—';

  return (
    <>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Lista de OS com erros de preenchimento
              <span className="ml-2 text-sm font-normal text-slate-500">({linhas.length} OS)</span>
            </h3>
            {linhas.length > 0 && (
              <p className="text-xs text-slate-400 mt-0.5">{totalErros} erro(s) detectado(s) no total</p>
            )}
          </div>
        </div>

        {linhas.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-green-500 text-sm font-medium">
            ✓ Nenhuma OS com erro de preenchimento
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300">
                  {['Nº OS', 'Atendente', 'Categoria', 'Status', 'Erros de Preenchimento'].map((h, i) => (
                    <th key={i} className="px-2 py-2 font-semibold border-b border-slate-200 dark:border-slate-600 text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {linhas.map(({ os, erros, errosLabels }, idx) => (
                  <tr key={os.id} className={`border-b border-slate-100 dark:border-slate-700/50 ${idx % 2 !== 0 ? 'bg-slate-50/50 dark:bg-slate-700/20' : ''} hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors`}>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <button onClick={() => setSelectedOS(os)}
                        className="font-mono text-blue-600 dark:text-blue-400 hover:underline text-left">
                        {os.codigo || os.id?.substring(0, 8)}
                      </button>
                    </td>
                    <td className="px-2 py-2 text-slate-700 dark:text-slate-300 max-w-[160px] truncate" title={os.atendente_nome}>
                      {os.atendente_nome || '—'}
                    </td>
                    <td className="px-2 py-2 text-slate-700 dark:text-slate-300 max-w-[160px] truncate">{nomeCategoria(os.categoria_id)}</td>
                    <td className="px-2 py-2 text-slate-700 dark:text-slate-300 whitespace-nowrap capitalize">{os.status || '—'}</td>
                    <td className="px-2 py-2">
                      <div className="flex flex-wrap gap-1">
                        {erros.map((k, i) => (
                          <span key={k} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: corDe(k) }}>
                            {errosLabels[i]}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedOS && (
        <OSFormModal
          open={!!selectedOS}
          onClose={() => setSelectedOS(null)}
          os={selectedOS}
          regionais={regionais}
          almoxarifados={almoxarifados}
          pessoas={pessoas}
          categorias={categorias}
          subcategorias={subcategorias}
          projetos={projetos}
          instalacoes={instalacoes}
          initialMode="edit"
        />
      )}
    </>
  );
}