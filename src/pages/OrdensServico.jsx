import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useApp } from '@/components/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, Maximize2, Minimize2 } from 'lucide-react';
import ExportOSButton from '@/components/os/ExportOSButton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import OSFilters from '@/components/os/OSFilters.jsx';
import OSKanban from '@/components/os/OSKanban.jsx';
import OSKanbanExpedicao from '@/components/os/OSKanbanExpedicao.jsx';
import OSKanbanRecebimento from '@/components/os/OSKanbanRecebimento.jsx';
import OSList from '@/components/os/OSList.jsx';
import OSGallery from '@/components/os/OSGallery.jsx';
import OSByResponsavel from '@/components/os/OSByResponsavel.jsx';
import OSPendenciasExpedicao from '@/components/os/OSPendenciasExpedicao.jsx';
import OSPendenciasRecebimento from '@/components/os/OSPendenciasRecebimento.jsx';
import OSFormModal from '@/components/os/OSFormModal.jsx';
import OSDetailModal from '@/components/os/OSDetailModal.jsx';
import { notifyOSAssignment, notifyStatusChange } from '@/components/notifications/PushNotificationHelper';

export default function OrdensServico() {
  const { regionais, categorias, subcategorias, pessoas, currentUser: ctxUser, currentPessoa: ctxPessoa } = useApp();
  const [loading, setLoading] = useState(true);
  const [ordens, setOrdens] = useState([]);
  const [almoxarifados, setAlmoxarifados] = useState([]);
  const [projetos, setProjetos] = useState([]);
  const [instalacoes, setInstalacoes] = useState([]);
  const [rotulos, setRotulos] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPessoa, setCurrentPessoa] = useState(null);
  
  const [viewMode, setViewMode] = useState('kanban');
  const [filters, setFilters] = useState({
    search: '',
    migo: '',
    regional: 'all',
    almoxarifado: 'all',
    categorias: [],
    subcategoria: 'all',
    status: 'all',
    statusList: [],
    visao: 'todos',
    periodo: 'all',
    dataInicio: '',
    dataFim: ''
  });

  const updateFilters = async (newFilters) => {
    setFilters(newFilters);
    try {
      const savedFilters = currentUser?.filtros_preferidos || {};
      await base44.auth.updateMe({
        filtros_preferidos: {
          ...savedFilters,
          OrdensServico: newFilters
        }
      });
    } catch (e) {
      console.error('Error saving filters:', e);
    }
  };

  const [showFormModal, setShowFormModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOS, setSelectedOS] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingOS, setDeletingOS] = useState(null);
  const [fullscreenMode, setFullscreenMode] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [user, ordensData, almoxarifadosData, projetosData, instalacoesData, rotulosData] = await Promise.all([
        base44.auth.me(),
        base44.entities.OrdemServico.list(),
        base44.entities.Almoxarifado.list(),
        base44.entities.Projeto.list(),
        base44.entities.Instalacao.list(),
        base44.entities.Rotulo.filter({ ativo: true })
      ]);
      
      setCurrentUser(user);
      const pessoa = Array.isArray(pessoas) ? pessoas.find(p => p?.email === user.email) : null;
      setCurrentPessoa(pessoa);

      if (user.filtros_preferidos?.OrdensServico) {
        const savedFilters = user.filtros_preferidos.OrdensServico;
        // Migrar filtro antigo 'categoria' para novo 'categorias'
        if (savedFilters.categoria && savedFilters.categoria !== 'all' && !savedFilters.categorias) {
          savedFilters.categorias = [savedFilters.categoria];
          delete savedFilters.categoria;
        }
        // Garantir que categorias é sempre um array
        if (!savedFilters.categorias) {
          savedFilters.categorias = [];
        }
        setFilters(savedFilters);
      }
      
      setOrdens(ordensData);
      setAlmoxarifados(almoxarifadosData);
      setProjetos(projetosData);
      setInstalacoes(instalacoesData);
      setRotulos(rotulosData);

      // Check for OS ID in URL params (from notification or external link)
      const urlParams = new URLSearchParams(window.location.search);
      const osId = urlParams.get('os_id');
      if (osId) {
        const os = ordensData.find(o => o.id === osId);
        if (os) {
          setSelectedOS(os);
          setShowFormModal(true);
        }
        // Limpar URL
        window.history.replaceState({}, '', window.location.pathname);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  const filteredOrdens = ordens.filter(os => {
    // Search
    if (filters.search) {
      const search = filters.search.toLowerCase();
      const matchesSearch = 
        os.codigo?.toLowerCase().includes(search) ||
        os.descricao_resumida?.toLowerCase().includes(search);
      if (!matchesSearch) return false;
    }

    // MIGO filter
    if (filters.migo) {
      const migoMatch = 
        os.num_migo?.toString().includes(filters.migo) ||
        os.numero_migo_receb?.toString().includes(filters.migo);
      if (!migoMatch) return false;
    }
    
    // Regional filter - OS Global sempre passa
    if (filters.regional !== 'all' && !os.is_global && os.regional_id !== filters.regional) return false;
    
    // Almoxarifado filter - OS Global sempre passa
    if (filters.almoxarifado !== 'all' && !os.is_global && os.almoxarifado_id !== filters.almoxarifado) return false;
    
    // Categoria filter (múltiplas)
    const categorias = filters.categorias || [];
    if (categorias.length > 0 && !categorias.includes(os.categoria_id)) return false;
    
    // Subcategoria filter
    if (filters.subcategoria !== 'all' && !os.subcategorias_ids?.includes(filters.subcategoria)) return false;
    
    // Status filter (antigo - mantido para compatibilidade)
    if (filters.status !== 'all' && os.status !== filters.status) return false;
    
    // Status filter (novo - múltiplos status)
    if (filters.statusList?.length > 0 && !filters.statusList.includes(os.status)) return false;
    
    // Period filter
    if (filters.periodo === 'hoje') {
      // Filtrar por prazo de vencimento = hoje
      if (!os.prazo) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const prazoDate = new Date(os.prazo);
      prazoDate.setHours(0, 0, 0, 0);
      if (prazoDate.getTime() !== today.getTime()) return false;
    } else if (filters.periodo === 'mes_atual') {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const osDate = new Date(os.created_date);
      if (osDate < startOfMonth || osDate > endOfMonth) return false;
    } else if (filters.periodo === 'customizado') {
      if (filters.dataInicio) {
        const startDate = new Date(filters.dataInicio);
        if (new Date(os.created_date) < startDate) return false;
      }
      if (filters.dataFim) {
        const endDate = new Date(filters.dataFim);
        endDate.setHours(23, 59, 59, 999);
        if (new Date(os.created_date) > endDate) return false;
      }
    } else if (filters.periodo !== 'all') {
      const days = parseInt(filters.periodo);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      if (new Date(os.created_date) < cutoff) return false;
    }
    
    // Visão filter (permission based)
    if (filters.visao === 'regional' && currentPessoa) {
      if (os.regional_id !== currentPessoa.regional_id) return false;
    }
    if (filters.visao === 'meus' && currentPessoa) {
      const isLider = os.lider_id === currentPessoa.id;
      const isExecutor = os.executores_ids?.includes(currentPessoa.id);
      const isOutroEnvolvido = os.outros_envolvidos_ids?.includes(currentPessoa.id);
      if (!isLider && !isExecutor && !isOutroEnvolvido) return false;
    }
    
    return true;
  });

  const handleOSClick = (os) => {
    setSelectedOS(os);
    setShowDetailModal(true);
  };

  const handleStatusChange = async (osId, newStatus, fluxoData) => {
    try {
      const os = Array.isArray(ordens) ? ordens.find(o => o?.id === osId) : null;
      
      // Determinar se é mudança de status normal, status_separacao ou fluxo_recebimento
      const isExpedicaoView = viewMode === 'kanban_expedicao';
      const isRecebimentoView = viewMode === 'kanban_recebimento';
      
      let updateData;
      if (isRecebimentoView && fluxoData) {
        updateData = { fluxo_recebimento: fluxoData };
      } else if (isExpedicaoView) {
        updateData = { status_separacao: newStatus };
      } else {
        updateData = { status: newStatus };
      }
      
      await base44.entities.OrdemServico.update(osId, updateData);
      setOrdens(ordens.map(o => o.id === osId ? { ...o, ...updateData } : o));
      
      // Registrar mudança de status no histórico
      try {
        const statusLabels = {
          elaboracao: 'Em Elaboração',
          execucao: 'Em Execução',
          concluido: 'Concluído',
          cancelado: 'Cancelado',
          pendente: 'Pendente',
          em_separacao: 'Em Separação',
          separado: 'Separado',
          em_rota: 'Em Rota',
          entregue: 'Entregue'
        };
        
        const campo = isExpedicaoView ? 'status_separacao' : 'status';
        const valorAnterior = isExpedicaoView ? os.status_separacao : os.status;
        
        await base44.functions.invoke('registrarAuditLog', {
          action: 'status_change',
          entity_type: 'OrdemServico',
          entity_id: osId,
          details: {
            campo: campo,
            valor_anterior: statusLabels[valorAnterior] || valorAnterior,
            valor_novo: statusLabels[newStatus] || newStatus,
            descricao: `Status alterado de ${statusLabels[valorAnterior] || valorAnterior} para ${statusLabels[newStatus] || newStatus}`
          }
        });
      } catch (auditError) {
        console.error('Erro ao registrar mudança de status no histórico:', auditError);
      }
      
      // Criar notificações para líder e executores
      if (os && currentPessoa) {
        const destinatarios = [os.lider_id, ...(os.executores_ids || [])].filter(id => id !== currentPessoa.id);
        
        const statusLabels = {
          elaboracao: 'Em Elaboração',
          execucao: 'Em Execução',
          concluido: 'Concluído',
          cancelado: 'Cancelado'
        };
        
        if (destinatarios.length > 0) {
          const notificacoes = destinatarios.map(destId => ({
            destinatario_id: destId,
            remetente_id: currentPessoa.id,
            tipo: 'mudanca_status',
            referencia_id: osId,
            referencia_tipo: 'tarefa',
            mensagem: `Status da tarefa ${os.codigo} mudou para ${statusLabels[newStatus]}`,
            lida: false,
            contexto_adicional: {
              os_codigo: os.codigo,
              status_anterior: os.status,
              status_novo: newStatus
            }
          }));
          
          await base44.entities.Notificacao.bulkCreate(notificacoes);
          
          // Enviar push notifications
          const oldStatus = isExpedicaoView ? os.status_separacao : os.status;
          for (const destId of destinatarios) {
            notifyStatusChange(os, destId, oldStatus, newStatus);
          }
        }
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleNewOS = () => {
    setSelectedOS(null);
    setShowFormModal(true);
  };

  const handleEditOS = () => {
    setShowDetailModal(false);
    setShowFormModal(true);
  };

  const handleCreateRelated = async (originalOS) => {
    const categoria = Array.isArray(categorias) ? categorias.find(c => c?.id === originalOS.categoria_id) : null;
    const regional = Array.isArray(regionais) ? regionais.find(r => r?.id === originalOS.regional_id) : null;
    
    // Preparar descrição para a nova OS
    const newOSDescription = `OS Relacionada à ${originalOS.codigo} - ${categoria?.nome || 'OS'} (${regional?.sigla || ''})`;
    
    // Criar nova OS em branco, apenas com descrição pré-preenchida
    setSelectedOS({
      descricao_resumida: newOSDescription,
      _relatedToOS: originalOS // Passar OS original para referência após criação
    });
    setShowDetailModal(false);
    setShowFormModal(true);
  };

  const handleFormClose = () => {
    setShowFormModal(false);
    setShowDetailModal(false);
  };

  const handleFormSave = async (isNew, osData) => {
    // Atualizar selectedOS com dados salvos para refletir imediatamente
    if (!isNew && osData) {
      setSelectedOS(prev => prev ? { ...prev, ...osData } : osData);
    }

    // Se é OS relacionada, atualizar a OS original
    if (isNew && selectedOS?._relatedToOS) {
      const originalOS = selectedOS._relatedToOS;
      const categoria = Array.isArray(categorias) ? categorias.find(c => c?.id === originalOS.categoria_id) : null;
      const regional = Array.isArray(regionais) ? regionais.find(r => r?.id === originalOS.regional_id) : null;
      
      try {
        // Atualizar OS original com referência à nova
        const updatedDescription = originalOS.descricao_resumida 
          ? `${originalOS.descricao_resumida}\n\nOS Relacionada Criada: ${osData.codigo}`
          : `OS Relacionada Criada: ${osData.codigo}`;
        
        await base44.entities.OrdemServico.update(originalOS.id, {
          descricao_resumida: updatedDescription
        });
      } catch (e) {
        console.error('Error updating original OS:', e);
      }
    }
    
    await loadData();
    
    // Se é nova OS e tem executores, criar notificações de atribuição
    if (isNew && osData?.executores_ids?.length > 0 && currentPessoa) {
      try {
        const notificacoes = osData.executores_ids.map(execId => ({
          destinatario_id: execId,
          remetente_id: currentPessoa.id,
          tipo: 'atribuicao',
          referencia_id: osData.id,
          referencia_tipo: 'tarefa',
          mensagem: `Você foi atribuído à tarefa ${osData.codigo}`,
          lida: false,
          contexto_adicional: {
            os_codigo: osData.codigo
          }
        }));
        
        await base44.entities.Notificacao.bulkCreate(notificacoes);
        
        // Enviar push notifications
        for (const execId of osData.executores_ids) {
          notifyOSAssignment(osData, execId);
        }
      } catch (e) {
        console.error('Error creating assignment notifications:', e);
      }
    }
  };

  const handleDeleteOS = (os) => {
    setDeletingOS(os);
    setShowDeleteDialog(true);
  };

  const confirmDeleteOS = async () => {
    if (!deletingOS) return;
    
    try {
      await base44.entities.OrdemServico.delete(deletingOS.id);
      setShowDeleteDialog(false);
      setShowDetailModal(false);
      setDeletingOS(null);
      setSelectedOS(null);
      await loadData();
    } catch (error) {
      console.error('Error deleting OS:', error);
    }
  };

  const canDeleteOS = (os) => {
    if (!currentUser || !currentPessoa) return false;
    
    // Admin pode deletar tudo
    if (currentUser.role === 'admin') return true;
    
    // Gestor pode deletar tudo
    if (currentPessoa.funcoes?.includes('gestor')) return true;
    
    // Líder pode deletar apenas suas próprias ordens
    if (currentPessoa.funcoes?.includes('lider') && os.lider_id === currentPessoa.id) return true;
    
    // Almoxarife não pode deletar
    return false;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (fullscreenMode) {
    return (
      <div className="fixed inset-0 bg-slate-50 dark:bg-slate-900 z-50 overflow-auto">
        {/* Fullscreen Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between shadow-sm z-10">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Ordens de Serviço</h1>
          <Button 
            onClick={() => setFullscreenMode(false)} 
            variant="outline"
            size="sm"
          >
            <Minimize2 className="w-4 h-4 mr-2" />
            Sair da Tela Cheia
          </Button>
        </div>

        {/* Fullscreen Content */}
        <div className="p-6">
          {filteredOrdens.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                <Plus className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Nenhuma OS encontrada
              </h3>
            </div>
          ) : (
            <>
              {viewMode === 'kanban' && (
                <OSKanban
                  ordens={filteredOrdens}
                  pessoas={pessoas}
                  categorias={categorias}
                  regionais={regionais}
                  instalacoes={instalacoes}
                  onOSClick={handleOSClick}
                  onStatusChange={handleStatusChange}
                />
              )}
              {viewMode === 'kanban_expedicao' && (
                <OSKanbanExpedicao
                  ordens={filteredOrdens}
                  pessoas={pessoas}
                  categorias={categorias}
                  regionais={regionais}
                  instalacoes={instalacoes}
                  onOSClick={handleOSClick}
                  onStatusChange={handleStatusChange}
                />
              )}
              {viewMode === 'kanban_recebimento' && (
                <OSKanbanRecebimento
                  ordens={filteredOrdens}
                  pessoas={pessoas}
                  categorias={categorias}
                  regionais={regionais}
                  instalacoes={instalacoes}
                  onOSClick={handleOSClick}
                  onStatusChange={handleStatusChange}
                />
              )}
              {viewMode === 'list' && (
                <OSList
                  ordens={filteredOrdens}
                  pessoas={pessoas}
                  categorias={categorias}
                  regionais={regionais}
                  onOSClick={handleOSClick}
                />
              )}
              {viewMode === 'gallery' && (
                <OSGallery
                  ordens={filteredOrdens}
                  pessoas={pessoas}
                  categorias={categorias}
                  regionais={regionais}
                  instalacoes={instalacoes}
                  onOSClick={handleOSClick}
                  rotulos={rotulos}
                />
              )}
              {viewMode === 'responsavel' && (
                <OSByResponsavel
                  ordensServico={filteredOrdens}
                  pessoas={pessoas}
                  onSelectOS={handleOSClick}
                  onNovaOS={(pessoa) => {
                    setSelectedOS({ lider_id: pessoa?.id });
                    setShowFormModal(true);
                  }}
                />
              )}
              {viewMode === 'pendencias_expedicao' && (
                <OSPendenciasExpedicao
                  ordens={filteredOrdens}
                  categorias={categorias}
                  subcategorias={subcategorias}
                  instalacoes={instalacoes}
                  onOSClick={handleOSClick}
                />
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">Ordens de Serviço</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Gerencie as OS do almoxarifado</p>
        </div>
        <div className="flex gap-2">
          <ExportOSButton
            ordens={filteredOrdens}
            pessoas={pessoas}
            categorias={categorias}
            regionais={regionais}
            almoxarifados={almoxarifados}
            instalacoes={instalacoes}
            subcategorias={subcategorias}
          />
          <Button 
            onClick={() => setFullscreenMode(true)} 
            variant="outline"
          >
            <Maximize2 className="w-4 h-4 mr-2" />
            Tela Cheia
          </Button>
          <Button onClick={handleNewOS} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Nova OS
          </Button>
        </div>
      </div>

      {/* Filters */}
      <OSFilters
        filters={filters}
        setFilters={updateFilters}
        regionais={regionais}
        almoxarifados={almoxarifados}
        categorias={categorias}
        subcategorias={subcategorias}
        viewMode={viewMode}
        setViewMode={setViewMode}
        isExpedicaoView={viewMode === 'kanban_expedicao'}
        isRecebimentoView={viewMode === 'kanban_recebimento'}
      />

      {/* Content */}
      {viewMode === 'pendencias_expedicao' ? (
        <OSPendenciasExpedicao
          ordens={filteredOrdens}
          categorias={categorias}
          subcategorias={subcategorias}
          instalacoes={instalacoes}
          onOSClick={handleOSClick}
        />
      ) : viewMode === 'pendencias_recebimento' ? (
        <OSPendenciasRecebimento
          ordens={filteredOrdens}
          categorias={categorias}
          subcategorias={subcategorias}
          almoxarifados={almoxarifados}
          onOSClick={handleOSClick}
        />
      ) : filteredOrdens.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
            <Plus className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            Nenhuma OS encontrada
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            Crie sua primeira ordem de serviço para começar
          </p>
          <Button onClick={handleNewOS}>
            <Plus className="w-4 h-4 mr-2" />
            Criar OS
          </Button>
        </div>
      ) : (
        <>
          {viewMode === 'kanban' && (
            <OSKanban
              ordens={filteredOrdens}
              pessoas={pessoas}
              categorias={categorias}
              regionais={regionais}
              instalacoes={instalacoes}
              onOSClick={handleOSClick}
              onStatusChange={handleStatusChange}
            />
          )}
          {viewMode === 'kanban_expedicao' && (
            <OSKanbanExpedicao
              ordens={filteredOrdens}
              pessoas={pessoas}
              categorias={categorias}
              regionais={regionais}
              instalacoes={instalacoes}
              onOSClick={handleOSClick}
              onStatusChange={handleStatusChange}
            />
          )}
          {viewMode === 'kanban_recebimento' && (
            <OSKanbanRecebimento
              ordens={filteredOrdens}
              pessoas={pessoas}
              categorias={categorias}
              regionais={regionais}
              instalacoes={instalacoes}
              onOSClick={handleOSClick}
              onStatusChange={handleStatusChange}
            />
          )}
          {viewMode === 'list' && (
            <OSList
              ordens={filteredOrdens}
              pessoas={pessoas}
              categorias={categorias}
              regionais={regionais}
              onOSClick={handleOSClick}
            />
          )}
          {viewMode === 'gallery' && (
            <OSGallery
              ordens={filteredOrdens}
              pessoas={pessoas}
              categorias={categorias}
              regionais={regionais}
              instalacoes={instalacoes}
              onOSClick={handleOSClick}
              rotulos={rotulos}
            />
          )}
          {viewMode === 'responsavel' && (
            <OSByResponsavel
              ordensServico={filteredOrdens}
              pessoas={pessoas}
              onSelectOS={handleOSClick}
              onNovaOS={(pessoa) => {
                setSelectedOS({ lider_id: pessoa?.id });
                setShowFormModal(true);
              }}
            />
          )}
        </>
      )}

      {/* Form Modal */}
      <OSFormModal
        open={showFormModal}
        onClose={handleFormClose}
        os={selectedOS}
        regionais={regionais}
        almoxarifados={almoxarifados}
        pessoas={pessoas}
        categorias={categorias}
        subcategorias={subcategorias}
        projetos={projetos}
        instalacoes={instalacoes}
        currentUser={currentUser}
        onSave={handleFormSave}
      />

      {/* Detail Modal */}
      <OSDetailModal
        open={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        os={selectedOS}
        regionais={regionais}
        almoxarifados={almoxarifados}
        pessoas={pessoas}
        categorias={categorias}
        subcategorias={subcategorias}
        instalacoes={instalacoes}
        projetos={projetos}
        onEdit={handleEditOS}
        onDelete={handleDeleteOS}
        onCreateRelated={handleCreateRelated}
        canDelete={selectedOS ? canDeleteOS(selectedOS) : false}
        onRefresh={loadData}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Ordem de Serviço</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a OS <strong>{deletingOS?.codigo}</strong>?
              <br />
              Esta ação não pode ser desfeita e todos os comentários e anexos serão perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteOS}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}