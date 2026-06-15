import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertTriangle } from 'lucide-react';
import { useApp } from '@/components/contexts/AppContext';
import OSFormModal from '@/components/os/OSFormModal';

const safeF = (d) => {
  if (!d) return '—';
  try {
    const m = typeof d === 'string' && /^\d{4}-\d{2}-\d{2}/.test(d) ? d.match(/^(\d{4})-(\d{2})-(\d{2})/) : null;
    const date = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(d);
    return format(date, 'dd/MM/yy', { locale: ptBR });
  } catch { return '—'; }
};

export default function OSProblemasRecebimentoTabela({ osComProblema = [], problemasRecebimento = [], almoxarifados = [] }) {
  const { regionais, categorias, subcategorias, pessoas, instalacoes, projetos } = useApp();
  const [selectedOS, setSelectedOS] = useState(null);
  const [formInitialMode, setFormInitialMode] = useState('edit');

  const rows = useMemo(() => {
    const pMap = {};
    (problemasRecebimento || []).forEach(p => { pMap[p.id] = p; });
    return (osComProblema || []).map(os => {
      const almox = almoxarifados.find(a => a.id === os.almoxarifado_id);
      const subcatNomes = (os.subcategorias_ids || [])
        .map(sid => subcategorias?.find(s => s.id === sid)?.nome)
        .filter(Boolean)
        .join(', ') || '—';
      const liderNome = pessoas?.find(p => p.id === os.lider_id)?.nome || '—';
      const erros = (os.problemas_recebimento_ids || [])
        .map(pid => pMap[pid]?.descricao_resumida || pMap[pid]?.nome)
        .filter(Boolean);
      return { os, almox, subcatNomes, liderNome, erros };
    });
  }, [osComProblema, problemasRecebimento, almoxarifados, subcategorias, pessoas]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          OS com Problemas (base do gráfico)
          <span className="ml-1 text-sm font-normal text-slate-500">({rows.length} OS)</span>
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">Lista das ordens de serviço usadas no ranking acima, com os erros registrados em cada uma.</p>
      </div>

      {rows.length === 0 ? (
        <div className="h-32 flex items-center justify-center text-green-500 text-sm font-medium">
          ✓ Nenhuma OS com problema registrado
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300">
                {['Nº OS', 'Subcategoria', 'Almoxarifado', 'Nº MIGO', 'Recebimento', 'Solução', 'Líder', 'Erros / Problemas'].map(h => (
                  <th key={h} className="px-2 py-2 font-semibold border-b border-slate-200 dark:border-slate-600 text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ os, almox, subcatNomes, liderNome, erros }, idx) => (
                <tr key={os.id} className={`border-b border-slate-100 dark:border-slate-700/50 ${idx % 2 !== 0 ? 'bg-slate-50/50 dark:bg-slate-700/20' : ''} hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors`}>
                  <td className="px-2 py-2 whitespace-nowrap">
                    <button onClick={() => { setFormInitialMode('edit'); setSelectedOS(os); }}
                      className="font-mono text-blue-600 dark:text-blue-400 hover:underline text-left">
                      {os.codigo || os.id?.substring(0, 8)}
                    </button>
                  </td>
                  <td className="px-2 py-2 max-w-[144px] truncate text-slate-700 dark:text-slate-300" title={subcatNomes}>{subcatNomes}</td>
                  <td className="px-2 py-2 text-slate-700 dark:text-slate-300 max-w-[144px] truncate">{almox?.nome || '—'}</td>
                  <td className="px-2 py-2 text-center whitespace-nowrap">{os.numero_migo_receb || '—'}</td>
                  <td className="px-2 py-2 text-center whitespace-nowrap">{safeF(os.data_recebimento)}</td>
                  <td className="px-2 py-2 text-center whitespace-nowrap">{safeF(os.data_solucao)}</td>
                  <td className="px-2 py-2 max-w-[144px] truncate text-slate-700 dark:text-slate-300" title={liderNome}>{liderNome}</td>
                  <td className="px-2 py-2">
                    {erros.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {erros.map((e, i) => (
                          <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                            {e}
                          </span>
                        ))}
                      </div>
                    ) : <span className="text-slate-400">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
          initialMode={formInitialMode}
          onSave={() => setFormInitialMode('read')}
        />
      )}
    </div>
  );
}