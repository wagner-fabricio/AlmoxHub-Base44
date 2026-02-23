import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, AlertTriangle, CheckCircle, XCircle, Loader2, Calendar, User, Mail, Phone, Download } from 'lucide-react';

export default function GestaoSolicitacoes() {
  const [selectedSolicitacao, setSelectedSolicitacao] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [resposta, setResposta] = useState('');
  const [user, setUser] = useState(null);

  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: solicitacoes = [], isLoading } = useQuery({
    queryKey: ['solicitacoes', filtroTipo, filtroStatus],
    queryFn: async () => {
      let query = {};
      if (filtroTipo !== 'todos') query.tipo = filtroTipo;
      if (filtroStatus !== 'todos') query.status = filtroStatus;
      
      const data = await base44.entities.SolicitacaoTitular.filter(query);
      return data.sort((a, b) => new Date(b.data_solicitacao) - new Date(a.data_solicitacao));
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, novoStatus, respostaTexto }) => {
      const updateData = {
        status: novoStatus,
        aprovado_por: user?.email,
        aprovado_por_nome: user?.full_name
      };

      if (respostaTexto) {
        updateData.resposta = respostaTexto;
        updateData.data_resposta = new Date().toISOString();
      }

      // Se for tipo "acesso" ou "portabilidade", gerar dados
      if (selectedSolicitacao?.tipo === 'acesso' || selectedSolicitacao?.tipo === 'portabilidade') {
        const dadosTitular = await gerarDadosTitular(selectedSolicitacao.titular_email);
        updateData.dados_gerados = dadosTitular;
      }

      return await base44.entities.SolicitacaoTitular.update(id, updateData);
    },
    onSuccess: async (_, { id, respostaTexto }) => {
      queryClient.invalidateQueries(['solicitacoes']);
      
      // Enviar email ao titular
      const solicitacao = solicitacoes.find(s => s.id === id);
      if (solicitacao && respostaTexto) {
        try {
          await base44.integrations.Core.SendEmail({
            to: solicitacao.titular_email,
            subject: `Resposta à sua Solicitação LGPD - ${solicitacao.protocolo}`,
            body: `
              <h2>Sua solicitação foi respondida</h2>
              <p>Olá ${solicitacao.titular_nome},</p>
              <p><strong>Protocolo:</strong> ${solicitacao.protocolo}</p>
              <p><strong>Status:</strong> ${solicitacao.status}</p>
              <p><strong>Resposta:</strong></p>
              <p>${respostaTexto}</p>
              <p>Atenciosamente,<br/>Equipe Axia Energia</p>
            `
          });
        } catch (e) {
          console.error('Erro ao enviar email:', e);
        }
      }

      setShowDetailModal(false);
      setResposta('');
    }
  });

  const gerarDadosTitular = async (email) => {
    try {
      // Buscar dados do titular em todas entidades
      const [pessoa, ordensServico, comentarios, mensagens] = await Promise.all([
        base44.entities.Pessoa.filter({ email }).then(r => r[0]),
        base44.entities.OrdemServico.filter({ created_by: email }),
        base44.entities.Comentario.filter({ autor_id: email }),
        base44.entities.MensagemChat.filter({ autor_id: email })
      ]);

      return {
        pessoa: pessoa || null,
        ordensServico: ordensServico.map(os => ({
          id: os.id,
          codigo: os.codigo,
          categoria_id: os.categoria_id,
          status: os.status,
          created_date: os.created_date
        })),
        comentarios: comentarios.map(c => ({
          id: c.id,
          conteudo: c.conteudo,
          created_date: c.created_date
        })),
        mensagens: mensagens.map(m => ({
          id: m.id,
          conteudo: m.conteudo,
          created_date: m.created_date
        })),
        data_geracao: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erro ao gerar dados:', error);
      return { erro: error.message };
    }
  };

  const handleAprovar = () => {
    if (!resposta) {
      alert('Por favor, preencha a resposta');
      return;
    }
    updateStatusMutation.mutate({
      id: selectedSolicitacao.id,
      novoStatus: 'aprovada',
      respostaTexto: resposta
    });
  };

  const handleRejeitar = () => {
    if (!resposta) {
      alert('Por favor, preencha o motivo da rejeição');
      return;
    }
    updateStatusMutation.mutate({
      id: selectedSolicitacao.id,
      novoStatus: 'rejeitada',
      respostaTexto: resposta
    });
  };

  const handleEmAnalise = () => {
    updateStatusMutation.mutate({
      id: selectedSolicitacao.id,
      novoStatus: 'em_analise',
      respostaTexto: null
    });
  };

  const getDiasPrazo = (prazoLegal) => {
    const prazo = new Date(prazoLegal);
    const hoje = new Date();
    const diff = Math.ceil((prazo - hoje) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getStatusBadge = (status) => {
    const badges = {
      pendente: <Badge className="bg-gray-500">Pendente</Badge>,
      em_analise: <Badge className="bg-blue-500">Em Análise</Badge>,
      aprovada: <Badge className="bg-green-500">Aprovada</Badge>,
      rejeitada: <Badge className="bg-red-500">Rejeitada</Badge>,
      concluida: <Badge className="bg-purple-500">Concluída</Badge>
    };
    return badges[status] || <Badge>{status}</Badge>;
  };

  const tipoLabels = {
    acesso: 'Acesso aos Dados',
    correcao: 'Correção de Dados',
    exclusao: 'Exclusão de Dados',
    portabilidade: 'Portabilidade',
    oposicao: 'Oposição ao Tratamento'
  };

  const solicitacoesFiltradas = solicitacoes;

  // Alertas de prazo
  const solicitacoesProximasPrazo = solicitacoes.filter(s => {
    const dias = getDiasPrazo(s.prazo_legal);
    return dias <= 5 && dias >= 0 && s.status !== 'concluida';
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gestão de Solicitações LGPD</h1>
      </div>

      {/* Alertas de Prazo */}
      {solicitacoesProximasPrazo.length > 0 && (
        <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription>
            <strong>{solicitacoesProximasPrazo.length} solicitação(ões)</strong> próximas do prazo legal (menos de 5 dias)
          </AlertDescription>
        </Alert>
      )}

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Tipo</Label>
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="acesso">Acesso</SelectItem>
                  <SelectItem value="correcao">Correção</SelectItem>
                  <SelectItem value="exclusao">Exclusão</SelectItem>
                  <SelectItem value="portabilidade">Portabilidade</SelectItem>
                  <SelectItem value="oposicao">Oposição</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label>Status</Label>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="em_analise">Em Análise</SelectItem>
                  <SelectItem value="aprovada">Aprovada</SelectItem>
                  <SelectItem value="rejeitada">Rejeitada</SelectItem>
                  <SelectItem value="concluida">Concluída</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Solicitações */}
      <div className="space-y-4">
        {solicitacoesFiltradas.map(solicitacao => {
          const diasPrazo = getDiasPrazo(solicitacao.prazo_legal);
          const prazoVencido = diasPrazo < 0;
          const prazoProximo = diasPrazo <= 5 && diasPrazo >= 0;

          return (
            <Card key={solicitacao.id} className={prazoVencido ? 'border-red-500' : prazoProximo ? 'border-orange-500' : ''}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold">{tipoLabels[solicitacao.tipo]}</h3>
                      {getStatusBadge(solicitacao.status)}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-4">
                      <div>
                        <p className="text-slate-500 text-xs">Protocolo</p>
                        <p className="font-mono font-semibold">{solicitacao.protocolo}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs">Titular</p>
                        <p>{solicitacao.titular_nome}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs">Data</p>
                        <p>{new Date(solicitacao.data_solicitacao).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs">Prazo</p>
                        <p className={prazoVencido ? 'text-red-600 font-semibold' : prazoProximo ? 'text-orange-600 font-semibold' : ''}>
                          {prazoVencido ? `Vencido há ${Math.abs(diasPrazo)} dias` : `${diasPrazo} dias restantes`}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      setSelectedSolicitacao(solicitacao);
                      setShowDetailModal(true);
                      setResposta(solicitacao.resposta || '');
                    }}
                  >
                    Ver Detalhes
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {solicitacoesFiltradas.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-slate-500">
              Nenhuma solicitação encontrada
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de Detalhes */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedSolicitacao && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Solicitação {selectedSolicitacao.protocolo}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Dados do Titular */}
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Dados do Titular
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <Label className="text-xs text-slate-500">Nome</Label>
                      <p>{selectedSolicitacao.titular_nome}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500">CPF</Label>
                      <p>{selectedSolicitacao.titular_cpf}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500">Email</Label>
                      <p className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {selectedSolicitacao.titular_email}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500">Telefone</Label>
                      <p className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {selectedSolicitacao.titular_telefone || 'Não informado'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Detalhes da Solicitação */}
                <div>
                  <Label className="font-semibold mb-2 block">Tipo</Label>
                  <p>{tipoLabels[selectedSolicitacao.tipo]}</p>
                </div>

                <div>
                  <Label className="font-semibold mb-2 block">Descrição</Label>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{selectedSolicitacao.descricao}</p>
                </div>

                {/* Anexos */}
                {selectedSolicitacao.anexos && selectedSolicitacao.anexos.length > 0 && (
                  <div>
                    <Label className="font-semibold mb-2 block">Comprovantes</Label>
                    <div className="space-y-2">
                      {selectedSolicitacao.anexos.map((anexo, idx) => (
                        <Button key={idx} variant="outline" size="sm" onClick={() => window.open(anexo, '_blank')}>
                          <Download className="w-4 h-4 mr-2" />
                          Documento {idx + 1}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resposta */}
                <div>
                  <Label className="font-semibold mb-2 block">Resposta ao Titular</Label>
                  <Textarea
                    value={resposta}
                    onChange={(e) => setResposta(e.target.value)}
                    placeholder="Digite a resposta que será enviada ao titular..."
                    rows={6}
                    disabled={selectedSolicitacao.status === 'concluida'}
                  />
                </div>

                {/* Dados Gerados */}
                {selectedSolicitacao.dados_gerados && (
                  <div>
                    <Label className="font-semibold mb-2 block">Dados do Titular Gerados</Label>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const dataStr = JSON.stringify(selectedSolicitacao.dados_gerados, null, 2);
                        const dataBlob = new Blob([dataStr], { type: 'application/json' });
                        const url = URL.createObjectURL(dataBlob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `dados-titular-${selectedSolicitacao.protocolo}.json`;
                        a.click();
                      }}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Baixar JSON
                    </Button>
                  </div>
                )}
              </div>

              <DialogFooter className="flex gap-2">
                {selectedSolicitacao.status === 'pendente' && (
                  <Button onClick={handleEmAnalise} variant="outline" disabled={updateStatusMutation.isPending}>
                    Colocar em Análise
                  </Button>
                )}
                {(selectedSolicitacao.status === 'pendente' || selectedSolicitacao.status === 'em_analise') && (
                  <>
                    <Button onClick={handleRejeitar} variant="destructive" disabled={updateStatusMutation.isPending}>
                      {updateStatusMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                      Rejeitar
                    </Button>
                    <Button onClick={handleAprovar} disabled={updateStatusMutation.isPending}>
                      {updateStatusMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                      Aprovar e Enviar Resposta
                    </Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}