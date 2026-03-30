import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { formatarTempo } from './TimeSheetButton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Radio, User, Clock, Building2 } from 'lucide-react';

// Calcula tempo correndo desde o início
const minutosDesde = (inicio) => {
  if (!inicio) return 0;
  return (Date.now() - new Date(inicio).getTime()) / 60000;
};

export default function OSTimeSheetView({ osEmPlay, pessoas, categorias, almoxarifados, onClickOS }) {
  const [tick, setTick] = useState(0);

  // Atualiza o cronômetro a cada minuto
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  if (!osEmPlay || osEmPlay.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400 dark:text-slate-500">
        <Radio className="w-12 h-12 mb-4 opacity-40" />
        <p className="text-lg font-medium">Nenhuma OS em andamento</p>
        <p className="text-sm mt-1">Quando alguém der play em uma OS, ela aparecerá aqui</p>
      </div>
    );
  }

  // Agrupar por pessoa também
  const porPessoa = {};
  for (const os of osEmPlay) {
    for (const sessao of (os.timesheet_sessoes_ativas || [])) {
      if (!porPessoa[sessao.pessoa_id]) {
        porPessoa[sessao.pessoa_id] = { pessoa_nome: sessao.pessoa_nome, os_list: [] };
      }
      porPessoa[sessao.pessoa_id].os_list.push({ os, sessao });
    }
  }

  return (
    <div className="space-y-6">
      {/* Header ao vivo */}
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-xs font-semibold">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          AO VIVO
        </span>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {osEmPlay.length} OS ativas · {Object.keys(porPessoa).length} pessoas trabalhando
        </span>
      </div>

      {/* Agrupamento por pessoa */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-3">Por Pessoa</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(porPessoa).map(([pessoaId, dados]) => (
            <div key={pessoaId} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <User className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="font-medium text-slate-900 dark:text-white text-sm">{dados.pessoa_nome}</span>
                <span className="ml-auto text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full animate-pulse">
                  ativo
                </span>
              </div>
              <div className="space-y-1.5">
                {dados.os_list.map(({ os, sessao }) => {
                  const cat = categorias?.find(c => c.id === os.categoria_id);
                  const mins = (os.timesheet_total_minutos || 0) + minutosDesde(sessao.inicio);
                  return (
                    <button
                      key={os.id}
                      onClick={() => onClickOS?.(os)}
                      className="w-full text-left flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <div className="min-w-0">
                        <span className="text-xs font-mono text-slate-500 dark:text-slate-400 block">{os.codigo}</span>
                        <span className="text-xs text-slate-700 dark:text-slate-300 truncate block">{cat?.nome || 'OS'}</span>
                      </div>
                      <span className="text-xs font-medium text-amber-600 dark:text-amber-400 ml-2 shrink-0">{formatarTempo(mins)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabela de OS */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-3">Por OS</h3>
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                <th className="text-left p-3 text-xs font-semibold text-slate-600 dark:text-slate-300">OS</th>
                <th className="text-left p-3 text-xs font-semibold text-slate-600 dark:text-slate-300">Categoria</th>
                <th className="text-left p-3 text-xs font-semibold text-slate-600 dark:text-slate-300 hidden md:table-cell">Almoxarifado</th>
                <th className="text-left p-3 text-xs font-semibold text-slate-600 dark:text-slate-300">Trabalhando</th>
                <th className="text-right p-3 text-xs font-semibold text-slate-600 dark:text-slate-300">Tempo total</th>
              </tr>
            </thead>
            <tbody>
              {osEmPlay.map(os => {
                const cat = categorias?.find(c => c.id === os.categoria_id);
                const almox = almoxarifados?.find(a => a.id === os.almoxarifado_id);
                const sessoes = os.timesheet_sessoes_ativas || [];
                const minutosCorrente = sessoes.length > 0
                  ? Math.max(...sessoes.map(s => minutosDesde(s.inicio)))
                  : 0;
                const totalMins = (os.timesheet_total_minutos || 0) + minutosCorrente;

                return (
                  <tr
                    key={os.id}
                    onClick={() => onClickOS?.(os)}
                    className="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer transition-colors"
                  >
                    <td className="p-3">
                      <span className="font-mono text-xs text-slate-500 dark:text-slate-400 block">{os.codigo}</span>
                      <span className="text-xs text-slate-700 dark:text-slate-300">{os.descricao_resumida?.substring(0, 40) || '-'}</span>
                    </td>
                    <td className="p-3 text-slate-700 dark:text-slate-300">{cat?.nome || '-'}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400 hidden md:table-cell">{almox?.nome || '-'}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {sessoes.map(s => (
                          <span key={s.pessoa_id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-xs font-medium">
                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                            {s.pessoa_nome.split(' ')[0]}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-right font-medium text-slate-900 dark:text-white">
                      {formatarTempo(totalMins)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}