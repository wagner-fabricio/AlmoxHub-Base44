import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, Play, Pause, Timer } from 'lucide-react';
import TimeSheetButton from './TimeSheetButton';

function formatarTempo(minutos) {
  const h = Math.floor(minutos / 60);
  const m = Math.floor(minutos % 60);
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}

export default function TimeSheetTab({ os, currentPessoa, onRefresh }) {
  const [entradas, setEntradas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!os?.id) return;
    setLoading(true);
    base44.entities.TimeSheetEntry.filter({ os_id: os.id }, '-created_date', 100)
      .then(data => setEntradas(Array.isArray(data) ? data : []))
      .catch(() => setEntradas([]))
      .finally(() => setLoading(false));
  }, [os?.id, os?.timesheet_total_minutos]);

  const totalMinutos = os?.timesheet_total_minutos || 0;
  const sessoesAtivas = os?.timesheet_sessoes_ativas || [];

  const tipoLabel = {
    pause: 'Pausado',
    stop: 'Parado',
    auto_fim_expediente: 'Pausa automática (fim do expediente)',
    auto_edicao: 'Pausa automática (edição)',
  };

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 flex items-center gap-3">
          <Timer className="w-8 h-8 text-blue-600" />
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Total acumulado</p>
            <p className="text-xl font-bold text-blue-700 dark:text-blue-400">{formatarTempo(totalMinutos)}</p>
          </div>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 flex items-center gap-3">
          <Play className="w-8 h-8 text-amber-600" />
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Sessões ativas agora</p>
            <p className="text-xl font-bold text-amber-700 dark:text-amber-400">{sessoesAtivas.length}</p>
          </div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 flex items-center gap-3">
          <Clock className="w-8 h-8 text-slate-500" />
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Sessões registradas</p>
            <p className="text-xl font-bold text-slate-700 dark:text-slate-300">{entradas.length}</p>
          </div>
        </div>
      </div>

      {/* Botão de controle */}
      {currentPessoa && (
        <div className="flex items-center gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300 flex-1">Controlar minha sessão</span>
          <TimeSheetButton
            os={os}
            currentPessoa={currentPessoa}
            size="sm"
            showTimer={true}
            onUpdate={onRefresh}
          />
        </div>
      )}

      {/* Sessões ativas */}
      {sessoesAtivas.length > 0 && (
        <div>
          <h4 className="font-medium text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse inline-block" />
            Em andamento agora
          </h4>
          <div className="space-y-2">
            {sessoesAtivas.map((s) => (
              <div key={s.entrada_id} className="flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white text-sm">{s.pessoa_nome}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Desde {format(new Date(s.inicio), "HH:mm 'de' dd/MM", { locale: ptBR })}
                  </p>
                </div>
                <span className="text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-2 py-1 rounded-full">
                  Ativo
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Histórico */}
      <div>
        <h4 className="font-medium text-slate-900 dark:text-white mb-3">Histórico de sessões</h4>
        {loading ? (
          <div className="text-center py-8 text-slate-400">Carregando...</div>
        ) : entradas.filter(e => e.status === 'closed').length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Clock className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p>Nenhuma sessão registrada</p>
          </div>
        ) : (
          <div className="border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th className="text-left p-3 font-semibold text-slate-600 dark:text-slate-300">Pessoa</th>
                  <th className="text-left p-3 font-semibold text-slate-600 dark:text-slate-300">Início</th>
                  <th className="text-left p-3 font-semibold text-slate-600 dark:text-slate-300">Fim</th>
                  <th className="text-right p-3 font-semibold text-slate-600 dark:text-slate-300">Duração</th>
                  <th className="text-left p-3 font-semibold text-slate-600 dark:text-slate-300">Encerramento</th>
                </tr>
              </thead>
              <tbody>
                {entradas.filter(e => e.status === 'closed').map((e) => (
                  <tr key={e.id} className="border-t border-slate-100 dark:border-slate-700">
                    <td className="p-3 font-medium">{e.pessoa_nome || '-'}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">
                      {e.inicio ? format(new Date(e.inicio), "dd/MM HH:mm", { locale: ptBR }) : '-'}
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">
                      {e.fim ? format(new Date(e.fim), "dd/MM HH:mm", { locale: ptBR }) : '-'}
                    </td>
                    <td className="p-3 text-right font-mono font-medium text-blue-600">
                      {e.duracao_minutos != null ? formatarTempo(e.duracao_minutos) : '-'}
                    </td>
                    <td className="p-3 text-xs text-slate-500 dark:text-slate-400">
                      {tipoLabel[e.tipo_encerramento] || e.tipo_encerramento || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 dark:bg-slate-800 border-t-2 border-slate-200 dark:border-slate-700">
                <tr>
                  <td colSpan={3} className="p-3 text-right font-semibold text-slate-900 dark:text-white">Total:</td>
                  <td className="p-3 text-right font-bold text-blue-600 text-base">
                    {formatarTempo(totalMinutos)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}