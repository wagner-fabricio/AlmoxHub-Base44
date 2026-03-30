import React, { useState, useEffect } from 'react';
import { formatarTempo } from './TimeSheetButton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Radio, Clock, Building2, Users, Calendar, AlertCircle, Tag, FileText, BarChart2, Play } from 'lucide-react';

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

  const pessoasComSessao = new Set();
  osEmPlay.forEach(os => (os.timesheet_sessoes_ativas || []).forEach(s => pessoasComSessao.add(s.pessoa_id)));

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

  // Horário de início mais antigo das sessões ativas (quando o play foi dado)
  const getInicioPlay = (os) => {
    const sessoes = os.timesheet_sessoes_ativas || [];
    if (!sessoes.length) return null;
    const datas = sessoes.map(s => new Date(s.inicio)).filter(d => !isNaN(d));
    if (!datas.length) return null;
    return new Date(Math.min(...datas.map(d => d.getTime())));
  };

  return (
    <div className="space-y-4">
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

      {/* Lista de OS */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-700 overflow-hidden">
        {osEmPlay.map(os => {
          const cat = categorias?.find(c => c.id === os.categoria_id);
          const almox = almoxarifados?.find(a => a.id === os.almoxarifado_id);
          const subcats = (subcategorias || []).filter(s => (os.subcategorias_ids || []).includes(s.id));
          const sessoes = os.timesheet_sessoes_ativas || [];
          const minutosCorrente = sessoes.length > 0 ? Math.max(...sessoes.map(s => minutosDesde(s.inicio))) : 0;
          const totalMins = (os.timesheet_total_minutos || 0) + minutosCorrente;
          const envolvidos = getEnvolvidos(os);
          const prio = prioridadeConfig[os.prioridade];
          const stat = statusConfig[os.status];
          const inicioPlay = getInicioPlay(os);

          return (
            <div
              key={os.id}
              onClick={() => onClickOS?.(os)}
              className="flex flex-col md:flex-row md:items-start gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer transition-colors"
            >
              {/* Coluna esquerda: código + tempo */}
              <div className="flex items-start gap-3 min-w-0 md:w-56 shrink-0">
                <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse mt-1.5 shrink-0" />
                <div className="min-w-0">
                  <p className="font-mono text-xs text-slate-500 dark:text-slate-400">{os.codigo}</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{cat?.nome || 'OS'}</p>
                  <div className="flex items-center gap-1 mt-1 text-amber-600 dark:text-amber-400 font-bold text-sm">
                    <Clock className="w-3.5 h-3.5" />
                    {formatarTempo(totalMins)}
                  </div>
                  {inicioPlay && (
                    <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      <Play className="w-3 h-3" />
                      {format(inicioPlay, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </div>
                  )}
                </div>
              </div>

              {/* Coluna central: detalhes */}
              <div className="flex-1 min-w-0 space-y-2">
                {/* Badges */}
                <div className="flex flex-wrap gap-1.5">
                  {stat && (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${stat.color}`}>{stat.label}</span>
                  )}
                  {prio && (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${prio.color}`}>{prio.label}</span>
                  )}
                  {os.complexidade && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                      <BarChart2 className="w-3 h-3" />{os.complexidade}
                    </span>
                  )}
                  {subcats.map(s => (
                    <span key={s.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                      <Tag className="w-3 h-3" />{s.nome}
                    </span>
                  ))}
                </div>

                {/* Descrição */}
                {os.descricao_resumida && (
                  <p className="text-sm text-slate-700 dark:text-slate-300 flex gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{os.descricao_resumida}</span>
                  </p>
                )}

                {/* Anotações */}
                {os.anotacoes && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex gap-1.5 italic">
                    <FileText className="w-3 h-3 shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{os.anotacoes}</span>
                  </p>
                )}

                {/* Meta info: almoxarifado, datas, progresso */}
                <div className="flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
                  {almox && (
                    <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{almox.nome}</span>
                  )}
                  {os.data_inicial && (
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Início: {format(new Date(os.data_inicial + 'T12:00:00'), 'dd/MM/yyyy')}</span>
                  )}
                  {os.prazo && (
                    <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3" />Prazo: {format(new Date(os.prazo + 'T12:00:00'), 'dd/MM/yyyy')}</span>
                  )}
                  {os.progresso > 0 && (
                    <span className="flex items-center gap-1.5">
                      <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${os.progresso}%` }} />
                      </div>
                      {os.progresso}%
                    </span>
                  )}
                </div>
              </div>

              {/* Coluna direita: equipe */}
              <div className="shrink-0">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                  <Users className="w-3 h-3" /> Equipe
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {envolvidos.map(({ id, nome, foto, sessaoAtiva }) => (
                    <div
                      key={id}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
                        sessaoAtiva
                          ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 ring-1 ring-amber-400'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {foto ? (
                        <img src={foto} alt={nome} className="w-4 h-4 rounded-full object-cover" />
                      ) : (
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] font-bold ${sessaoAtiva ? 'bg-amber-500' : 'bg-slate-400'}`}>
                          {nome.charAt(0)}
                        </div>
                      )}
                      {nome.split(' ')[0]}
                      {sessaoAtiva && <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}