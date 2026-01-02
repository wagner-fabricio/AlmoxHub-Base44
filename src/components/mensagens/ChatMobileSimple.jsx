import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { base44 } from '@/api/base44Client';
import { X, Send, Loader2 } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ChatMobileSimple({
  conversa,
  onClose,
  pessoas,
  currentPessoaId,
  onRefresh
}) {
  const [mensagens, setMensagens] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [participantes, setParticipantes] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (conversa) {
      loadData();
      const interval = setInterval(loadMensagens, 5000);
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
      const mensagensOrdenadas = (mensagensArray || []).sort((a, b) => 
        new Date(a.created_date) - new Date(b.created_date)
      );
      setMensagens(mensagensOrdenadas || []);
      scrollToBottom();
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
      const participanteResult = await base44.entities.ParticipanteConversa.filter({
        conversa_id: conversa.id,
        pessoa_id: currentPessoaId
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

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const currentPessoa = pessoas.find(p => p.id === currentPessoaId);
      
      await base44.entities.MensagemChat.create({
        conversa_id: conversa.id,
        autor_id: currentPessoaId,
        autor_nome: currentPessoa?.nome || 'Usuário',
        conteudo: newMessage,
        status: 'enviada'
      });

      await base44.entities.Conversa.update(conversa.id, {
        ultima_mensagem: newMessage.substring(0, 50),
        ultima_mensagem_data: new Date().toISOString(),
        ultima_mensagem_autor: currentPessoa?.nome || ''
      });

      // Incrementar contador para outros participantes
      await Promise.all(
        participantes
          .filter(p => p.pessoa_id !== currentPessoaId)
          .map(p => 
            base44.entities.ParticipanteConversa.update(p.id, {
              mensagens_nao_lidas: (p.mensagens_nao_lidas || 0) + 1
            })
          )
      );

      setNewMessage('');
      await loadMensagens();
      onRefresh?.();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const getNomeConversa = () => {
    if (conversa.tipo === 'grupo') {
      return conversa.nome_grupo;
    }
    
    const outroPessoa = participantes.find(p => p.pessoa_id !== currentPessoaId);
    if (outroPessoa) {
      const pessoa = pessoas.find(p => p.id === outroPessoa.pessoa_id);
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
    
    const outroPessoa = participantes.find(p => p.pessoa_id !== currentPessoaId);
    if (outroPessoa) {
      const pessoa = pessoas.find(p => p.id === outroPessoa.pessoa_id);
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

  const avatar = getAvatarInfo();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
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
          <div className="text-center py-12 text-slate-500">
            <p>Nenhuma mensagem ainda</p>
            <p className="text-sm mt-1">Comece a conversa</p>
          </div>
        ) : (
          groupMessagesByDate(mensagens || []).map((item, idx) => {
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

            const message = item.data;
            const isOwnMessage = message.autor_id === currentPessoaId;
            const autor = pessoas.find(p => p.id === message.autor_id);

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
                        : 'bg-white text-slate-900 rounded-tl-sm shadow-sm'
                    }`}
                    style={isOwnMessage ? { backgroundColor: '#0000FF' } : {}}
                  >
                    {message.status === 'excluida' ? (
                      <p className="italic text-slate-400">Mensagem removida</p>
                    ) : (
                      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                        {message.conteudo}
                      </p>
                    )}
                  </div>
                  
                  <span className="text-xs text-slate-500 mt-1 px-1">
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
      <div className="p-4 bg-white border-t border-slate-200">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Digite uma mensagem..."
            className="flex-1 rounded-full bg-slate-50"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            size="icon"
            className="rounded-full shrink-0"
            style={{ backgroundColor: '#0000FF' }}
          >
            {sending ? (
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