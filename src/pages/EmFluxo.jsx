import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ClipboardList, 
  FolderKanban, 
  MessageSquare, 
  ChevronRight,
  X,
  Clock,
  CheckCircle,
  Loader2,
  AlertTriangle,
  User,
  MapPin,
  Plus,
  Filter,
  UserCircle,
  BarChart3,
  Bell,
  Trash2,
  CheckCheck
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import OSMobileDetail from '@/components/os/OSMobileDetail';
import ChatMobileSimple from '@/components/mensagens/ChatMobileSimple';
import NovaConversaModal from '@/components/mensagens/NovaConversaModal';
import ProjetoMobileDetail from '@/components/projetos/ProjetoMobileDetail';
import OSFormModal from '@/components/os/OSFormModal';
import EmFluxoInsights from '@/components/emfluxo/EmFluxoInsights';
import MeuDesempenhoMobile from '@/components/emfluxo/MeuDesempenhoMobile';
import TouchGestures from '@/components/emfluxo/TouchGestures';
import TimeSheetButton from '@/components/timesheet/TimeSheetButton';

const statusConfig = {
  elaboracao: { icon: Clock, color: 'bg-slate-500', label: 'Em Elaboração' },
  execucao: { icon: Loader2, color: 'bg-blue-500', label: 'Em Execução' },
  concluido: { icon: CheckCircle, color: 'bg-green-500', label: 'Concluído' },
  cancelado: { icon: AlertTriangle, color: 'bg-red-500', label: 'Cancelado' },
};

const prioridadeConfig = {
  baixa: { color: 'bg-slate-400', label: 'Baixa' },
  media: { color: 'bg-blue-400', label: 'Média' },
  alta: { color: 'bg-orange-400', label: 'Alta' },
  urgente: { color: 'bg-red-500', label: 'Urgente' },
};

