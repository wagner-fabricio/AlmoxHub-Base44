import React, { memo } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { MoreVertical, Reply, Edit2, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import MessageContent from '@/components/mensagens/MessageContent';
import OSCard from '@/components/mensagens/OSCard';

const MessageBubble = memo(function MessageBubble({
  mensagem,
  isMinha,
  autor,
  mostrarAvatar,
  isGrupo,
  onResponder,
  onEditar,
  onExcluir
}) {
  const formatarHora = (data) => format(new Date(data), 'HH:mm');

  return (
    <div className={`flex gap-2 ${isMinha ? 'flex-row-reverse' : 'flex-row'}`}>
      {mostrarAvatar && (
        <Avatar className="w-8 h-8 shrink-0">
          <AvatarFallback className="text-xs bg-slate-200 dark:bg-slate-700">
            {autor?.nome?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={`flex flex-col max-w-[70%] ${isMinha ? 'items-end' : 'items-start'}`}>
        {isGrupo && !isMinha && (
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-1 left-[-28px] h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onResponder(mensagem)}>
                  <Reply className="w-4 h-4 mr-2" />
                  Responder
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEditar(mensagem)}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onExcluir(mensagem.id)}
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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

          {mensagem.status === 'excluida' ? (
            <p className="text-sm whitespace-pre-wrap break-words">
              Mensagem excluída
            </p>
          ) : (
            <>
              <MessageContent 
                content={mensagem.conteudo} 
                isMinha={isMinha}
              />
              
              {/* Renderizar cards de OS */}
              {Array.isArray(mensagem.conteudo_formatado?.entities) && 
                mensagem.conteudo_formatado.entities
                  .filter(e => e && e.type === 'ordem_servico')
                  .map((entity, idx) => (
                    <div key={idx} className="mt-2">
                      <OSCard 
                        osId={entity.os_id || entity.os_codigo}
                        isMinha={isMinha}
                      />
                    </div>
                  ))
              }
            </>
          )}
          
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
  );
});

export default MessageBubble;