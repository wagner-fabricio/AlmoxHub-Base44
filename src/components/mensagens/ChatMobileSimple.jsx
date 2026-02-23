import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { base44 } from '@/api/base44Client';
import { X, Send, Loader2, Paperclip, Download } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import MentionInput from '@/components/notifications/MentionInput';

export default function ChatMobileSimple({
  conversa,
  onClose,
  pessoas,
  currentPessoaId,
  currentUserId,
  currentUserName,
  onRefresh
}) {
  const [mensagens, setMensagens] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [mencoesIds, setMencoesIds] = useState([]);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [participantes, setParticipantes] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (conversa) {
      loadData();
      // Polling mais espaçado para reduzir carga
      const interval = setInterval(loadMensagens, 8000);
      return () => clearInterval(interval);
    }
  }, [conversa]);

  const loadData = async () => {
    await Promise.all([loadMensagens(), loadParticipantes()]);
    setLoading(false);
  };

  const loadMensagens = async () => {
    try {
      const msgs = await base44.entities.MensagemChat.filter({ conversa_id: conversa.id });
      const mensagensArray = Array.isArray(msgs) ? msgs : [];
      const mensagensOrdenadas = mensagensArray.sort((a, b) => 
        new Date(a.created_date) - new Date(b.created_date)
      );
      
      // Evitar re-render se mensagens não mudaram
      setMensagens(prev => {
        if (prev.length === mensagensOrdenadas.length) {
          const prevIds = prev.map(m => m.id).join(',');
          const newIds = mensagensOrdenadas.map(m => m.id).join(',');
          if (prevIds === newIds) return prev;
        }
        scrollToBottom();
        return mensagensOrdenadas;
      });
      
      marcarComoLida();
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const loadParticipantes = async () => {
    try {
      const parts = await base44.entities.ParticipanteConversa.filter({ conversa_id: conversa.id });
      setParticipantes(Array.isArray(parts) ? parts : []);
    } catch (error) {
      console.error('Error loading participants:', error);
    }
  };

  const marcarComoLida = async () => {
   try {
     const userId = currentPessoaId || currentUserId;
     if (!userId) return;

     const participanteResult = await base44.entities.ParticipanteConversa.filter({
       conversa_id: conversa.id,
       pessoa_id: userId
     });
     const participante = Array.isArray(participanteResult) && participanteResult.length > 0 ? participanteResult[0] : null;

     if (participante && participante.mensagens_nao_lidas > 0) {
       await base44.entities.ParticipanteConversa.update(participante.id, {
         mensagens_nao_lidas: 0,
         ultima_leitura: new Date().toISOString()
       });
     }
   } catch (error) {
     console.error('Error marking as read:', error);
   }
  };

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setSelectedFiles(files.slice(0, 5)); // Max 5 arquivos
    }
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async () => {
    const textoLimpo = newMessage.trim();
    if (!textoLimpo && selectedFiles.length === 0) return;
    if (sending) return;
    
    const autorId = currentPessoaId || currentUserId;
    const autorNome = currentUserName || (pessoas || []).find(p => p.id === currentPessoaId)?.nome || 'Usuário';
    
    if (!autorId) return;

    setSending(true);
    setUploadingFiles(true);
    try {
      // Upload de arquivos se houver
      let anexos = [];
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          anexos.push({
            file_url,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size
          });
        }
      }

      const mensagemCriada = await base44.entities.MensagemChat.create({
        conversa_id: conversa.id,
        autor_id: autorId,
        autor_nome: autorNome,
        conteudo: textoLimpo || ' ',
        mencoes_ids: mencoesIds,
        anexos: anexos,
        status: 'enviada'
      });

      // Criar notificações para mencionados
      if (mencoesIds && mencoesIds.length > 0) {
        try {
          const notificacoes = mencoesIds
            .filter(id => id !== currentPessoaId)
            .map(destinatarioId => ({
              destinatario_id: destinatarioId,
              remetente_id: currentPessoaId,
              tipo: 'mencao',
              referencia_id: conversa.id,
              referencia_tipo: 'conversa',
              mensagem: `Você foi mencionado(a) na conversa "${conversa.nome_grupo || 'privada'}"`,
              lida: false
            }));
          
          if (notificacoes.length > 0) {
            await base44.entities.Notificacao.bulkCreate(notificacoes);
          }
        } catch (notifError) {
          console.error('Erro ao criar notificações de menção:', notifError);
        }
      }

      const previewMsg = textoLimpo || (anexos.length > 0 ? '📎 Anexo' : '');
      await base44.entities.Conversa.update(conversa.id, {
        ultima_mensagem: previewMsg.substring(0, 50),
        ultima_mensagem_data: new Date().toISOString(),
        ultima_mensagem_autor: autorNome
      });

      // Incrementar contador para outros participantes
      await Promise.all(
        ((participantes || [])
          .filter(p => p && p.pessoa_id !== (currentPessoaId || currentUserId)) || [])
          .map(p => 
            base44.entities.ParticipanteConversa.update(p.id, {
              mensagens_nao_lidas: (p.mensagens_nao_lidas || 0) + 1
            })
          )
      );

      setNewMessage('');
      setMencoesIds([]);
      setSelectedFiles([]);
      await loadMensagens();
      onRefresh?.();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
      setUploadingFiles(false);
    }
  };

  const getNomeConversa = () => {
   if (conversa.tipo === 'grupo') {
     return conversa.nome_grupo;
   }

   const userId = currentPessoaId || currentUserId;
   const outroPessoa = (participantes || []).find(p => p.pessoa_id !== userId);
   if (outroPessoa) {
     const pessoa = (pessoas || []).find(p => p.id === outroPessoa.pessoa_id);
     return pessoa?.nome || 'Conversa';
   }
   return 'Conversa';
  };

  const getAvatarInfo = () => {
   if (conversa.tipo === 'grupo') {
     return {
       initials: conversa.nome_grupo?.substring(0, 2).toUpperCase() || 'G',
       url: conversa.avatar_grupo,
       isGroup: true
     };
   }

   const userId = currentPessoaId || currentUserId;
   const outroPessoa = (participantes || []).find(p => p.pessoa_id !== userId);
   if (outroPessoa) {
     const pessoa = (pessoas || []).find(p => p.id === outroPessoa.pessoa_id);
     return {
       initials: pessoa?.nome?.charAt(0) || 'U',
       url: pessoa?.foto_perfil,
       isGroup: false
     };
   }
   return { initials: 'U', url: null, isGroup: false };
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

  const avatar = getAvatarInfo();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="p-4 shadow-lg sticky top-0 z-10" style={{ backgroundColor: '#0000FF' }}>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full shrink-0"
          >
            <X className="w-6 h-6" />
          </Button>

          {avatar.url ? (
            <img
              src={avatar.url}
              alt={getNomeConversa()}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
              avatar.isGroup ? 'bg-white/20' : 'bg-white/30'
            }`}>
              {avatar.initials}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-white truncate">{getNomeConversa()}</h2>
            {conversa.tipo === 'grupo' && (
              <p className="text-white/80 text-xs">{participantes.length} participantes</p>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {mensagens.length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            <p>Nenhuma mensagem ainda</p>
            <p className="text-sm mt-1">Comece a conversa</p>
          </div>
        ) : (
          (groupMessagesByDate(mensagens || []) || []).map((item, idx) => {
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

            const message = item.data;
            const isOwnMessage = message.autor_id === (currentPessoaId || currentUserId);
            const autor = (pessoas || []).find(p => p.id === message.autor_id);

            return (
              <div 
                key={message.id} 
                className={`flex gap-2 mb-2 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {!isOwnMessage && (
                  <Avatar className="w-8 h-8 shrink-0 mt-1">
                    {autor?.foto_perfil && <AvatarImage src={autor.foto_perfil} />}
                    <AvatarFallback className="bg-slate-200 text-slate-700 text-xs">
                      {message.autor_nome?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-[75%]`}>
                  {!isOwnMessage && conversa.tipo === 'grupo' && (
                    <span className="text-xs font-medium text-slate-600 mb-1 px-1">
                      {message.autor_nome}
                    </span>
                  )}
                  
                  <div 
                    className={`rounded-2xl px-4 py-2 ${
                      isOwnMessage 
                        ? 'text-white rounded-tr-sm' 
                        : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-tl-sm shadow-sm'
                    }`}
                    style={isOwnMessage ? { backgroundColor: '#0000FF' } : {}}
                  >
                    {message.status === 'excluida' ? (
                      <p className="italic text-slate-400">Mensagem removida</p>
                    ) : (
                      <>
                        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                          {message.conteudo}
                        </p>
                        {message.anexos && message.anexos.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {message.anexos.map((anexo, idx) => (
                              <a
                                key={idx}
                                href={anexo.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center gap-2 px-2 py-1 rounded text-xs ${
                                  isOwnMessage 
                                    ? 'bg-blue-700 hover:bg-blue-600' 
                                    : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'
                                }`}
                              >
                                <Download className="w-3 h-3" />
                                <span className="truncate max-w-[180px]">{anexo.file_name}</span>
                              </a>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  
                  <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 px-1">
                    {format(new Date(message.created_date), 'HH:mm')}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
        {selectedFiles.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 px-3 py-2 rounded-lg">
                <Paperclip className="w-4 h-4" />
                <span className="text-sm truncate max-w-[120px]">{file.name}</span>
                <button
                  onClick={() => handleRemoveFile(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingFiles}
            className="rounded-full shrink-0 bg-white dark:bg-slate-800"
          >
            <Paperclip className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          </Button>
          <MentionInput
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Digite uma mensagem... (@ para mencionar)"
            className="flex-1 rounded-full bg-slate-50"
            pessoas={pessoas}
            onMentionsChange={setMencoesIds}
            disabled={!currentPessoaId && !currentUserId}
          />
          <Button
            onClick={handleSendMessage}
            disabled={(!newMessage.trim() && selectedFiles.length === 0) || sending || uploadingFiles || (!currentPessoaId && !currentUserId)}
            size="icon"
            className="rounded-full shrink-0"
            style={{ backgroundColor: '#0000FF' }}
          >
            {sending || uploadingFiles ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}