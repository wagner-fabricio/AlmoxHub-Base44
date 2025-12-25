import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Users } from 'lucide-react';

export default function ConversaList({ conversas, pessoas, currentPessoaId, onSelectConversa, conversaSelecionada }) {
  
  const getOutraPessoa = (conversa, participantes) => {
    if (conversa.tipo === 'grupo') return null;
    const outroPart = participantes.find(p => p.pessoa_id !== currentPessoaId);
    return pessoas.find(p => p.id === outroPart?.pessoa_id);
  };

  const formatarData = (data) => {
    if (!data) return '';
    const date = new Date(data);
    if (isToday(date)) return format(date, 'HH:mm');
    if (isYesterday(date)) return 'Ontem';
    return format(date, 'dd/MM/yy');
  };

  const getNomeConversa = (conversa, participantes) => {
    if (conversa.tipo === 'grupo') return conversa.nome_grupo || 'Grupo sem nome';
    const outraPessoa = getOutraPessoa(conversa, participantes);
    return outraPessoa?.nome || 'Usuário desconhecido';
  };

  const getAvatarInfo = (conversa, participantes) => {
    if (conversa.tipo === 'grupo') {
      return { initial: '👥', isGroup: true };
    }
    const outraPessoa = getOutraPessoa(conversa, participantes);
    return { 
      initial: outraPessoa?.nome?.charAt(0) || 'U',
      foto: outraPessoa?.foto_perfil,
      isGroup: false
    };
  };

  return (
    <div className="flex flex-col h-full">
      {conversas.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <div className="text-slate-500 dark:text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Nenhuma conversa ainda</p>
            <p className="text-xs mt-1">Clique em "Nova Conversa" para começar</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {conversas.map((conversa) => {
            const avatar = getAvatarInfo(conversa.conversa, conversa.participantes);
            const nomeConversa = getNomeConversa(conversa.conversa, conversa.participantes);
            const participante = conversa.participantes.find(p => p.pessoa_id === currentPessoaId);
            const naoLidas = participante?.mensagens_nao_lidas || 0;
            const isSelected = conversaSelecionada?.id === conversa.conversa.id;

            return (
              <div
                key={conversa.conversa.id}
                onClick={() => onSelectConversa(conversa)}
                className={`
                  flex items-center gap-3 p-4 cursor-pointer border-b border-slate-200 dark:border-slate-700
                  hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors
                  ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500' : ''}
                `}
              >
                {avatar.foto ? (
                  <img src={avatar.foto} alt={nomeConversa} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className={`
                      ${avatar.isGroup ? 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300' : 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'}
                      text-lg
                    `}>
                      {avatar.initial}
                    </AvatarFallback>
                  </Avatar>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`font-medium truncate ${naoLidas > 0 ? 'font-bold' : ''} text-slate-900 dark:text-white`}>
                      {nomeConversa}
                    </h3>
                    {conversa.conversa.ultima_mensagem_data && (
                      <span className="text-xs text-slate-500 dark:text-slate-400 ml-2 shrink-0">
                        {formatarData(conversa.conversa.ultima_mensagem_data)}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className={`text-sm truncate ${naoLidas > 0 ? 'font-medium text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                      {conversa.conversa.tipo === 'grupo' && conversa.conversa.ultima_mensagem_autor && (
                        <span className="font-medium">{conversa.conversa.ultima_mensagem_autor}: </span>
                      )}
                      {conversa.conversa.ultima_mensagem || 'Sem mensagens'}
                    </p>
                    {naoLidas > 0 && (
                      <Badge className="bg-blue-600 text-white ml-2 shrink-0">
                        {naoLidas}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}