export default function EmFluxo() {
  const [loading, setLoading] = useState(true);
  const [activeModule, setActiveModule] = useState(null);
  const [ordens, setOrdens] = useState([]);
  const [projetos, setProjetos] = useState([]);
  const [conversas, setConversas] = useState([]);
  const [pessoas, setPessoas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [regionais, setRegionais] = useState([]);
  const [almoxarifados, setAlmoxarifados] = useState([]);
  const [instalacoes, setInstalacoes] = useState([]);
  const [currentPessoa, setCurrentPessoa] = useState(null);
  const [selectedOS, setSelectedOS] = useState(null);
  const [participantes, setParticipantes] = useState([]);
  const [selectedConversa, setSelectedConversa] = useState(null);
  const [showNovaConversa, setShowNovaConversa] = useState(false);
  const [selectedProjeto, setSelectedProjeto] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showOSForm, setShowOSForm] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showDesempenho, setShowDesempenho] = useState(false);
  const [todasOrdens, setTodasOrdens] = useState([]);
  const [notificacoes, setNotificacoes] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
      const [
        pessoasData,
        ordensData,
        projetosData,
        conversasData,
        categoriasData,
        subcategoriasData,
        regionaisData,
        almoxarifadosData,
        instalacoesData,
        participantesData,
        notificacoesData
      ] = await Promise.all([
        base44.entities.Pessoa.list(),
        base44.entities.OrdemServico.list(),
        base44.entities.Projeto.list(),
        base44.entities.Conversa.list(),
        base44.entities.Categoria.list(),
        base44.entities.Subcategoria.list(),
        base44.entities.Regional.list(),
        base44.entities.Almoxarifado.list(),
        base44.entities.Instalacao.list(),
        base44.entities.ParticipanteConversa.list(),
        base44.entities.Notificacao.list(),
      ]);

      setTodasOrdens(ordensData || []);

      setPessoas(pessoasData || []);
      const pessoa = (pessoasData || []).find(p => p.email === user.email);
      setCurrentPessoa(pessoa);

      // Filtrar notificações do usuário
      const minhasNotificacoes = (notificacoesData || [])
        .filter(n => n.destinatario_id === pessoa?.id)
        .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      setNotificacoes(minhasNotificacoes);

      // Filtrar apenas OS onde o usuário é líder ou executor
      const minhasOrdens = (ordensData || []).filter(os => 
        os.lider_id === pessoa?.id || (os.executores_ids || []).includes(pessoa?.id)
      );
      setOrdens(minhasOrdens);
      setProjetos(projetosData || []);
      
      // Filtrar conversas onde o usuário participa
      const minhasConversas = (conversasData || []).filter(conv => {
        const participaConversa = (participantesData || []).some(p => 
          p && p.conversa_id === conv.id && p.pessoa_id === pessoa?.id
        );
        return participaConversa;
      });
      setConversas(minhasConversas);
      setParticipantes(participantesData || []);
      
      setCategorias(categoriasData || []);
      setSubcategorias(subcategoriasData || []);
      setRegionais(regionaisData || []);
      setAlmoxarifados(almoxarifadosData || []);
      setInstalacoes(instalacoesData || []);

      // Verificar se há um os_id na URL para abrir automaticamente
      const urlParams = new URLSearchParams(window.location.search);
      const osIdParam = urlParams.get('os_id');
      if (osIdParam) {
        const osToOpen = minhasOrdens.find(os => os.id === osIdParam);
        if (osToOpen) {
          setSelectedOS(osToOpen);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar projetos do usuário
  const projetosFiltrados = useMemo(() => {
    if (!currentPessoa) return [];
    
    return (projetos || []).filter(projeto => {
      // Verifica se o usuário é líder ou está envolvido no projeto
      const estaNoTime = 
        projeto.lider_id === currentPessoa.id ||
        (projeto.outros_envolvidos_ids || []).includes(currentPessoa.id);
      
      if (estaNoTime) return true;
      
      // Verifica se há alguma OS do projeto onde o usuário está envolvido
      const temOSVinculada = (ordens || []).some(os => 
        (os.projetos_ids || []).includes(projeto.id) &&
        (os.lider_id === currentPessoa.id || (os.executores_ids || []).includes(currentPessoa.id))
      );
      
      return temOSVinculada;
    });
  }, [projetos, currentPessoa, ordens]);

  const modules = [
    {
      id: 'ordens',
      name: 'Ordens de Serviço',
      icon: ClipboardList,
      color: '#0000FF',
      bgColor: '#0000FF',
      count: (ordens || []).filter(os => os.status === 'elaboracao' || os.status === 'execucao').length
    },
    {
      id: 'projetos',
      name: 'Projetos',
      icon: FolderKanban,
      color: '#0A003C',
      bgColor: '#0A003C',
      count: (projetosFiltrados || []).length
    },
    {
      id: 'mensagens',
      name: 'Mensagens',
      icon: MessageSquare,
      color: '#A0B4D2',
      bgColor: '#A0B4D2',
      count: (conversas || []).length
    },
    {
      id: 'desempenho',
      name: 'Meu Desempenho',
      icon: BarChart3,
      color: '#10B981',
      bgColor: '#10B981',
      count: null
    },
    {
      id: 'notificacoes',
      name: 'Notificações',
      icon: Bell,
      color: '#F59E0B',
      bgColor: '#F59E0B',
      count: (notificacoes || []).filter(n => !n.lida).length
    }
  ] || [];

  const handleOpenModule = (moduleId) => {
    if (moduleId === 'desempenho') {
      setShowDesempenho(true);
    } else {
      setActiveModule(moduleId);
      setSelectedOS(null);
    }
  };

  const handleCloseModule = () => {
    setActiveModule(null);
    setSelectedOS(null);
  };

  const handleOpenOS = (os) => {
    setSelectedOS(os);
  };

  const handleCloseOS = () => {
    setSelectedOS(null);
  };

  const handleOpenConversa = (conversa) => {
    setSelectedConversa(conversa);
  };

  const handleCloseConversa = () => {
    setSelectedConversa(null);
  };

  const handleCloseProjeto = () => {
    setSelectedProjeto(null);
  };

  const handleMarcarTodasLidas = async () => {
    try {
      const naoLidas = notificacoes.filter(n => !n.lida);
      await Promise.all(
        naoLidas.map(n => base44.entities.Notificacao.update(n.id, { lida: true }))
      );
      await loadData();
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const handleExcluirNotificacao = async (notifId) => {
    try {
      await base44.entities.Notificacao.delete(notifId);
      setNotificacoes(notificacoes.filter(n => n.id !== notifId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleExcluirTodas = async () => {
    try {
      await Promise.all(
        notificacoes.map(n => base44.entities.Notificacao.delete(n.id))
      );
      setNotificacoes([]);
    } catch (error) {
      console.error('Error deleting all notifications:', error);
    }
  };

  const getNomeConversa = (conversa) => {
    if (conversa.tipo === 'grupo') {
      return conversa.nome_grupo;
    }
    
    const participantesConversa = (participantes || []).filter(p => p && p.conversa_id === conversa.id);
    const outroPessoa = (participantesConversa || []).find(p => p && p.pessoa_id !== currentPessoa?.id);
    if (outroPessoa) {
      const pessoa = (pessoas || []).find(p => p && p.id === outroPessoa.pessoa_id);
      return pessoa?.nome || 'Conversa';
    }
    return 'Conversa';
  };

  const getAvatarInfo = (conversa) => {
    if (conversa.tipo === 'grupo') {
      return {
        initials: conversa.nome_grupo?.substring(0, 2).toUpperCase() || 'G',
        url: conversa.avatar_grupo,
        isGroup: true
      };
    }
    
    const participantesConversa = (participantes || []).filter(p => p && p.conversa_id === conversa.id);
    const outroPessoa = (participantesConversa || []).find(p => p && p.pessoa_id !== currentPessoa?.id);
    if (outroPessoa) {
      const pessoa = (pessoas || []).find(p => p && p.id === outroPessoa.pessoa_id);
      return {
        initials: pessoa?.nome?.charAt(0) || 'U',
        url: pessoa?.foto_perfil,
        isGroup: false
      };
    }
    return { initials: 'U', url: null, isGroup: false };
  };

  const formatarData = (date) => {
    if (!date) return '';
    const now = new Date();
    const msgDate = new Date(date);
    
    if (msgDate.toDateString() === now.toDateString()) {
      return format(msgDate, 'HH:mm');
    }
    
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (msgDate.toDateString() === yesterday.toDateString()) {
      return 'Ontem';
    }
    
    return format(msgDate, 'dd/MM/yy');
  };

  const handleCriarConversa = async (tipo, participantesIds, nomeGrupo) => {
    try {
      // Verificar se já existe conversa privada
      if (tipo === 'privada') {
        for (const conv of (conversas || [])) {
          const participantesConv = (participantes || [])
            .filter(p => p && p.conversa_id === conv.id)
            .map(p => p && p.pessoa_id);
          if (participantesConv.includes(participantesIds[0]) && participantesConv.includes(currentPessoa?.id)) {
            setSelectedConversa(conv);
            setShowNovaConversa(false);
            return;
          }
        }
      }

      const novaConversa = await base44.entities.Conversa.create({
        tipo,
        nome_grupo: tipo === 'grupo' ? nomeGrupo : null,
        criador_id: currentPessoa.id
      });

      const todosParticipantes = [currentPessoa?.id, ...(participantesIds || [])].filter(id => id);
      await Promise.all((todosParticipantes || []).map((pessoaId, index) => 
        base44.entities.ParticipanteConversa.create({
          conversa_id: novaConversa.id,
          pessoa_id: pessoaId,
          permissao: index === 0 ? 'admin' : 'membro',
          status: 'ativo'
        })
      ));

      await loadData();
      setSelectedConversa(novaConversa);
      setShowNovaConversa(false);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader2 className="w-12 h-12 animate-spin" style={{ color: '#0000FF' }} />
      </div>
    );
  }

  // Vista de desempenho
  if (showDesempenho) {
    return (
      <MeuDesempenhoMobile
        onClose={() => setShowDesempenho(false)}
        minhasOS={ordens}
        todasOS={todasOrdens}
        pessoas={pessoas}
        categorias={categorias}
        almoxarifados={almoxarifados}
        regionais={regionais}
        currentPessoaId={currentPessoa?.id}
      />
    );
  }

  // Vista de módulos (home)
  if (!activeModule && !selectedOS) {
    return (
      <div className="min-h-screen px-4 py-3 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-3">
            <div className="flex items-center justify-between mb-1">
              <div className="flex-1" />
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">AlmoxHub</h1>
              <div className="flex-1 flex justify-end">
                <button
                  onClick={() => window.location.href = '/MeuPerfilMobile'}
                  className="w-9 h-9 rounded-full overflow-hidden border-2 border-white shadow-lg"
                >
                  {currentPessoa?.foto_perfil ? (
                    <img
                      src={currentPessoa.foto_perfil}
                      alt="Perfil"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#0000FF' }}>
                      <UserCircle className="w-5 h-5 text-white" />
                    </div>
                  )}
                </button>
              </div>
            </div>
            <p className="text-base text-slate-600 dark:text-slate-400">Olá, {currentPessoa?.nome?.split(' ')[0] || 'Usuário'}</p>
          </div>

          {/* Módulos Grid */}
          <div className="space-y-2.5 mt-3">
            {(modules || []).map((module) => {
              const Icon = module.icon;
              return (
                <button
                  key={module.id}
                  onClick={() => handleOpenModule(module.id)}
                  className="w-full rounded-2xl px-4 py-3 shadow-xl transform transition-all hover:scale-105 active:scale-95"
                  style={{ backgroundColor: module.color }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/90 dark:bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-md shrink-0">
                        <Icon className="w-6 h-6" style={{ color: module.color }} />
                      </div>
                      <div className="text-left">
                        <h3 className="text-base font-bold text-white leading-tight">{module.name}</h3>
                        {module.count !== null && <p className="text-white/90 text-xs">{module.count} itens</p>}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/90 shrink-0" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Vista de OS Detail
  if (selectedOS) {
    return (
      <OSMobileDetail
        os={selectedOS}
        onClose={handleCloseOS}
        pessoas={pessoas}
        categorias={categorias}
        subcategorias={subcategorias}
        regionais={regionais}
        almoxarifados={almoxarifados}
        instalacoes={instalacoes}
        onRefresh={loadData}
      />
    );
  }

  // Vista de Chat
  if (selectedConversa) {
    return (
      <ChatMobileSimple
        conversa={selectedConversa}
        onClose={handleCloseConversa}
        pessoas={pessoas}
        currentPessoaId={currentPessoa?.id}
        currentUserId={currentUser?.id}
        currentUserName={currentUser?.full_name}
        onRefresh={loadData}
      />
    );
  }

  // Vista de Projeto Detail
  if (selectedProjeto) {
    return (
      <ProjetoMobileDetail
        projeto={selectedProjeto}
        onClose={handleCloseProjeto}
        pessoas={pessoas}
        onRefresh={loadData}
        onOpenOS={(os) => {
          setSelectedProjeto(null);
          setSelectedOS(os);
        }}
      />
    );
  }

  // Vista de módulo expandido
  const activeModuleData = (modules || []).find(m => m.id === activeModule);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="p-4 sticky top-0 z-10 shadow-lg" style={{ backgroundColor: activeModuleData?.color }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCloseModule}
              className="text-white hover:bg-white/20 rounded-full"
            >
              <X className="w-6 h-6" />
            </Button>
            <h2 className="text-xl font-bold text-white">{activeModuleData?.name}</h2>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-4 pb-20">
        {activeModule === 'ordens' && (
          <div className="space-y-3">
            {/* Controles de Filtro */}
            <div className="flex gap-3">
              <div className="flex-1">
                <Button
                  onClick={() => {
                    const options = [
                      { value: 'all', label: 'Todas' },
                      { value: 'elaboracao', label: 'Em Elaboração' },
                      { value: 'execucao', label: 'Em Execução' },
                      { value: 'concluido', label: 'Concluído' },
                      { value: 'cancelado', label: 'Cancelado' }
                    ];
                    const currentIndex = options.findIndex(o => o.value === statusFilter);
                    const nextIndex = (currentIndex + 1) % options.length;
                    setStatusFilter(options[nextIndex].value);
                  }}
                  variant="outline"
                  className="w-full justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    <span>
                      {statusFilter === 'all' ? 'Todas' : 
                       statusFilter === 'elaboracao' ? 'Em Elaboração' :
                       statusFilter === 'execucao' ? 'Em Execução' :
                       statusFilter === 'concluido' ? 'Concluído' : 'Cancelado'}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {(ordens || []).filter(os => os && (statusFilter === 'all' || os.status === statusFilter)).length === 0 ? (
              <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                <ClipboardList className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Nenhuma ordem de serviço</p>
              </div>
            ) : (
              (ordens || []).filter(os => os && (statusFilter === 'all' || os.status === statusFilter)).map((os) => {
                const categoria = (categorias || []).find(c => c && c.id === os.categoria_id);
                const regional = (regionais || []).find(r => r && r.id === os.regional_id);
                const StatusIcon = statusConfig[os.status]?.icon || Clock;

                return (
                  <TouchGestures
                    key={os.id}
                    onSwipeRight={() => handleOpenOS(os)}
                    onLongPress={() => handleOpenOS(os)}
                  >
                    <div
                      className="w-full bg-white dark:bg-slate-800 rounded-2xl shadow-md border-l-4 text-left transition-all active:scale-95"
                      style={{ borderLeftColor: categoria?.cor || '#3b82f6' }}
                      onClick={() => handleOpenOS(os)}
                    >
                      <div className="relative">
                        {/* Botão TimeSheet — stopPropagation para não abrir a OS */}
                        {currentPessoa && (
                          <div
                            className="absolute top-3 right-3 z-10"
                            onClick={e => e.stopPropagation()}
                          >
                            <TimeSheetButton
                              os={os}
                              currentPessoa={currentPessoa}
                              onStateChange={(updatedOS) => setOrdens(prev => prev.map(o => o.id === updatedOS.id ? { ...o, ...updatedOS } : o))}
                              size="mobile"
                            />
                          </div>
                        )}

                        <div className="p-4 pr-16 cursor-pointer">
                          <div className="mb-3">
                            <p className="text-xs font-mono text-slate-500 dark:text-slate-400">{os.codigo}</p>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{categoria?.nome || 'OS'}</h3>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap mb-3">
                            <Badge className={`${statusConfig[os.status]?.color} text-white text-xs`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusConfig[os.status]?.label}
                            </Badge>
                            {regional && (
                              <Badge variant="outline" className="text-xs">
                                <MapPin className="w-3 h-3 mr-1" />
                                {regional.sigla}
                              </Badge>
                            )}
                          </div>

                          {os.descricao_resumida && (
                            <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{os.descricao_resumida}</p>
                          )}

                          <div className="mt-3 flex items-center justify-between gap-2">
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              Prazo: {os.prazo ? format(new Date(os.prazo), 'dd/MM/yyyy') : '-'}
                            </div>
                            <div className="flex items-center gap-1 text-xs">
                              <div className="bg-slate-200 dark:bg-slate-700 rounded-full h-2 w-14">
                                <div
                                  className="bg-blue-500 h-2 rounded-full"
                                  style={{ width: `${os.progresso || 0}%` }}
                                />
                              </div>
                              <span className="text-slate-600 dark:text-slate-300 font-medium">{os.progresso || 0}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TouchGestures>
                );
              })
            )}
          </div>
        )}

        {activeModule === 'projetos' && (
          <div className="space-y-3">
            {(projetosFiltrados || []).length === 0 ? (
              <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                <FolderKanban className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Nenhum projeto vinculado</p>
              </div>
            ) : (
              (projetosFiltrados || []).filter(p => p).map((projeto) => {
                const lider = (pessoas || []).find(p => p && p.id === projeto.lider_id);
                
                return (
                  <button
                    key={projeto.id}
                    onClick={() => setSelectedProjeto(projeto)}
                    className="w-full bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-md border-l-4 text-left transition-all active:scale-95"
                    style={{ borderLeftColor: projeto.cor || '#8b5cf6' }}
                  >
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{projeto.nome}</h3>
                    {projeto.descricao && (
                      <p className="text-sm text-slate-600 dark:text-slate-300 mb-2 line-clamp-2">{projeto.descricao}</p>
                    )}
                    {lider && (
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <User className="w-3 h-3" />
                        <span>Líder: {lider.nome}</span>
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        )}

        {activeModule === 'mensagens' && (
          <div className="space-y-3">
            <Button
              onClick={() => setShowNovaConversa(true)}
              className="w-full text-white py-6 rounded-2xl shadow-lg"
              style={{ backgroundColor: '#0000FF' }}
            >
              <MessageSquare className="w-5 h-5 mr-2" />
              Nova Mensagem
            </Button>

            {(conversas || []).length === 0 ? (
              <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Nenhuma conversa</p>
              </div>
            ) : (
              (conversas || []).filter(c => c).map((conversa) => {
                const avatar = getAvatarInfo(conversa);
                const participante = (participantes || []).find(p => 
                  p && p.conversa_id === conversa.id && p.pessoa_id === currentPessoa?.id
                );
                const naoLidas = participante?.mensagens_nao_lidas || 0;

                return (
                  <button
                    key={conversa.id}
                    onClick={() => handleOpenConversa(conversa)}
                    className="w-full bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-md text-left transition-all active:scale-95"
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="shrink-0">
                        {avatar.url ? (
                          <img
                            src={avatar.url}
                            alt={getNomeConversa(conversa)}
                            className="w-14 h-14 rounded-full object-cover"
                          />
                        ) : (
                          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                            avatar.isGroup ? 'bg-gradient-to-br from-purple-500 to-purple-600' : 'bg-gradient-to-br from-blue-500 to-blue-600'
                          }`}>
                            {avatar.initials}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                            {getNomeConversa(conversa)}
                          </h3>
                          {conversa.ultima_mensagem_data && (
                            <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">
                              {formatarData(conversa.ultima_mensagem_data)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-1 flex-1">
                            {conversa.ultima_mensagem_autor && conversa.tipo === 'grupo' && (
                              <span className="font-medium">{conversa.ultima_mensagem_autor}: </span>
                            )}
                            {conversa.ultima_mensagem || 'Sem mensagens'}
                          </p>
                          
                          {naoLidas > 0 && (
                            <div className="bg-green-500 text-white text-xs font-bold rounded-full min-w-[24px] h-6 flex items-center justify-center px-2 shrink-0">
                              {naoLidas > 99 ? '99+' : naoLidas}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}

        {activeModule === 'notificacoes' && (
          <div className="space-y-3">
            {/* Botões de Ação */}
            {notificacoes.length > 0 && (
              <div className="flex gap-2">
                <Button
                  onClick={handleMarcarTodasLidas}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  disabled={notificacoes.filter(n => !n.lida).length === 0}
                >
                  <CheckCheck className="w-4 h-4 mr-2" />
                  Marcar Todas como Lidas
                </Button>
                <Button
                  onClick={handleExcluirTodas}
                  variant="outline"
                  size="sm"
                  className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir Todas
                </Button>
              </div>
            )}

            {notificacoes.length === 0 ? (
              <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                <Bell className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Nenhuma notificação</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notificacoes.map((notif) => {
                  const remetente = pessoas.find(p => p.id === notif.remetente_id);
                  
                  return (
                    <div
                      key={notif.id}
                      className={`bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border-l-4 ${
                        notif.lida 
                          ? 'border-slate-300 dark:border-slate-600' 
                          : 'border-amber-500 bg-amber-50/50 dark:bg-amber-900/10'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className={`text-sm ${notif.lida ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white font-medium'}`}>
                              {notif.mensagem}
                            </p>
                            {!notif.lida && (
                              <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1" />
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            {remetente && (
                              <>
                                <span>{remetente.nome}</span>
                                <span>•</span>
                              </>
                            )}
                            <span>{format(new Date(notif.created_date), 'dd/MM/yyyy HH:mm')}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleExcluirNotificacao(notif.id)}
                          className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-slate-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Nova Conversa */}
      <NovaConversaModal
        open={showNovaConversa}
        onClose={() => setShowNovaConversa(false)}
        pessoas={pessoas}
        currentPessoaId={currentPessoa?.id}
        onCriar={handleCriarConversa}
      />

      {/* Modal Criar OS */}
      {showOSForm && (
        <OSFormModal
          open={showOSForm}
          onClose={() => setShowOSForm(false)}
          onSave={async () => {
            await loadData();
            setShowOSForm(false);
          }}
          pessoas={pessoas || []}
          categorias={categorias || []}
          subcategorias={subcategorias || []}
          regionais={regionais || []}
          almoxarifados={almoxarifados || []}
          instalacoes={instalacoes || []}
          projetos={projetos || []}
        />
      )}
    </div>
  );
}