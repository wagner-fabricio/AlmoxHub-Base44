import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { base44 } from '@/api/base44Client';
import { UserCheck, FileText, Upload, CheckCircle, Loader2, Shield } from 'lucide-react';

export default function PortalTitular() {
  const [step, setStep] = useState('form'); // 'form' ou 'success' ou 'tracking'
  const [loading, setLoading] = useState(false);
  const [protocolo, setProtocolo] = useState(null);
  const [trackingProtocolo, setTrackingProtocolo] = useState('');
  const [trackingEmail, setTrackingEmail] = useState('');
  const [solicitacao, setSolicitacao] = useState(null);
  
  const [formData, setFormData] = useState({
    tipo: '',
    titular_nome: '',
    titular_email: '',
    titular_cpf: '',
    titular_telefone: '',
    descricao: '',
    anexos: []
  });

  const [anexosFiles, setAnexosFiles] = useState([]);
  const [uploadingAnexos, setUploadingAnexos] = useState(false);

  const tipoLabels = {
    acesso: 'Solicitar Acesso aos Meus Dados',
    correcao: 'Corrigir Dados Incorretos',
    exclusao: 'Excluir Meus Dados',
    portabilidade: 'Portabilidade de Dados',
    oposicao: 'Oposição ao Tratamento'
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setAnexosFiles(files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Upload de anexos
      let anexosUrls = [];
      if (anexosFiles.length > 0) {
        setUploadingAnexos(true);
        for (const file of anexosFiles) {
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          anexosUrls.push(file_url);
        }
        setUploadingAnexos(false);
      }

      // Gerar protocolo único
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 10000);
      const protocoloGerado = `LGPD-${timestamp}-${random}`;

      // Calcular prazo legal (15 dias)
      const prazoLegal = new Date();
      prazoLegal.setDate(prazoLegal.getDate() + 15);

      // Criar solicitação
      const novaSolicitacao = await base44.asServiceRole.entities.SolicitacaoTitular.create({
        ...formData,
        protocolo: protocoloGerado,
        anexos: anexosUrls,
        data_solicitacao: new Date().toISOString(),
        prazo_legal: prazoLegal.toISOString().split('T')[0],
        status: 'pendente'
      });

      // Enviar email de confirmação (opcional)
      try {
        await base44.integrations.Core.SendEmail({
          to: formData.titular_email,
          subject: `Solicitação LGPD - Protocolo ${protocoloGerado}`,
          body: `
            <h2>Solicitação recebida com sucesso!</h2>
            <p>Olá ${formData.titular_nome},</p>
            <p>Recebemos sua solicitação de <strong>${tipoLabels[formData.tipo]}</strong>.</p>
            <p><strong>Protocolo:</strong> ${protocoloGerado}</p>
            <p><strong>Prazo de Resposta:</strong> ${prazoLegal.toLocaleDateString('pt-BR')}</p>
            <p>Você pode acompanhar o status da sua solicitação através do link: <a href="${window.location.origin}/portal-titular?tracking=true">Acompanhar Solicitação</a></p>
            <p>Atenciosamente,<br/>Equipe Axia Energia</p>
          `
        });
      } catch (emailError) {
        console.error('Erro ao enviar email:', emailError);
      }

      setProtocolo(protocoloGerado);
      setStep('success');
    } catch (error) {
      alert('Erro ao enviar solicitação: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTracking = async () => {
    if (!trackingProtocolo || !trackingEmail) {
      alert('Por favor, preencha o protocolo e email');
      return;
    }

    setLoading(true);
    try {
      const results = await base44.asServiceRole.entities.SolicitacaoTitular.filter({
        protocolo: trackingProtocolo,
        titular_email: trackingEmail
      });

      if (results.length === 0) {
        alert('Solicitação não encontrada. Verifique o protocolo e email.');
        setSolicitacao(null);
      } else {
        setSolicitacao(results[0]);
        setStep('tracking');
      }
    } catch (error) {
      alert('Erro ao buscar solicitação: ' + error.message);
    } finally {
      setLoading(false);
    }
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

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-6">
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl">Solicitação Enviada com Sucesso!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-slate-600 dark:text-slate-400">
              Sua solicitação foi recebida e será analisada em até 15 dias úteis.
            </p>
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Protocolo de Acompanhamento</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono">{protocolo}</p>
            </div>
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Enviamos um email de confirmação para <strong>{formData.titular_email}</strong> com os detalhes da solicitação.
              </AlertDescription>
            </Alert>
            <div className="flex gap-3 justify-center pt-4">
              <Button onClick={() => window.location.reload()} variant="outline">
                Nova Solicitação
              </Button>
              <Button onClick={() => {
                setTrackingProtocolo(protocolo);
                setTrackingEmail(formData.titular_email);
                handleTracking();
              }}>
                Acompanhar Status
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'tracking' && solicitacao) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-900 dark:to-slate-800 p-6">
        <div className="max-w-4xl mx-auto">
          <Button onClick={() => setStep('form')} variant="outline" className="mb-6">
            ← Voltar
          </Button>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Acompanhamento de Solicitação</span>
                {getStatusBadge(solicitacao.status)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-slate-500">Protocolo</Label>
                  <p className="font-mono font-bold">{solicitacao.protocolo}</p>
                </div>
                <div>
                  <Label className="text-sm text-slate-500">Tipo</Label>
                  <p>{tipoLabels[solicitacao.tipo]}</p>
                </div>
                <div>
                  <Label className="text-sm text-slate-500">Data da Solicitação</Label>
                  <p>{new Date(solicitacao.data_solicitacao).toLocaleDateString('pt-BR')}</p>
                </div>
                <div>
                  <Label className="text-sm text-slate-500">Prazo Legal</Label>
                  <p className="font-semibold text-orange-600">{new Date(solicitacao.prazo_legal).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>

              {solicitacao.resposta && (
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                  <Label className="text-sm font-semibold mb-2 block">Resposta da Empresa</Label>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{solicitacao.resposta}</p>
                  {solicitacao.data_resposta && (
                    <p className="text-xs text-slate-500 mt-2">
                      Respondido em {new Date(solicitacao.data_resposta).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
              )}

              {solicitacao.dados_gerados && (
                <div>
                  <Label className="text-sm font-semibold mb-2 block">Seus Dados</Label>
                  <Button onClick={() => {
                    const dataStr = JSON.stringify(solicitacao.dados_gerados, null, 2);
                    const dataBlob = new Blob([dataStr], { type: 'application/json' });
                    const url = URL.createObjectURL(dataBlob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `meus-dados-${solicitacao.protocolo}.json`;
                    a.click();
                  }}>
                    <FileText className="w-4 h-4 mr-2" />
                    Baixar Meus Dados (JSON)
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Verificar se estamos no modo tracking via URL
  const urlParams = new URLSearchParams(window.location.search);
  const isTrackingMode = urlParams.get('tracking') === 'true';

  if (isTrackingMode && step === 'form') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-600" />
              Acompanhar Solicitação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Protocolo</Label>
              <Input
                value={trackingProtocolo}
                onChange={(e) => setTrackingProtocolo(e.target.value)}
                placeholder="LGPD-123456-7890"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={trackingEmail}
                onChange={(e) => setTrackingEmail(e.target.value)}
                placeholder="seu@email.com"
              />
            </div>
            <Button onClick={handleTracking} disabled={loading} className="w-full">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Consultar'}
            </Button>
            <Button onClick={() => window.location.href = '/portal-titular'} variant="outline" className="w-full">
              Nova Solicitação
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Formulário de nova solicitação
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-900 dark:to-slate-800 py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserCheck className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Portal do Titular - LGPD</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Exerça seus direitos sobre seus dados pessoais
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Nova Solicitação</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label>Tipo de Solicitação *</Label>
                <Select value={formData.tipo} onValueChange={(value) => setFormData({...formData, tipo: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de solicitação" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(tipoLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Nome Completo *</Label>
                  <Input
                    value={formData.titular_nome}
                    onChange={(e) => setFormData({...formData, titular_nome: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={formData.titular_email}
                    onChange={(e) => setFormData({...formData, titular_email: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>CPF *</Label>
                  <Input
                    value={formData.titular_cpf}
                    onChange={(e) => setFormData({...formData, titular_cpf: e.target.value})}
                    placeholder="000.000.000-00"
                    required
                  />
                </div>
                <div>
                  <Label>Telefone</Label>
                  <Input
                    value={formData.titular_telefone}
                    onChange={(e) => setFormData({...formData, titular_telefone: e.target.value})}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              <div>
                <Label>Descrição da Solicitação *</Label>
                <Textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                  placeholder="Descreva sua solicitação em detalhes..."
                  rows={4}
                  required
                />
              </div>

              <div>
                <Label>Comprovante de Identidade (RG ou CNH)</Label>
                <div className="mt-2">
                  <Input
                    type="file"
                    onChange={handleFileChange}
                    accept="image/*,.pdf"
                    multiple
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Anexe documento de identidade para validação (RG, CNH ou Passaporte)
                  </p>
                </div>
                {uploadingAnexos && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-blue-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enviando anexos...
                  </div>
                )}
              </div>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>Prazo Legal:</strong> Sua solicitação será analisada em até 15 dias úteis, conforme Art. 18 da LGPD.
                </AlertDescription>
              </Alert>

              <div className="flex gap-3">
                <Button type="submit" disabled={loading || uploadingAnexos} className="flex-1">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileText className="w-4 h-4 mr-2" />}
                  Enviar Solicitação
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.location.href = '/portal-titular?tracking=true'}
                >
                  Acompanhar Solicitação
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}