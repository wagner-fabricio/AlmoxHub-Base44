import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import OSFilters from '@/components/os/OSFilters.jsx';
import OSKanban from '@/components/os/OSKanban.jsx';
import OSList from '@/components/os/OSList.jsx';
import OSGallery from '@/components/os/OSGallery.jsx';
import OSFormModal from '@/components/os/OSFormModal.jsx';
import OSDetailModal from '@/components/os/OSDetailModal.jsx';

export default function OrdensServico() {
  const [loading, setLoading] = useState(true);
  const [ordens, setOrdens] = useState([]);
  const [regionais, setRegionais] = useState([]);
  const [almoxarifados, setAlmoxarifados] = useState([]);
  const [pessoas, setPessoas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [projetos, setProjetos] = useState([]);
  const [instalacoes, setInstalacoes] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPessoa, setCurrentPessoa] = useState(null);
  
  const [viewMode, setViewMode] = useState('kanban');
  const [filters, setFilters] = useState({
    search: '',
    regional: 'all',
    categoria: 'all',
    subcategoria: 'all',
    status: 'all',
    visao: 'todos'
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

  useEffect(() => {
    loadData();
    
    // Check for OS ID in URL params (from notification)
    const urlParams = new URLSearchParams(window.location.search);
    const osId = urlParams.get('os_id');
    if (osId) {
      // Aguardar dados carregarem e abrir modal de edição
      setTimeout(() => {
        const os = ordens.find(o => o.id === osId);
        if (os) {
          setSelectedOS(os);
          setShowFormModal(true);
        }
      }, 500);
      // Limpar URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [user, ordensData, regionaisData, almoxarifadosData, pessoasData, categoriasData, subcategoriasData, projetosData, instalacoesData] = await Promise.all([
        base44.auth.me(),
        base44.entities.OrdemServico.list(),
        base44.entities.Regional.list(),
        base44.entities.Almoxarifado.list(),
        base44.entities.Pessoa.list(),
        base44.entities.Categoria.list(),
        base44.entities.Subcategoria.list(),
        base44.entities.Projeto.list(),
        base44.entities.Instalacao.list()
      ]);
      
      setCurrentUser(user);
      const pessoa = pessoasData.find(p => p.email === user.email);
      setCurrentPessoa(pessoa);

      if (user.filtros_preferidos?.OrdensServico) {
        setFilters(user.filtros_preferidos.OrdensServico);
      }
      
      setOrdens(ordensData);
      setRegionais(regionaisData);
      setAlmoxarifados(almoxarifadosData);
      setPessoas(pessoasData);
      setCategorias(categoriasData);
      setSubcategorias(subcategoriasData);
      setProjetos(projetosData);
      setInstalacoes(instalacoesData);
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
    
    // Regional filter
    if (filters.regional !== 'all' && os.regional_id !== filters.regional) return false;
    
    // Categoria filter
    if (filters.categoria !== 'all' && os.categoria_id !== filters.categoria) return false;
    
    // Subcategoria filter
    if (filters.subcategoria !== 'all' && !os.subcategorias_ids?.includes(filters.subcategoria)) return false;
    
    // Status filter
    if (filters.status !== 'all' && os.status !== filters.status) return false;
    
    // Visão filter (permission based)
    if (filters.visao === 'regional' && currentPessoa) {
      if (os.regional_id !== currentPessoa.regional_id) return false;
    }
    if (filters.visao === 'meus' && currentPessoa) {
      if (os.lider_id !== currentPessoa.id && !os.outros_envolvidos_ids?.includes(currentPessoa.id)) return false;
    }
    
    return true;
  });

  const handleOSClick = (os) => {
    setSelectedOS(os);
    setShowDetailModal(true);
  };

  const handleStatusChange = async (osId, newStatus) => {
    try {
      const os = ordens.find(o => o.id === osId);
      await base44.entities.OrdemServico.update(osId, { status: newStatus });
      setOrdens(ordens.map(o => o.id === osId ? { ...o, status: newStatus } : o));
      
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

  const handleFormSave = async (isNew, osData) => {
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
      } catch (e) {
        console.error('Error creating assignment notifications:', e);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
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
        <Button onClick={handleNewOS} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Nova OS
        </Button>
      </div>

      {/* Filters */}
      <OSFilters
        filters={filters}
        setFilters={updateFilters}
        regionais={regionais}
        categorias={categorias}
        subcategorias={subcategorias}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      {/* Content */}
      {filteredOrdens.length === 0 ? (
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
              onOSClick={handleOSClick}
            />
          )}
        </>
      )}

      {/* Form Modal */}
      <OSFormModal
        open={showFormModal}
        onClose={() => setShowFormModal(false)}
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
        onEdit={handleEditOS}
        onRefresh={loadData}
      />
    </div>
  );
}