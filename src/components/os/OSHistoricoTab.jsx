import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ACTION_LABELS = {
  create: 'criou a OS',
  update: 'atualizou a OS',
  delete: 'excluiu',
  status_change: 'alterou o status',
  progress_update: 'atualizou o progresso',
  comment_add: 'adicionou comentário',
  attachment_add: 'adicionou anexo',
  item_add: 'adicionou item',
  item_update: 'atualizou item',
  item_delete: 'removeu item',
  separacao_update: 'atualizou separação',
  expedicao_add: 'adicionou expedição',
  expedicao_update: 'atualizou expedição'
};

const CAMPO_LABELS = {
  status: 'Status',
  status_separacao: 'Status de Separação',
  progresso: 'Progresso',
  prazo: 'Prazo',
  prioridade: 'Prioridade',
  lider_id: 'Líder',
  almoxarifado_id: 'Almoxarifado',
  categoria_id: 'Categoria',
  regional_id: 'Regional',
  data_inicial: 'Data Inicial',
  data_conclusao: 'Data de Conclusão',
  anotacoes: 'Anotações',
  descricao_resumida: 'Descrição',
  rotulos_ids: 'Rótulos'
};

export default function OSHistoricoTab({ loaded, auditLogs, auditPage, setAuditPage, pageSize, pessoas }) {
  return (
    <TabsContent value="historico" className="space-y-3">
      {!loaded ? (
        <div className="text-center py-12 text-slate-400">Clique na aba para carregar o histórico</div>
      ) : auditLogs.length > 0 ? (
        <div className="space-y-3">
          {auditLogs.length > pageSize && (
            <div className="flex items-center justify-between mb-2 px-1">
              <button onClick={() => setAuditPage(p => Math.max(1, p - 1))} disabled={auditPage === 1} className="text-xs text-blue-600 disabled:text-slate-300 hover:underline">← Anteriores</button>
              <span className="text-xs text-slate-500">{auditPage}/{Math.ceil(auditLogs.length / pageSize)}</span>
              <button onClick={() => setAuditPage(p => Math.min(Math.ceil(auditLogs.length / pageSize), p + 1))} disabled={auditPage >= Math.ceil(auditLogs.length / pageSize)} className="text-xs text-blue-600 disabled:text-slate-300 hover:underline">Próximos →</button>
            </div>
          )}
          {auditLogs.slice((auditPage - 1) * pageSize, auditPage * pageSize).map((log, idx) => {
            const logUser = log.user_id ? (Array.isArray(pessoas) ? pessoas.find(p => p?.user_id === log.user_id) : null) : null;
            const actionLabel = ACTION_LABELS[log.action] || log.action;
            let details = null;
            try { details = log.details ? JSON.parse(log.details) : null; } catch (e) { details = log.details; }

            return (
              <div key={log.id || idx} className="flex gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 items-start">
                <div className="w-9 h-9 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  {logUser?.foto_perfil ? (
                    <img src={logUser.foto_perfil} alt={logUser.nome} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      {logUser?.nome?.charAt(0) || log.created_by?.charAt(0) || '?'}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap mb-1">
                    <span className="font-medium text-slate-900 dark:text-white">{logUser?.nome || log.created_by || 'Usuário'}</span>
                    <span className="text-sm text-slate-600 dark:text-slate-400">{actionLabel}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {format(new Date(log.timestamp || log.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  {details && typeof details === 'object' && details.campo && (
                    <div className="mt-2">
                      <div className="text-sm">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{CAMPO_LABELS[details.campo] || details.campo}:</span>
                        {details.valor_anterior !== undefined && details.valor_novo !== undefined && (
                          <div className="mt-1 flex items-center gap-2 text-xs flex-wrap">
                            {details.valor_anterior !== null && details.valor_anterior !== '' && (
                              <>
                                <span className="px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded line-through">
                                  {String(details.valor_anterior)}
                                </span>
                                <span className="text-slate-400">→</span>
                              </>
                            )}
                            <span className="px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded font-medium">
                              {String(details.valor_novo)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {details && typeof details === 'string' && (
                    <div className="mt-2 text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 px-3 py-2 rounded-lg">
                      {details}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-start pt-12 pb-8 text-slate-400">
          <Clock className="w-12 h-12 mb-3 opacity-50" />
          <p>Nenhuma alteração registrada</p>
        </div>
      )}
    </TabsContent>
  );
}