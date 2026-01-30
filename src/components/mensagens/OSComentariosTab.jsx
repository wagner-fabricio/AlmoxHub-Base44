import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import MentionInput from '@/components/notifications/MentionInput';
import { MessageSquare, Send, Loader2, Package, ArrowLeft } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { createPageUrl } from '@/utils';
import { notifyCommentMention } from '@/components/notifications/PushNotificationHelper';

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

      // Buscar OSs
      if (osIds.size > 0) {
        const ordensPromises = Array.from(osIds).map(id => 
          base44.entities.OrdemServico.filter({ id }).then(r => r[0])
        );
        const ordens = await Promise.all(ordensPromises);
        
        // Ordenar por última atualização
        const ordensValidas = ordens.filter(Boolean).sort((a, b) => 
          new Date(b.updated_date) - new Date(a.updated_date)
        );
        
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
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Comentários de OS</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            OSs com conversas em que você participou
          </p>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            {ordensComComentarios.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                <p className="text-slate-500 dark:text-slate-400">Nenhum comentário ainda</p>
              </div>
            ) : (
              ordensComComentarios.map((os) => {
                const categoria = categorias.find(c => c.id === os.categoria_id);
                const regional = regionais.find(r => r.id === os.regional_id);
                const almoxarifado = almoxarifados.find(a => a.id === os.almoxarifado_id);
                
                return (
                  <button
                    key={os.id}
                    onClick={() => setOsSelecionada(os)}
                    className="w-full bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 hover:border-blue-500 transition-all text-left"
                  >
                    <div className="flex items-start gap-3">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: categoria?.cor || '#3b82f6' }}
                      >
                        <Package className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-sm text-slate-500 dark:text-slate-400 mb-1">
                          {os.codigo}
                        </p>
                        <p className="font-semibold text-slate-900 dark:text-white mb-2">
                          {categoria?.nome || 'Ordem de Serviço'}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {regional?.sigla}
                          </Badge>
                          <Badge variant="outline" className="text-xs truncate max-w-[150px]">
                            {almoxarifado?.nome}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>
    );
  }

  // Vista do chat da OS selecionada
  const categoria = categorias.find(c => c.id === osSelecionada.categoria_id);
  
  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900">
      {/* Header da OS */}
      <div 
        className="p-4 border-b border-slate-200 dark:border-slate-700 shrink-0"
        style={{ 
          background: `linear-gradient(135deg, ${categoria?.cor || '#3b82f6'} 0%, ${categoria?.cor || '#3b82f6'}dd 100%)`
        }}
      >
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOsSelecionada(null)}
            className="text-white hover:bg-white/20 shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <p className="text-white/90 text-sm font-mono mb-1">{osSelecionada.codigo}</p>
            <p className="text-white font-semibold truncate">{categoria?.nome || 'Ordem de Serviço'}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(`${createPageUrl('OrdensServico')}?os_id=${osSelecionada.id}`, '_blank')}
            className="text-white hover:bg-white/20 text-xs"
          >
            Abrir OS
          </Button>
        </div>
      </div>

      {/* Messages Container */}
      <ScrollArea className="flex-1 p-4">
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
              const isOwnMessage = currentPessoa?.id === comment.autor_id;
              const commentAuthor = pessoas.find(p => p?.id === comment.autor_id);

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
                    
                    <div 
                      className={`rounded-2xl px-4 py-2 ${
                        isOwnMessage 
                          ? 'bg-blue-600 text-white rounded-tr-sm' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-tl-sm'
                      }`}
                    >
                      {comment.is_deleted ? (
                        <p className="italic text-slate-400">Mensagem removida</p>
                      ) : (
                        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                          {comment.conteudo.split(/(@\S+(?:\s+\S+)*?)(?=\s|$|@)/g).map((part, i) => {
                            if (part.startsWith('@')) {
                              const mentionedName = part.slice(1);
                              const isPessoaMentioned = pessoas.some(p => 
                                p?.nome?.toLowerCase() === mentionedName.toLowerCase()
                              );
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
                    
                    <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-1 px-1">
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
      <div className="border-t border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-800 shrink-0">
        <div className="flex gap-3 items-end">
          <Avatar className="w-9 h-9 shrink-0">
            {currentPessoa?.foto_perfil && (
              <AvatarImage src={currentPessoa.foto_perfil} alt={currentPessoa?.nome} />
            )}
            <AvatarFallback className="bg-blue-100 text-blue-700 text-sm">
              {currentPessoa?.nome?.charAt(0) || 'U'}
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
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAddComment();
                }
              }}
              pessoas={pessoas}
              onMentionsChange={setMentionedIds}
              className="min-h-[44px] max-h-[120px] resize-none pr-12"
            />
            <Button 
              onClick={handleAddComment} 
              disabled={loadingComment || !newComment.trim()}
              size="icon"
              className="absolute right-2 bottom-2 h-8 w-8 rounded-full"
            >
              {loadingComment ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}