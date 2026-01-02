import React, { useState, useEffect } from 'react';
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
  Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import OSMobileDetail from '@/components/os/OSMobileDetail';
import ChatMobileSimple from '@/components/mensagens/ChatMobileSimple';
import NovaConversaModal from '@/components/mensagens/NovaConversaModal';
import ProjetoMobileDetail from '@/components/projetos/ProjetoMobileDetail';
import OSFormModal from '@/components/os/OSFormModal';

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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();
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
        participantesData
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
      ]);

      setPessoas(pessoasData || []);
      const pessoa = (pessoasData || []).find(p => p.email === user.email);
      setCurrentPessoa(pessoa);

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
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const modules = [
    {
      id: 'ordens',
      name: 'Ordens de Serviço',
      icon: ClipboardList,
      color: '#0000FF',
      bgColor: '#0000FF',
      count: (ordens || []).length
    },
    {
      id: 'projetos',
      name: 'Projetos',
      icon: FolderKanban,
      color: '#0A003C',
      bgColor: '#0A003C',
      count: (projetos || []).length
    },
    {
      id: 'mensagens',
      name: 'Mensagens',
      icon: MessageSquare,
      color: '#A0B4D2',
      bgColor: '#A0B4D2',
      count: (conversas || []).length
    }
  ] || [];

  const handleOpenModule = (moduleId) => {
    setActiveModule(moduleId);
    setSelectedOS(null);
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
            .map(p => p.pessoa_id);
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

      const todosParticipantes = [currentPessoa.id, ...(participantesIds || [])];
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

  // Vista de módulos (home)
  if (!activeModule && !selectedOS) {
    return (
      <div className="min-h-screen p-6 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">AlmoxHub - Atividades em Fluxo</h1>
            <p className="text-slate-600 dark:text-slate-400">Olá, {currentPessoa?.nome?.split(' ')[0] || 'Usuário'}</p>
          </div>

          {/* Módulos Grid */}
          <div className="space-y-4">
            {(modules || []).map((module) => {
              const Icon = module.icon;
              return (
                <button
                  key={module.id}
                  onClick={() => handleOpenModule(module.id)}
                  className="w-full rounded-3xl p-6 shadow-2xl transform transition-all hover:scale-105 active:scale-95"
                  style={{ backgroundColor: module.color }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-white/90 dark:bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-md">
                        <Icon className="w-8 h-8" style={{ color: module.color }} />
                      </div>
                      <div className="text-left">
                        <h3 className="text-xl font-bold text-white">{module.name}</h3>
                        <p className="text-white/90 text-sm">{module.count} itens</p>
                      </div>
                    </div>
                    <ChevronRight className="w-6 h-6 text-white/90" />
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
      />
    );
  }

  // Vista de módulo expandido
  const activeModuleData = (modules || []).find(m => m.id === activeModule);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF5F0' }}>
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
            {/* Controles de Filtro e Criar */}
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
              <Button
                onClick={() => setShowOSForm(true)}
                size="icon"
                className="shrink-0"
                style={{ backgroundColor: '#0000FF' }}
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>

            {(ordens || []).filter(os => statusFilter === 'all' || os.status === statusFilter).length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <ClipboardList className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Nenhuma ordem de serviço</p>
              </div>
            ) : (
              (ordens || []).filter(os => statusFilter === 'all' || os.status === statusFilter).map((os) => {
                const categoria = (categorias || []).find(c => c && c.id === os.categoria_id);
                const regional = (regionais || []).find(r => r && r.id === os.regional_id);
                const StatusIcon = statusConfig[os.status]?.icon || Clock;

                return (
                  <button
                    key={os.id}
                    onClick={() => handleOpenOS(os)}
                    className="w-full bg-white rounded-2xl p-4 shadow-md border-l-4 text-left transition-all active:scale-95"
                    style={{ borderLeftColor: categoria?.cor || '#3b82f6' }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-xs font-mono text-slate-500">{os.codigo}</p>
                        <h3 className="text-lg font-bold text-slate-900">{categoria?.nome || 'OS'}</h3>
                      </div>
                      <div className={`w-10 h-10 ${prioridadeConfig[os.prioridade]?.color} rounded-xl flex items-center justify-center`}>
                        <span className="text-white text-xs font-bold">
                          {os.prioridade === 'urgente' ? '!!' : os.prioridade === 'alta' ? '!' : ''}
                        </span>
                      </div>
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
                      <p className="text-sm text-slate-600 line-clamp-2">{os.descricao_resumida}</p>
                    )}

                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-xs text-slate-500">
                        Prazo: {os.prazo ? format(new Date(os.prazo), 'dd/MM/yyyy') : '-'}
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <div className="w-full bg-slate-200 rounded-full h-2 w-16">
                          <div 
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${os.progresso || 0}%` }}
                          />
                        </div>
                        <span className="text-slate-600 font-medium">{os.progresso || 0}%</span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}

        {activeModule === 'projetos' && (
          <div className="space-y-3">
            {(projetos || []).length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <FolderKanban className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Nenhum projeto</p>
              </div>
            ) : (
              (projetos || []).map((projeto) => {
                const lider = (pessoas || []).find(p => p && p.id === projeto.lider_id);
                
                return (
                  <button
                    key={projeto.id}
                    onClick={() => setSelectedProjeto(projeto)}
                    className="w-full bg-white rounded-2xl p-4 shadow-md border-l-4 text-left transition-all active:scale-95"
                    style={{ borderLeftColor: projeto.cor || '#8b5cf6' }}
                  >
                    <h3 className="text-lg font-bold text-slate-900 mb-1">{projeto.nome}</h3>
                    {projeto.descricao && (
                      <p className="text-sm text-slate-600 mb-2 line-clamp-2">{projeto.descricao}</p>
                    )}
                    {lider && (
                      <div className="flex items-center gap-2 text-xs text-slate-500">
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
              <div className="text-center py-12 text-slate-500">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Nenhuma conversa</p>
              </div>
            ) : (
              (conversas || []).map((conversa) => {
                const avatar = getAvatarInfo(conversa);
                const participante = (participantes || []).find(p => 
                  p && p.conversa_id === conversa.id && p.pessoa_id === currentPessoa?.id
                );
                const naoLidas = participante?.mensagens_nao_lidas || 0;

                return (
                  <button
                    key={conversa.id}
                    onClick={() => handleOpenConversa(conversa)}
                    className="w-full bg-white rounded-2xl p-4 shadow-md text-left transition-all active:scale-95"
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
                          <h3 className="text-base font-bold text-slate-900 truncate">
                            {getNomeConversa(conversa)}
                          </h3>
                          {conversa.ultima_mensagem_data && (
                            <span className="text-xs text-slate-500 shrink-0">
                              {formatarData(conversa.ultima_mensagem_data)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm text-slate-600 line-clamp-1 flex-1">
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
          onSubmit={async (osData) => {
            await loadData();
            setShowOSForm(false);
          }}
          pessoas={pessoas}
          categorias={categorias}
          subcategorias={subcategorias}
          regionais={regionais}
          almoxarifados={almoxarifados}
          instalacoes={instalacoes}
        />
      )}
    </div>
  );
}