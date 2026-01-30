import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MentionInput from '@/components/notifications/MentionInput';
import { 
  MessageSquare, 
  Send, 
  Loader2, 
  ArrowLeft, 
  Calendar,
  MapPin,
  User,
  Building2,
  Clock,
  AlertTriangle,
  CheckCircle,
  MoreVertical,
  Trash2,
  Edit
} from 'lucide-react';
import { format, isToday, isYesterday, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { createPageUrl } from '@/utils';
import { notifyCommentMention } from '@/components/notifications/PushNotificationHelper';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

export default function OSComentariosTab({ currentPessoa, pessoas }) {
  const [ordensComComentarios, setOrdensComComentarios] = useState([]);
  const [osSelecionada, setOsSelecionada] = useState(null);
  const [comentarios, setComentarios] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComment, setLoadingComment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mentionedIds, setMentionedIds] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [regionais, setRegionais] = useState([]);
  const [almoxarifados, setAlmoxarifados] = useState([]);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadOSComComentarios();
    loadEntities();
  }, [currentPessoa]);

  useEffect(() => {
    if (osSelecionada) {
      loadComentarios(osSelecionada.id);
      const interval = setInterval(() => loadComentarios(osSelecionada.id), 5000);
      return () => clearInterval(interval);
    }
  }, [osSelecionada]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const osId = urlParams.get('os_id');
    if (osId && ordensComComentarios.length > 0) {
      const os = ordensComComentarios.find(o => o.id === osId);
      if (os) {
        setOsSelecionada(os);
        // Limpar URL
        window.history.replaceState({}, '', window.location.pathname + '?tab=os');
      }
    }
  }, [ordensComComentarios]);

  const loadEntities = async () => {
    try {
      const [cats, regs, almoxs] = await Promise.all([
        base44.entities.Categoria.list(),
        base44.entities.Regional.list(),
        base44.entities.Almoxarifado.list()
      ]);
      setCategorias(cats);
      setRegionais(regs);
      setAlmoxarifados(almoxs);
    } catch (error) {
      console.error('Erro ao carregar entidades:', error);
    }
  };

  const loadOSComComentarios = async () => {
    if (!currentPessoa?.id) return;
    
    setLoading(true);
    try {
      // Buscar comentários onde o usuário é autor ou foi mencionado
      const [comentariosAutor, todasNotificacoes] = await Promise.all([
        base44.entities.Comentario.filter({ autor_id: currentPessoa.id }),
        base44.entities.Notificacao.filter({ 
          destinatario_id: currentPessoa.id,
          tipo: 'mencao',
          referencia_tipo: 'tarefa'
        })
      ]);

      // Pegar IDs únicos de OSs
      const osIds = new Set();
      (comentariosAutor || []).forEach(c => osIds.add(c.ordem_servico_id));
      (todasNotificacoes || []).forEach(n => osIds.add(n.referencia_id));

      // Buscar OSs com progresso < 100%
      if (osIds.size > 0) {
        const ordensPromises = Array.from(osIds).map(id => 
          base44.entities.OrdemServico.filter({ id }).then(r => r[0])
        );
        const ordens = await Promise.all(ordensPromises);
        
        // Filtrar progresso < 100% e ordenar por última atualização
        const ordensValidas = ordens
          .filter(o => o && (o.progresso === undefined || o.progresso < 100))
          .sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date));
        
        setOrdensComComentarios(ordensValidas);
      } else {
        setOrdensComComentarios([]);
      }
    } catch (error) {
      console.error('Erro ao carregar OS com comentários:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadComentarios = async (osId) => {
    try {
      const data = await base44.entities.Comentario.filter({ ordem_servico_id: osId });
      const comentariosArray = Array.isArray(data) ? data : [];
      setComentarios(comentariosArray.sort((a, b) => 
        new Date(a.created_date) - new Date(b.created_date)
      ));
      setTimeout(() => scrollToBottom(), 100);
    } catch (error) {
      console.error('Erro ao carregar comentários:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !osSelecionada) return;
    
    setLoadingComment(true);
    try {
      const comentario = await base44.entities.Comentario.create({
        ordem_servico_id: osSelecionada.id,
        conteudo: newComment,
        autor_nome: currentPessoa.nome,
        autor_id: currentPessoa.id,
        mencoes_ids: mentionedIds,
        is_deleted: false,
        is_edited: false
      });

      // Criar notificações para mencionados
      if (mentionedIds?.length > 0) {
        try {
          const notificacoes = mentionedIds
            .filter(id => id !== currentPessoa.id)
            .map(destinatarioId => ({
              destinatario_id: destinatarioId,
              remetente_id: currentPessoa.id,
              tipo: 'mencao',
              referencia_id: osSelecionada.id,
              referencia_tipo: 'tarefa',
              mensagem: `Você foi mencionado(a) em um comentário da OS ${osSelecionada.codigo}`,
              lida: false,
              contexto_adicional: {
                comentario_id: comentario.id,
                os_codigo: osSelecionada.codigo,
                url: `${createPageUrl('Mensagens')}?tab=os&os_id=${osSelecionada.id}`
              }
            }));
          
          if (notificacoes.length > 0) {
            await base44.entities.Notificacao.bulkCreate(notificacoes);
            
            // Enviar push notifications
            for (const mencaoId of mentionedIds.filter(id => id !== currentPessoa.id)) {
              notifyCommentMention(osSelecionada, mencaoId, currentPessoa.nome);
            }
          }
        } catch (notifError) {
          console.error('Erro ao criar notificações de menção:', notifError);
        }
      }
      
      setNewComment('');
      setMentionedIds([]);
      loadComentarios(osSelecionada.id);
      loadOSComComentarios(); // Atualizar lista
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
    } finally {
      setLoadingComment(false);
    }
  };

  const handleEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditingContent(comment.conteudo);
  };

  const handleSaveEdit = async (commentId) => {
    if (!editingContent.trim()) return;
    
    try {
      const extractMentions = (text) => {
        const mentionRegex = /@(\S+(?:\s+\S+)*?)(?=\s|$|@)/g;
        const mentions = [];
        let match;
        
        while ((match = mentionRegex.exec(text)) !== null) {
          const mentionedName = match[1].trim();
          const pessoa = pessoas.find(p => 
            p?.nome?.toLowerCase() === mentionedName.toLowerCase()
          );
          if (pessoa) mentions.push(pessoa.id);
        }
        
        return [...new Set(mentions)];
      };

      const mencoesIds = extractMentions(editingContent);
      
      await base44.entities.Comentario.update(commentId, {
        conteudo: editingContent,
        mencoes_ids: mencoesIds,
        is_edited: true
      });
      
      // Criar notificações para novas menções
      if (mencoesIds?.length > 0) {
        const notificacoes = mencoesIds
          .filter(id => id !== currentPessoa.id)
          .map(destinatarioId => ({
            destinatario_id: destinatarioId,
            remetente_id: currentPessoa.id,
            tipo: 'mencao',
            referencia_id: osSelecionada.id,
            referencia_tipo: 'tarefa',
            mensagem: `Você foi mencionado(a) em um comentário da OS ${osSelecionada.codigo}`,
            lida: false,
            contexto_adicional: {
              comentario_id: commentId,
              os_codigo: osSelecionada.codigo,
              url: `${createPageUrl('Mensagens')}?tab=os&os_id=${osSelecionada.id}`
            }
          }));
        
        if (notificacoes.length > 0) {
          await base44.entities.Notificacao.bulkCreate(notificacoes);
        }
      }
      
      setEditingCommentId(null);
      setEditingContent('');
      loadComentarios(osSelecionada.id);
    } catch (error) {
      console.error('Erro ao editar comentário:', error);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await base44.entities.Comentario.update(commentId, {
        is_deleted: true
      });
      loadComentarios(osSelecionada.id);
    } catch (error) {
      console.error('Erro ao deletar comentário:', error);
    }
  };

  const canEditOrDelete = (comment) => {
    if (!currentPessoa || comment.autor_id !== currentPessoa.id) return false;
    const minutesSinceCreation = differenceInMinutes(new Date(), new Date(comment.created_date));
    return minutesSinceCreation <= 10;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // Vista da lista de OSs
  if (!osSelecionada) {
    return (
      <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Comentários de OS</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            OSs em andamento com conversas em que você participou
          </p>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6">
            {ordensComComentarios.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                <p className="text-slate-500 dark:text-slate-400">Nenhuma OS em andamento com comentários</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {ordensComComentarios.map((os) => {
                  const categoria = categorias.find(c => c.id === os.categoria_id);
                  const regional = regionais.find(r => r.id === os.regional_id);
                  const almoxarifado = almoxarifados.find(a => a.id === os.almoxarifado_id);
                  const lider = pessoas.find(p => p.id === os.lider_id);
                  const StatusIcon = statusConfig[os.status]?.icon || Clock;
                  
                  return (
                    <button
                      key={os.id}
                      onClick={() => setOsSelecionada(os)}
                      className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:shadow-lg transition-all text-left overflow-hidden"
                    >
                      <div 
                        className="h-2" 
                        style={{ backgroundColor: categoria?.cor || '#3b82f6' }}
                      />
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-mono text-xs text-slate-500 dark:text-slate-400 mb-1">
                              {os.codigo}
                            </p>
                            <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-1 truncate">
                              {categoria?.nome || 'Ordem de Serviço'}
                            </h3>
                          </div>
                          <div className="flex items-center gap-1">
                            <Badge className={prioridadeConfig[os.prioridade]?.color} className="text-xs px-2 py-0.5">
                              {prioridadeConfig[os.prioridade]?.label}
                            </Badge>
                          </div>
                        </div>

                        {os.descricao_resumida && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                            {os.descricao_resumida}
                          </p>
                        )}

                        <div className="space-y-2 text-xs mb-3">
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span className="truncate">{regional?.sigla} - {almoxarifado?.nome}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <User className="w-3 h-3 shrink-0" />
                            <span className="truncate">{lider?.nome || '-'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <Calendar className="w-3 h-3 shrink-0" />
                            <span>{os.prazo ? format(new Date(os.prazo), 'dd/MM/yyyy') : '-'}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
                          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${statusConfig[os.status]?.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            <span className="font-medium">{statusConfig[os.status]?.label}</span>
                          </div>
                          <div className="text-xs font-semibold text-blue-600">
                            {os.progresso || 0}%
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    );
  }

  // Vista do chat da OS selecionada
  const categoria = categorias.find(c => c.id === osSelecionada.categoria_id);
  const regional = regionais.find(r => r.id === osSelecionada.regional_id);
  const almoxarifado = almoxarifados.find(a => a.id === osSelecionada.almoxarifado_id);
  const lider = pessoas.find(p => p.id === osSelecionada.lider_id);
  const StatusIcon = statusConfig[osSelecionada.status]?.icon || Clock;
  
  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900">
      {/* Header da OS */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOsSelecionada(null)}
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-mono text-slate-500 dark:text-slate-400">{osSelecionada.codigo}</span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                {categoria?.nome || 'Ordem de Serviço'}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={prioridadeConfig[osSelecionada.prioridade]?.color}>
              {prioridadeConfig[osSelecionada.prioridade]?.label}
            </Badge>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${statusConfig[osSelecionada.status]?.color}`}>
              <StatusIcon className="w-4 h-4" />
              <span className="text-sm font-medium">{statusConfig[osSelecionada.status]?.label}</span>
            </div>
          </div>
        </div>

        {/* Informações Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-slate-400" />
            <div className="min-w-0">
              <p className="text-xs text-slate-500 dark:text-slate-400">Regional</p>
              <p className="font-medium text-slate-900 dark:text-white truncate">{regional?.sigla}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="w-4 h-4 text-slate-400" />
            <div className="min-w-0">
              <p className="text-xs text-slate-500 dark:text-slate-400">Almoxarifado</p>
              <p className="font-medium text-slate-900 dark:text-white truncate">{almoxarifado?.nome}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-slate-400" />
            <div className="min-w-0">
              <p className="text-xs text-slate-500 dark:text-slate-400">Líder</p>
              <p className="font-medium text-slate-900 dark:text-white truncate">{lider?.nome}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-slate-400" />
            <div className="min-w-0">
              <p className="text-xs text-slate-500 dark:text-slate-400">Prazo</p>
              <p className="font-medium text-slate-900 dark:text-white">
                {osSelecionada.prazo ? format(new Date(osSelecionada.prazo), 'dd/MM/yyyy') : '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Progresso */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Progresso</span>
            <span className="text-lg font-bold text-blue-600">{osSelecionada.progresso || 0}%</span>
          </div>
          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all"
              style={{ width: `${osSelecionada.progresso || 0}%` }}
            />
          </div>
        </div>
      </div>