import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Users, Plus, Edit, Trash2, Search, User, MapPin, Warehouse, Loader2 } from 'lucide-react';

export default function EquipesPage() {
  const [equipes, setEquipes] = useState([]);
  const [pessoas, setPessoas] = useState([]);
  const [regionais, setRegionais] = useState([]);
  const [almoxarifados, setAlmoxarifados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEquipe, setEditingEquipe] = useState(null);
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserPessoa, setCurrentUserPessoa] = useState(null);

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    lider_id: '',
    membros_ids: [],
    regional_id: '',
    almoxarifados_ids: [],
    cor: '#3b82f6',
    ativa: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [equipesData, pessoasData, regionaisData, almoxarifadosData, userData] = await Promise.all([
        base44.entities.Equipe.list(),
        base44.entities.Pessoa.list(),
        base44.entities.Regional.list(),
        base44.entities.Almoxarifado.list(),
        base44.auth.me()
      ]);

      setEquipes(equipesData);
      setPessoas(pessoasData);
      setRegionais(regionaisData);
      setAlmoxarifados(almoxarifadosData);
      setCurrentUser(userData);

      const pessoaData = pessoasData.find(p => p.user_id === userData.id);
      setCurrentUserPessoa(pessoaData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (equipe = null) => {
    if (equipe) {
      setEditingEquipe(equipe);
      setFormData({
        nome: equipe.nome || '',
        descricao: equipe.descricao || '',
        lider_id: equipe.lider_id || '',
        membros_ids: equipe.membros_ids || [],
        regional_id: equipe.regional_id || '',
        almoxarifados_ids: equipe.almoxarifados_ids || [],
        cor: equipe.cor || '#3b82f6',
        ativa: equipe.ativa !== false
      });
    } else {
      setEditingEquipe(null);
      setFormData({
        nome: '',
        descricao: '',
        lider_id: '',
        membros_ids: [],
        regional_id: '',
        almoxarifados_ids: [],
        cor: '#3b82f6',
        ativa: true
      });
    }
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nome || !formData.lider_id) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    setSaving(true);
    try {
      if (editingEquipe) {
        await base44.entities.Equipe.update(editingEquipe.id, formData);
      } else {
        await base44.entities.Equipe.create(formData);
      }
      await loadData();
      setModalOpen(false);
    } catch (error) {
      console.error('Error saving equipe:', error);
      alert('Erro ao salvar equipe');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir esta equipe?')) return;

    try {
      await base44.entities.Equipe.delete(id);
      await loadData();
    } catch (error) {
      console.error('Error deleting equipe:', error);
      alert('Erro ao excluir equipe');
    }
  };

  const handleToggleMembro = (pessoaId) => {
    setFormData(prev => ({
      ...prev,
      membros_ids: prev.membros_ids.includes(pessoaId)
        ? prev.membros_ids.filter(id => id !== pessoaId)
        : [...prev.membros_ids, pessoaId]
    }));
  };

  const handleToggleAlmoxarifado = (almoxId) => {
    setFormData(prev => ({
      ...prev,
      almoxarifados_ids: prev.almoxarifados_ids.includes(almoxId)
        ? prev.almoxarifados_ids.filter(id => id !== almoxId)
        : [...prev.almoxarifados_ids, almoxId]
    }));
  };

  const filteredEquipes = equipes.filter(equipe =>
    equipe.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    equipe.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canEdit = currentUser?.role === 'admin' || currentUserPessoa?.funcoes?.includes('gestor');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Gestão de Equipes</h1>
        <p className="text-slate-600 dark:text-slate-400">Organize pessoas em equipes e times de trabalho</p>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <Input
            placeholder="Buscar equipes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        {canEdit && (
          <Button onClick={() => handleOpenModal()} className="gap-2">
            <Plus className="w-5 h-5" />
            Nova Equipe
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredEquipes.map((equipe) => {
          const lider = pessoas.find(p => p.id === equipe.lider_id);
          const regional = regionais.find(r => r.id === equipe.regional_id);
          const membros = pessoas.filter(p => equipe.membros_ids?.includes(p.id));

          return (
            <Card key={equipe.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: equipe.cor }}
                    >
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{equipe.nome}</CardTitle>
                      {!equipe.ativa && (
                        <Badge variant="outline" className="mt-1">Inativa</Badge>
                      )}
                    </div>
                  </div>
                  {canEdit && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenModal(equipe)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(equipe.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {equipe.descricao && (
                  <p className="text-sm text-slate-600 dark:text-slate-400">{equipe.descricao}</p>
                )}

                {lider && (
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                      <User className="w-4 h-4" />
                      <span>Líder</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8">
                        {lider.foto_perfil && <AvatarImage src={lider.foto_perfil} />}
                        <AvatarFallback>{lider.nome.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{lider.nome}</span>
                    </div>
                  </div>
                )}

                {membros.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                      <Users className="w-4 h-4" />
                      <span>Membros ({membros.length})</span>
                    </div>
                    <div className="flex -space-x-2">
                      {membros.slice(0, 5).map((membro) => (
                        <Avatar key={membro.id} className="w-8 h-8 border-2 border-white">
                          {membro.foto_perfil && <AvatarImage src={membro.foto_perfil} />}
                          <AvatarFallback className="text-xs">{membro.nome.charAt(0)}</AvatarFallback>
                        </Avatar>
                      ))}
                      {membros.length > 5 && (
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white flex items-center justify-center">
                          <span className="text-xs font-medium">+{membros.length - 5}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {regional && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span className="text-slate-600 dark:text-slate-400">{regional.sigla}</span>
                  </div>
                )}

                {equipe.almoxarifados_ids?.length > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Warehouse className="w-4 h-4 text-amber-600" />
                    <span className="text-slate-600 dark:text-slate-400">
                      {equipe.almoxarifados_ids.length} almoxarifado(s)
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredEquipes.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500 dark:text-slate-400">Nenhuma equipe encontrada</p>
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="px-6 py-5 border-b -m-6 mb-0" style={{ background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)' }}>
            <DialogTitle className="text-white">
              {editingEquipe ? 'Editar Equipe' : 'Nova Equipe'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-6 px-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-5 flex items-center gap-2">
                <div className="w-1 h-4 bg-gradient-to-b from-[#22c55e] to-[#84cc16] rounded-full"></div>
                Informações Básicas
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Nome da Equipe *</label>
                  <Input
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Equipe Nordeste"
                    className="border-slate-300 dark:border-slate-600 rounded-lg"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Descrição</label>
                  <Textarea
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Descreva a equipe..."
                    rows={3}
                    className="border-slate-300 dark:border-slate-600 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Cor</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={formData.cor}
                        onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                        className="w-12 h-12 rounded cursor-pointer border border-slate-300 dark:border-slate-600"
                      />
                      <Input
                        value={formData.cor}
                        onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                        placeholder="#3b82f6"
                        className="flex-1 border-slate-300 dark:border-slate-600 rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer w-full">
                      <input
                        type="checkbox"
                        checked={formData.ativa}
                        onChange={(e) => setFormData({ ...formData, ativa: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-sm font-medium">Equipe ativa</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-5 flex items-center gap-2">
                <div className="w-1 h-4 bg-gradient-to-b from-[#22c55e] to-[#84cc16] rounded-full"></div>
                Localização e Almoxarifados
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Regional</label>
                  <Select
                    value={formData.regional_id}
                    onValueChange={(value) => setFormData({ ...formData, regional_id: value, almoxarifados_ids: [] })}
                  >
                    <SelectTrigger className="border-slate-300 dark:border-slate-600 rounded-lg">
                      <SelectValue placeholder="Selecione a regional" />
                    </SelectTrigger>
                    <SelectContent>
                      {regionais.map((regional) => (
                        <SelectItem key={regional.id} value={regional.id}>
                          {regional.sigla} - {regional.descricao}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Almoxarifados</label>
                  <div className="border border-slate-300 dark:border-slate-600 rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                    {almoxarifados
                      .filter(almox => !formData.regional_id || almox.regional_id === formData.regional_id)
                      .map((almox) => (
                      <label key={almox.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.almoxarifados_ids.includes(almox.id)}
                          onChange={() => handleToggleAlmoxarifado(almox.id)}
                          className="rounded"
                        />
                        <span className="text-sm">{almox.nome}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-5 flex items-center gap-2">
                <div className="w-1 h-4 bg-gradient-to-b from-[#22c55e] to-[#84cc16] rounded-full"></div>
                Membros
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Líder *</label>
                  <Select
                    value={formData.lider_id}
                    onValueChange={(value) => setFormData({ ...formData, lider_id: value })}
                  >
                    <SelectTrigger className="border-slate-300 dark:border-slate-600 rounded-lg">
                      <SelectValue placeholder="Selecione o líder" />
                    </SelectTrigger>
                    <SelectContent>
                      {pessoas
                        .filter(p => {
                          const hasFuncao = p.funcoes?.includes('lider') || p.funcoes?.includes('gestor');
                          if (!formData.almoxarifados_ids.length) return hasFuncao;
                          return hasFuncao && formData.almoxarifados_ids.some(almoxId =>
                            p.almoxarifados_ids?.includes(almoxId)
                          );
                        })
                        .map((pessoa) => (
                        <SelectItem key={pessoa.id} value={pessoa.id}>
                          {pessoa.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Membros da Equipe</label>
                  <div className="border border-slate-300 dark:border-slate-600 rounded-lg p-3 max-h-60 overflow-y-auto space-y-2">
                    {pessoas
                      .filter(p => {
                        if (!formData.almoxarifados_ids.length) return true;
                        return formData.almoxarifados_ids.some(almoxId =>
                          p.almoxarifados_ids?.includes(almoxId)
                        );
                      })
                      .map((pessoa) => (
                      <label key={pessoa.id} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded">
                        <input
                          type="checkbox"
                          checked={formData.membros_ids.includes(pessoa.id)}
                          onChange={() => handleToggleMembro(pessoa.id)}
                          className="rounded"
                        />
                        <Avatar className="w-8 h-8">
                          {pessoa.foto_perfil && <AvatarImage src={pessoa.foto_perfil} />}
                          <AvatarFallback className="text-xs">{pessoa.nome.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{pessoa.nome}</p>
                          <p className="text-xs text-slate-500">{pessoa.funcao}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 px-6 py-4 flex justify-end gap-3 rounded-b-lg">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} style={{ background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)', color: 'white' }}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                editingEquipe ? 'Salvar Alterações' : 'Criar Equipe'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}