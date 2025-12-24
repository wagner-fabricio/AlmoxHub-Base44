import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, UserPlus, CheckCircle2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function NewUserSetup() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [regionais, setRegionais] = useState([]);
  const [almoxarifados, setAlmoxarifados] = useState([]);
  const [formData, setFormData] = useState({
    nome: '',
    matricula: '',
    regional_id: '',
    funcoes: [],
    almoxarifados_ids: []
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        nome: currentUser.full_name || ''
      }));
    }
  }, [currentUser]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [user, regionaisData, almoxarifadosData] = await Promise.all([
        base44.auth.me(),
        base44.entities.Regional.list(),
        base44.entities.Almoxarifado.list()
      ]);
      setCurrentUser(user);
      setRegionais(regionaisData);
      setAlmoxarifados(almoxarifadosData);
    } catch (err) {
      setError('Erro ao carregar dados. Tente novamente.');
      console.error(err);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // Criar registro de Pessoa
      await base44.entities.Pessoa.create({
        matricula: formData.matricula,
        nome: formData.nome || currentUser.full_name,
        email: currentUser.email,
        funcoes: formData.funcoes,
        regional_id: formData.regional_id,
        almoxarifados_ids: formData.almoxarifados_ids,
        user_id: currentUser.id,
        ativo: false,
        status_aprovacao: 'pendente'
      });

      // Buscar todos os administradores
      const admins = await base44.entities.User.filter({ role: 'admin' });

      // Enviar e-mail para cada administrador
      for (const admin of admins) {
        await base44.integrations.Core.SendEmail({
          to: admin.email,
          subject: 'Novo usuário aguardando aprovação - AlmoxHub',
          body: `
Olá ${admin.full_name},

Um novo usuário se cadastrou no sistema AlmoxHub e está aguardando aprovação de acesso.

Dados do usuário:
- Nome: ${formData.nome || currentUser.full_name}
- E-mail: ${currentUser.email}
- Matrícula: ${formData.matricula}
- Regional: ${regionais.find(r => r.id === formData.regional_id)?.sigla || 'N/A'}
- Funções solicitadas: ${formData.funcoes.join(', ')}

Para aprovar ou gerenciar este usuário, acesse:
${window.location.origin}${base44.utils?.createPageUrl ? base44.utils.createPageUrl('UserApproval') : '/UserApproval'}?user_id=${currentUser.id}

Atenciosamente,
Sistema AlmoxHub
          `
        });
      }

      setCompleted(true);
    } catch (err) {
      setError('Erro ao salvar cadastro. Tente novamente.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (completed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-6">
        <Card className="max-w-2xl w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
              Cadastro Enviado com Sucesso!
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Obrigado por completar seu cadastro. Sua solicitação de acesso foi enviada aos administradores 
              e você receberá um e-mail assim que sua conta for aprovada.
            </p>
            <Button onClick={handleLogout} className="bg-blue-600 hover:bg-blue-700">
              Encerrar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Bem-vindo ao AlmoxHub! 
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Complete seu cadastro para solicitar acesso ao sistema
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulário */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-500" />
                Dados do Cadastro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Dados do Usuário (read-only) */}
                <div className="space-y-4 pb-6 border-b">
                  <h3 className="font-semibold text-slate-900 dark:text-white">Informações da Conta</h3>
                  <div>
                    <Label>Nome Completo *</Label>
                    <Input 
                      value={formData.nome} 
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder="Digite seu nome completo"
                      required
                    />
                  </div>
                  <div>
                    <Label>E-mail</Label>
                    <Input value={currentUser?.email || ''} disabled className="bg-slate-100" />
                  </div>
                </div>

                {/* Dados Adicionais */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900 dark:text-white">Informações Profissionais</h3>
                  
                  <div>
                    <Label>Matrícula *</Label>
                    <Input
                      value={formData.matricula}
                      onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                      placeholder="Digite sua matrícula"
                      required
                    />
                  </div>

                  <div>
                    <Label>Regional *</Label>
                    <Select
                      value={formData.regional_id}
                      onValueChange={(value) => setFormData({ ...formData, regional_id: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione sua regional" />
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

                  {formData.funcoes.includes('almoxarife') && formData.regional_id && (
                    <div>
                      <Label>Almoxarifados Vinculados</Label>
                      <div className="space-y-2 mt-2 max-h-40 overflow-y-auto border rounded-lg p-3 bg-slate-50">
                        {almoxarifados
                          .filter(a => a.regional_id === formData.regional_id)
                          .length > 0 ? (
                            almoxarifados
                              .filter(a => a.regional_id === formData.regional_id)
                              .map((almox) => (
                                <label key={almox.id} className="flex items-center gap-2 cursor-pointer">
                                  <Checkbox
                                    checked={formData.almoxarifados_ids.includes(almox.id)}
                                    onCheckedChange={() => toggleAlmoxarifado(almox.id)}
                                  />
                                  <span>{almox.nome}</span>
                                </label>
                              ))
                          ) : (
                            <p className="text-sm text-slate-500">Nenhum almoxarifado disponível para esta regional</p>
                          )}
                      </div>
                    </div>
                  )}
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  disabled={saving || !formData.nome || !formData.matricula || !formData.regional_id || formData.funcoes.length === 0}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Enviar Solicitação de Acesso
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Informações */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 border-blue-200 dark:border-slate-600">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-4">
                  <UserPlus className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Processo de Aprovação
                </h3>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  Após preencher e enviar este formulário, sua solicitação será enviada aos administradores do sistema para análise.
                </p>
                <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Você receberá um e-mail confirmando o recebimento da sua solicitação</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Um administrador analisará seus dados em breve</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Após a aprovação, você será notificado por e-mail e poderá acessar o sistema completo</span>
                  </div>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 font-medium mt-6">
                  Fique tranquilo! Normalmente o processo de aprovação é rápido e você logo terá acesso ao AlmoxHub. 🚀
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}