import React, { useState, useEffect } from 'react';
import { formatarTempo } from './TimeSheetButton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Radio, Clock, Building2, Users, Calendar, AlertCircle, Tag, FileText, BarChart2, Play, ChevronDown, ChevronRight, Square, Loader2 } from 'lucide-react';
import ColaboradoresDisponiveis from './ColaboradoresDisponiveis';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const minutosDesde = (inicio) => {
  if (!inicio) return 0;
  return (Date.now() - new Date(inicio).getTime()) / 60000;
};

const prioridadeConfig = {
  baixa:   { label: 'Baixa',   color: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' },
  media:   { label: 'Média',   color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  alta:    { label: 'Alta',    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  urgente: { label: 'Urgente', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
};

const statusConfig = {
  elaboracao: { label: 'Em Elaboração', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  execucao:   { label: 'Em Execução',   color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  concluido:  { label: 'Concluído',     color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  cancelado:  { label: 'Cancelado',     color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
};

export default function OSTimeSheetView({ osEmPlay, pessoas, categorias, almoxarifados, subcategorias, regionais, filters, onClickOS, currentUser, onPauseAll }) {
  const [tick, setTick] = useState(0);
  const [expandedPessoas, setExpandedPessoas] = useState({});
  const [pausingAll, setPausingAll] = useState(false);

  const handlePauseAll = async () => {
    setPausingAll(true);
    try {
      const res = await base44.functions.invoke('pauseAllTimeSheets', {});
      const total = res?.data?.total_os_pausadas || 0;
      toast.success(total > 0 ? `${total} OS pausada${total !== 1 ? 's' : ''}` : 'Nenhuma OS em sessão');
      onPauseAll?.();
    } catch (e) {
      toast.error('Erro ao pausar', { description: e.message });
    } finally {
      setPausingAll(false);
    }
  };

  const isAdmin = currentUser?.role === 'admin';

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

  // Apenas colaboradores com sessão ativa
  const getEnvolvidos = (os) => {
    return (os.timesheet_sessoes_ativas || []).map(sessaoAtiva => {
      const p = (pessoas || []).find(x => x.id === sessaoAtiva.pessoa_id);
      return { id: sessaoAtiva.pessoa_id, nome: p?.nome || 'Desconhecido', foto: p?.foto_perfil, sessaoAtiva };
    });
  };

  // Horário de início mais antigo das sessões ativas
  const getInicioPlay = (os) => {
    const sessoes = os.timesheet_sessoes_ativas || [];
    if (!sessoes.length) return null;
    const datas = sessoes.map(s => new Date(s.inicio)).filter(d => !isNaN(d));
    return datas.length ? new Date(Math.min(...datas.map(d => d.getTime()))) : null;
  };

  // Agrupamento por pessoa (todos os envolvidos)
  const porPessoa = {};
  for (const os of osEmPlay) {
    const envolvidos = getEnvolvidos(os);
    for (const env of envolvidos) {
      if (!porPessoa[env.id]) {
        porPessoa[env.id] = { nome: env.nome, foto: env.foto, temSessaoAtiva: false, osList: [] };
      }
      if (env.sessaoAtiva) porPessoa[env.id].temSessaoAtiva = true;
      porPessoa[env.id].osList.push(os);
    }
  }

  // Pessoas em sessão: apenas quem tem sessão ativa de fato
  const pessoasComSessao = new Set();
  osEmPlay.forEach(os => {
    (os.timesheet_sessoes_ativas || []).forEach(s => pessoasComSessao.add(s.pessoa_id));
  });

  const togglePessoa = (id) => setExpandedPessoas(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="space-y-6">
      {/* Badge ao vivo */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-xs font-semibold">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            AO VIVO
          </span>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {osEmPlay.length} OS ativa{osEmPlay.length !== 1 ? 's' : ''} · {pessoasComSessao.size} pessoa{pessoasComSessao.size !== 1 ? 's' : ''} em sessão
          </span>
        </div>
        {isAdmin && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                disabled={pausingAll || osEmPlay.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
                title="Pausar todas as OS em sessão"
              >
                {pausingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Square className="w-3.5 h-3.5" />}
                Parar Tudo
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Pausar todas as OS em sessão?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação irá pausar {osEmPlay.length} OS ativa{osEmPlay.length !== 1 ? 's' : ''} e encerrar todas as sessões de TimeSheet em andamento. Os colaboradores poderão retomar manualmente depois.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handlePauseAll} className="bg-red-600 hover:bg-red-700">
                  Sim, parar tudo
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* ── TABELA DE OS ── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white text-base">OS em Andamento</h3>
          <span className="px-2.5 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 text-xs font-semibold rounded-full">{osEmPlay.length} OS</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300">
                <th className="px-3 py-2.5 font-semibold border-b border-slate-200 dark:border-slate-600 text-left w-32">Código</th>
                <th className="px-3 py-2.5 font-semibold border-b border-slate-200 dark:border-slate-600 text-left w-28">Status</th>
                <th className="px-3 py-2.5 font-semibold border-b border-slate-200 dark:border-slate-600 text-left w-28">Prioridade</th>
                <th className="px-3 py-2.5 font-semibold border-b border-slate-200 dark:border-slate-600 text-left w-32">Categoria</th>
                <th className="px-3 py-2.5 font-semibold border-b border-slate-200 dark:border-slate-600 text-left">Subcategoria</th>
                <th className="px-3 py-2.5 font-semibold border-b border-slate-200 dark:border-slate-600 text-left">Descrição</th>
                <th className="px-3 py-2.5 font-semibold border-b border-slate-200 dark:border-slate-600 text-left w-24 hidden md:table-cell">Almoxarifado</th>
                <th className="px-3 py-2.5 font-semibold border-b border-slate-200 dark:border-slate-600 text-center w-28">Início Prazo</th>
                <th className="px-3 py-2.5 font-semibold border-b border-slate-200 dark:border-slate-600 text-center w-28">Prazo</th>
                <th className="px-3 py-2.5 font-semibold border-b border-slate-200 dark:border-slate-600 text-center w-36">Play em</th>
                <th className="px-3 py-2.5 font-semibold border-b border-slate-200 dark:border-slate-600 text-right w-24">Tempo Total</th>
              </tr>
            </thead>
            <tbody>
              {osEmPlay.map((os, idx) => {
                const cat = categorias?.find(c => c.id === os.categoria_id);
                const almox = almoxarifados?.find(a => a.id === os.almoxarifado_id);
                const subcats = (subcategorias || []).filter(s => (os.subcategorias_ids || []).includes(s.id));
                const sessoes = os.timesheet_sessoes_ativas || [];
                const minutosCorrente = sessoes.length > 0 ? Math.max(...sessoes.map(s => minutosDesde(s.inicio))) : 0;
                const totalMins = (os.timesheet_total_minutos || 0) + minutosCorrente;
                const inicioPlay = getInicioPlay(os);
                const stat = statusConfig[os.status];
                const prio = prioridadeConfig[os.prioridade];

                return (
                  <tr
                    key={os.id}
                    onClick={() => onClickOS?.(os)}
                    className={`border-b border-slate-100 dark:border-slate-700/50 cursor-pointer hover:bg-amber-50/40 dark:hover:bg-amber-900/10 transition-colors ${idx % 2 !== 0 ? 'bg-slate-50/40 dark:bg-slate-700/20' : ''}`}
                  >
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse shrink-0" />
                        <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">{os.codigo}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {stat && <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${stat.color}`}>{stat.label}</span>}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {prio && <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${prio.color}`}>{prio.label}</span>}
                    </td>
                    <td className="px-3 py-2.5 text-slate-700 dark:text-slate-300 whitespace-nowrap">{cat?.nome || '—'}</td>
                    <td className="px-3 py-2.5 max-w-[140px] truncate text-slate-600 dark:text-slate-400" title={subcats.map(s => s.nome).join(', ')}>
                      {subcats.length ? subcats.map(s => s.nome).join(', ') : '—'}
                    </td>
                    <td className="px-3 py-2.5 max-w-[200px] truncate text-slate-600 dark:text-slate-400" title={os.descricao_resumida}>
                      {os.descricao_resumida || '—'}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400 hidden md:table-cell whitespace-nowrap">{almox?.nome || '—'}</td>
                    <td className="px-3 py-2.5 text-center text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {os.data_inicial ? format(new Date(os.data_inicial + 'T12:00:00'), 'dd/MM/yyyy') : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-center text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {os.prazo ? format(new Date(os.prazo + 'T12:00:00'), 'dd/MM/yyyy') : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-center whitespace-nowrap text-slate-600 dark:text-slate-400">
                      {inicioPlay ? format(inicioPlay, "dd/MM 'às' HH:mm", { locale: ptBR }) : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-right font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                      {formatarTempo(totalMins)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── AGRUPAMENTO POR PESSOA ── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-500" /> Por Colaborador
          </h3>
          <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-full">
            {Object.keys(porPessoa).length} envolvidos
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            {/* Cabeçalho idêntico ao da tabela "OS em Andamento" */}
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300">
                <th className="px-3 py-2.5 font-semibold border-b border-slate-200 dark:border-slate-600 text-left w-32">Código</th>
                <th className="px-3 py-2.5 font-semibold border-b border-slate-200 dark:border-slate-600 text-left w-28">Status</th>
                <th className="px-3 py-2.5 font-semibold border-b border-slate-200 dark:border-slate-600 text-left w-28">Prioridade</th>
                <th className="px-3 py-2.5 font-semibold border-b border-slate-200 dark:border-slate-600 text-left w-32">Categoria</th>
                <th className="px-3 py-2.5 font-semibold border-b border-slate-200 dark:border-slate-600 text-left">Subcategoria</th>
                <th className="px-3 py-2.5 font-semibold border-b border-slate-200 dark:border-slate-600 text-left">Descrição</th>
                <th className="px-3 py-2.5 font-semibold border-b border-slate-200 dark:border-slate-600 text-left w-24 hidden md:table-cell">Almoxarifado</th>
                <th className="px-3 py-2.5 font-semibold border-b border-slate-200 dark:border-slate-600 text-center w-36">Play em</th>
                <th className="px-3 py-2.5 font-semibold border-b border-slate-200 dark:border-slate-600 text-right w-24">Tempo Total</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(porPessoa)
                .sort(([, a], [, b]) => (b.temSessaoAtiva ? 1 : 0) - (a.temSessaoAtiva ? 1 : 0))
                .map(([pessoaId, dados]) => {
                  const isExpanded = expandedPessoas[pessoaId] !== false;
                  return (
                    <React.Fragment key={pessoaId}>
                      {/* Linha cabeçalho da pessoa */}
                      <tr
                        className="bg-slate-100/70 dark:bg-slate-700/50 cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-700/80 transition-colors"
                        onClick={() => togglePessoa(pessoaId)}
                      >
                        <td colSpan={9} className="px-5 py-2.5">
                          <div className="flex items-center gap-3">
                            {isExpanded
                              ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                              : <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                            }
                            {dados.foto ? (
                              <img src={dados.foto} alt={dados.nome} className="w-7 h-7 rounded-full object-cover shrink-0" />
                            ) : (
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${dados.temSessaoAtiva ? 'bg-amber-500' : 'bg-slate-400'}`}>
                                {dados.nome.charAt(0)}
                              </div>
                            )}
                            <span className="font-semibold text-sm text-slate-900 dark:text-white">{dados.nome}</span>
                            {dados.temSessaoAtiva && (
                              <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-xs font-medium">
                                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                                em sessão
                              </span>
                            )}
                            <span className="text-xs text-slate-400">{dados.osList.length} OS</span>
                          </div>
                        </td>
                      </tr>

                      {/* Linhas de OS da pessoa */}
                      {isExpanded && dados.osList.map((os, idx) => {
                        const cat = categorias?.find(c => c.id === os.categoria_id);
                        const almox = almoxarifados?.find(a => a.id === os.almoxarifado_id);
                        const subcats = (subcategorias || []).filter(s => (os.subcategorias_ids || []).includes(s.id));
                        const sessoes = os.timesheet_sessoes_ativas || [];
                        const sessaoMinha = sessoes.find(s => s.pessoa_id === pessoaId);
                        const minutosCorrente = sessaoMinha ? minutosDesde(sessaoMinha.inicio) : 0;
                        const totalMins = (os.timesheet_total_minutos || 0) + minutosCorrente;
                        const stat = statusConfig[os.status];
                        const prio = prioridadeConfig[os.prioridade];
                        const inicioPlay = sessaoMinha ? new Date(sessaoMinha.inicio) : null;

                        return (
                          <tr
                            key={os.id}
                            onClick={() => onClickOS?.(os)}
                            className={`border-b border-slate-100 dark:border-slate-700/40 cursor-pointer hover:bg-amber-50/40 dark:hover:bg-amber-900/10 transition-colors ${idx % 2 !== 0 ? 'bg-slate-50/40 dark:bg-slate-700/20' : ''}`}
                          >
                            <td className="pl-16 pr-3 py-2.5 whitespace-nowrap">
                              <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">{os.codigo}</span>
                            </td>
                            <td className="px-3 py-2.5 whitespace-nowrap">
                              {stat && <span className={`inline-block px-2 py-0.5 rounded-full font-medium ${stat.color}`}>{stat.label}</span>}
                            </td>
                            <td className="px-3 py-2.5 whitespace-nowrap">
                              {prio && <span className={`inline-block px-2 py-0.5 rounded-full font-medium ${prio.color}`}>{prio.label}</span>}
                            </td>
                            <td className="px-3 py-2.5 text-slate-700 dark:text-slate-300 whitespace-nowrap">{cat?.nome || '—'}</td>
                            <td className="px-3 py-2.5 max-w-[140px] truncate text-slate-600 dark:text-slate-400" title={subcats.map(s => s.nome).join(', ')}>
                              {subcats.length ? subcats.map(s => s.nome).join(', ') : '—'}
                            </td>
                            <td className="px-3 py-2.5 max-w-[200px] truncate text-slate-600 dark:text-slate-400" title={os.descricao_resumida}>
                              {os.descricao_resumida || '—'}
                            </td>
                            <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400 hidden md:table-cell whitespace-nowrap">{almox?.nome || '—'}</td>
                            <td className="px-3 py-2.5 text-center whitespace-nowrap text-slate-500 dark:text-slate-400">
                              {inicioPlay ? format(inicioPlay, "dd/MM 'às' HH:mm", { locale: ptBR }) : '—'}
                            </td>
                            <td className="px-3 py-2.5 text-right font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap pr-5">
                              {formatarTempo(totalMins)}
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
      {/* ── COLABORADORES DISPONÍVEIS ── */}
      <ColaboradoresDisponiveis
        pessoas={pessoas}
        regionais={regionais}
        almoxarifados={almoxarifados}
        pessoasEmSessao={pessoasComSessao}
        filters={filters}
      />
    </div>
  );
}