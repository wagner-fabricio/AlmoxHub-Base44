import React, { useState, useEffect } from 'react';
import { formatarTempo } from './TimeSheetButton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Radio, User, Clock, Building2, Users, Calendar, AlertCircle, Tag, FileText, BarChart2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const minutosDesde = (inicio) => {
  if (!inicio) return 0;
  return (Date.now() - new Date(inicio).getTime()) / 60000;
};

const prioridadeConfig = {
  baixa:   { label: 'Baixa',   color: 'bg-slate-100 text-slate-600' },
  media:   { label: 'Média',   color: 'bg-blue-100 text-blue-700' },
  alta:    { label: 'Alta',    color: 'bg-amber-100 text-amber-700' },
  urgente: { label: 'Urgente', color: 'bg-red-100 text-red-700' },
};

const statusConfig = {
  elaboracao: { label: 'Em Elaboração', color: 'bg-slate-100 text-slate-600' },
  execucao:   { label: 'Em Execução',   color: 'bg-blue-100 text-blue-700' },
  concluido:  { label: 'Concluído',     color: 'bg-green-100 text-green-700' },
  cancelado:  { label: 'Cancelado',     color: 'bg-red-100 text-red-700' },
};

export default function OSTimeSheetView({ osEmPlay, pessoas, categorias, almoxarifados, subcategorias, onClickOS }) {
  const [tick, setTick] = useState(0);

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

  // Todos os envolvidos de uma OS: líder + executores + quem tem sessão ativa
  const getEnvolvidos = (os) => {
    const ids = new Set();
    if (os.lider_id) ids.add(os.lider_id);
    (os.executores_ids || []).forEach(id => ids.add(id));
    (os.timesheet_sessoes_ativas || []).forEach(s => ids.add(s.pessoa_id));
    return Array.from(ids).map(id => {
      const pessoa = (pessoas || []).find(p => p.id === id);
      const sessaoAtiva = (os.timesheet_sessoes_ativas || []).find(s => s.pessoa_id === id);
      return { id, nome: pessoa?.nome || 'Desconhecido', foto: pessoa?.foto_perfil, sessaoAtiva };
    });
  };

  // Contagem total de pessoas únicas trabalhando (com sessão ativa)
  const pessoasComSessao = new Set();
  osEmPlay.forEach(os => (os.timesheet_sessoes_ativas || []).forEach(s => pessoasComSessao.add(s.pessoa_id)));

  return (
    <div className="space-y-6">
      {/* Header ao vivo */}
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-xs font-semibold">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          AO VIVO
        </span>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {osEmPlay.length} OS ativa{osEmPlay.length !== 1 ? 's' : ''} · {pessoasComSessao.size} pessoa{pessoasComSessao.size !== 1 ? 's' : ''} em sessão
        </span>
      </div>

      {/* Cards das OS */}
      <div className="space-y-4">
        {osEmPlay.map(os => {
          const cat = categorias?.find(c => c.id === os.categoria_id);
          const almox = almoxarifados?.find(a => a.id === os.almoxarifado_id);
          const subcats = (subcategorias || []).filter(s => (os.subcategorias_ids || []).includes(s.id));
          const sessoes = os.timesheet_sessoes_ativas || [];
          const minutosCorrente = sessoes.length > 0
            ? Math.max(...sessoes.map(s => minutosDesde(s.inicio)))
            : 0;
          const totalMins = (os.timesheet_total_minutos || 0) + minutosCorrente;
          const envolvidos = getEnvolvidos(os);
          const prio = prioridadeConfig[os.prioridade];
          const stat = statusConfig[os.status];

          return (
            <div
              key={os.id}
              onClick={() => onClickOS?.(os)}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-amber-300 dark:hover:border-amber-600"
            >
              {/* Header do card */}
              <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-b border-amber-100 dark:border-amber-800/30">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse" />
                  <span className="font-mono text-sm font-semibold text-slate-700 dark:text-slate-300">{os.codigo}</span>
                  <span className="text-slate-400 dark:text-slate-500">·</span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{cat?.nome || 'OS'}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500 text-white rounded-full text-sm font-bold">
                  <Clock className="w-3.5 h-3.5" />
                  {formatarTempo(totalMins)}
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* Badges de status/prioridade/complexidade */}
                <div className="flex flex-wrap gap-2">
                  {stat && (
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${stat.color}`}>
                      {stat.label}
                    </span>
                  )}
                  {prio && (
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${prio.color}`}>
                      {prio.label}
                    </span>
                  )}
                  {os.complexidade && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                      <BarChart2 className="w-3 h-3 mr-1" />
                      {os.complexidade}
                    </span>
                  )}
                  {subcats.map(s => (
                    <span key={s.id} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                      <Tag className="w-3 h-3 mr-1" />
                      {s.nome}
                    </span>
                  ))}
                </div>

                {/* Descrição e anotações */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {os.descricao_resumida && (
                    <div className="bg-slate-50 dark:bg-slate-700/40 rounded-xl p-3">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                        <FileText className="w-3 h-3" /> Descrição
                      </p>
                      <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-3">{os.descricao_resumida}</p>
                    </div>
                  )}
                  {os.anotacoes && (
                    <div className="bg-slate-50 dark:bg-slate-700/40 rounded-xl p-3">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                        <FileText className="w-3 h-3" /> Anotações
                      </p>
                      <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-3">{os.anotacoes}</p>
                    </div>
                  )}
                </div>

                {/* Datas + Almoxarifado */}
                <div className="flex flex-wrap gap-4 text-xs text-slate-600 dark:text-slate-400">
                  {almox && (
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{almox.nome}</span>
                    </div>
                  )}
                  {os.data_inicial && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Início: {format(new Date(os.data_inicial + 'T12:00:00'), 'dd/MM/yyyy')}</span>
                    </div>
                  )}
                  {os.prazo && (
                    <div className="flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                      <span>Prazo: {format(new Date(os.prazo + 'T12:00:00'), 'dd/MM/yyyy')}</span>
                    </div>
                  )}
                </div>

                {/* Barra de progresso */}
                {os.progresso > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${os.progresso}%` }} />
                    </div>
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400 w-8 text-right">{os.progresso}%</span>
                  </div>
                )}

                {/* Todos os envolvidos */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <Users className="w-3 h-3" /> Equipe envolvida
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {envolvidos.map(({ id, nome, foto, sessaoAtiva }) => (
                      <div
                        key={id}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                          sessaoAtiva
                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 ring-1 ring-amber-400'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {foto ? (
                          <img src={foto} alt={nome} className="w-5 h-5 rounded-full object-cover" />
                        ) : (
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${sessaoAtiva ? 'bg-amber-500' : 'bg-slate-400'}`}>
                            {nome.charAt(0)}
                          </div>
                        )}
                        <span>{nome.split(' ')[0]}</span>
                        {sessaoAtiva && <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}