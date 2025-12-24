import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, UserPlus, CheckCircle2, AlertCircle, Moon, Sun, Upload, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function NewUserSetup() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [regionais, setRegionais] = useState([]);
  const [almoxarifados, setAlmoxarifados] = useState([]);
  const [formData, setFormData] = useState({
    matricula: '',
    funcao: '',
    regional_id: '',
    funcoes: [],
    almoxarifados_ids: [],
    foto_perfil: ''
  });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);

  useEffect(() => {
    loadData();
    const savedTheme = localStorage.getItem('almoxhub-theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('almoxhub-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('almoxhub-theme', 'light');
    }
  };

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

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione uma imagem válida.');
      return;
    }

    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('A imagem deve ter no máximo 5MB.');
      return;
    }

    setUploadingPhoto(true);
    setError(null);

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, foto_perfil: file_url }));
      setPhotoPreview(file_url);
    } catch (err) {
      setError('Erro ao fazer upload da foto. Tente novamente.');
      console.error(err);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const removePhoto = () => {
    setFormData(prev => ({ ...prev, foto_perfil: '' }));
    setPhotoPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // Criar registro de Pessoa
      await base44.entities.Pessoa.create({
        matricula: formData.matricula,
        nome: currentUser.full_name,
        email: currentUser.email,
        funcao: formData.funcao,
        funcoes: formData.funcoes,
        regional_id: formData.regional_id,
        almoxarifados_ids: formData.almoxarifados_ids,
        foto_perfil: formData.foto_perfil,
        user_id: currentUser.id,
        ativo: false,
        status_aprovacao: 'pendente'
      });

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
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-900 p-6 ${darkMode ? 'dark' : ''}`}>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <div className="text-center flex-1">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Bem-vindo ao AlmoxHub! 
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Complete seu cadastro para solicitar acesso ao sistema
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="rounded-xl shrink-0"
          >
            {darkMode ? (
              <Sun className="w-5 h-5 text-amber-500" />
            ) : (
              <Moon className="w-5 h-5 text-slate-600" />
            )}
          </Button>
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
                    <Label>Nome Completo</Label>
                    <Input 
                      value={currentUser?.full_name || ''} 
                      disabled 
                      className="bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100" 
                    />
                  </div>
                  <div>
                    <Label>E-mail</Label>
                    <Input 
                      value={currentUser?.email || ''} 
                      disabled 
                      className="bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100" 
                    />
                  </div>
                </div>

                {/* Dados Adicionais */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900 dark:text-white">Informações Profissionais</h3>

                  <div>
                    <Label>Foto de Perfil (opcional)</Label>
                    <div className="mt-2">
                      {photoPreview ? (
                        <div className="flex items-center gap-4">
                          <img
                            src={photoPreview}
                            alt="Preview"
                            className="w-20 h-20 rounded-full object-cover border-2 border-slate-200"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={removePhoto}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Remover
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            disabled={uploadingPhoto}
                            className="hidden"
                            id="photo-upload"
                          />
                          <label htmlFor="photo-upload">
                            <Button
                              type="button"
                              variant="outline"
                              disabled={uploadingPhoto}
                              onClick={() => document.getElementById('photo-upload').click()}
                              asChild
                            >
                              <span>
                                {uploadingPhoto ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <Upload className="w-4 h-4 mr-2" />
                                )}
                                {uploadingPhoto ? 'Enviando...' : 'Selecionar Foto'}
                              </span>
                            </Button>
                          </label>
                        </div>
                      )}
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Formatos aceitos: JPG, PNG, GIF (máx. 5MB)
                      </p>
                    </div>
                  </div>

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
                    <Label>Função/Cargo</Label>
                    <Input
                      value={formData.funcao}
                      onChange={(e) => setFormData({ ...formData, funcao: e.target.value })}
                      placeholder="Ex: Analista, Técnico, Coordenador..."
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

                  {formData.regional_id && (
                    <div>
                      <Label>Almoxarifados Vinculados (opcional)</Label>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                        Selecione os almoxarifados aos quais você terá acesso
                      </p>
                      <div className="space-y-2 mt-2 max-h-40 overflow-y-auto border rounded-lg p-3 bg-slate-50 dark:bg-slate-800">
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
                                  <span className="text-slate-900 dark:text-slate-100">{almox.nome}</span>
                                </label>
                              ))
                          ) : (
                            <p className="text-sm text-slate-500 dark:text-slate-400">Nenhum almoxarifado disponível para esta regional</p>
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
                  disabled={saving || !formData.matricula || !formData.regional_id || formData.funcoes.length === 0}
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