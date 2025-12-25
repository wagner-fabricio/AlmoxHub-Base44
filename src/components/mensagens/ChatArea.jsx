import React, { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MoreVertical, Reply, Edit2, Trash2, X, Send, Users, Settings } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from '@/components/ui/textarea';

export default function ChatArea({ 
  conversa, 
  mensagens, 
  participantes,
  pessoas,
  currentPessoaId,
  onEnviarMensagem,
  onEditarMensagem,
  onExcluirMensagem,
  onAbrirDetalhes
}) {
  const [novaMensagem, setNovaMensagem] = useState('');
  const [mensagemEditando, setMensagemEditando] = useState(null);
  const [mensagemRespondendo, setMensagemRespondendo] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mensagens]);

  const handleEnviar = () => {
    if (!novaMensagem.trim()) return;

    if (mensagemEditando) {
      onEditarMensagem(mensagemEditando.id, novaMensagem);
      setMensagemEditando(null);
    } else {
      onEnviarMensagem(novaMensagem, mensagemRespondendo);
      setMensagemRespondendo(null);
    }
    setNovaMensagem('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEnviar();
    }
  };

  const formatarDataSeparador = (data) => {
    const date = new Date(data);
    if (isToday(date)) return 'Hoje';
    if (isYesterday(date)) return 'Ontem';
    return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const formatarHora = (data) => {
    return format(new Date(data), 'HH:mm');
  };

  const getPessoaById = (id) => pessoas.find(p => p.id === id);

  const getOutraPessoa = () => {
    if (conversa.tipo === 'grupo') return null;
    const outroPart = participantes.find(p => p.pessoa_id !== currentPessoaId);
    return getPessoaById(outroPart?.pessoa_id);
  };

  const getNomeConversa = () => {
    if (conversa.tipo === 'grupo') return conversa.nome_grupo || 'Grupo sem nome';
    const outraPessoa = getOutraPessoa();
    return outraPessoa?.nome || 'Usuário';
  };

  const renderSeparadorData = (mensagem, index) => {
    if (index === 0) return (
      <div className="flex justify-center my-4">
        <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs px-3 py-1 rounded-full">
          {formatarDataSeparador(mensagem.created_date)}
        </span>
      </div>
    );

    const mensagemAnterior = mensagens[index - 1];
    if (!isSameDay(new Date(mensagem.created_date), new Date(mensagemAnterior.created_date))) {
      return (
        <div className="flex justify-center my-4">
          <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs px-3 py-1 rounded-full">
            {formatarDataSeparador(mensagem.created_date)}
          </span>
        </div>
      );
    }
    return null;
  };

  if (!conversa) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center text-slate-500 dark:text-slate-400">
          <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">Selecione uma conversa</h3>
          <p className="text-sm">Escolha uma conversa existente ou inicie uma nova</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback className="bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                {conversa.tipo === 'grupo' ? '👥' : getNomeConversa().charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">{getNomeConversa()}</h2>
              {conversa.tipo === 'grupo' && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {participantes.filter(p => p.status === 'ativo').length} participantes
                </p>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onAbrirDetalhes}>
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Mensagens */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-900 space-y-4">
        {mensagens.map((mensagem, index) => {
          const isMinha = mensagem.autor_id === currentPessoaId;
          const autor = getPessoaById(mensagem.autor_id);
          const mostrarAvatar = conversa.tipo === 'grupo' && !isMinha;

          return (
            <React.Fragment key={mensagem.id}>
              {renderSeparadorData(mensagem, index)}
              
              <div className={`flex gap-2 ${isMinha ? 'flex-row-reverse' : 'flex-row'}`}>
                {mostrarAvatar && (
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarFallback className="text-xs bg-slate-200 dark:bg-slate-700">
                      {autor?.nome?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className={`flex flex-col max-w-[70%] ${isMinha ? 'items-end' : 'items-start'}`}>
                  {conversa.tipo === 'grupo' && !isMinha && (
                    <span className="text-xs text-slate-600 dark:text-slate-400 mb-1 px-2">
                      {mensagem.autor_nome}
                    </span>
                  )}
                  
                  <div className={`
                    group relative rounded-2xl px-4 py-2
                    ${mensagem.status === 'excluida' 
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 italic' 
                      : isMinha 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700'
                    }
                  `}>
                    {mensagem.status !== 'excluida' && isMinha && (
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setMensagemRespondendo(mensagem);
                            }}>
                              <Reply className="w-4 h-4 mr-2" />
                              Responder
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setMensagemEditando(mensagem);
                              setNovaMensagem(mensagem.conteudo);
                            }}>
                              <Edit2 className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => onExcluirMensagem(mensagem.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}

                    {mensagem.mensagem_citada_conteudo && (
                      <div className={`
                        mb-2 p-2 rounded-lg border-l-2 text-xs
                        ${isMinha 
                          ? 'bg-blue-700 border-white' 
                          : 'bg-slate-100 dark:bg-slate-700 border-slate-400'
                        }
                      `}>
                        <div className="font-semibold mb-1">{mensagem.mensagem_citada_autor}</div>
                        <div className="opacity-80 line-clamp-2">{mensagem.mensagem_citada_conteudo}</div>
                      </div>
                    )}

                    <p className="text-sm whitespace-pre-wrap break-words">
                      {mensagem.status === 'excluida' ? 'Mensagem excluída' : mensagem.conteudo}
                    </p>
                    
                    <div className="flex items-center justify-end gap-2 mt-1">
                      <span className={`text-xs ${isMinha ? 'text-white/70' : 'text-slate-500 dark:text-slate-400'}`}>
                        {formatarHora(mensagem.created_date)}
                      </span>
                      {mensagem.status === 'editada' && (
                        <span className={`text-xs italic ${isMinha ? 'text-white/70' : 'text-slate-500'}`}>
                          editada
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Input */}
      <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
        {(mensagemEditando || mensagemRespondendo) && (
          <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-start justify-between">
            <div className="flex-1">
              <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
                {mensagemEditando ? '✏️ Editando mensagem' : '↩️ Respondendo'}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-300 line-clamp-1">
                {mensagemEditando?.conteudo || mensagemRespondendo?.conteudo}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setMensagemEditando(null);
                setMensagemRespondendo(null);
                setNovaMensagem('');
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        <div className="flex gap-2">
          <Textarea
            value={novaMensagem}
            onChange={(e) => setNovaMensagem(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Digite uma mensagem..."
            className="resize-none min-h-[44px] max-h-32"
            rows={1}
          />
          <Button
            onClick={handleEnviar}
            disabled={!novaMensagem.trim()}
            className="shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}