import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { X, Send, Users, Settings, ArrowLeft, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import MentionInput from '@/components/notifications/MentionInput';
import GrupoDetalhesModal from '@/components/mensagens/GrupoDetalhesModal';
import RichTextEditor from '@/components/mensagens/RichTextEditor';
import MessageContent from '@/components/mensagens/MessageContent';
import OSCard from '@/components/mensagens/OSCard';
import OSDetailModal from '@/components/os/OSDetailModal';
import MessageBubble from '@/components/mensagens/MessageBubble';

export default function ChatArea({ 
  conversa, 
  mensagens, 
  participantes,
  pessoas,
  currentPessoaId,
  onEnviarMensagem,
  onEditarMensagem,
  onExcluirMensagem,
  onAbrirDetalhes,
  onVoltar,
  onLimparMensagens,
  onExcluirConversa
}) {
  const [novaMensagem, setNovaMensagem] = useState('');
  const [mensagemEditando, setMensagemEditando] = useState(null);
  const [mensagemRespondendo, setMensagemRespondendo] = useState(null);
  const [mencoesIds, setMencoesIds] = useState([]);
  const [showGrupoDetalhes, setShowGrupoDetalhes] = useState(false);
  const [osDetailModal, setOsDetailModal] = useState(null);
  const scrollRef = useRef(null);
  const mentionInputRef = useRef(null);
  const isUserScrollingRef = useRef(false);
  const lastMessageCountRef = useRef(0);

  // Scroll inteligente - só rola automaticamente se usuário não estiver lendo histórico
  useEffect(() => {
    if (!scrollRef.current) return;
    
    const mensagensCount = Array.isArray(mensagens) ? mensagens.length : 0;
    const isNewMessage = mensagensCount > lastMessageCountRef.current;
    lastMessageCountRef.current = mensagensCount;

    if (isNewMessage && !isUserScrollingRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mensagens]);

  // Detectar quando usuário está rolando manualmente
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      isUserScrollingRef.current = !isNearBottom;
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, []);

  const handleEnviar = useCallback(async () => {
    if (!novaMensagem.trim()) return;

    // Extrair entidades (OSs) do texto
    const conteudoFormatado = parseMessageContent(novaMensagem);

    if (mensagemEditando) {
      onEditarMensagem(mensagemEditando.id, novaMensagem, conteudoFormatado);
      setMensagemEditando(null);
    } else {
      onEnviarMensagem(novaMensagem, mensagemRespondendo, mencoesIds, conteudoFormatado);
      setMensagemRespondendo(null);
      
      // Criar notificações para pessoas mencionadas
      if (mencoesIds && mencoesIds.length > 0) {
        try {
          const notificacoes = mencoesIds.map(destinatarioId => ({
            destinatario_id: destinatarioId,
            remetente_id: currentPessoaId,
            tipo: 'mencao',
            referencia_id: conversa.id,
            referencia_tipo: 'conversa',
            mensagem: `Você foi mencionado(a) na conversa "${conversa.nome_grupo || 'privada'}"`,
            lida: false
          }));
          
          await base44.entities.Notificacao.bulkCreate(notificacoes);
        } catch (notifError) {
          console.error('Erro ao criar notificações de menção:', notifError);
        }
      }
    }
    setNovaMensagem('');
    setMencoesIds([]);
  }, [novaMensagem, mensagemEditando, mensagemRespondendo, mencoesIds, onEditarMensagem, onEnviarMensagem, currentPessoaId, conversa]);

  const parseMessageContent = (text) => {
    if (!text) return { text: '', entities: [] };
    
    // Sanitizar texto para prevenir XSS
    const sanitizedText = text.trim().substring(0, 10000);
    
    const entities = [];
    
    try {
      // Detectar links de OS em URLs (ex: ?os_id=xxx ou ?id=xxx)
      const urlRegex = /(?:os_id|id)=([a-f0-9]{24})/gi;
      let match;
      while ((match = urlRegex.exec(sanitizedText)) !== null) {
        entities.push({
          type: 'ordem_servico',
          offset: match.index,
          length: match[0].length,
          os_id: match[1]
        });
      }

      // Detectar códigos de OS no texto (ex: ALMHUB-20250101-0001)
      const osCodigoRegex = /(ALMHUB-\d{8}-\d{4})/gi;
      while ((match = osCodigoRegex.exec(sanitizedText)) !== null) {
        entities.push({
          type: 'ordem_servico',
          offset: match.index,
          length: match[0].length,
          os_codigo: match[1]
        });
      }
    } catch (error) {
      console.error('Erro ao fazer parse do conteúdo');
    }

    return {
      text: sanitizedText,
      entities: entities
    };
  };

  const extractOSFromMessage = (mensagem) => {
    const conteudoFormatado = mensagem?.conteudo_formatado;
    if (!conteudoFormatado || !Array.isArray(conteudoFormatado.entities)) return [];
    
    return conteudoFormatado.entities
      .filter(e => e && e.type === 'ordem_servico')
      .map(e => e.os_codigo || e.os_id)
      .filter(Boolean);
  };

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEnviar();
    }
  }, [handleEnviar]);

  const formatarDataSeparador = useCallback((data) => {
    const date = new Date(data);
    if (isToday(date)) return 'Hoje';
    if (isYesterday(date)) return 'Ontem';
    return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  }, []);

  const formatarHora = useCallback((data) => {
    return format(new Date(data), 'HH:mm');
  }, []);

  // Memoizar pessoas para evitar buscas repetidas
  const pessoasMap = useMemo(() => {
    if (!Array.isArray(pessoas)) return new Map();
    return new Map(pessoas.map(p => [p?.id, p]));
  }, [pessoas]);

  const getPessoaById = (id) => pessoasMap.get(id) || null;

  const getOutraPessoa = () => {
    if (conversa?.tipo === 'grupo') return null;
    if (!Array.isArray(participantes)) return null;
    const outroPart = participantes.find(p => p?.pessoa_id !== currentPessoaId);
    if (!outroPart) return null;
    return getPessoaById(outroPart.pessoa_id);
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

    const mensagemAnterior = Array.isArray(mensagens) && mensagens[index - 1];
    if (mensagemAnterior && !isSameDay(new Date(mensagem.created_date), new Date(mensagemAnterior.created_date))) {
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
      <div className="flex-1 flex flex-col overflow-hidden">
        {onVoltar && (
          <div className="px-4 lg:px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0 lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={onVoltar}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </div>
        )}
        <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-900">
          <div className="text-center text-slate-500 dark:text-slate-400">
            <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Selecione uma conversa</h3>
            <p className="text-sm">Escolha uma conversa existente ou inicie uma nova</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <GrupoDetalhesModal
        open={showGrupoDetalhes}
        onClose={() => setShowGrupoDetalhes(false)}
        conversa={conversa}
        participantes={participantes}
        pessoas={pessoas}
        currentPessoaId={currentPessoaId}
        onUpdate={() => {
          setShowGrupoDetalhes(false);
          // Forçar recarregamento dos dados sem reload da página
          if (window.location.reload) {
            window.location.reload();
          }
        }}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 lg:px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onVoltar && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onVoltar}
                className="lg:hidden shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <Avatar className="shrink-0">
              <AvatarFallback className="bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                {conversa.tipo === 'grupo' ? '👥' : getNomeConversa().charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h2 className="font-semibold text-slate-900 dark:text-white truncate">{getNomeConversa()}</h2>
              {conversa.tipo === 'grupo' && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {Array.isArray(participantes) ? participantes.filter(p => p?.status === 'ativo').length : 0} participantes
                </p>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <Settings className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {conversa.tipo === 'grupo' && (
                <DropdownMenuItem onClick={() => setShowGrupoDetalhes(true)}>
                  <Users className="w-4 h-4 mr-2" />
                  Detalhes do Grupo
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onLimparMensagens(conversa.id)}>
                <Trash2 className="w-4 h-4 mr-2" />
                Limpar Mensagens
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onExcluirConversa(conversa.id)}
                className="text-red-600"
              >
                <X className="w-4 h-4 mr-2" />
                Excluir Conversa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mensagens */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 lg:p-6 bg-slate-50 dark:bg-slate-900 space-y-4">
        {Array.isArray(mensagens) && mensagens.map((mensagem, index) => {
          const isMinha = mensagem.autor_id === currentPessoaId;
          const autor = getPessoaById(mensagem.autor_id);
          const mostrarAvatar = conversa.tipo === 'grupo' && !isMinha;

          return (
            <React.Fragment key={mensagem.id}>
              {renderSeparadorData(mensagem, index)}
              <MessageBubble
                mensagem={mensagem}
                isMinha={isMinha}
                autor={autor}
                mostrarAvatar={mostrarAvatar}
                isGrupo={conversa.tipo === 'grupo'}
                onResponder={(msg) => setMensagemRespondendo(msg)}
                onEditar={(msg) => {
                  setMensagemEditando(msg);
                  setNovaMensagem(msg.conteudo);
                }}
                onExcluir={onExcluirMensagem}
              />
            </React.Fragment>
          );
        })}
      </div>

      {/* Input */}
      <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shrink-0">
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

        <div className="flex gap-2 items-start">
          {conversa.tipo === 'grupo' ? (
            <div className="flex-1">
              <MentionInput
                value={novaMensagem}
                onChange={(e) => setNovaMensagem(e.target.value)}
                onKeyDown={handleKeyPress}
                pessoas={pessoas}
                placeholder="Digite uma mensagem... (use @ para mencionar)"
                className="resize-none min-h-[42px] max-h-24"
                onMentionsChange={setMencoesIds}
                textareaRef={mentionInputRef}
              />
            </div>
          ) : (
            <RichTextEditor
              value={novaMensagem}
              onChange={(e) => setNovaMensagem(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Digite uma mensagem... Use códigos de OS (ex: ALMHUB-20250101-0001)"
              className="resize-none min-h-[42px] max-h-24"
            />
          )}
          <Button
            onClick={handleEnviar}
            disabled={!novaMensagem.trim()}
            className="shrink-0 mt-10"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
      </div>

      {/* Modal de Detalhes da OS */}
      {osDetailModal && osDetailModal.id && (
        <OSDetailModal
          os={osDetailModal}
          onClose={() => setOsDetailModal(null)}
          onUpdate={() => {
            setOsDetailModal(null);
            // Recarregar apenas os dados necessários
          }}
        />
      )}
    </>
  );
}