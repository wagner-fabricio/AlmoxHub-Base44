import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import ConversaList from '@/components/mensagens/ConversaList';
import ChatArea from '@/components/mensagens/ChatArea';
import NovaConversaModal from '@/components/mensagens/NovaConversaModal';
import { showError, showSuccess } from '@/components/ui/toast-error';

export default function MensagensPage() {
  const [loading, setLoading] = useState(true);
  const [conversas, setConversas] = useState([]);
  const [mensagens, setMensagens] = useState([]);
  const [conversaSelecionada, setConversaSelecionada] = useState(null);
  const [pessoas, setPessoas] = useState([]);
  const [currentPessoa, setCurrentPessoa] = useState(null);
  const [showNovaConversa, setShowNovaConversa] = useState(false);
  const [mostrarLista, setMostrarLista] = useState(true);

  // Cache para OSs - evita buscar todas as OSs repetidamente
  const [osCache, setOsCache] = useState(new Map());

  useEffect(() => {
    loadData();
    // Polling mais espaçado para reduzir carga no servidor
    const interval = setInterval(loadConversas, 15000); // Poll a cada 15s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (conversaSelecionada) {
      loadMensagens(conversaSelecionada.id);
      marcarComoLida(conversaSelecionada.id);
      // Polling mais inteligente - só atualiza se conversa estiver selecionada
      const interval = setInterval(() => loadMensagens(conversaSelecionada.id), 5000);
      return () => clearInterval(interval);
    }
  }, [conversaSelecionada]);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      const pessoasData = await base44.entities.Pessoa.list();
      const pessoaAtual = Array.isArray(pessoasData) ? pessoasData.find(p => p?.user_id === user.id) : null;
      
      setPessoas(pessoasData);
      setCurrentPessoa(pessoaAtual);
      
      if (pessoaAtual) {
        await loadConversas(pessoaAtual.id);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      showError('Erro ao carregar dados', 'Não foi possível carregar as conversas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const loadConversas = async (pessoaId) => {
    if (!pessoaId && currentPessoa) pessoaId = currentPessoa.id;
    if (!pessoaId) return;

    try {
      // Otimização: carregar todas as conversas e participantes em batch
      const [participantes, todasConversas, todosParticipantes] = await Promise.all([
        base44.entities.ParticipanteConversa.filter({ 
          pessoa_id: pessoaId,
          status: 'ativo'
        }),
        base44.entities.Conversa.list(),
        base44.entities.ParticipanteConversa.list()
      ]);
      
      if (!Array.isArray(participantes)) {
        setConversas([]);
        return;
      }

      // Criar mapas para lookup rápido
      const conversasMap = new Map((todasConversas || []).map(c => [c.id, c]));
      
      // Agrupar participantes por conversa
      const participantesPorConversa = new Map();
      (todosParticipantes || []).forEach(p => {
        if (!participantesPorConversa.has(p.conversa_id)) {
          participantesPorConversa.set(p.conversa_id, []);
        }
        participantesPorConversa.get(p.conversa_id).push(p);
      });
      
      // Montar conversas completas
      const conversasCompletas = participantes
        .map(part => {
          const conversa = conversasMap.get(part.conversa_id);
          const allParts = participantesPorConversa.get(part.conversa_id) || [];
          return conversa ? { conversa, participantes: allParts } : null;
        })
        .filter(Boolean);
      
      conversasCompletas.sort((a, b) => {
        const dataA = a?.conversa?.ultima_mensagem_data ? new Date(a.conversa.ultima_mensagem_data) : new Date(0);
        const dataB = b?.conversa?.ultima_mensagem_data ? new Date(b.conversa.ultima_mensagem_data) : new Date(0);
        return dataB - dataA;
      });

      // Evitar re-render se dados não mudaram
      setConversas(prev => {
        const prevIds = prev.map(c => c.conversa?.id).join(',');
        const newIds = conversasCompletas.map(c => c.conversa?.id).join(',');
        if (prevIds === newIds) {
          // Verificar se alguma conversa teve alteração
          const prevStr = JSON.stringify(prev.map(c => ({
            id: c.conversa?.id,
            ultima: c.conversa?.ultima_mensagem_data,
            naoLidas: c.participantes?.find(p => p.pessoa_id === pessoaId)?.mensagens_nao_lidas
          })));
          const newStr = JSON.stringify(conversasCompletas.map(c => ({
            id: c.conversa?.id,
            ultima: c.conversa?.ultima_mensagem_data,
            naoLidas: c.participantes?.find(p => p.pessoa_id === pessoaId)?.mensagens_nao_lidas
          })));
          if (prevStr === newStr) return prev;
        }
        return conversasCompletas;
      });
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
      // Silencioso - não mostrar erro em polling automático
    }
  };

  const loadMensagens = async (conversaId) => {
    try {
      const msgs = await base44.entities.MensagemChat.filter({ conversa_id: conversaId });
      const mensagensArray = Array.isArray(msgs) ? msgs : [];
      
      // Ordenar apenas uma vez
      const mensagensOrdenadas = mensagensArray.sort((a, b) => 
        new Date(a.created_date) - new Date(b.created_date)
      );
      
      // Evitar re-render se mensagens não mudaram
      setMensagens(prev => {
        if (JSON.stringify(prev) === JSON.stringify(mensagensOrdenadas)) return prev;
        return mensagensOrdenadas;
      });
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    }
  };

  const marcarComoLida = async (conversaId) => {
    if (!currentPessoa) return;

    try {
      const participanteResult = await base44.entities.ParticipanteConversa.filter({
        conversa_id: conversaId,
        pessoa_id: currentPessoa.id
      });
      const participante = Array.isArray(participanteResult) && participanteResult.length > 0 ? participanteResult[0] : null;

      if (participante && participante.mensagens_nao_lidas > 0) {
        await base44.entities.ParticipanteConversa.update(participante.id, {
          mensagens_nao_lidas: 0,
          ultima_leitura: new Date().toISOString()
        });
        loadConversas();
      }
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  const handleCriarConversa = async (tipo, participantesIds, nomeGrupo) => {
    try {
      // Verificar se já existe conversa privada com essa pessoa
      if (tipo === 'privada') {
        const conversasExistentes = Array.isArray(conversas) ? conversas.filter(c => c && c.conversa && c.conversa.tipo === 'privada') : [];
        for (const conv of conversasExistentes) {
          const participantesConv = Array.isArray(conv?.participantes) ? conv.participantes.map(p => p?.pessoa_id).filter(Boolean) : [];
          if (participantesConv.includes(participantesIds?.[0]) && participantesConv.includes(currentPessoa?.id)) {
            setConversaSelecionada(conv.conversa);
            return;
          }
        }
      }

      const novaConversa = await base44.entities.Conversa.create({
        tipo,
        nome_grupo: tipo === 'grupo' ? nomeGrupo : null,
        criador_id: currentPessoa.id
      });

      // Adicionar participantes
      const todosParticipantes = [currentPessoa.id, ...participantesIds];
      await Promise.all(todosParticipantes.map((pessoaId, index) => 
        base44.entities.ParticipanteConversa.create({
          conversa_id: novaConversa.id,
          pessoa_id: pessoaId,
          permissao: index === 0 ? 'admin' : 'membro',
          status: 'ativo'
        })
      ));

      await loadConversas();
      setConversaSelecionada(novaConversa);
      showSuccess('Conversa criada', tipo === 'grupo' ? `Grupo "${nomeGrupo}" criado com sucesso` : 'Conversa iniciada');
      } catch (error) {
      console.error('Erro ao criar conversa:', error);
      showError('Erro ao criar conversa', 'Não foi possível criar a conversa. Tente novamente.');
      }
      };

  // Função para converter códigos de OS para IDs com cache
  const convertOSCodigos = async (entities) => {
    if (!Array.isArray(entities) || entities.length === 0) return entities;

    const codigosParaBuscar = entities
      .filter(e => e?.type === 'ordem_servico' && e.os_codigo && !e.os_id)
      .map(e => e.os_codigo);

    if (codigosParaBuscar.length === 0) return entities;

    // Buscar apenas códigos que não estão no cache
    const codigosNaoCache = codigosParaBuscar.filter(codigo => !osCache.has(codigo));

    if (codigosNaoCache.length > 0) {
      try {
        // Buscar apenas as OSs necessárias por código
        const osEncontradas = await Promise.all(
          codigosNaoCache.map(codigo => 
            base44.entities.OrdemServico.filter({ codigo }).then(result => 
              Array.isArray(result) && result.length > 0 ? result[0] : null
            )
          )
        );

        // Atualizar cache
        const novoCache = new Map(osCache);
        osEncontradas.forEach((os, idx) => {
          if (os) novoCache.set(codigosNaoCache[idx], os.id);
        });
        setOsCache(novoCache);
      } catch (error) {
        console.error('Erro ao buscar OSs:', error);
      }
    }

    // Converter usando cache
    return entities.map(entity => {
      if (!entity) return entity;
      if (entity.type === 'ordem_servico' && entity.os_codigo && !entity.os_id) {
        return {
          ...entity,
          os_id: osCache.get(entity.os_codigo) || entity.os_codigo
        };
      }
      return entity;
    }).filter(Boolean);
  };

  const handleEnviarMensagem = async (conteudo, mensagemRespondendo, mencoesIds = [], conteudoFormatado = null) => {
    if (!conversaSelecionada || !currentPessoa) return;

    try {
      // Converter códigos de OS usando cache
      if (conteudoFormatado?.entities) {
        conteudoFormatado.entities = await convertOSCodigos(conteudoFormatado.entities);
      }

      const novaMensagem = await base44.entities.MensagemChat.create({
        conversa_id: conversaSelecionada.id,
        autor_id: currentPessoa.id,
        autor_nome: currentPessoa.nome,
        conteudo,
        conteudo_formatado: conteudoFormatado,
        mensagem_citada_id: mensagemRespondendo?.id || null,
        mensagem_citada_conteudo: mensagemRespondendo?.conteudo || null,
        mensagem_citada_autor: mensagemRespondendo?.autor_nome || null,
        status: 'enviada'
      });

      // Atualizar conversa com última mensagem
      await base44.entities.Conversa.update(conversaSelecionada.id, {
        ultima_mensagem: conteudo.substring(0, 50),
        ultima_mensagem_data: new Date().toISOString(),
        ultima_mensagem_autor: currentPessoa?.nome || ''
      });

      // Incrementar contador de não lidas para outros participantes
      const conversaAtual = Array.isArray(conversas) ? conversas.find(c => c && c.conversa && c.conversa.id === conversaSelecionada.id) : null;
      const participantes = conversaAtual && Array.isArray(conversaAtual.participantes) ? conversaAtual.participantes : [];
      await Promise.all(
        participantes
          .filter(p => p && p.pessoa_id !== currentPessoa.id)
          .map(p => 
            base44.entities.ParticipanteConversa.update(p.id, {
              mensagens_nao_lidas: (p.mensagens_nao_lidas || 0) + 1
            })
          )
      );

      // Criar notificações para pessoas mencionadas
      if (Array.isArray(mencoesIds) && mencoesIds.length > 0) {
        const pessoasMencionadas = mencoesIds.filter(id => id && id !== currentPessoa?.id);
        await Promise.all(
          pessoasMencionadas.map(pessoaId =>
            base44.entities.Notificacao.create({
              destinatario_id: pessoaId,
              remetente_id: currentPessoa.id,
              tipo: 'mencao',
              referencia_id: novaMensagem.id,
              referencia_tipo: 'mensagem',
              mensagem: `${currentPessoa.nome} mencionou você em uma mensagem`,
              contexto_adicional: {
                conversa_id: conversaSelecionada.id,
                conversa_nome: conversaSelecionada.tipo === 'grupo' ? conversaSelecionada.nome_grupo : null
              }
            })
          )
        );
      }

      await loadMensagens(conversaSelecionada.id);
      await loadConversas();
      showSuccess('Mensagem enviada');
      } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      showError('Erro ao enviar mensagem', 'Não foi possível enviar a mensagem. Tente novamente.');
      }
      };

  const handleEditarMensagem = async (mensagemId, novoConteudo, conteudoFormatado = null) => {
    try {
      // Converter códigos de OS usando cache
      if (conteudoFormatado?.entities) {
        conteudoFormatado.entities = await convertOSCodigos(conteudoFormatado.entities);
      }

      await base44.entities.MensagemChat.update(mensagemId, {
        conteudo: novoConteudo,
        conteudo_formatado: conteudoFormatado,
        status: 'editada',
        editada_em: new Date().toISOString()
      });
      await loadMensagens(conversaSelecionada.id);
      showSuccess('Mensagem editada');
      } catch (error) {
      console.error('Erro ao editar mensagem:', error);
      showError('Erro ao editar mensagem', 'Não foi possível editar a mensagem.');
      }
      };

  const handleExcluirMensagem = async (mensagemId) => {
    try {
      await base44.entities.MensagemChat.update(mensagemId, {
        status: 'excluida',
        conteudo: 'Mensagem excluída'
      });
      await loadMensagens(conversaSelecionada.id);
      showSuccess('Mensagem excluída');
      } catch (error) {
      console.error('Erro ao excluir mensagem:', error);
      showError('Erro ao excluir mensagem', 'Não foi possível excluir a mensagem.');
      }
      };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-500">Carregando...</div>
      </div>
    );
  }

  if (!currentPessoa) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-slate-500">Usuário não encontrado no sistema</p>
        </div>
      </div>
    );
  }

  const handleSelectConversa = (conv) => {
    setConversaSelecionada(conv.conversa);
    // Só oculta lista em mobile
    if (window.innerWidth < 1024) {
      setMostrarLista(false);
    }
  };

  const handleVoltarLista = () => {
    setMostrarLista(true);
  };

  const handleToggleFavorito = async (conversaId) => {
    if (!currentPessoa) return;

    try {
      const participanteResult = await base44.entities.ParticipanteConversa.filter({
        conversa_id: conversaId,
        pessoa_id: currentPessoa.id
      });
      const participante = Array.isArray(participanteResult) && participanteResult.length > 0 ? participanteResult[0] : null;

      if (participante) {
        await base44.entities.ParticipanteConversa.update(participante.id, {
          favorito: !participante.favorito
        });
        await loadConversas();
      }
    } catch (error) {
      console.error('Erro ao marcar como favorito:', error);
    }
    };

    const handleLimparMensagens = async (conversaId) => {
    if (!window.confirm('Tem certeza que deseja limpar todas as mensagens desta conversa?')) return;

    try {
      const msgs = await base44.entities.MensagemChat.filter({ conversa_id: conversaId });
      const mensagensArray = Array.isArray(msgs) ? msgs : [];
      await Promise.all(mensagensArray.map(msg => base44.entities.MensagemChat.delete(msg.id)));

      await base44.entities.Conversa.update(conversaId, {
        ultima_mensagem: null,
        ultima_mensagem_data: null,
        ultima_mensagem_autor: null
      });

      await loadMensagens(conversaId);
      await loadConversas();
    } catch (error) {
      console.error('Erro ao limpar mensagens:', error);
    }
    };

    const handleExcluirConversa = async (conversaId) => {
    if (!window.confirm('Tem certeza que deseja excluir esta conversa? Esta ação não pode ser desfeita.')) return;

    try {
      const participantes = await base44.entities.ParticipanteConversa.filter({ conversa_id: conversaId });
      const participantesArray = Array.isArray(participantes) ? participantes : [];
      await Promise.all(participantesArray.map(p => base44.entities.ParticipanteConversa.delete(p.id)));

      const msgs = await base44.entities.MensagemChat.filter({ conversa_id: conversaId });
      const mensagensArray = Array.isArray(msgs) ? msgs : [];
      await Promise.all(mensagensArray.map(msg => base44.entities.MensagemChat.delete(msg.id)));

      await base44.entities.Conversa.delete(conversaId);

      setConversaSelecionada(null);
      await loadConversas();
    } catch (error) {
      console.error('Erro ao excluir conversa:', error);
    }
    };

    return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900">
      {/* Header - Apenas em desktop */}
      <div className="hidden lg:block px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Mensagens</h1>
          <Button onClick={() => setShowNovaConversa(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Conversa
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Lista de Conversas */}
        <div className={`
          ${mostrarLista ? 'flex' : 'hidden lg:flex'}
          w-full lg:w-96 lg:min-w-[360px] lg:max-w-[360px]
          border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800
          flex-col overflow-hidden
        `}>
          <ConversaList
            conversas={conversas}
            pessoas={pessoas}
            currentPessoaId={currentPessoa.id}
            onSelectConversa={handleSelectConversa}
            conversaSelecionada={conversaSelecionada}
            onToggleFavorito={handleToggleFavorito}
            onNovaConversa={() => setShowNovaConversa(true)}
          />
        </div>

        {/* Área de Chat */}
        <div className={`
          ${!mostrarLista ? 'flex' : 'hidden lg:flex'}
          flex-1 min-w-0
        `}>
          <ChatArea
            conversa={conversaSelecionada}
            mensagens={mensagens}
            participantes={Array.isArray(conversas) ? (conversas.find(c => c?.conversa?.id === conversaSelecionada?.id)?.participantes || []) : []}
            pessoas={pessoas}
            currentPessoaId={currentPessoa.id}
            onEnviarMensagem={handleEnviarMensagem}
            onEditarMensagem={handleEditarMensagem}
            onExcluirMensagem={handleExcluirMensagem}
            onAbrirDetalhes={() => {}}
            onVoltar={window.innerWidth < 1024 ? handleVoltarLista : undefined}
            onLimparMensagens={handleLimparMensagens}
            onExcluirConversa={handleExcluirConversa}
          />
        </div>
      </div>

      {/* Modal Nova Conversa */}
      <NovaConversaModal
        open={showNovaConversa}
        onClose={() => setShowNovaConversa(false)}
        pessoas={pessoas}
        currentPessoaId={currentPessoa.id}
        onCriar={handleCriarConversa}
      />
    </div>
  );
}