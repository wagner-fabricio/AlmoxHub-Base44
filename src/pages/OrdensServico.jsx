import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useApp } from '@/components/contexts/AppContext';
import { useOrdensFiltradas, ORDENS_QUERY_KEY } from '@/hooks/useOrdensQuery';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, Maximize2, Minimize2, Tv2, ChevronLeft, ChevronRight } from 'lucide-react';
import PresentationSetupModal from '@/components/presentation/PresentationSetupModal';
import PresentationOverlay from '@/components/presentation/PresentationOverlay';
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
import { notifyOSAssignment, notifyStatusChange } from '@/components/notifications/PushNotificationHelper';
import OSTimeSheetView from '@/components/timesheet/OSTimeSheetView.jsx';
import OSTimeSheetRelatorio from '@/components/timesheet/OSTimeSheetRelatorio.jsx';
import OSPagination from '@/components/os/OSPagination.jsx';
import IniciarSessaoModal from '@/components/timesheet/IniciarSessaoModal.jsx';

export default function OrdensServico() {
  const { regionais, categorias, subcategorias = [], pessoas, currentUser: ctxUser, currentPessoa: ctxPessoa, almoxarifados, instalacoes, projetos, rotulos } = useApp();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPessoa, setCurrentPessoa] = useState(null);
  
  const [viewMode, setViewMode] = useState('kanban');
  const [filters, setFilters] = useState({
    search: '',
    migo: '',
    reserva: '',
    codigoMaterial: '',
    regional: [],
    almoxarifado: [],
    categorias: [],
    subcategoria: 'all',
    status: 'all',
    statusList: [],
    visao: 'todos',
    periodo: 'all',
    dataInicio: '',
    dataFim: '',
    pessoa_id: ''
  });

  // Debounced text filters — só recalcular filtros após parar de digitar
  const [debouncedTextFilters, setDebouncedTextFilters] = useState({
    search: '', migo: '', reserva: '', codigoMaterial: ''
  });
  const debounceRef = useRef(null);
  const savePrefsRef = useRef(null);

  const updateFilters = useCallback(async (newFilters) => {
    setFilters(newFilters);
    // Debounce apenas para campos de texto livres
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedTextFilters({
        search: newFilters.search || '',
        migo: newFilters.migo || '',
        reserva: newFilters.reserva || '',
        codigoMaterial: newFilters.codigoMaterial || '',
      });
    }, 300);
    // Debounce preference saving — only write after user stops interacting (1.5s)
    if (savePrefsRef.current) clearTimeout(savePrefsRef.current);
    savePrefsRef.current = setTimeout(async () => {
      try {
        const savedFilters = currentUser?.filtros_preferidos || {};
        await base44.auth.updateMe({
          filtros_preferidos: {
            ...savedFilters,
            OrdensServico: newFilters
          }
        });
      } catch (e) {
        // silently fail — preference saving is not critical
      }
    }, 1500);
  }, [currentUser]);

  const [showFormModal, setShowFormModal] = useState(false);
  const [formInitialMode, setFormInitialMode] = useState('edit');
  const [selectedOS, setSelectedOS] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingOS, setDeletingOS] = useState(null);
  const [fullscreenMode, setFullscreenMode] = useState(false);
  const [showPresentationSetup, setShowPresentationSetup] = useState(false);
  const [presentationSlides, setPresentationSlides] = useState(null);
  const [osSelecaoSessao, setOsSelecaoSessao] = useState(null);
  const [iniciandoSessao, setIniciandoSessao] = useState(false);

  // Paginação client-side (para views list e gallery)
  const PAGE_SIZE = 100;
  const [currentPage, setCurrentPage] = useState(1);
  // Visão "Atribuídas a Mim" precisa filtrar por executores_ids no client — backend não suporta.
  // Aumentamos o limite nesse caso para garantir que OS atribuídas apareçam mesmo em datasets grandes.
  const effectiveLimit = filters.visao === 'meus' ? 500 : PAGE_SIZE;

  // Filtros que o backend suporta — usados para busca paginada
  const backendFilter = useMemo(() => {
    const f = {};
    if (filters.status !== 'all' && filters.statusList?.length === 0) f.status = filters.status;
    // Se há exatamente um status selecionado no statusList, enviar para o backend
    // (evita que o backend devolva apenas as 100 OS mais recentes que podem não ter o status desejado)
    else if (filters.statusList?.length === 1) f.status = filters.statusList[0];
    const regArr = Array.isArray(filters.regional) ? filters.regional : (filters.regional && filters.regional !== 'all' ? [filters.regional] : []);
    const almoxArr = Array.isArray(filters.almoxarifado) ? filters.almoxarifado : (filters.almoxarifado && filters.almoxarifado !== 'all' ? [filters.almoxarifado] : []);
    // Backend só aceita 1 valor — apenas enviamos quando há exatamente 1 selecionado; múltiplos são tratados no client
    if (regArr.length === 1) f.regional_id = regArr[0];
    if (almoxArr.length === 1) f.almoxarifado_id = almoxArr[0];
    if (filters.categorias?.length === 1) f.categoria_id = filters.categorias[0];
    // Visão "Minha Regional" — aplicar regional do usuário no backend
    if (filters.visao === 'regional' && currentPessoa?.regional_id && regArr.length === 0) {
      f.regional_id = currentPessoa.regional_id;
    }
    return f;
  }, [filters.status, filters.regional, filters.almoxarifado, filters.categorias, filters.statusList, filters.visao, currentPessoa?.regional_id]);

  const { data: ordens = [], isLoading: isOrdensLoading } = useOrdensFiltradas(
    { backendFilter, sort: '-created_date', limit: effectiveLimit, page: currentPage, textSearch: debouncedTextFilters },
    { enabled: true }
  );

  // setOrdens — optimistic update no cache da query filtrada ativa
  const currentQueryKey = useMemo(
    () => ['ordens-filtradas', { backendFilter, sort: '-created_date', limit: effectiveLimit, page: currentPage, textSearch: debouncedTextFilters }],
    [backendFilter, currentPage, effectiveLimit, debouncedTextFilters]
  );
  const setOrdens = useCallback((updater) => {
    queryClient.setQueryData(currentQueryKey, (prev = []) =>
      typeof updater === 'function' ? updater(prev) : updater
    );
  }, [queryClient, currentQueryKey]);

  const handleRequestSelecaoSessao = useCallback((os) => {
    setOsSelecaoSessao(os);
  }, []);

  const handleConfirmarSessao = useCallback(async (pessoasIds) => {
    if (!osSelecaoSessao) return;
    setIniciandoSessao(true);
    try {
      const res = await base44.functions.invoke('registrarTimeSheet', {
        acao: 'play_multi',
        os_id: osSelecaoSessao.id,
        pessoas_ids: pessoasIds
      });
      const updated = res?.data?.os;
      if (updated) {
        setOrdens(prev => prev.map(o => o.id === updated.id ? { ...o, ...updated } : o));
      }
      setOsSelecaoSessao(null);
    } catch (err) {
      console.error('TimeSheet error:', err);
    } finally {
      setIniciandoSessao(false);
    }
  }, [osSelecaoSessao, setOrdens]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      // All entity data comes from AppContext — only resolve user identity here
      const user = ctxUser || (await base44.auth.me());
      setCurrentUser(user);
      const pessoa = ctxPessoa || (Array.isArray(pessoas) ? pessoas.find(p => p?.user_id === user?.id) : null);
      setCurrentPessoa(pessoa);
      if (!silent) queryClient.invalidateQueries({ queryKey: ['ordens-filtradas'] });

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
        // Migrar regional/almoxarifado de string para array
        if (!Array.isArray(savedFilters.regional)) {
          savedFilters.regional = (savedFilters.regional && savedFilters.regional !== 'all') ? [savedFilters.regional] : [];
        }
        if (!Array.isArray(savedFilters.almoxarifado)) {
          savedFilters.almoxarifado = (savedFilters.almoxarifado && savedFilters.almoxarifado !== 'all') ? [savedFilters.almoxarifado] : [];
        }
        setFilters(savedFilters);
        // Sincronizar debounced filters com os valores salvos
        setDebouncedTextFilters({
          search: savedFilters.search || '',
          migo: savedFilters.migo || '',
          reserva: savedFilters.reserva || '',
          codigoMaterial: savedFilters.codigoMaterial || '',
        });
      }

      // Check for OS ID in URL params (from notification or external link)
      const urlParams = new URLSearchParams(window.location.search);
      const osId = urlParams.get('os_id');
      if (osId) {
        window.history.replaceState({}, '', window.location.pathname);
        // Tenta encontrar no cache; se não achar, busca direto do backend
        const cached = queryClient.getQueryData(ORDENS_QUERY_KEY);
        const osFromCache = Array.isArray(cached) ? cached.find(o => o.id === osId) : null;
        if (osFromCache) {
          setSelectedOS(osFromCache);
          setFormInitialMode('read');
          setShowFormModal(true);
        } else {
          base44.entities.OrdemServico.filter({ id: osId }).then(res => {
            if (res?.[0]) { setSelectedOS(res[0]); setFormInitialMode('read'); setShowFormModal(true); }
          }).catch(() => {});
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Reset página ao mudar filtros ou view
  useEffect(() => { setCurrentPage(1); }, [filters, debouncedTextFilters, viewMode]);

  // Filtros memoizados — só recalculam quando ordens ou filtros relevantes mudam
  const filteredOrdens = useMemo(() => {
    // Calcular cutoff de período uma única vez fora do loop
    let periodoCutoff = null;
    let periodoStartMonth = null;
    let periodoEndMonth = null;
    let periodoStartCustom = null;
    let periodoEndCustom = null;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    if (filters.periodo === 'mes_atual') {
      const now = new Date();
      periodoStartMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      periodoEndMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (filters.periodo === 'customizado') {
      if (filters.dataInicio) periodoStartCustom = new Date(filters.dataInicio);
      if (filters.dataFim) {
        periodoEndCustom = new Date(filters.dataFim);
        periodoEndCustom.setHours(23, 59, 59, 999);
      }
    } else if (filters.periodo !== 'all' && filters.periodo !== 'hoje') {
      const days = parseInt(filters.periodo);
      periodoCutoff = new Date();
      periodoCutoff.setDate(periodoCutoff.getDate() - days);
    }

    const { search, migo, reserva, codigoMaterial } = debouncedTextFilters;
    const searchLower = search ? search.toLowerCase() : '';
    const codMatLower = codigoMaterial ? codigoMaterial.toLowerCase() : '';
    const categoriasFilter = filters.categorias || [];

    return ordens.filter(os => {
      // Search (debounced)
      if (searchLower) {
        if (
          !os.codigo?.toLowerCase().includes(searchLower) &&
          !os.descricao_resumida?.toLowerCase().includes(searchLower)
        ) return false;
      }

      // MIGO filter (debounced)
      if (migo) {
        if (
          !os.num_migo?.toString().includes(migo) &&
          !os.numero_migo_receb?.toString().includes(migo)
        ) return false;
      }

      // Reserva filter (debounced)
      if (reserva) {
        if (!os.num_reserva?.toString().includes(reserva)) return false;
      }

      // Código Material filter (debounced) — mais custoso, fica por último
      if (codMatLower) {
        const hasItem = (os.itens_documento || []).some(item =>
          item.codigo?.toLowerCase().includes(codMatLower)
        );
        if (!hasItem) return false;
      }

      // Regional filter (multi)
      const regArr = Array.isArray(filters.regional) ? filters.regional : (filters.regional && filters.regional !== 'all' ? [filters.regional] : []);
      if (regArr.length > 0 && !os.is_global && !regArr.includes(os.regional_id)) return false;

      // Almoxarifado filter (multi)
      const almoxArr = Array.isArray(filters.almoxarifado) ? filters.almoxarifado : (filters.almoxarifado && filters.almoxarifado !== 'all' ? [filters.almoxarifado] : []);
      if (almoxArr.length > 0 && !os.is_global && !almoxArr.includes(os.almoxarifado_id)) return false;

      // Categoria filter
      if (categoriasFilter.length > 0 && !categoriasFilter.includes(os.categoria_id)) return false;

      // Subcategoria filter
      if (filters.subcategoria !== 'all' && !os.subcategorias_ids?.includes(filters.subcategoria)) return false;

      // Status filter
      if (filters.status !== 'all' && os.status !== filters.status) return false;
      if (filters.statusList?.length > 0 && !filters.statusList.includes(os.status)) return false;

      // Period filter (usando valores pré-calculados)
      if (filters.periodo === 'hoje') {
        if (!os.prazo) return false;
        const prazoDate = new Date(os.prazo);
        prazoDate.setHours(0, 0, 0, 0);
        if (prazoDate.getTime() !== hoje.getTime()) return false;
      } else if (periodoStartMonth) {
        const osDate = new Date(os.created_date);
        if (osDate < periodoStartMonth || osDate > periodoEndMonth) return false;
      } else if (periodoStartCustom || periodoEndCustom) {
        const osDate = new Date(os.created_date);
        if (periodoStartCustom && osDate < periodoStartCustom) return false;
        if (periodoEndCustom && osDate > periodoEndCustom) return false;
      } else if (periodoCutoff) {
        if (new Date(os.created_date) < periodoCutoff) return false;
      }

      // Visão filter
      if (filters.visao === 'regional' && currentPessoa) {
        if (os.regional_id !== currentPessoa.regional_id) return false;
      }
      if (filters.visao === 'meus' && currentPessoa) {
        const isLider = os.lider_id === currentPessoa.id;
        const isExecutor = os.executores_ids?.includes(currentPessoa.id);
        const isOutroEnvolvido = os.outros_envolvidos_ids?.includes(currentPessoa.id);
        if (!isLider && !isExecutor && !isOutroEnvolvido) return false;
      }

      // Pessoa filter
      if (filters.pessoa_id) {
        const isLider = os.lider_id === filters.pessoa_id;
        const isExecutor = os.executores_ids?.includes(filters.pessoa_id);
        const isOutroEnvolvido = os.outros_envolvidos_ids?.includes(filters.pessoa_id);
        if (!isLider && !isExecutor && !isOutroEnvolvido) return false;
      }

      return true;
    });
  }, [ordens, filters, debouncedTextFilters, currentPessoa]);

  // Backend já pagina — paginatedOrdens é igual a filteredOrdens (já vem 100 por vez)
  // totalPages é desconhecido sem count do backend; usamos heurística: se veio PAGE_SIZE, pode ter mais
  const paginatedOrdens = filteredOrdens;
  const totalPages = filteredOrdens.length >= PAGE_SIZE ? currentPage + 1 : currentPage;
  const totalApprox = (currentPage - 1) * PAGE_SIZE + filteredOrdens.length;

  const handleOSClick = (os) => {
    setSelectedOS(os);
    setFormInitialMode('read');
    setShowFormModal(true);
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
        // Progresso automático para categorias sem fluxo (não Expedição/Recebimento)
        const categoria = Array.isArray(categorias) ? categorias.find(c => c?.id === os?.categoria_id) : null;
        const nomeCat = categoria?.nome?.toLowerCase() || '';
        const semFluxo = !nomeCat.includes('expedição') && !nomeCat.includes('expedicao') && !nomeCat.includes('recebimento');
        const isFinal = newStatus === 'concluido' || newStatus === 'cancelado';
        const eraFinal = os?.status === 'concluido' || os?.status === 'cancelado';
        if (semFluxo) {
          if (isFinal) updateData.progresso = 100;
          else if (eraFinal) updateData.progresso = 0;
        }
      }
      
      await base44.entities.OrdemServico.update(osId, updateData);
      // Optimistic update — immediate visual feedback
      setOrdens(ordens.map(o => o.id === osId ? { ...o, ...updateData } : o));

      // Fire-and-forget: audit log, notifications, timesheet — don't block UI
      const statusLabels = {
        elaboracao: 'Em Elaboração', execucao: 'Em Execução',
        concluido: 'Concluído', cancelado: 'Cancelado',
        pendente: 'Pendente', em_separacao: 'Em Separação',
        separado: 'Separado', em_rota: 'Em Rota', entregue: 'Entregue'
      };
      const campo = isExpedicaoView ? 'status_separacao' : 'status';
      const valorAnterior = isExpedicaoView ? os?.status_separacao : os?.status;

      base44.functions.invoke('registrarAuditLog', {
        action: 'status_change',
        entity_type: 'OrdemServico',
        entity_id: osId,
        details: {
          campo,
          valor_anterior: statusLabels[valorAnterior] || valorAnterior,
          valor_novo: statusLabels[newStatus] || newStatus,
        }
      }).catch(() => {});

      if (!isExpedicaoView && !isRecebimentoView && (newStatus === 'concluido' || newStatus === 'cancelado')) {
        base44.functions.invoke('encerrarTimeSheetOS', { os_id: osId }).catch(() => {});
      }

      if (os && currentPessoa) {
        const destinatarios = [os.lider_id, ...(os.executores_ids || [])].filter(id => id !== currentPessoa.id);
        if (destinatarios.length > 0) {
          const notificacoes = destinatarios.map(destId => ({
            destinatario_id: destId,
            remetente_id: currentPessoa.id,
            tipo: 'mudanca_status',
            referencia_id: osId,
            referencia_tipo: 'tarefa',
            mensagem: `Status da tarefa ${os.codigo} mudou para ${statusLabels[newStatus]}`,
            lida: false,
            contexto_adicional: { os_codigo: os.codigo, status_anterior: os.status, status_novo: newStatus }
          }));
          base44.entities.Notificacao.bulkCreate(notificacoes).catch(() => {});
          const oldStatus = isExpedicaoView ? os.status_separacao : os.status;
          destinatarios.forEach(destId => notifyStatusChange(os, destId, oldStatus, newStatus));
        }
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleNewOS = () => {
    setSelectedOS(null);
    setFormInitialMode('edit');
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
    setFormInitialMode('edit');
    setShowFormModal(true);
  };

  const handleFormClose = () => {
    setShowFormModal(false);
  };

  const handleFormSave = async (isNew, osData) => {
    // Update local state optimistically — no full reload needed
    if (isNew && osData) {
      setOrdens(prev => prev.some(o => o.id === osData.id) ? prev.map(o => o.id === osData.id ? { ...o, ...osData } : o) : [osData, ...prev]);
      // Abrir modal de iniciar sessão para a nova OS recém-criada
      setOsSelecaoSessao(osData);
    } else if (!isNew && osData) {
      setOrdens(prev => prev.map(o => o.id === osData.id ? { ...o, ...osData } : o));
      setSelectedOS(prev => prev ? { ...prev, ...osData } : prev);
    }

    // Se é OS relacionada, atualizar a OS original
    if (isNew && selectedOS?._relatedToOS) {
      const originalOS = selectedOS._relatedToOS;
      try {
        const updatedDescription = originalOS.descricao_resumida 
          ? `${originalOS.descricao_resumida}\n\nOS Relacionada Criada: ${osData.codigo}`
          : `OS Relacionada Criada: ${osData.codigo}`;
        const updated = await base44.entities.OrdemServico.update(originalOS.id, { descricao_resumida: updatedDescription });
        setOrdens(prev => prev.map(o => o.id === originalOS.id ? { ...o, ...updated } : o));
      } catch (e) {
        console.error('Error updating original OS:', e);
      }
    }
    
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
      // Update local state — no reload needed
      setOrdens(prev => prev.filter(o => o.id !== deletingOS.id));
      setShowDeleteDialog(false);
      setShowFormModal(false);
      setDeletingOS(null);
      setSelectedOS(null);
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

  if (loading || isOrdensLoading) {
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
            onClick={() => setShowPresentationSetup(true)}
            variant="outline"
            size="sm"
            className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300"
          >
            <Tv2 className="w-4 h-4 mr-2" />
            Apresentação
          </Button>
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
          {viewMode === 'timesheet' ? (
            <OSTimeSheetView
              osEmPlay={filteredOrdens.filter(o => {
                if (o.timesheet_status !== 'playing') return false;
                if (filters.pessoa_id) {
                  return (o.timesheet_sessoes_ativas || []).some(s => s.pessoa_id === filters.pessoa_id) ||
                    o.lider_id === filters.pessoa_id ||
                    (o.executores_ids || []).includes(filters.pessoa_id);
                }
                return true;
              })}
              pessoas={pessoas}
              categorias={categorias}
              subcategorias={subcategorias}
              almoxarifados={almoxarifados}
              regionais={regionais}
              filters={filters}
              onClickOS={handleOSClick}
              currentUser={currentUser}
              currentPessoa={currentPessoa}
              onPauseAll={() => queryClient.invalidateQueries({ queryKey: ['ordens-filtradas'] })}
            />
          ) : viewMode === 'timesheet_relatorio' ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <OSTimeSheetRelatorio pessoas={pessoas} categorias={categorias} subcategorias={subcategorias} almoxarifados={almoxarifados} ordens={ordens} filters={filters} onOSClick={handleOSClick} />
            </div>
          ) : filteredOrdens.length === 0 ? (
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
                  ordens={paginatedOrdens}
                  pessoas={pessoas}
                  categorias={categorias}
                  regionais={regionais}
                  onOSClick={handleOSClick}
                />
              )}
              {viewMode === 'gallery' && (
                <OSGallery
                  ordens={paginatedOrdens}
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
                    setFormInitialMode('edit');
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
              {viewMode === 'pendencias_recebimento' && (
                <OSPendenciasRecebimento
                  ordens={filteredOrdens}
                  categorias={categorias}
                  subcategorias={subcategorias}
                  almoxarifados={almoxarifados}
                  onOSClick={handleOSClick}
                />
              )}
            </>
          )}
        </div>

        {/* Presentation Modal (dentro do fullscreen) */}
        <PresentationSetupModal
          open={showPresentationSetup}
          onClose={() => setShowPresentationSetup(false)}
          onStart={(slides) => {
            setShowPresentationSetup(false);
            setPresentationSlides(slides);
          }}
        />
        {presentationSlides && (
          <PresentationOverlay
            slides={presentationSlides}
            dashData={{
              filteredOrdens,
              pessoas,
              categorias,
              subcategorias: subcategorias || [],
              regionais,
              almoxarifados,
              problemasRecebimento: [],
              categoriaRecebimento: categorias?.find(c => c.nome?.toLowerCase().includes('recebimento')),
              categoriaExpedicao: categorias?.find(c => c.nome?.toLowerCase().includes('expedição')),
              tempoMedioRegularizacaoCompra: 0,
              numItensNFCompra: 0,
              filters,
            }}
            osData={{
              ordens,
              categorias,
              subcategorias: subcategorias || [],
              pessoas,
              regionais,
              almoxarifados,
              instalacoes,
              osFilters: filters,
            }}
            onStop={() => setPresentationSlides(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">Ordens de Serviço</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Gerencie as OS do almoxarifado
            {filteredOrdens.length > 0 && (
              <span className="ml-2 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">
                {filteredOrdens.length} OS
              </span>
            )}
          </p>
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
        pessoas={pessoas}
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
      ) : viewMode === 'timesheet' ? (
        <div className="space-y-2">
          <OSTimeSheetView
            osEmPlay={filteredOrdens.filter(o => {
              if (o.timesheet_status !== 'playing') return false;
              if (filters.pessoa_id) {
                return (o.timesheet_sessoes_ativas || []).some(s => s.pessoa_id === filters.pessoa_id) ||
                  o.lider_id === filters.pessoa_id ||
                  (o.executores_ids || []).includes(filters.pessoa_id);
              }
              return true;
            })}
            pessoas={pessoas}
            categorias={categorias}
            subcategorias={subcategorias}
            almoxarifados={almoxarifados}
            regionais={regionais}
            filters={filters}
            onClickOS={handleOSClick}
            currentUser={currentUser}
            currentPessoa={currentPessoa}
            onPauseAll={() => queryClient.invalidateQueries({ queryKey: ['ordens-filtradas'] })}
          />
        </div>
      ) : viewMode === 'timesheet_relatorio' ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <OSTimeSheetRelatorio pessoas={pessoas} categorias={categorias} subcategorias={subcategorias} almoxarifados={almoxarifados} ordens={ordens} filters={filters} onOSClick={handleOSClick} />
        </div>
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
              currentPessoa={currentPessoa}
              onOSChange={(updatedOS) => setOrdens(prev => prev.map(o => o.id === updatedOS.id ? { ...o, ...updatedOS } : o))}
              onRequestSelecaoSessao={handleRequestSelecaoSessao}
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
              currentPessoa={currentPessoa}
              onOSChange={(updatedOS) => setOrdens(prev => prev.map(o => o.id === updatedOS.id ? { ...o, ...updatedOS } : o))}
              onRequestSelecaoSessao={handleRequestSelecaoSessao}
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
              currentPessoa={currentPessoa}
              onOSChange={(updatedOS) => setOrdens(prev => prev.map(o => o.id === updatedOS.id ? { ...o, ...updatedOS } : o))}
              onRequestSelecaoSessao={handleRequestSelecaoSessao}
            />
          )}
          {viewMode === 'list' && (
            <>
              <OSList
                ordens={paginatedOrdens}
                pessoas={pessoas}
                categorias={categorias}
                regionais={regionais}
                onOSClick={handleOSClick}
              />
              <OSPagination currentPage={currentPage} totalPages={totalPages} total={totalApprox} onChange={setCurrentPage} />
            </>
          )}
          {viewMode === 'gallery' && (
            <>
              <OSGallery
                ordens={paginatedOrdens}
                pessoas={pessoas}
                categorias={categorias}
                regionais={regionais}
                instalacoes={instalacoes}
                onOSClick={handleOSClick}
                rotulos={rotulos}
                currentPessoa={currentPessoa}
                onOSChange={(updatedOS) => setOrdens(prev => prev.map(o => o.id === updatedOS.id ? { ...o, ...updatedOS } : o))}
                onRequestSelecaoSessao={handleRequestSelecaoSessao}
              />
              <OSPagination currentPage={currentPage} totalPages={totalPages} total={totalApprox} onChange={setCurrentPage} />
            </>
          )}
          {viewMode === 'responsavel' && (
            <OSByResponsavel
              ordensServico={filteredOrdens}
              pessoas={pessoas}
              onSelectOS={handleOSClick}
              onNovaOS={(pessoa) => {
                setSelectedOS({ lider_id: pessoa?.id });
                setFormInitialMode('edit');
                setShowFormModal(true);
              }}
            />
          )}
        </>
      )}

      {/* Unified Form/Detail Modal — lazy mount */}
      {showFormModal && (
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
          initialMode={formInitialMode}
          onDelete={handleDeleteOS}
          onCreateRelated={handleCreateRelated}
          canDelete={selectedOS?.id ? canDeleteOS(selectedOS) : false}
        />
      )}

      {/* Presentation */}
      <PresentationSetupModal
        open={showPresentationSetup}
        onClose={() => setShowPresentationSetup(false)}
        onStart={(slides) => {
          setShowPresentationSetup(false);
          setPresentationSlides(slides);
        }}
      />
      {presentationSlides && (
        <PresentationOverlay
          slides={presentationSlides}
          dashData={{
            filteredOrdens,
            pessoas,
            categorias,
            subcategorias: subcategorias || [],
            regionais,
            almoxarifados,
            problemasRecebimento: [],
            categoriaRecebimento: categorias?.find(c => c.nome?.toLowerCase().includes('recebimento')),
            categoriaExpedicao: categorias?.find(c => c.nome?.toLowerCase().includes('expedição')),
            tempoMedioRegularizacaoCompra: 0,
            numItensNFCompra: 0,
            filters,
          }}
          osData={{
            ordens,
            categorias,
            subcategorias: subcategorias || [],
            pessoas,
            regionais,
            almoxarifados,
            instalacoes,
            osFilters: filters,
          }}
          onStop={() => setPresentationSlides(null)}
        />
      )}

      {/* Modal global de seleção de sessão de TimeSheet */}
      <IniciarSessaoModal
        open={!!osSelecaoSessao}
        onClose={() => setOsSelecaoSessao(null)}
        os={osSelecaoSessao}
        pessoas={pessoas}
        currentPessoa={currentPessoa}
        onConfirm={handleConfirmarSessao}
        loading={iniciandoSessao}
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