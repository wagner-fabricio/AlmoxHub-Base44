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
  MapPin
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import OSMobileDetail from '@/components/os/OSMobileDetail';

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
        instalacoesData
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
      ]);

      setPessoas(pessoasData);
      const pessoa = pessoasData.find(p => p.email === user.email);
      setCurrentPessoa(pessoa);

      // Filtrar apenas OS onde o usuário é líder ou executor
      const minhasOrdens = ordensData.filter(os => 
        os.lider_id === pessoa?.id || os.executores_ids?.includes(pessoa?.id)
      );
      setOrdens(minhasOrdens);
      setProjetos(projetosData);
      setConversas(conversasData);
      setCategorias(categoriasData);
      setSubcategorias(subcategoriasData);
      setRegionais(regionaisData);
      setAlmoxarifados(almoxarifadosData);
      setInstalacoes(instalacoesData);
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
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-500',
      count: ordens.length
    },
    {
      id: 'projetos',
      name: 'Projetos',
      icon: FolderKanban,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-500',
      count: projetos.length
    },
    {
      id: 'mensagens',
      name: 'Mensagens',
      icon: MessageSquare,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-500',
      count: conversas.length
    }
  ];

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-white" />
      </div>
    );
  }

  // Vista de módulos (home)
  if (!activeModule && !selectedOS) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Em Fluxo</h1>
            <p className="text-slate-300">Olá, {currentPessoa?.nome?.split(' ')[0] || 'Usuário'}</p>
          </div>

          {/* Módulos Grid */}
          <div className="space-y-4">
            {modules.map((module) => {
              const Icon = module.icon;
              return (
                <button
                  key={module.id}
                  onClick={() => handleOpenModule(module.id)}
                  className={`w-full bg-gradient-to-r ${module.color} rounded-3xl p-6 shadow-2xl transform transition-all hover:scale-105 active:scale-95`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-xl font-bold text-white">{module.name}</h3>
                        <p className="text-white/80 text-sm">{module.count} itens</p>
                      </div>
                    </div>
                    <ChevronRight className="w-6 h-6 text-white" />
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

  // Vista de módulo expandido
  const activeModuleData = modules.find(m => m.id === activeModule);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className={`bg-gradient-to-r ${activeModuleData.color} p-4 sticky top-0 z-10 shadow-lg`}>
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
            <h2 className="text-xl font-bold text-white">{activeModuleData.name}</h2>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-4 pb-20">
        {activeModule === 'ordens' && (
          <div className="space-y-3">
            {ordens.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <ClipboardList className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Nenhuma ordem de serviço</p>
              </div>
            ) : (
              ordens.map((os) => {
                const categoria = categorias.find(c => c.id === os.categoria_id);
                const regional = regionais.find(r => r.id === os.regional_id);
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
            {projetos.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <FolderKanban className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Nenhum projeto</p>
              </div>
            ) : (
              projetos.map((projeto) => (
                <div
                  key={projeto.id}
                  className="bg-white rounded-2xl p-4 shadow-md border-l-4"
                  style={{ borderLeftColor: projeto.cor }}
                >
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{projeto.nome}</h3>
                  {projeto.descricao && (
                    <p className="text-sm text-slate-600">{projeto.descricao}</p>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeModule === 'mensagens' && (
          <div className="space-y-3">
            <div className="text-center py-12 text-slate-500">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Funcionalidade em desenvolvimento</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}