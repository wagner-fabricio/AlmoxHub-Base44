import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { base44 } from '@/api/base44Client';
import {
  X,
  Clock,
  CheckCircle,
  Loader2,
  AlertTriangle,
  MapPin,
  Building2,
  User,
  Calendar,
  Package,
  MessageSquare,
  Paperclip,
  Check,
  Send,
  Camera,
  Image as ImageIcon,
  Upload
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

export default function OSMobileDetail({
  os,
  onClose,
  pessoas,
  categorias,
  subcategorias,
  regionais,
  almoxarifados,
  instalacoes,
  onRefresh
}) {
  const [activeTab, setActiveTab] = useState('detalhes');
  const [checkedItems, setCheckedItems] = useState({});
  const [saving, setSaving] = useState(false);
  const [localProgress, setLocalProgress] = useState(os.progresso || 0);
  const [savingProgress, setSavingProgress] = useState(false);
  const [comentarios, setComentarios] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComment, setLoadingComment] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserPessoa, setCurrentUserPessoa] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedAnexos, setSelectedAnexos] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const categoria = categorias.find(c => c.id === os.categoria_id);
  const regional = regionais.find(r => r.id === os.regional_id);
  const almoxarifado = almoxarifados.find(a => a.id === os.almoxarifado_id);
  const lider = pessoas.find(p => p.id === os.lider_id);
  const instalacaoDestino = instalacoes.find(i => i.id === os.instalacao_destino_id);
  
  const isExpedicao = categoria?.nome?.toLowerCase().includes('expedição');
  const StatusIcon = statusConfig[os.status]?.icon || Clock;

  // Verificar se o usuário atual está associado à OS
  const isUserAssociated = () => {
    if (!currentUserPessoa) return false;
    const userId = currentUserPessoa.id;
    return (
      os.lider_id === userId ||
      os.executores_ids?.includes(userId) ||
      os.outros_envolvidos_ids?.includes(userId)
    );
  };

  const handleStatusClick = async () => {
    if (!isUserAssociated() || changingStatus) return;
    
    // Sequência de status
    const statusSequence = ['elaboracao', 'execucao', 'concluido', 'cancelado'];
    const currentIndex = statusSequence.indexOf(os.status);
    const nextIndex = (currentIndex + 1) % statusSequence.length;
    const nextStatus = statusSequence[nextIndex];
    
    setChangingStatus(true);
    try {
      await base44.entities.OrdemServico.update(os.id, {
        status: nextStatus
      });
      // Atualizar localmente sem fechar o modal
      os.status = nextStatus;
      // Forçar re-render
      setChangingStatus(false);
      setChangingStatus(true);
      setTimeout(() => setChangingStatus(false), 100);
    } catch (error) {
      console.error('Error updating status:', error);
      setChangingStatus(false);
    }
  };

  useEffect(() => {
    // Carregar itens já marcados
    const initialChecked = {};
    (os.itens_documento || []).forEach((item, index) => {
      if (item.separado) {
        initialChecked[index] = true;
      }
    });
    setCheckedItems(initialChecked);
    
    // Carregar usuário ao abrir o modal
    loadUser();
  }, [os.id]);

  useEffect(() => {
    if (activeTab === 'comentarios') {
      loadComentarios();
      const interval = setInterval(() => loadComentarios(), 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const loadUser = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
      const pessoaData = await base44.entities.Pessoa.filter({ user_id: user.id });
      if (Array.isArray(pessoaData) && pessoaData[0]) {
        setCurrentUserPessoa(pessoaData[0]);
      }
    } catch (e) {}
  };

  const loadComentarios = async () => {
    try {
      const data = await base44.entities.Comentario.filter({ ordem_servico_id: os.id });
      const comentariosArray = Array.isArray(data) ? data : [];
            const sortedComentarios = comentariosArray.filter(c => c).sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
            setComentarios(sortedComentarios);
      setTimeout(() => scrollToBottom(), 100);
    } catch (e) {
      console.error('Error loading comments:', e);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !currentUser) return;
    
    setLoadingComment(true);
    try {
      await base44.entities.Comentario.create({
        ordem_servico_id: os.id,
        conteudo: newComment,
        autor_nome: currentUser.full_name || 'Usuário',
        autor_id: currentUser.id,
        is_deleted: false,
        is_edited: false
      });
      
      setNewComment('');
      loadComentarios();
    } catch (e) {
      console.error('Error adding comment:', e);
    } finally {
      setLoadingComment(false);
    }
  };

  const getDateSeparator = (date) => {
    if (isToday(new Date(date))) return 'Hoje';
    if (isYesterday(new Date(date))) return 'Ontem';
    return format(new Date(date), "dd 'de' MMMM", { locale: ptBR });
  };

  const groupMessagesByDate = (messages) => {
    const groups = [];
    let currentDate = null;
    
    (messages || []).forEach((msg) => {
      const msgDate = format(new Date(msg.created_date), 'yyyy-MM-dd');
      if (msgDate !== currentDate) {
        groups.push({ type: 'separator', date: msg.created_date });
        currentDate = msgDate;
      }
      groups.push({ type: 'message', data: msg });
    });
    
    return groups;
  };

  const handleImageUpload = async (file) => {
    if (!file) return;
    
    setUploadingImage(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const currentImages = os.imagens || [];
      await base44.entities.OrdemServico.update(os.id, {
        imagens: [...currentImages, file_url]
      });
      
      onRefresh?.();
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file);
  };

  const toggleImageSelection = (url) => {
    if (selectedImages.includes(url)) {
      setSelectedImages(selectedImages.filter(u => u !== url));
    } else {
      setSelectedImages([...selectedImages, url]);
    }
  };

  const toggleAnexoSelection = (url) => {
    if (selectedAnexos.includes(url)) {
      setSelectedAnexos(selectedAnexos.filter(u => u !== url));
    } else {
      setSelectedAnexos([...selectedAnexos, url]);
    }
  };

  const handleDeleteSelected = async () => {
    setDeleting(true);
    try {
      const newImages = (os.imagens || []).filter(img => !selectedImages.includes(img));
      const newAnexos = (os.anexos || []).filter(anx => !selectedAnexos.includes(anx));
      
      await base44.entities.OrdemServico.update(os.id, {
        imagens: newImages,
        anexos: newAnexos
      });
      
      setSelectedImages([]);
      setSelectedAnexos([]);
      setSelectionMode(false);
      onRefresh?.();
    } catch (error) {
      console.error('Error deleting attachments:', error);
    } finally {
      setDeleting(false);
    }
  };

  const cancelSelection = () => {
    setSelectionMode(false);
    setSelectedImages([]);
    setSelectedAnexos([]);
  };

  const handleProgressChange = async (value) => {
    const newProgress = value[0];
    setLocalProgress(newProgress);
  };

  const handleProgressCommit = async (value) => {
    const newProgress = value[0];
    setSavingProgress(true);
    try {
      await base44.entities.OrdemServico.update(os.id, {
        progresso: newProgress
      });
      // Atualizar estado local sem recarregar a lista
      os.progresso = newProgress;
    } catch (error) {
      console.error('Error updating progress:', error);
    } finally {
      setSavingProgress(false);
    }
  };

  const handleToggleItem = async (index) => {
    const newCheckedItems = {
      ...checkedItems,
      [index]: !checkedItems[index]
    };
    setCheckedItems(newCheckedItems);
    
    // Verificar status de separação
    const totalItems = os.itens_documento?.length || 0;
    const checkedCount = Object.values(newCheckedItems).filter(Boolean).length;
    
    // Atualizar status_separacao localmente no objeto OS sem recarregar
    let needsStatusUpdate = false;
    let newStatus = os.status_separacao;
    
    // Se marcar o primeiro item e não estiver em separação, mudar para 'em_separacao'
    if (checkedCount >= 1 && checkedCount < totalItems && os.status_separacao !== 'em_separacao') {
      newStatus = 'em_separacao';
      needsStatusUpdate = true;
    }
    
    // Se todos os itens estiverem marcados, mudar para 'separado'
    if (checkedCount === totalItems && totalItems > 0 && os.status_separacao !== 'separado') {
      newStatus = 'separado';
      needsStatusUpdate = true;
    }
    
    // Se desmarcar todos, voltar para 'pendente'
    if (checkedCount === 0 && os.status_separacao !== 'pendente') {
      newStatus = 'pendente';
      needsStatusUpdate = true;
    }
    
    // Atualizar status se necessário, mas não recarregar
    if (needsStatusUpdate) {
      await base44.entities.OrdemServico.update(os.id, {
        status_separacao: newStatus
      });
      // Atualizar apenas o status local sem refresh
      os.status_separacao = newStatus;
    }
  };

  const handleSavePicking = async () => {
    setSaving(true);
    try {
      const updatedItems = (os.itens_documento || []).map((item, index) => ({
        ...item,
        separado: checkedItems[index] || false
      }));

      await base44.entities.OrdemServico.update(os.id, {
        itens_documento: updatedItems
      });

      onRefresh?.();
      onClose();
    } catch (error) {
      console.error('Error saving picking:', error);
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'detalhes', label: 'Detalhes', icon: Clock },
    ...(isExpedicao && os.itens_documento?.length > 0 ? [{ id: 'materiais', label: 'Materiais', icon: Package }] : []),
    { id: 'comentarios', label: 'Chat', icon: MessageSquare },
    { id: 'anexos', label: 'Anexos', icon: Paperclip }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header com gradiente */}
      <div 
        className="p-4 shadow-lg"
        style={{ 
          background: `linear-gradient(135deg, ${categoria?.cor || '#3b82f6'} 0%, ${categoria?.cor || '#3b82f6'}dd 100%)`
        }}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white hover:bg-white/20 rounded-full shrink-0"
              >
                <X className="w-6 h-6" />
              </Button>
              <p className="text-white/90 text-sm font-mono">{os.codigo}</p>
            </div>
            <h2 className="text-2xl font-bold text-white mb-1 px-2">{categoria?.nome || 'Ordem de Serviço'}</h2>
          </div>
          <div className={`${prioridadeConfig[os.prioridade]?.color} rounded-xl px-3 py-1 shrink-0`}>
            <span className="text-white text-xs font-bold">{prioridadeConfig[os.prioridade]?.label}</span>
          </div>
        </div>

        {/* Progress Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-white/90 text-sm font-medium">Progresso</span>
            <span className="text-white text-lg font-bold">{localProgress}%</span>
          </div>
          <Slider
            value={[localProgress]}
            onValueChange={handleProgressChange}
            onValueCommit={handleProgressCommit}
            max={100}
            step={5}
            className="cursor-pointer"
            disabled={savingProgress}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[80px] py-3 px-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-slate-600'
                }`}
              >
                <TabIcon className="w-5 h-5 mx-auto mb-1" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-24">
        {activeTab === 'detalhes' && (
          <div className="space-y-3">
            {/* Status Badge */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <button
                onClick={handleStatusClick}
                disabled={!isUserAssociated() || changingStatus}
                className={`${statusConfig[os.status]?.color} text-white text-sm py-2 px-4 w-full rounded-md flex items-center justify-center gap-2 disabled:opacity-50 transition-all ${isUserAssociated() && !changingStatus ? 'active:scale-95' : ''}`}
              >
                {changingStatus ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <StatusIcon className="w-4 h-4" />
                    {statusConfig[os.status]?.label}
                  </>
                )}
              </button>
            </div>

            {/* Info Cards */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-blue-600 mb-2">
                    <MapPin className="w-5 h-5" />
                    <span className="text-xs font-medium">Regional</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900">{regional?.sigla}</p>
                </div>

                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-amber-600 mb-2">
                    <Building2 className="w-5 h-5" />
                    <span className="text-xs font-medium">Almoxarifado</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 truncate">{almoxarifado?.nome || '-'}</p>
                </div>
              </div>

              {instalacaoDestino && (
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-rose-600 mb-2">
                    <Building2 className="w-5 h-5" />
                    <span className="text-xs font-medium">Destino</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900">{instalacaoDestino.nome}</p>
                </div>
              )}

              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-2 text-green-600 mb-2">
                  <User className="w-5 h-5" />
                  <span className="text-xs font-medium">Líder</span>
                </div>
                <p className="text-sm font-bold text-slate-900 truncate">{lider?.nome || '-'}</p>
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-2 text-purple-600 mb-2">
                  <Calendar className="w-5 h-5" />
                  <span className="text-xs font-medium">Prazo</span>
                </div>
                <p className="text-sm font-bold text-slate-900">
                  {os.prazo ? format(new Date(os.prazo), 'dd/MM/yy') : '-'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {os.num_reserva && (
                  <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-cyan-600 mb-2">
                      <Package className="w-5 h-5" />
                      <span className="text-xs font-medium">Reserva</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900">{os.num_reserva}</p>
                  </div>
                )}

                {os.usuario_reserva && (
                  <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-indigo-600 mb-2">
                      <User className="w-5 h-5" />
                      <span className="text-xs font-medium">Usuário</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900">{os.usuario_reserva}</p>
                  </div>
                )}
              </div>
            </div>



            {/* Executores */}
            {os.executores_ids?.length > 0 && (
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-2 text-teal-600 mb-3">
                  <User className="w-5 h-5" />
                  <span className="text-xs font-medium">Executores</span>
                </div>
                <div className="space-y-2">
                  {((os.executores_ids || []).filter(id => id)).map(execId => {
                    const executor = (pessoas || []).find(p => p && p.id === execId);
                    return executor ? (
                      <div key={execId} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold text-sm">
                          {executor.nome.charAt(0)}
                        </div>
                        <span className="text-sm text-slate-900">{executor.nome}</span>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {/* Descrição */}
            {os.descricao_resumida && (
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <h4 className="text-xs font-medium text-slate-600 mb-2">Descrição</h4>
                <p className="text-sm text-slate-900 whitespace-pre-wrap">{os.descricao_resumida}</p>
              </div>
            )}

            {/* Anotações */}
            {os.anotacoes && (
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <h4 className="text-xs font-medium text-slate-600 mb-2">Anotações</h4>
                <p className="text-sm text-slate-900 whitespace-pre-wrap">{os.anotacoes}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'materiais' && (
          <div className="space-y-3">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-4 shadow-lg mb-4">
              <h3 className="text-white font-bold text-lg mb-1">Lista de Separação</h3>
              <p className="text-white/80 text-sm">Marque os itens conforme separa</p>
            </div>

            {(!os.itens_documento || os.itens_documento?.length === 0) ? (
              <div className="text-center py-12 text-slate-500">
                <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Nenhum material cadastrado</p>
              </div>
            ) : (
              ((os.itens_documento || []).filter(item => item)).map((item, index) => (
                <label
                  key={index}
                  className={`block bg-white rounded-2xl p-4 shadow-sm transition-all ${
                    checkedItems[index] ? 'ring-2 ring-green-500 bg-green-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <Checkbox
                        checked={checkedItems[index] || item.separado || false}
                        onCheckedChange={() => handleToggleItem(index)}
                        className="w-6 h-6 rounded-lg"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      {/* Linha 1: Código e Check */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <p className="text-lg font-bold font-mono text-slate-900">
                          {item.codigo}
                        </p>
                        {(checkedItems[index] || item.separado) && (
                          <div className="bg-green-500 rounded-full p-1">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                      
                      {/* Linha 2: Descrição */}
                      <p className={`text-sm font-medium mb-2 ${checkedItems[index] ? 'text-green-700 line-through' : 'text-slate-900'}`}>
                        {item.descricao}
                      </p>
                      
                      {/* Info adicional */}
                      <div className="flex items-center gap-4 text-xs flex-wrap">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-500">Qtd:</span>
                          <span className={`font-bold ${checkedItems[index] ? 'text-green-700' : 'text-blue-600'}`}>
                            {item.quantidade} {item.unidade}
                          </span>
                        </div>
                        {item.endereco && (
                          <div className="flex items-center gap-1">
                            <span className="text-slate-500">Local:</span>
                            <span className="font-medium text-slate-700">{item.endereco}</span>
                          </div>
                        )}
                        {item.deposito && (
                          <Badge variant="outline" className="text-xs">
                            Dep. {item.deposito}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </label>
              ))
            )}

            {os.itens_documento?.length > 0 && Object.keys(checkedItems).length > 0 && (
              <div className="fixed bottom-4 left-4 right-4 z-20">
                <Button
                  onClick={handleSavePicking}
                  disabled={saving}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-6 text-lg rounded-2xl shadow-2xl"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5 mr-2" />
                      Salvar Separação ({Object.keys(checkedItems).length} itens)
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'comentarios' && (
          <div className="flex flex-col h-[calc(100vh-280px)]">
            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto space-y-1">
              {comentarios.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma mensagem ainda</p>
                  <p className="text-sm mt-1">Seja o primeiro a comentar</p>
                </div>
              ) : (
                groupMessagesByDate(comentarios || []).map((item, idx) => {
                  if (item.type === 'separator') {
                    return (
                      <div key={`sep-${idx}`} className="flex items-center gap-3 my-4">
                        <div className="flex-1 h-px bg-slate-200" />
                        <span className="text-xs font-medium text-slate-500 px-2">
                          {getDateSeparator(item.date)}
                        </span>
                        <div className="flex-1 h-px bg-slate-200" />
                      </div>
                    );
                  }

                  const comment = item.data;
                   const isOwnMessage = currentUser?.id === comment.autor_id;
                   const commentAuthor = pessoas.find(p => p.id === comment.autor_id);

                  return (
                    <div 
                      key={comment.id} 
                      className={`flex gap-2 mb-2 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      <Avatar className="w-8 h-8 shrink-0 mt-1">
                        {commentAuthor?.foto_perfil && (
                          <AvatarImage src={commentAuthor.foto_perfil} alt={comment.autor_nome} />
                        )}
                        <AvatarFallback className={`text-xs ${isOwnMessage ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-700'}`}>
                          {comment.autor_nome?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-[75%]`}>
                        {!isOwnMessage && (
                          <span className="text-xs font-medium text-slate-600 mb-1 px-1">
                            {comment.autor_nome}
                          </span>
                        )}
                        
                        <div 
                          className={`rounded-2xl px-4 py-2 ${
                            isOwnMessage 
                              ? 'text-white rounded-tr-sm' 
                              : 'bg-white text-slate-900 rounded-tl-sm shadow-sm'
                          }`}
                          style={isOwnMessage ? { backgroundColor: '#0000FF' } : {}}
                        >
                          {comment.is_deleted ? (
                            <p className="italic text-slate-400">Mensagem removida</p>
                          ) : (
                            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                              {comment.conteudo}
                            </p>
                          )}
                        </div>
                        
                        <span className="text-xs text-slate-500 mt-1 px-1">
                          {format(new Date(comment.created_date), 'HH:mm')}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Fixed Input at Bottom */}
            <div className="border-t pt-3 mt-3 bg-white">
              <div className="flex gap-2">
                <Input
                   value={newComment}
                   onChange={(e) => setNewComment(e.target.value)}
                   onKeyDown={(e) => {
                     if (e.key === 'Enter' && !e.shiftKey) {
                       e.preventDefault();
                       handleAddComment();
                     }
                   }}
                   placeholder="Digite uma mensagem..."
                   className="flex-1 rounded-full bg-slate-50"
                   disabled={!currentUser}
                 />
                 <Button
                   onClick={handleAddComment}
                   disabled={!newComment.trim() || loadingComment || !currentUser}
                   size="icon"
                   className="rounded-full shrink-0"
                   style={{ backgroundColor: '#0000FF' }}
                 >
                  {loadingComment ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'anexos' && (
          <div className="space-y-4">
            {/* Botões de Upload e Seleção */}
            <div className="flex gap-3">
              {!selectionMode ? (
                <>
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  <Button
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="flex-1 py-6 rounded-2xl shadow-md flex flex-col gap-2"
                    style={{ backgroundColor: '#0000FF' }}
                  >
                    {uploadingImage ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <>
                        <Camera className="w-6 h-6" />
                        <span className="text-sm">Câmera</span>
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="flex-1 py-6 rounded-2xl shadow-md flex flex-col gap-2"
                    style={{ backgroundColor: '#0A003C' }}
                  >
                    {uploadingImage ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <>
                        <ImageIcon className="w-6 h-6" />
                        <span className="text-sm">Galeria</span>
                      </>
                    )}
                  </Button>

                  {(os.imagens?.length > 0 || os.anexos?.length > 0) && (
                    <Button
                      onClick={() => setSelectionMode(true)}
                      variant="outline"
                      className="px-4 py-6 rounded-2xl shadow-md"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button
                    onClick={cancelSelection}
                    variant="outline"
                    className="flex-1 py-6 rounded-2xl"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleDeleteSelected}
                    disabled={(selectedImages.length === 0 && selectedAnexos.length === 0) || deleting}
                    className="flex-1 py-6 rounded-2xl bg-red-500 hover:bg-red-600"
                  >
                    {deleting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      `Excluir (${selectedImages.length + selectedAnexos.length})`
                    )}
                  </Button>
                </>
              )}
            </div>

            {/* Imagens */}
            {os.imagens?.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <ImageIcon className="w-5 h-5 text-blue-600" />
                  <h4 className="text-sm font-medium text-slate-700">Imagens ({os.imagens.length})</h4>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {(os.imagens || []).map((url, i) => (
                    <div
                      key={i}
                      onClick={(e) => {
                        if (selectionMode) {
                          e.preventDefault();
                          toggleImageSelection(url);
                        }
                      }}
                      className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 shadow-md hover:shadow-lg transition-shadow"
                    >
                      {!selectionMode ? (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full h-full"
                        >
                          <img src={url} alt={`Imagem ${i + 1}`} className="w-full h-full object-cover" />
                        </a>
                      ) : (
                        <>
                          <img src={url} alt={`Imagem ${i + 1}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                            <div className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center ${
                              selectedImages.includes(url) ? 'bg-blue-500' : 'bg-transparent'
                            }`}>
                              {selectedImages.includes(url) && <Check className="w-5 h-5 text-white" />}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Documentos/Arquivos */}
            {os.anexos?.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Paperclip className="w-5 h-5 text-purple-600" />
                  <h4 className="text-sm font-medium text-slate-700">Documentos ({os.anexos.length})</h4>
                </div>
                <div className="space-y-2">
                  {(os.anexos || []).map((url, i) => {
                    const fileName = url.split('/').pop()?.split('?')[0] || `Documento ${i + 1}`;
                    const fileExtension = fileName.split('.').pop()?.toUpperCase() || 'ARQUIVO';
                    const isSelected = selectedAnexos.includes(url);
                    
                    return (
                      <div
                        key={i}
                        onClick={(e) => {
                          if (selectionMode) {
                            e.preventDefault();
                            toggleAnexoSelection(url);
                          }
                        }}
                        className={`flex items-center gap-3 p-4 bg-white rounded-2xl shadow-md hover:shadow-lg transition-all ${
                          !selectionMode ? 'active:scale-95' : ''
                        } ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                      >
                        {selectionMode && (
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-blue-500 border-blue-500' : 'border-slate-300'
                          }`}>
                            {isSelected && <Check className="w-4 h-4 text-white" />}
                          </div>
                        )}
                        
                        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                          <Paperclip className="w-6 h-6 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{fileName}</p>
                          <p className="text-xs text-slate-500">{fileExtension}</p>
                        </div>
                        
                        {!selectionMode && (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Upload className="w-5 h-5 text-slate-400 rotate-180 shrink-0" />
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {(!os.imagens?.length && !os.anexos?.length) && (
              <div className="text-center py-8 text-slate-500">
                <Upload className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Use os botões acima para adicionar fotos</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}