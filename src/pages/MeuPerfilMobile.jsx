import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '../utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, Upload, X, Save } from 'lucide-react';
import { createPageUrl } from '@/utils';

const funcaoLabels = {
  gestor: { label: 'Gestor', color: 'bg-purple-100 text-purple-700' },
  lider: { label: 'Líder', color: 'bg-blue-100 text-blue-700' },
  almoxarife: { label: 'Almoxarife', color: 'bg-amber-100 text-amber-700' }
};

export default function MeuPerfilMobile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [pessoa, setPessoa] = useState(null);
  const [regional, setRegional] = useState(null);
  const [almoxarifados, setAlmoxarifados] = useState([]);
  const [formData, setFormData] = useState({
    nome: '',
    matricula: '',
    funcao: '',
    foto_perfil: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      const [pessoaData, regionaisData, almoxData] = await Promise.all([
        base44.entities.Pessoa.filter({ user_id: user.id }),
        base44.entities.Regional.list(),
        base44.entities.Almoxarifado.list()
      ]);

      if (pessoaData[0]) {
        const pessoaObj = pessoaData[0];
        setPessoa(pessoaObj);
        setFormData({
          nome: pessoaObj.nome || '',
          matricula: pessoaObj.matricula || '',
          funcao: pessoaObj.funcao || '',
          foto_perfil: pessoaObj.foto_perfil || ''
        });

        if (pessoaObj.regional_id) {
          const reg = regionaisData.find(r => r.id === pessoaObj.regional_id);
          setRegional(reg);
        }

        if (pessoaObj.almoxarifados_ids?.length > 0) {
          const userAlmox = almoxData.filter(a => pessoaObj.almoxarifados_ids.includes(a.id));
          setAlmoxarifados(userAlmox);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, foto_perfil: file_url });
    } catch (error) {
      console.error('Erro ao fazer upload');
      alert('Erro ao fazer upload da imagem.');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    setFormData({ ...formData, foto_perfil: '' });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.Pessoa.update(pessoa.id, {
        nome: formData.nome.trim(),
        funcao: formData.funcao.trim(),
        foto_perfil: formData.foto_perfil
      });
      alert('Perfil atualizado com sucesso!');
      await loadData();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar perfil.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="p-4 shadow-lg sticky top-0 z-10" style={{ backgroundColor: '#0000FF' }}>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.location.href = createPageUrl('EmFluxo')}
            className="text-white hover:bg-white/20 rounded-full shrink-0"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-lg font-bold text-white">Meu Perfil</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Foto de Perfil */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <Label className="text-sm font-medium text-slate-700 mb-3 block">Foto de Perfil</Label>
          <div className="flex flex-col items-center gap-4">
            {formData.foto_perfil ? (
              <div className="relative">
                <img
                  src={formData.foto_perfil}
                  alt="Foto de perfil"
                  className="w-32 h-32 rounded-full object-cover border-4 border-slate-200"
                />
                <button
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-4xl font-bold">
                {formData.nome?.charAt(0) || currentUser?.full_name?.charAt(0) || 'U'}
              </div>
            )}
            <div>
              <input
                type="file"
                id="image-upload"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('image-upload').click()}
                disabled={uploadingImage}
                className="w-full"
              >
                {uploadingImage ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                {uploadingImage ? 'Enviando...' : 'Alterar foto'}
              </Button>
            </div>
          </div>
        </div>

        {/* Informações Básicas */}
        <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-slate-900 mb-4">Informações Pessoais</h2>
          
          <div className="space-y-2">
            <Label>Nome Completo</Label>
            <Input
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Seu nome completo"
            />
          </div>

          <div className="space-y-2">
            <Label>Matrícula</Label>
            <Input
              value={formData.matricula}
              disabled
              className="bg-slate-100"
            />
            <p className="text-xs text-slate-500">Este campo não pode ser editado</p>
          </div>

          <div className="space-y-2">
            <Label>Função/Cargo</Label>
            <Input
              value={formData.funcao}
              onChange={(e) => setFormData({ ...formData, funcao: e.target.value })}
              placeholder="Ex: Analista, Técnico, Coordenador..."
            />
          </div>

          <div className="space-y-2">
            <Label>E-mail</Label>
            <Input
              value={currentUser?.email || ''}
              disabled
              className="bg-slate-100"
            />
            <p className="text-xs text-slate-500">Este campo não pode ser editado</p>
          </div>
        </div>

        {/* Informações do Sistema */}
        <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-slate-900 mb-4">Acesso ao Sistema</h2>

          <div className="space-y-2">
            <Label className="text-sm text-slate-600">Regional</Label>
            <p className="text-base font-medium text-slate-900">
              {regional?.sigla || '-'}
              {regional?.descricao && ` - ${regional.descricao}`}
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-slate-600">Perfis/Funções</Label>
            <div className="flex gap-2 flex-wrap">
              {pessoa?.funcoes?.map(f => (
                <Badge key={f} className={funcaoLabels[f]?.color}>
                  {funcaoLabels[f]?.label}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Apenas gestores podem alterar perfis. Entre em contato com um gestor se precisar de mudanças.
            </p>
          </div>

          {almoxarifados.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm text-slate-600">Almoxarifados Vinculados</Label>
              <div className="space-y-1">
                {almoxarifados.map(a => (
                  <p key={a.id} className="text-sm text-slate-900">• {a.nome}</p>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-sm text-slate-600">Status de Acesso</Label>
            <div className="flex gap-2">
              <Badge className={pessoa?.ativo !== false ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}>
                {pessoa?.ativo !== false ? 'Ativo' : 'Inativo'}
              </Badge>
              <Badge className={
                pessoa?.status_aprovacao === 'aprovado' ? 'bg-green-100 text-green-700' :
                pessoa?.status_aprovacao === 'rejeitado' ? 'bg-red-100 text-red-700' :
                'bg-amber-100 text-amber-700'
              }>
                {pessoa?.status_aprovacao === 'aprovado' ? 'Aprovado' :
                 pessoa?.status_aprovacao === 'rejeitado' ? 'Rejeitado' :
                 'Pendente'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Botão Salvar */}
        <Button
          onClick={handleSave}
          disabled={saving || !formData.nome.trim()}
          className="w-full"
          style={{ backgroundColor: '#0000FF' }}
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Salvar Alterações
            </>
          )}
        </Button>
      </div>
    </div>
  );
}