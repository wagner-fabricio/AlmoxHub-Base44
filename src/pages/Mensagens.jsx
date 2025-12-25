import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import ConversaList from '@/components/mensagens/ConversaList';
import ChatArea from '@/components/mensagens/ChatArea';
import NovaConversaModal from '@/components/mensagens/NovaConversaModal';

export default function MensagensPage() {
  const [loading, setLoading] = useState(true);
  const [conversas, setConversas] = useState([]);
  const [mensagens, setMensagens] = useState([]);
  const [conversaSelecionada, setConversaSelecionada] = useState(null);
  const [pessoas, setPessoas] = useState([]);
  const [currentPessoa, setCurrentPessoa] = useState(null);
  const [showNovaConversa, setShowNovaConversa] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadConversas, 3000); // Poll a cada 3s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (conversaSelecionada) {
      loadMensagens(conversaSelecionada.id);
      marcarComoLida(conversaSelecionada.id);
      const interval = setInterval(() => loadMensagens(conversaSelecionada.id), 2000);
      return () => clearInterval(interval);
    }
  }, [conversaSelecionada]);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      const pessoasData = await base44.entities.Pessoa.list();
      const pessoaAtual = pessoasData.find(p => p.user_id === user.id);
      
      setPessoas(pessoasData);
      setCurrentPessoa(pessoaAtual);
      
      if (pessoaAtual) {
        await loadConversas(pessoaAtual.id);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadConversas = async (pessoaId) => {
    if (!pessoaId && currentPessoa) pessoaId = currentPessoa.id;
    if (!pessoaId) return;

    try {
      const participantes = await base44.entities.ParticipanteConversa.filter({ 
        pessoa_id: pessoaId,
        status: 'ativo'
      });
      
      const conversasCompletas = await Promise.all(
        participantes.map(async (part) => {
          const conversa = await base44.entities.Conversa.filter({ id: part.conversa_id }).then(c => c[0]);
          const allParts = await base44.entities.ParticipanteConversa.filter({ conversa_id: part.conversa_id });
          return { conversa, participantes: allParts };
        })
      );

      conversasCompletas.sort((a, b) => {
        const dataA = a.conversa.ultima_mensagem_data ? new Date(a.conversa.ultima_mensagem_data) : new Date(0);
        const dataB = b.conversa.ultima_mensagem_data ? new Date(b.conversa.ultima_mensagem_data) : new Date(0);
        return dataB - dataA;
      });

      setConversas(conversasCompletas);
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
    }
  };

  const loadMensagens = async (conversaId) => {
    try {
      const msgs = await base44.entities.MensagemChat.filter({ conversa_id: conversaId });
      msgs.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
      setMensagens(msgs);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    }
  };

  const marcarComoLida = async (conversaId) => {
    if (!currentPessoa) return;
    
    try {
      const participante = await base44.entities.ParticipanteConversa.filter({
        conversa_id: conversaId,
        pessoa_id: currentPessoa.id
      }).then(p => p[0]);

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
        const conversasExistentes = conversas.filter(c => c.conversa.tipo === 'privada');
        for (const conv of conversasExistentes) {
          const participantesConv = conv.participantes.map(p => p.pessoa_id);
          if (participantesConv.includes(participantesIds[0]) && participantesConv.includes(currentPessoa.id)) {
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
    } catch (error) {
      console.error('Erro ao criar conversa:', error);
    }
  };

  const handleEnviarMensagem = async (conteudo, mensagemRespondendo) => {
    if (!conversaSelecionada || !currentPessoa) return;

    try {
      const novaMensagem = await base44.entities.MensagemChat.create({
        conversa_id: conversaSelecionada.id,
        autor_id: currentPessoa.id,
        autor_nome: currentPessoa.nome,
        conteudo,
        mensagem_citada_id: mensagemRespondendo?.id || null,
        mensagem_citada_conteudo: mensagemRespondendo?.conteudo || null,
        mensagem_citada_autor: mensagemRespondendo?.autor_nome || null,
        status: 'enviada'
      });

      // Atualizar conversa com última mensagem
      await base44.entities.Conversa.update(conversaSelecionada.id, {
        ultima_mensagem: conteudo.substring(0, 50),
        ultima_mensagem_data: new Date().toISOString(),
        ultima_mensagem_autor: currentPessoa.nome
      });

      // Incrementar contador de não lidas para outros participantes
      const participantes = conversas.find(c => c.conversa.id === conversaSelecionada.id)?.participantes || [];
      await Promise.all(
        participantes
          .filter(p => p.pessoa_id !== currentPessoa.id)
          .map(p => 
            base44.entities.ParticipanteConversa.update(p.id, {
              mensagens_nao_lidas: (p.mensagens_nao_lidas || 0) + 1
            })
          )
      );

      // TODO: Criar notificações para outros participantes

      await loadMensagens(conversaSelecionada.id);
      await loadConversas();
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  const handleEditarMensagem = async (mensagemId, novoConteudo) => {
    try {
      await base44.entities.MensagemChat.update(mensagemId, {
        conteudo: novoConteudo,
        status: 'editada',
        editada_em: new Date().toISOString()
      });
      await loadMensagens(conversaSelecionada.id);
    } catch (error) {
      console.error('Erro ao editar mensagem:', error);
    }
  };

  const handleExcluirMensagem = async (mensagemId) => {
    try {
      await base44.entities.MensagemChat.update(mensagemId, {
        status: 'excluida',
        conteudo: 'Mensagem excluída'
      });
      await loadMensagens(conversaSelecionada.id);
    } catch (error) {
      console.error('Erro ao excluir mensagem:', error);
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

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Mensagens</h1>
          <Button onClick={() => setShowNovaConversa(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Conversa
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Lista de Conversas */}
        <div className="w-96 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <ConversaList
            conversas={conversas}
            pessoas={pessoas}
            currentPessoaId={currentPessoa.id}
            onSelectConversa={(conv) => setConversaSelecionada(conv.conversa)}
            conversaSelecionada={conversaSelecionada}
          />
        </div>

        {/* Área de Chat */}
        <ChatArea
          conversa={conversaSelecionada}
          mensagens={mensagens}
          participantes={conversas.find(c => c.conversa?.id === conversaSelecionada?.id)?.participantes || []}
          pessoas={pessoas}
          currentPessoaId={currentPessoa.id}
          onEnviarMensagem={handleEnviarMensagem}
          onEditarMensagem={handleEditarMensagem}
          onExcluirMensagem={handleExcluirMensagem}
          onAbrirDetalhes={() => {}}
        />
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