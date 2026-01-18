import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { base44 } from '@/api/base44Client';
import { format, isToday, isYesterday, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import MentionInput from '@/components/notifications/MentionInput';
import { 
  Edit, 
  Calendar, 
  MapPin, 
  User, 
  Building2, 
  Tag, 
  MessageSquare, 
  Paperclip, 
  Image,
  Send,
  Clock,
  CheckCircle,
  AlertTriangle,
  MoreVertical,
  Trash2,
  Trash,
  Share2,
  FileText,
  Printer,
  Users,
  Plus
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import RelatorioSeparacao from './RelatorioSeparacao';
import ExpedicaoProgressTracker from './ExpedicaoProgressTracker';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const prioridadeConfig = {
  baixa: { color: 'bg-slate-100 text-slate-700', label: 'Baixa' },
  media: { color: 'bg-blue-100 text-blue-700', label: 'Média' },
  alta: { color: 'bg-amber-100 text-amber-700', label: 'Alta' },
  urgente: { color: 'bg-red-100 text-red-700', label: 'Urgente' },
};

const statusConfig = {
  elaboracao: { icon: Clock, color: 'text-slate-500 bg-slate-100', label: 'Em Elaboração' },
  execucao: { icon: AlertTriangle, color: 'text-blue-500 bg-blue-100', label: 'Em Execução' },
  concluido: { icon: CheckCircle, color: 'text-green-500 bg-green-100', label: 'Concluído' },
  cancelado: { icon: AlertTriangle, color: 'text-red-500 bg-red-100', label: 'Cancelado' },
};

export default function OSDetailModal({
  open,
  onClose,
  os,
  regionais,
  almoxarifados,
  pessoas,
  categorias,
  subcategorias,
  instalacoes,
  onEdit,
  onDelete,
  onCreateRelated,
  canDelete,
  onRefresh
}) {
  const [comentarios, setComentarios] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComment, setLoadingComment] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserPessoa, setCurrentUserPessoa] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [showRelatorio, setShowRelatorio] = useState(false);
  const [localOS, setLocalOS] = useState(os);
  const [savingSeparacao, setSavingSeparacao] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (open && os) {
      loadComentarios();
      loadUser();
      setLocalOS(os);
    }
  }, [open, os]);

  useEffect(() => {
    if (!open || !os?.id) return;

    const unsubscribe = base44.entities.OrdemServico.subscribe((event) => {
      if (event.id === os.id && event.type === 'update') {
        setLocalOS(event.data);
        if (onRefresh) onRefresh();
      }
    });

    return unsubscribe;
  }, [open, os?.id]);

  const loadUser = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
      
      // Buscar dados da pessoa para obter foto de perfil
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
      setComentarios(comentariosArray.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)));
      setTimeout(() => scrollToBottom(), 100);
    } catch (e) {
      console.error('Error loading comments:', e);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const extractMentions = (text) => {
    const mentionRegex = /@(\S+(?:\s+\S+)*?)(?=\s|$|@)/g;
    const mentions = [];
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
      const mentionedName = match[1].trim();
      const pessoa = Array.isArray(pessoas) ? pessoas.find(p => 
        p?.nome?.toLowerCase() === mentionedName.toLowerCase()
      ) : null;
      if (pessoa) {
        mentions.push(pessoa.id);
      }
    }
    
    return [...new Set(mentions)];
  };



  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    setLoadingComment(true);
    try {
      const mencoesIds = extractMentions(newComment);
      
      const comentario = await base44.entities.Comentario.create({
        ordem_servico_id: os.id,
        conteudo: newComment,
        autor_nome: currentUser?.full_name || 'Usuário',
        autor_id: currentUserPessoa?.id,
        mencoes_ids: mencoesIds,
        is_deleted: false,
        is_edited: false
      });
      
      // Criar notificações para mencionados
      if (mencoesIds && mencoesIds.length > 0) {
        try {
          const notificacoes = mencoesIds
            .filter(id => id !== currentUserPessoa?.id) // Não notificar a si mesmo
            .map(destinatarioId => ({
              destinatario_id: destinatarioId,
              remetente_id: currentUserPessoa?.id,
              tipo: 'mencao',
              referencia_id: os.id,
              referencia_tipo: 'tarefa',
              mensagem: `Você foi mencionado(a) em um comentário da OS ${os.codigo}`,
              lida: false,
              contexto_adicional: {
                comentario_id: comentario.id
              }
            }));
          
          if (notificacoes.length > 0) {
            await base44.entities.Notificacao.bulkCreate(notificacoes);
          }
        } catch (notifError) {
          console.error('Erro ao criar notificações de menção:', notifError);
        }
      }
      
      setNewComment('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      loadComentarios();
    } catch (e) {
      console.error('Error adding comment:', e);
    } finally {
      setLoadingComment(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddComment();
    }
  };

  const handleEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditingContent(comment.conteudo);
  };

  const handleSaveEdit = async (commentId) => {
    if (!editingContent.trim()) return;
    
    try {
      const mencoesIds = extractMentions(editingContent);
      
      await base44.entities.Comentario.update(commentId, {
        conteudo: editingContent,
        mencoes_ids: mencoesIds,
        is_edited: true
      });
      
      // Criar notificações para novas menções
      if (mencoesIds && mencoesIds.length > 0) {
        try {
          const notificacoes = mencoesIds
            .filter(id => id !== currentUserPessoa?.id) // Não notificar a si mesmo
            .map(destinatarioId => ({
              destinatario_id: destinatarioId,
              remetente_id: currentUserPessoa?.id,
              tipo: 'mencao',
              referencia_id: os.id,
              referencia_tipo: 'tarefa',
              mensagem: `Você foi mencionado(a) em um comentário da OS ${os.codigo}`,
              lida: false,
              contexto_adicional: {
                comentario_id: commentId
              }
            }));
          
          if (notificacoes.length > 0) {
            await base44.entities.Notificacao.bulkCreate(notificacoes);
          }
        } catch (notifError) {
          console.error('Erro ao criar notificações de menção:', notifError);
        }
      }
      
      setEditingCommentId(null);
      setEditingContent('');
      loadComentarios();
    } catch (e) {
      console.error('Error editing comment:', e);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await base44.entities.Comentario.update(commentId, {
        is_deleted: true
      });
      loadComentarios();
    } catch (e) {
      console.error('Error deleting comment:', e);
    }
  };

  const canEditOrDelete = (comment) => {
    if (!currentUserPessoa || comment.autor_id !== currentUserPessoa.id) return false;
    const minutesSinceCreation = differenceInMinutes(new Date(), new Date(comment.created_date));
    return minutesSinceCreation <= 10;
  };

  const handleGeneratePDF = async () => {
    setGeneratingPDF(true);
    setShowRelatorio(true);
    
    // Wait for render
    await new Promise(resolve => setTimeout(resolve, 300));
    
    try {
      const element = document.getElementById('relatorio-separacao');
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate how many pages we need
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = imgWidth / imgHeight;
      
      const pageWidth = pdfWidth;
      const pageHeight = pdfHeight;
      
      // Scale to fit page width
      const scaledHeight = pageWidth / ratio;
      
      // Calculate total pages needed
      const totalPages = Math.ceil(scaledHeight / pageHeight);
      
      for (let i = 0; i < totalPages; i++) {
        if (i > 0) {
          pdf.addPage();
        }
        
        const yOffset = -(pageHeight * i);
        pdf.addImage(imgData, 'PNG', 0, yOffset, pageWidth, scaledHeight);
      }
      
      pdf.save(`Lista_Separacao_${os.codigo}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setGeneratingPDF(false);
      setShowRelatorio(false);
    }
  };

  const handleToggleSeparado = (itemIndex) => {
    const updatedItens = [...(localOS.itens_documento || [])];
    updatedItens[itemIndex] = {
      ...updatedItens[itemIndex],
      separado: !updatedItens[itemIndex].separado
    };
    setLocalOS({ ...localOS, itens_documento: updatedItens });
  };

  const handleSaveSeparacao = async () => {
    setSavingSeparacao(true);
    try {
      await base44.entities.OrdemServico.update(os.id, {
        itens_documento: localOS.itens_documento
      });
      
      // Atualizar fluxo de expedição se aplicável
      if (isExpedicao) {
        await base44.functions.invoke('atualizarFluxoExpedicao', { os_id: os.id });
      }
      
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Erro ao salvar separação:', error);
    } finally {
      setSavingSeparacao(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    onEdit();
  };

  const handleCancelEdit = () => {
    setLocalOS(os);
    setIsEditing(false);
  };

  const handleShareOS = () => {
    const url = `${window.location.origin}${window.location.pathname}?os_id=${os.id}`;
    navigator.clipboard.writeText(url).then(() => {
      // Visual feedback
      const btn = document.getElementById('share-btn');
      if (btn) {
        btn.innerText = 'Copiado!';
        setTimeout(() => {
          btn.innerText = 'Compartilhar';
        }, 2000);
      }
    }).catch(err => {
      console.error('Erro ao copiar URL:', err);
    });
  };

  const getDateSeparator = (date) => {
    if (isToday(new Date(date))) return 'Hoje';
    if (isYesterday(new Date(date))) return 'Ontem';
    return format(new Date(date), "dd 'de' MMMM", { locale: ptBR });
  };

  const groupMessagesByDate = (messages) => {
    const groups = [];
    let currentDate = null;
    
    messages.forEach((msg) => {
      const msgDate = format(new Date(msg.created_date), 'yyyy-MM-dd');
      if (msgDate !== currentDate) {
        groups.push({ type: 'separator', date: msg.created_date });
        currentDate = msgDate;
      }
      groups.push({ type: 'message', data: msg });
    });
    
    return groups;
  };

  if (!os || !localOS) return null;

  const categoria = Array.isArray(categorias) ? categorias.find(c => c?.id === localOS?.categoria_id) : null;
  const regional = Array.isArray(regionais) ? regionais.find(r => r?.id === localOS?.regional_id) : null;
  const almoxarifado = Array.isArray(almoxarifados) ? almoxarifados.find(a => a?.id === localOS?.almoxarifado_id) : null;
  const lider = Array.isArray(pessoas) ? pessoas.find(p => p?.id === localOS?.lider_id) : null;
  const StatusIcon = statusConfig[localOS?.status]?.icon || Clock;
  const isExpedicao = categoria?.nome?.toLowerCase().includes('expedição');
  const hasChanges = JSON.stringify(localOS?.itens_documento) !== JSON.stringify(os?.itens_documento);

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-4 lg:px-6 py-4 border-b bg-slate-50 dark:bg-slate-800">
          <div className="space-y-4">
            {/* Linha 1: Título e Status */}
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
              <div className="flex-1 min-w-0">
                <span className="text-sm font-mono text-slate-500 dark:text-slate-400">{os.codigo}</span>
                <DialogTitle className="text-xl font-semibold mt-1 break-words">
                  {categoria?.nome || 'Ordem de Serviço'}
                </DialogTitle>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={prioridadeConfig[os.prioridade]?.color}>
                  {prioridadeConfig[os.prioridade]?.label}
                </Badge>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${statusConfig[os.status]?.color}`}>
                  <StatusIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">{statusConfig[os.status]?.label}</span>
                </div>
              </div>
            </div>

            {/* Linha 2: Ações */}
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={handleShareOS} id="share-btn" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Compartilhar</span>
              </Button>
              <Button variant="outline" onClick={() => onCreateRelated?.(os)} size="sm" className="border-green-500 text-green-600 hover:bg-green-50">
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Nova OS Relacionada</span>
                <span className="sm:hidden">Relacionada</span>
              </Button>
              {isExpedicao && (
                <Button 
                  variant="outline" 
                  onClick={handleGeneratePDF}
                  disabled={generatingPDF}
                  size="sm"
                  className="border-blue-500 text-blue-600 hover:bg-blue-50"
                >
                  {generatingPDF ? (
                    <span className="text-xs">Gerando...</span>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Lista de Separação</span>
                      <span className="sm:hidden">Lista</span>
                    </>
                  )}
                </Button>
              )}
              <Button onClick={handleEdit} size="sm">
                <Edit className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Editar</span>
              </Button>
              {canDelete && (
                <Button variant="destructive" onClick={() => onDelete?.(os)} size="sm">
                  <Trash className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Excluir</span>
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-140px)]">
          <div className="p-6">
            <Tabs defaultValue="detalhes">
              <TabsList className="mb-6">
                <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
                {isExpedicao && os.itens_documento?.length > 0 && (
                  <TabsTrigger value="materiais">Materiais</TabsTrigger>
                )}
                {isExpedicao && os.volumes?.length > 0 && (
                  <TabsTrigger value="volumes">Volumes</TabsTrigger>
                )}
                {isExpedicao && os.detalhamento_expedicao?.length > 0 && (
                  <TabsTrigger value="expedicao">Expedição</TabsTrigger>
                )}
                <TabsTrigger value="comentarios">
                  Comentários ({comentarios.length})
                </TabsTrigger>
                <TabsTrigger value="anexos">
                  Anexos ({(os.anexos?.length || 0) + (os.imagens?.length || 0)})
                </TabsTrigger>
              </TabsList>

              {/* Detalhes Tab */}
              <TabsContent value="detalhes" className="space-y-6">
                {/* Fluxo de Expedição */}
                {isExpedicao && (
                  <ExpedicaoProgressTracker os={localOS} />
                )}

                {/* Progress */}
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-slate-900 dark:text-white">Progresso</span>
                    <span className="text-2xl font-bold text-blue-600">{os.progresso || 0}%</span>
                  </div>
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all"
                      style={{ width: `${os.progresso || 0}%` }}
                    />
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="flex items-start gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Regional</p>
                      <p className="font-medium text-slate-900 dark:text-white text-sm truncate">{regional?.sigla} - {regional?.descricao}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Almoxarifado</p>
                      <p className="font-medium text-slate-900 dark:text-white text-sm truncate">{almoxarifado?.nome || '-'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Líder</p>
                      <p className="font-medium text-slate-900 dark:text-white text-sm truncate">{lider?.nome || '-'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center shrink-0">
                      <Calendar className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Prazo</p>
                      <p className="font-medium text-slate-900 dark:text-white text-sm">
                        {os.prazo ? format(new Date(os.prazo), "dd/MM/yyyy", { locale: ptBR }) : '-'}
                      </p>
                    </div>
                  </div>

                  {os.num_reserva && (
                    <div className="flex items-start gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="w-10 h-10 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-cyan-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Reserva</p>
                        <p className="font-medium text-slate-900 dark:text-white text-sm truncate">{os.num_reserva}</p>
                      </div>
                    </div>
                  )}

                  {os.usuario_reserva && (
                    <div className="flex items-start gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center shrink-0">
                        <User className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Usuário</p>
                        <p className="font-medium text-slate-900 dark:text-white text-sm truncate">{os.usuario_reserva}</p>
                      </div>
                    </div>
                  )}

                  {(() => {
                    const instalacaoDestino = Array.isArray(instalacoes) ? instalacoes.find(i => i?.id === os.instalacao_destino_id) : null;
                    return instalacaoDestino && (
                      <div className="flex items-start gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/30 rounded-lg flex items-center justify-center shrink-0">
                          <Building2 className="w-5 h-5 text-rose-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-slate-500 dark:text-slate-400">Destino</p>
                          <p className="font-medium text-slate-900 dark:text-white text-sm truncate">{instalacaoDestino.nome}</p>
                        </div>
                      </div>
                    );
                  })()}

                  {os.executores_ids && os.executores_ids.length > 0 && (
                    <div className="flex items-start gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 md:col-span-2 lg:col-span-3">
                      <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900/30 rounded-lg flex items-center justify-center shrink-0">
                        <Users className="w-5 h-5 text-teal-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Executores</p>
                        <div className="flex flex-wrap gap-2">
                          {os.executores_ids.map(execId => {
                            const executor = Array.isArray(pessoas) ? pessoas.find(p => p?.id === execId) : null;
                            return executor ? (
                              <Badge key={execId} variant="outline" className="text-xs">
                                {executor.nome}
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                {os.descricao_resumida && (
                  <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                    <h4 className="font-medium text-slate-900 dark:text-white mb-2">Descrição</h4>
                    <p className="text-slate-600 dark:text-slate-400">{os.descricao_resumida}</p>
                  </div>
                )}

                {/* Notes */}
                {os.anotacoes && (
                  <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                    <h4 className="font-medium text-slate-900 dark:text-white mb-2">Anotações</h4>
                    <p className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{os.anotacoes}</p>
                  </div>
                )}
              </TabsContent>

              {/* Volumes Tab */}
              <TabsContent value="volumes" className="space-y-4">
                {os.volumes?.length > 0 ? (
                  <div className="border rounded-xl overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-slate-50 dark:bg-slate-800">
                        <tr>
                          <th className="text-center p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Quantidade</th>
                          <th className="text-right p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Largura (cm)</th>
                          <th className="text-right p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Altura (cm)</th>
                          <th className="text-right p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Comprimento (cm)</th>
                          <th className="text-right p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Peso (kg)</th>
                          <th className="text-right p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Volume (m³)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {os.volumes.map((volume, i) => (
                          <tr key={i} className="border-t border-slate-100 dark:border-slate-700">
                            <td className="p-3 text-center">{volume.quantidade || 1}</td>
                            <td className="p-3 text-right">{volume.largura || '-'}</td>
                            <td className="p-3 text-right">{volume.altura || '-'}</td>
                            <td className="p-3 text-right">{volume.comprimento || '-'}</td>
                            <td className="p-3 text-right">{volume.peso_bruto || '-'}</td>
                            <td className="p-3 text-right">{volume.m3 || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    Nenhum volume cadastrado
                  </div>
                )}
              </TabsContent>

              {/* Expedição Tab */}
              <TabsContent value="expedicao" className="space-y-4">
                {os.detalhamento_expedicao?.length > 0 ? (
                  <div className="border rounded-xl overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-slate-50 dark:bg-slate-800">
                        <tr>
                          <th className="text-left p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">#</th>
                          <th className="text-left p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Data</th>
                          <th className="text-left p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Tipo Doc</th>
                          <th className="text-left p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Nº Doc</th>
                          <th className="text-center p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Volumes</th>
                          <th className="text-right p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Peso (kg)</th>
                          <th className="text-left p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Modal</th>
                          <th className="text-left p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Transportadora</th>
                          <th className="text-left p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Veículo</th>
                          <th className="text-left p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Motorista</th>
                          <th className="text-right p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Valor Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {os.detalhamento_expedicao.map((exp, i) => (
                          <tr key={i} className="border-t border-slate-100 dark:border-slate-700">
                            <td className="p-3 font-medium">{exp.num_expedicao || i + 1}</td>
                            <td className="p-3 text-sm">
                              {exp.data_expedicao ? format(new Date(exp.data_expedicao), 'dd/MM/yy') : '-'}
                            </td>
                            <td className="p-3">{exp.tipo_doc || '-'}</td>
                            <td className="p-3">{exp.num_doc || '-'}</td>
                            <td className="p-3 text-center">{exp.num_vol || '-'}</td>
                            <td className="p-3 text-right">{exp.peso || '-'}</td>
                            <td className="p-3 text-sm">{exp.modal_transporte || '-'}</td>
                            <td className="p-3 text-sm">{exp.transportadora?.razao_social || '-'}</td>
                            <td className="p-3 text-sm">
                              {exp.veiculo?.placa ? `${exp.veiculo.placa} (${exp.veiculo.estado || ''})` : '-'}
                            </td>
                            <td className="p-3 text-sm">{exp.motorista?.nome || '-'}</td>
                            <td className="p-3 text-right font-medium">
                              {exp.valor_total ? `R$ ${exp.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    Nenhuma expedição cadastrada
                  </div>
                )}
              </TabsContent>

              {/* Materiais Tab */}
              <TabsContent value="materiais" className="space-y-4">
                {localOS.itens_documento?.length > 0 ? (
                  <>
                    <div className="border rounded-xl overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-800">
                          <tr>
                            {isEditing && (
                              <th className="text-center p-3 text-sm font-semibold text-slate-600 dark:text-slate-300 w-12">
                                <input
                                  type="checkbox"
                                  checked={(localOS.itens_documento || []).every(item => item.separado)}
                                  onChange={(e) => {
                                    const allChecked = e.target.checked;
                                    const updatedItens = (localOS.itens_documento || []).map(item => ({
                                      ...item,
                                      separado: allChecked
                                    }));
                                    setLocalOS({ ...localOS, itens_documento: updatedItens });
                                  }}
                                  className="w-4 h-4 cursor-pointer"
                                />
                              </th>
                            )}
                            <th className="text-left p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Código</th>
                            <th className="text-left p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Descrição</th>
                            <th className="text-right p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Qtd</th>
                            <th className="text-left p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Depósito</th>
                            <th className="text-left p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Localização</th>
                            <th className="text-right p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">R$ Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(localOS.itens_documento || []).map((item, i) => (
                            <tr 
                              key={i} 
                              className={`border-t border-slate-100 dark:border-slate-700 transition-colors ${
                                item.separado ? 'bg-green-50 dark:bg-green-900/10' : ''
                              }`}
                            >
                              {isEditing && (
                                <td className="p-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={item.separado || false}
                                    onChange={() => handleToggleSeparado(i)}
                                    className="w-4 h-4 cursor-pointer accent-green-600"
                                  />
                                </td>
                              )}
                              <td className={`p-3 font-mono text-sm ${item.separado ? 'line-through text-green-600' : ''}`}>
                                {item.codigo}
                              </td>
                              <td className={`p-3 ${item.separado ? 'line-through text-green-600' : ''}`}>
                                {item.descricao}
                              </td>
                              <td className={`p-3 text-right ${item.separado ? 'line-through text-green-600' : ''}`}>
                                {item.quantidade} {item.unidade}
                              </td>
                              <td className={`p-3 text-sm ${item.separado ? 'line-through text-green-600' : ''}`}>
                                {item.deposito || '-'}
                              </td>
                              <td className={`p-3 text-sm ${item.separado ? 'line-through text-green-600' : ''}`}>
                                {item.endereco || '-'}
                              </td>
                              <td className={`p-3 text-right font-medium ${item.separado ? 'line-through text-green-600' : ''}`}>
                                R$ {(item.r_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-slate-50 dark:bg-slate-800 border-t-2 border-slate-200 dark:border-slate-700">
                          <tr>
                            <td colSpan={isEditing ? "6" : "5"} className="p-3 text-right font-semibold text-slate-900 dark:text-white">
                              Valor Total:
                            </td>
                            <td className="p-3 text-right font-bold text-blue-600 text-lg">
                              R$ {(localOS.itens_documento || []).reduce((sum, item) => sum + (item.r_total || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {isEditing && hasChanges && (
                      <div className="flex justify-end gap-2 pt-2">
                        <Button
                          variant="outline"
                          onClick={handleCancelEdit}
                          disabled={savingSeparacao}
                        >
                          Cancelar
                        </Button>
                        <Button
                          onClick={handleSaveSeparacao}
                          disabled={savingSeparacao}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {savingSeparacao ? 'Salvando...' : 'Salvar Separação'}
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    Nenhum material cadastrado
                  </div>
                )}
              </TabsContent>

              {/* Comentários Tab - Chat Style */}
              <TabsContent value="comentarios" className="flex flex-col h-[500px]">
                {/* Messages Container */}
                <ScrollArea className="flex-1 pr-4">
                  <div className="space-y-1">
                    {comentarios.length === 0 ? (
                      <div className="text-center py-12 text-slate-400">
                        <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Nenhuma mensagem ainda</p>
                        <p className="text-sm mt-1">Seja o primeiro a comentar</p>
                      </div>
                    ) : (
                      groupMessagesByDate(comentarios).map((item, idx) => {
                        if (item.type === 'separator') {
                          return (
                            <div key={`sep-${idx}`} className="flex items-center gap-3 my-4">
                              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 px-2">
                                {getDateSeparator(item.date)}
                              </span>
                              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                            </div>
                          );
                        }

                        const comment = item.data;
                        const isOwnMessage = currentUserPessoa?.id === comment.autor_id;
                        const commentAuthor = Array.isArray(pessoas) ? pessoas.find(p => p?.id === comment.autor_id) : null;
                        const canEdit = canEditOrDelete(comment);

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
                                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 px-1">
                                  {comment.autor_nome}
                                </span>
                              )}
                              
                              <div className="relative group">
                                <div 
                                  className={`rounded-2xl px-4 py-2 ${
                                    isOwnMessage 
                                      ? 'bg-blue-600 text-white rounded-tr-sm' 
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-tl-sm'
                                  }`}
                                >
                                  {comment.is_deleted ? (
                                    <p className="italic text-slate-400">Mensagem removida</p>
                                  ) : editingCommentId === comment.id ? (
                                   <div className="space-y-2">
                                     <MentionInput
                                       value={editingContent}
                                       onChange={(e) => setEditingContent(e.target.value)}
                                       pessoas={pessoas}
                                       className="min-h-[60px] bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                       textareaRef={React.createRef()}
                                     />
                                      <div className="flex gap-2 justify-end">
                                        <Button 
                                          size="sm" 
                                          variant="ghost"
                                          onClick={() => {
                                            setEditingCommentId(null);
                                            setEditingContent('');
                                          }}
                                        >
                                          Cancelar
                                        </Button>
                                        <Button 
                                          size="sm"
                                          onClick={() => handleSaveEdit(comment.id)}
                                        >
                                          Salvar
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                   <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                                     {comment.conteudo.split(/(@\S+(?:\s+\S+)*?)(?=\s|$|@)/g).map((part, i) => {
                                       if (part.startsWith('@')) {
                                         const mentionedName = part.slice(1);
                                         const isPessoaMentioned = Array.isArray(pessoas) ? pessoas.some(p => 
                                           p?.nome?.toLowerCase() === mentionedName.toLowerCase()
                                         ) : false;
                                         return isPessoaMentioned ? (
                                           <span key={i} className={`font-semibold ${isOwnMessage ? 'text-blue-100' : 'text-blue-600 dark:text-blue-400'}`}>
                                             {part}
                                           </span>
                                         ) : part;
                                       }
                                       return part;
                                     })}
                                   </p>
                                  )}
                                </div>
                                
                                {!comment.is_deleted && canEdit && editingCommentId !== comment.id && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className={`absolute top-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity ${
                                          isOwnMessage ? 'left-[-28px]' : 'right-[-28px]'
                                        }`}
                                      >
                                        <MoreVertical className="w-3 h-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align={isOwnMessage ? 'end' : 'start'}>
                                      <DropdownMenuItem onClick={() => handleEditComment(comment)}>
                                        <Edit className="w-3 h-3 mr-2" />
                                        Editar
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        onClick={() => handleDeleteComment(comment.id)}
                                        className="text-red-600"
                                      >
                                        <Trash2 className="w-3 h-3 mr-2" />
                                        Excluir
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </div>
                              
                              <div className={`flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-1 px-1`}>
                                <span>{format(new Date(comment.created_date), 'HH:mm')}</span>
                                {comment.is_edited && !comment.is_deleted && (
                                  <span className="italic">• editado</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Fixed Input at Bottom */}
                <div className="border-t pt-4 mt-4">
                  <div className="flex gap-3 items-end">
                    <Avatar className="w-9 h-9 shrink-0">
                      {currentUserPessoa?.foto_perfil && (
                        <AvatarImage src={currentUserPessoa.foto_perfil} alt={currentUser?.full_name} />
                      )}
                      <AvatarFallback className="bg-blue-100 text-blue-700 text-sm">
                        {currentUser?.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 relative">
                      <MentionInput
                        ref={textareaRef}
                        textareaRef={textareaRef}
                        placeholder="Digite uma mensagem... (@ para mencionar, Enter para enviar)"
                        value={newComment}
                        onChange={(e) => {
                          setNewComment(e.target.value);
                          if (textareaRef.current) {
                            textareaRef.current.style.height = 'auto';
                            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
                          }
                        }}
                        onKeyDown={handleKeyDown}
                        pessoas={pessoas}
                        className="min-h-[44px] max-h-[120px] resize-none pr-12"
                      />
                      <Button 
                        onClick={handleAddComment} 
                        disabled={loadingComment || !newComment.trim()}
                        size="icon"
                        className="absolute right-2 bottom-2 h-8 w-8 rounded-full"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Anexos Tab */}
              <TabsContent value="anexos" className="space-y-6">
                {/* Images */}
                {os.imagens?.length > 0 && (
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                      <Image className="w-4 h-4" />
                      Imagens ({os.imagens.length})
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {os.imagens.map((url, i) => (
                        <a 
                          key={i} 
                          href={url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 hover:opacity-80 transition-opacity"
                        >
                          <img src={url} alt={`Imagem ${i + 1}`} className="w-full h-full object-cover" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Attachments */}
                {os.anexos?.length > 0 && (
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                      <Paperclip className="w-4 h-4" />
                      Anexos ({os.anexos.length})
                    </h4>
                    <div className="space-y-2">
                      {os.anexos.map((url, i) => (
                        <a 
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                          <Paperclip className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-blue-600 hover:underline">Anexo {i + 1}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {(!os.imagens?.length && !os.anexos?.length) && (
                  <div className="text-center py-12 text-slate-400">
                    Nenhum anexo
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </DialogContent>
      </Dialog>

      {/* Hidden Relatorio for PDF Generation */}
      {showRelatorio && (
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <RelatorioSeparacao
          os={os}
          regional={regional}
          almoxarifado={almoxarifado}
          lider={lider}
          categoria={categoria}
          subcategorias={subcategorias}
          currentUser={currentUser}
        />
      </div>
      )}
      </>
      );
      }