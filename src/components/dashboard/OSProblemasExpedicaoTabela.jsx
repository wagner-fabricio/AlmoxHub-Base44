import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { AlertTriangle } from 'lucide-react';
import { useApp } from '@/components/contexts/AppContext';
import OSFormModal from '@/components/os/OSFormModal';

const safeFormat = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? '—' : format(dt, 'dd/MM/yy');
};

const statusLabels = {
  pendente: { label: 'Pendente', cls: 'bg-slate-100 text-slate-600' },
  em_separacao: { label: 'Em Sep.', cls: 'bg-blue-100 text-blue-700' },
  separado: { label: 'Separado', cls: 'bg-indigo-100 text-indigo-700' },
  embalando: { label: 'Embalando', cls: 'bg-purple-100 text-purple-700' },
  aguardando_transporte: { label: 'Ag. Transp.', cls: 'bg-yellow-100 text-yellow-700' },
  em_rota: { label: 'Em Rota', cls: 'bg-orange-100 text-orange-700' },
  entregue: { label: 'Entregue', cls: 'bg-green-100 text-green-700' },
};

export default function OSProblemasExpedicaoTabela({ osComOcorrencia = [], problemasExpedicao = [], almoxarifados = [] }) {
  const { regionais, categorias, subcategorias, pessoas, instalacoes, projetos } = useApp();
  const [selectedOS, setSelectedOS] = useState(null);
  const [formInitialMode, setFormInitialMode] = useState('edit');

  const rows = useMemo(() => {
    const pMap = {};
    (problemasExpedicao || []).forEach(p => { pMap[p.id] = p; });
    return (osComOcorrencia || []).map(os => {
      const almox = almoxarifados.find(a => a.id === os.almoxarifado_id);
      const destino = instalacoes?.find(i => i.id === os.instalacao_destino_id);
      const subcatNomes = (os.subcategorias_ids || [])
        .map(sid => subcategorias?.find(s => s.id === sid)?.nome)
        .filter(Boolean)
        .join(', ') || '—';
      const liderNome = pessoas?.find(p => p.id === os.lider_id)?.nome || '—';
      const erros = (os.problemas_expedicao_ids || [])
        .map(pid => pMap[pid]?.descricao_resumida || pMap[pid]?.nome)
        .filter(Boolean);
      return { os, almox, destino, subcatNomes, liderNome, erros };
    });
  }, [osComOcorrencia, problemasExpedicao, almoxarifados, instalacoes, subcategorias, pessoas]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          OS com Ocorrências (base do gráfico)
          <span className="ml-1 text-sm font-normal text-slate-500">({rows.length} OS)</span>
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">Lista das ordens de serviço usadas no ranking acima, com os erros registrados em cada uma.</p>
      </div>

      {rows.length === 0 ? (
        <div className="h-32 flex items-center justify-center text-green-500 text-sm font-medium">
          ✓ Nenhuma OS com ocorrência registrada
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300">
                {['Nº OS', 'Status Exp.', 'Subcategoria', 'Almoxarifado', 'Destino', 'Nº Reserva', 'Nº MIGO', 'Entrega', 'Líder', 'Erros / Problemas'].map(h => (
                  <th key={h} className="px-2 py-2 font-semibold border-b border-slate-200 dark:border-slate-600 text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ os, almox, destino, subcatNomes, liderNome, erros }, idx) => {
                const s = statusLabels[os.status_separacao];
                return (
                  <tr key={os.id} className={`border-b border-slate-100 dark:border-slate-700/50 ${idx % 2 !== 0 ? 'bg-slate-50/50 dark:bg-slate-700/20' : ''} hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors`}>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <button onClick={() => { setFormInitialMode('edit'); setSelectedOS(os); }}
                        className="font-mono text-blue-600 dark:text-blue-400 hover:underline text-left">
                        {os.codigo || os.id?.substring(0, 8)}
                      </button>
                    </td>
                    <td className="px-2 py-2 text-center whitespace-nowrap">
                      {s ? <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span> : '—'}
                    </td>
                    <td className="px-2 py-2 max-w-[144px] truncate text-slate-700 dark:text-slate-300" title={subcatNomes}>{subcatNomes}</td>
                    <td className="px-2 py-2 text-slate-700 dark:text-slate-300 max-w-[144px] truncate">{almox?.nome || '—'}</td>
                    <td className="px-2 py-2 text-slate-700 dark:text-slate-300 max-w-[144px] truncate">{destino?.nome || '—'}</td>
                    <td className="px-2 py-2 text-center whitespace-nowrap">{os.num_reserva || '—'}</td>
                    <td className="px-2 py-2 text-center whitespace-nowrap">{os.num_migo || '—'}</td>
                    <td className="px-2 py-2 text-center whitespace-nowrap">{safeFormat(os.data_entrega)}</td>
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
                );
              })}
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