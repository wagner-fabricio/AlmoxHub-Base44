import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, UserCheck, UserX, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function UserApproval() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [targetUser, setTargetUser] = useState(null);
  const [pessoa, setPessoa] = useState(null);
  const [regionais, setRegionais] = useState([]);
  const [almoxarifados, setAlmoxarifados] = useState([]);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [formData, setFormData] = useState({
    matricula: '',
    regional_id: '',
    funcoes: [],
    almoxarifados_ids: []
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Verificar se o usuário atual é admin
      const user = await base44.auth.me();
      setCurrentUser(user);

      if (user.role !== 'admin') {
        setError('Acesso negado. Apenas administradores podem acessar esta página.');
        return;
      }

      // Obter user_id da URL
      const urlParams = new URLSearchParams(window.location.search);
      const userId = urlParams.get('user_id');

      if (!userId) {
        setError('ID de usuário não fornecido na URL.');
        return;
      }

      // Buscar dados do usuário alvo
      const [targetUserData, pessoaData, regionaisData, almoxarifadosData] = await Promise.all([
        base44.entities.User.filter({ id: userId }).then(users => users[0]),
        base44.entities.Pessoa.filter({ user_id: userId }).then(pessoas => pessoas[0]),
        base44.entities.Regional.list(),
        base44.entities.Almoxarifado.list()
      ]);

      if (!targetUserData) {
        setError('Usuário não encontrado.');
        return;
      }

      if (!pessoaData) {
        setError('Cadastro de pessoa não encontrado para este usuário.');
        return;
      }

      setTargetUser(targetUserData);
      setPessoa(pessoaData);
      setRegionais(regionaisData);
      setAlmoxarifados(almoxarifadosData);

      setFormData({
        matricula: pessoaData.matricula || '',
        regional_id: pessoaData.regional_id || '',
        funcoes: pessoaData.funcoes || [],
        almoxarifados_ids: pessoaData.almoxarifados_ids || []
      });
    } catch (err) {
      setError('Erro ao carregar dados. Tente novamente.');
      console.error('Erro ao carregar dados de aprovação');
    } finally {
      setLoading(false);
    }
  };

  const toggleFuncao = (funcao) => {
    setFormData(prev => ({
      ...prev,
      funcoes: prev.funcoes.includes(funcao)
        ? prev.funcoes.filter(f => f !== funcao)
        : [...prev.funcoes, funcao]
    }));
  };

  const toggleAlmoxarifado = (almoxId) => {
    setFormData(prev => ({
      ...prev,
      almoxarifados_ids: prev.almoxarifados_ids.includes(almoxId)
        ? prev.almoxarifados_ids.filter(id => id !== almoxId)
        : [...prev.almoxarifados_ids, almoxId]
    }));
  };

  const handleApprove = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Atualizar dados da pessoa
      await base44.entities.Pessoa.update(pessoa.id, {
        ...formData,
        ativo: true,
        status_aprovacao: 'aprovado'
      });

      // Enviar e-mail de aprovação ao usuário
      await base44.integrations.Core.SendEmail({
        to: targetUser.email,
        subject: 'Seu acesso ao AlmoxHub foi aprovado! 🎉',
        body: `
Olá ${targetUser.full_name},

Temos ótimas notícias! Seu cadastro no AlmoxHub foi aprovado pelos administradores.

Agora você já pode acessar o sistema completo e começar a utilizar todas as funcionalidades disponíveis.

Acesse o sistema através do link:
${window.location.origin}

Bem-vindo à equipe!

Atenciosamente,
Equipe AlmoxHub
        `
      });

      setSuccess('Usuário aprovado com sucesso! E-mail de boas-vindas enviado.');
      setTimeout(() => {
        window.close();
      }, 3000);
    } catch (err) {
      setError('Erro ao aprovar usuário. Tente novamente.');
      console.error('Erro ao aprovar usuário');
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Atualizar status da pessoa
      await base44.entities.Pessoa.update(pessoa.id, {
        ativo: false,
        status_aprovacao: 'rejeitado'
      });

      // Enviar e-mail de rejeição ao usuário
      await base44.integrations.Core.SendEmail({
        to: targetUser.email,
        subject: 'Atualização sobre seu cadastro no AlmoxHub',
        body: `
Olá ${targetUser.full_name},

Informamos que, após análise, sua solicitação de acesso ao AlmoxHub não foi aprovada neste momento.

Se você acredita que houve algum erro ou deseja mais informações, entre em contato com o administrador do sistema.

Atenciosamente,
Equipe AlmoxHub
        `
      });

      setSuccess('Usuário rejeitado. E-mail de notificação enviado.');
      setShowRejectDialog(false);
      setTimeout(() => {
        window.close();
      }, 3000);
    } catch (err) {
      setError('Erro ao rejeitar usuário. Tente novamente.');
      console.error('Erro ao rejeitar usuário');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error && !pessoa) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-6">
        <Card className="max-w-lg w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Erro</h2>
            <p className="text-slate-600 dark:text-slate-400">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Aprovação de Usuário
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Revise e aprove ou rejeite o acesso deste usuário ao sistema
          </p>
        </div>

        {success && (
          <Alert className="mb-6 bg-green-50 border-green-200 text-green-800">
            <CheckCircle2 className="w-4 h-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 gap-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Status do Cadastro</span>
                <Badge className={
                  pessoa?.status_aprovacao === 'aprovado' ? 'bg-green-100 text-green-700' :
                  pessoa?.status_aprovacao === 'rejeitado' ? 'bg-red-100 text-red-700' :
                  'bg-amber-100 text-amber-700'
                }>
                  {pessoa?.status_aprovacao === 'aprovado' ? 'Aprovado' :
                   pessoa?.status_aprovacao === 'rejeitado' ? 'Rejeitado' :
                   'Pendente'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-500">Nome Completo</Label>
                  <p className="font-medium">{targetUser?.full_name}</p>
                </div>
                <div>
                  <Label className="text-slate-500">E-mail</Label>
                  <p className="font-medium">{targetUser?.email}</p>
                </div>
                <div>
                  <Label className="text-slate-500">Data de Cadastro</Label>
                  <p className="font-medium">
                    {pessoa?.created_date ? new Date(pessoa.created_date).toLocaleDateString('pt-BR') : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Card */}
          <Card>
            <CardHeader>
              <CardTitle>Dados Profissionais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <Label>Matrícula *</Label>
                  <Input
                    value={formData.matricula}
                    onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                    placeholder="Digite a matrícula"
                  />
                </div>

                <div>
                  <Label>Regional *</Label>
                  <Select
                    value={formData.regional_id}
                    onValueChange={(value) => setFormData({ ...formData, regional_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a regional" />
                    </SelectTrigger>
                    <SelectContent>
                      {regionais.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.sigla} - {r.descricao}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Funções *</Label>
                  <div className="space-y-2 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={formData.funcoes.includes('gestor')}
                        onCheckedChange={() => toggleFuncao('gestor')}
                      />
                      <span>Gestor</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={formData.funcoes.includes('lider')}
                        onCheckedChange={() => toggleFuncao('lider')}
                      />
                      <span>Líder</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={formData.funcoes.includes('almoxarife')}
                        onCheckedChange={() => toggleFuncao('almoxarife')}
                      />
                      <span>Almoxarife</span>
                    </label>
                  </div>
                </div>

                {formData.funcoes.includes('almoxarife') && (
                  <div>
                    <Label>Almoxarifados Vinculados</Label>
                    <div className="space-y-2 mt-2 max-h-40 overflow-y-auto">
                      {almoxarifados
                        .filter(a => a.regional_id === formData.regional_id)
                        .map((almox) => (
                          <label key={almox.id} className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                              checked={formData.almoxarifados_ids.includes(almox.id)}
                              onCheckedChange={() => toggleAlmoxarifado(almox.id)}
                            />
                            <span>{almox.nome}</span>
                          </label>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          {pessoa?.status_aprovacao === 'pendente' && (
            <div className="flex gap-4">
              <Button
                onClick={handleApprove}
                disabled={saving || !formData.matricula || !formData.regional_id || formData.funcoes.length === 0}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <UserCheck className="w-4 h-4 mr-2" />
                )}
                Aprovar Usuário
              </Button>
              <Button
                onClick={() => setShowRejectDialog(true)}
                disabled={saving}
                variant="destructive"
                className="flex-1"
              >
                <UserX className="w-4 h-4 mr-2" />
                Rejeitar
              </Button>
            </div>
          )}
        </div>

        {/* Reject Confirmation Dialog */}
        <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Rejeição</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja rejeitar o acesso deste usuário? 
                O usuário será notificado por e-mail sobre esta decisão.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={saving}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleReject}
                disabled={saving}
                className="bg-red-600 hover:bg-red-700"
              >
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Confirmar Rejeição
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}