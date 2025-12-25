import React, { useState, useMemo } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Users, Star, Plus } from 'lucide-react';

export default function ConversaList({ conversas, pessoas, currentPessoaId, onSelectConversa, conversaSelecionada, onToggleFavorito, onNovaConversa }) {
  const [filtroAtivo, setFiltroAtivo] = useState('todas');

  // Memoizar mapa de pessoas para lookup rápido
  const pessoasMap = useMemo(() => {
    if (!Array.isArray(pessoas)) return new Map();
    return new Map(pessoas.map(p => [p?.id, p]));
  }, [pessoas]);

  // Memoizar conversas filtradas para evitar recalcular a cada render
  const conversasFiltradas = useMemo(() => {
    if (!Array.isArray(conversas)) return [];
    
    return conversas.filter((conv) => {
      const participante = Array.isArray(conv?.participantes) ? conv.participantes.find(p => p?.pessoa_id === currentPessoaId) : null;
      
      if (filtroAtivo === 'nao_lidas') {
        return (participante?.mensagens_nao_lidas || 0) > 0;
      }
      if (filtroAtivo === 'favoritas') {
        return participante?.favorito === true;
      }
      if (filtroAtivo === 'grupos') {
        return conv?.conversa?.tipo === 'grupo';
      }
      return true;
    });
  }, [conversas, filtroAtivo, currentPessoaId]);
  
  const getOutraPessoa = (conversa, participantes) => {
    if (conversa?.tipo === 'grupo') return null;
    if (!Array.isArray(participantes)) return null;
    const outroPart = participantes.find(p => p?.pessoa_id !== currentPessoaId);
    if (!outroPart?.pessoa_id) return null;
    return pessoasMap.get(outroPart.pessoa_id) || null;
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

  const contadores = React.useMemo(() => ({
    todas: Array.isArray(conversas) ? conversas.length : 0,
    nao_lidas: Array.isArray(conversas) ? conversas.filter(c => {
      const participante = Array.isArray(c?.participantes) ? c.participantes.find(p => p?.pessoa_id === currentPessoaId) : null;
      return (participante?.mensagens_nao_lidas || 0) > 0;
    }).length : 0,
    favoritas: Array.isArray(conversas) ? conversas.filter(c => {
      const participante = Array.isArray(c?.participantes) ? c.participantes.find(p => p?.pessoa_id === currentPessoaId) : null;
      return participante?.favorito === true;
    }).length : 0,
    grupos: Array.isArray(conversas) ? conversas.filter(c => c?.conversa?.tipo === 'grupo').length : 0,
  }), [conversas, currentPessoaId]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header Mobile */}
      <div className="lg:hidden px-4 py-3 border-b border-slate-200 dark:border-slate-700 shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Mensagens</h1>
          <Button size="icon" onClick={onNovaConversa}>
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Abas de Filtro */}
      <div className="px-2 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 shrink-0">
        <div className="flex gap-1 overflow-x-auto">
          <Button
            variant={filtroAtivo === 'todas' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFiltroAtivo('todas')}
            className={`shrink-0 ${filtroAtivo === 'todas' ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
          >
            Todas {contadores.todas > 0 && `(${contadores.todas})`}
          </Button>
          <Button
            variant={filtroAtivo === 'nao_lidas' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFiltroAtivo('nao_lidas')}
            className={`shrink-0 ${filtroAtivo === 'nao_lidas' ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
          >
            Não lidas {contadores.nao_lidas > 0 && (
              <Badge className="ml-1 bg-red-500 text-white">{contadores.nao_lidas}</Badge>
            )}
          </Button>
          <Button
            variant={filtroAtivo === 'favoritas' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFiltroAtivo('favoritas')}
            className={`shrink-0 ${filtroAtivo === 'favoritas' ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
          >
            Favoritas {contadores.favoritas > 0 && `(${contadores.favoritas})`}
          </Button>
          <Button
            variant={filtroAtivo === 'grupos' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFiltroAtivo('grupos')}
            className={`shrink-0 ${filtroAtivo === 'grupos' ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
          >
            Grupos {contadores.grupos > 0 && `(${contadores.grupos})`}
          </Button>
        </div>
      </div>

      {/* Lista de Conversas */}
      {conversasFiltradas.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <div className="text-slate-500 dark:text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">
              {filtroAtivo === 'todas' && 'Nenhuma conversa ainda'}
              {filtroAtivo === 'nao_lidas' && 'Nenhuma mensagem não lida'}
              {filtroAtivo === 'favoritas' && 'Nenhuma conversa favorita'}
              {filtroAtivo === 'grupos' && 'Nenhum grupo'}
            </p>
            <p className="text-xs mt-1">
              {filtroAtivo === 'todas' && 'Clique em "Nova Conversa" para começar'}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto min-h-0">
          {conversasFiltradas.map((conversa) => {
            const avatar = getAvatarInfo(conversa?.conversa, conversa?.participantes);
            const nomeConversa = getNomeConversa(conversa?.conversa, conversa?.participantes);
            const participante = Array.isArray(conversa?.participantes) ? conversa.participantes.find(p => p?.pessoa_id === currentPessoaId) : null;
            const naoLidas = participante?.mensagens_nao_lidas || 0;
            const isFavorito = participante?.favorito || false;
            const isSelected = conversaSelecionada?.id === conversa.conversa.id;

            return (
              <div
                key={conversa.conversa.id}
                className={`
                  flex items-center gap-3 p-4 cursor-pointer border-b border-slate-200 dark:border-slate-700
                  hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors relative
                  ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500' : ''}
                `}
              >
                <div onClick={() => onSelectConversa(conversa)} className="flex items-center gap-3 flex-1 min-w-0">
                  {avatar.foto ? (
                    <img src={avatar.foto} alt={nomeConversa} className="w-12 h-12 rounded-full object-cover shrink-0" />
                  ) : (
                    <Avatar className="w-12 h-12 shrink-0">
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
                      <div className="flex items-center gap-2 min-w-0">
                        <h3 className={`font-medium truncate ${naoLidas > 0 ? 'font-bold' : ''} text-slate-900 dark:text-white`}>
                          {nomeConversa}
                        </h3>
                        {conversa.conversa.tipo === 'grupo' && (
                          <Users className="w-3 h-3 text-slate-400 shrink-0" />
                        )}
                      </div>
                      {conversa.conversa.ultima_mensagem_data && (
                        <span className="text-xs text-slate-500 dark:text-slate-400 ml-2 shrink-0">
                          {formatarData(conversa.conversa.ultima_mensagem_data)}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm truncate ${naoLidas > 0 ? 'font-medium text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                        {conversa.conversa.tipo === 'grupo' && conversa.conversa.ultima_mensagem_autor && (
                          <span className="font-medium">{conversa.conversa.ultima_mensagem_autor}: </span>
                        )}
                        {conversa.conversa.ultima_mensagem || 'Sem mensagens'}
                      </p>
                      <div className="flex items-center gap-1 shrink-0">
                        {naoLidas > 0 && (
                          <Badge className="bg-blue-600 text-white">
                            {naoLidas}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorito(conversa.conversa.id);
                  }}
                  className="shrink-0 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                >
                  <Star className={`w-5 h-5 ${isFavorito ? 'fill-yellow-400 text-yellow-400' : 'text-slate-400'}`} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}