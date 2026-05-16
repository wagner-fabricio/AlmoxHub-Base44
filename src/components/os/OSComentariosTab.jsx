import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { base44 } from '@/api/base44Client';
import { format, isToday, isYesterday, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import MentionInput from '@/components/notifications/MentionInput';
import {
  MessageSquare, Send, Edit, Trash2, MoreVertical
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { notifyCommentMention } from '@/components/notifications/PushNotificationHelper';
import { createPageUrl } from '@/utils';

const PAGE_SIZE = 20;

export default function OSComentariosTab({
  os,
  pessoas,
  currentUser,
  currentUserPessoa,
  isActive,
}) {
  const [comentarios, setComentarios] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComment, setLoadingComment] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [page, setPage] = useState(1);
  const editingTextareaRef = useRef(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (isActive && !loaded && os?.id) {
      loadComentarios();
    }
  }, [isActive, os?.id]);

  const loadComentarios = async () => {
    try {
      const data = await base44.entities.Comentario.filter({ ordem_servico_id: os.id });
      const arr = Array.isArray(data) ? data : [];
      setComentarios(arr.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)));
      setLoaded(true);
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
      if (pessoa) mentions.push(pessoa.id);
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

      if (mencoesIds && mencoesIds.length > 0) {
        try {
          const notificacoes = mencoesIds
            .filter(id => id !== currentUserPessoa?.id)
            .map(destinatarioId => ({
              destinatario_id: destinatarioId,
              remetente_id: currentUserPessoa?.id,
              tipo: 'mencao',
              referencia_id: os.id,
              referencia_tipo: 'tarefa',
              mensagem: `Você foi mencionado(a) em um comentário da OS ${os.codigo}`,
              lida: false,
              contexto_adicional: {
                comentario_id: comentario.id,
                os_codigo: os.codigo,
                url: `${createPageUrl('OrdensServico')}?os_id=${os.id}&tab=comentarios`
              }
            }));
          if (notificacoes.length > 0) {
            await base44.entities.Notificacao.bulkCreate(notificacoes);
            for (const mencaoId of mencoesIds.filter(id => id !== currentUserPessoa?.id)) {
              notifyCommentMention(os, mencaoId, currentUser?.full_name || 'Usuário');
            }
          }
        } catch (notifError) {
          console.error('Erro ao criar notificações de menção:', notifError);
        }
      }

      setComentarios(prev => [...prev, comentario]);
      setNewComment('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      setTimeout(() => scrollToBottom(), 50);
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

      if (mencoesIds && mencoesIds.length > 0) {
        try {
          const notificacoes = mencoesIds
            .filter(id => id !== currentUserPessoa?.id)
            .map(destinatarioId => ({
              destinatario_id: destinatarioId,
              remetente_id: currentUserPessoa?.id,
              tipo: 'mencao',
              referencia_id: os.id,
              referencia_tipo: 'tarefa',
              mensagem: `Você foi mencionado(a) em um comentário da OS ${os.codigo}`,
              lida: false,
              contexto_adicional: {
                comentario_id: commentId,
                os_codigo: os.codigo,
                url: `${createPageUrl('OrdensServico')}?os_id=${os.id}&tab=comentarios`
              }
            }));
          if (notificacoes.length > 0) {
            await base44.entities.Notificacao.bulkCreate(notificacoes);
          }
        } catch (notifError) {
          console.error('Erro ao criar notificações de menção:', notifError);
        }
      }

      setComentarios(prev => prev.map(c => c.id === commentId
        ? { ...c, conteudo: editingContent, mencoes_ids: mencoesIds, is_edited: true }
        : c
      ));
      setEditingCommentId(null);
      setEditingContent('');
    } catch (e) {
      console.error('Error editing comment:', e);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await base44.entities.Comentario.update(commentId, { is_deleted: true });
      setComentarios(prev => prev.map(c => c.id === commentId ? { ...c, is_deleted: true } : c));
    } catch (e) {
      console.error('Error deleting comment:', e);
    }
  };

  const canEditOrDelete = (comment) => {
    if (!currentUserPessoa || comment.autor_id !== currentUserPessoa.id) return false;
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

  return (
    <div className="flex flex-col">
      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-1">
          {!loaded ? (
            <div className="text-center py-12 text-slate-400">Carregando...</div>
          ) : comentarios.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma mensagem ainda</p>
              <p className="text-sm mt-1">Seja o primeiro a comentar</p>
            </div>
          ) : (
            <>
              {comentarios.length > PAGE_SIZE && (
                <div className="flex items-center justify-between mb-3 px-1">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="text-xs text-blue-600 disabled:text-slate-300 hover:underline">← Anteriores</button>
                  <span className="text-xs text-slate-500">{page}/{Math.ceil(comentarios.length / PAGE_SIZE)}</span>
                  <button onClick={() => setPage(p => Math.min(Math.ceil(comentarios.length / PAGE_SIZE), p + 1))} disabled={page >= Math.ceil(comentarios.length / PAGE_SIZE)} className="text-xs text-blue-600 disabled:text-slate-300 hover:underline">Próximos →</button>
                </div>
              )}
              {groupMessagesByDate(
                comentarios.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
              ).map((item, idx) => {
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
                  <div key={comment.id} className={`flex gap-2 mb-2 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
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
                        <div className={`rounded-2xl px-4 py-2 ${
                          isOwnMessage
                            ? 'bg-blue-600 text-white rounded-tr-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-tl-sm'
                        }`}>
                          {comment.is_deleted ? (
                            <p className="italic text-slate-400">Mensagem removida</p>
                          ) : editingCommentId === comment.id ? (
                            <div className="space-y-2">
                              <MentionInput
                                value={editingContent}
                                onChange={(e) => setEditingContent(e.target.value)}
                                pessoas={pessoas}
                                className="min-h-[60px] bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                textareaRef={editingTextareaRef}
                              />
                              <div className="flex gap-2 justify-end">
                                <Button size="sm" variant="ghost" onClick={() => { setEditingCommentId(null); setEditingContent(''); }}>Cancelar</Button>
                                <Button size="sm" onClick={() => handleSaveEdit(comment.id)}>Salvar</Button>
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
                                className={`absolute top-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity ${isOwnMessage ? 'left-[-28px]' : 'right-[-28px]'}`}
                              >
                                <MoreVertical className="w-3 h-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align={isOwnMessage ? 'end' : 'start'}>
                              <DropdownMenuItem onClick={() => handleEditComment(comment)}>
                                <Edit className="w-3 h-3 mr-2" />Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteComment(comment.id)} className="text-red-600">
                                <Trash2 className="w-3 h-3 mr-2" />Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-1 px-1">
                        <span>{format(new Date(comment.created_date), 'HH:mm')}</span>
                        {comment.is_edited && !comment.is_deleted && (
                          <span className="italic">• editado</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

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
    </div>
  );
}