import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Edit, Trash2, User, Loader2, Search, Upload, X } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const funcaoLabels = {
  gestor: { label: 'Gestor', color: 'bg-purple-100 text-purple-700' },
  lider: { label: 'Líder', color: 'bg-blue-100 text-blue-700' },
  almoxarife: { label: 'Almoxarife', color: 'bg-amber-100 text-amber-700' }
};

export default function Pessoas() {
  const [loading, setLoading] = useState(true);
  const [pessoas, setPessoas] = useState([]);
  const [regionais, setRegionais] = useState([]);
  const [almoxarifados, setAlmoxarifados] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [search, setSearch] = useState('');
  const [filterRegional, setFilterRegional] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showFuncoesModal, setShowFuncoesModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);
  const [editingFuncoes, setEditingFuncoes] = useState({ pessoa: null, funcoes: [] });
  const [formData, setFormData] = useState({
    matricula: '',
    nome: '',
    email: '',
    funcoes: [],
    regional_id: '',
    almoxarifados_ids: [],
    ativo: true,
    foto_perfil: ''
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('view') === 'me' && currentUser && pessoas.length > 0) {
      const minhaPessoa = pessoas.find(p => p.user_id === currentUser.id);
      if (minhaPessoa) {
        setViewingItem(minhaPessoa);
        setShowViewModal(true);
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [currentUser, pessoas]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [user, pessoasData, regionaisData, almoxData] = await Promise.all([
        base44.auth.me(),
        base44.entities.Pessoa.list(),
        base44.entities.Regional.list(),
        base44.entities.Almoxarifado.list()
      ]);
      setCurrentUser(user);
      setPessoas(pessoasData);
      setRegionais(regionaisData);
      setAlmoxarifados(almoxData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNew = () => {
    setSelectedItem(null);
    setFormData({
      matricula: '',
      nome: '',
      email: '',
      funcoes: [],
      regional_id: '',
      almoxarifados_ids: [],
      ativo: true,
      foto_perfil: ''
    });
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setFormData({
      matricula: item.matricula || '',
      nome: item.nome || '',
      email: item.email || '',
      funcoes: item.funcoes || [],
      regional_id: item.regional_id || '',
      almoxarifados_ids: item.almoxarifados_ids || [],
      ativo: item.ativo !== false,
      foto_perfil: item.foto_perfil || ''
    });
    setShowModal(true);
  };

  const handleDelete = (item) => {
    setSelectedItem(item);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    try {
      await base44.entities.Pessoa.delete(selectedItem.id);
      loadData();
    } catch (error) {
      console.error('Error deleting:', error);
    } finally {
      setShowDeleteDialog(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (selectedItem) {
        await base44.entities.Pessoa.update(selectedItem.id, formData);
      } else {
        await base44.entities.Pessoa.create(formData);
      }
      loadData();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleFuncao = (funcao) => {
    if (formData.funcoes.includes(funcao)) {
      setFormData({ ...formData, funcoes: formData.funcoes.filter(f => f !== funcao) });
    } else {
      setFormData({ ...formData, funcoes: [...formData.funcoes, funcao] });
    }
  };

  const toggleAlmoxarifado = (id) => {
    if (formData.almoxarifados_ids.includes(id)) {
      setFormData({ ...formData, almoxarifados_ids: formData.almoxarifados_ids.filter(a => a !== id) });
    } else {
      setFormData({ ...formData, almoxarifados_ids: [...formData.almoxarifados_ids, id] });
    }
  };

  const handleFuncoesClick = (pessoa) => {
    if (currentUser?.role !== 'admin') return;
    setEditingFuncoes({ pessoa, funcoes: [...(pessoa.funcoes || [])] });
    setShowFuncoesModal(true);
  };

  const toggleEditingFuncao = (funcao) => {
    setEditingFuncoes(prev => ({
      ...prev,
      funcoes: prev.funcoes.includes(funcao)
        ? prev.funcoes.filter(f => f !== funcao)
        : [...prev.funcoes, funcao]
    }));
  };

  const saveFuncoes = async () => {
    setSaving(true);
    try {
      await base44.entities.Pessoa.update(editingFuncoes.pessoa.id, {
        funcoes: editingFuncoes.funcoes
      });
      await loadData();
      setShowFuncoesModal(false);
    } catch (error) {
      console.error('Error updating funcoes:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (pessoa) => {
    if (currentUser?.role !== 'admin') return;
    try {
      await base44.entities.Pessoa.update(pessoa.id, {
        ativo: !pessoa.ativo
      });
      await loadData();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const toggleStatusAprovacao = async (pessoa) => {
    if (currentUser?.role !== 'admin') return;
    const statusOrder = ['pendente', 'aprovado', 'rejeitado'];
    const currentIndex = statusOrder.indexOf(pessoa.status_aprovacao || 'pendente');
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];

    try {
      await base44.entities.Pessoa.update(pessoa.id, {
        status_aprovacao: nextStatus
      });
      await loadData();
    } catch (error) {
      console.error('Error updating approval status:', error);
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
      console.error('Error uploading image:', error);
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    setFormData({ ...formData, foto_perfil: '' });
  };

  const getRegional = (id) => regionais.find(r => r.id === id);
  const filteredAlmoxarifados = almoxarifados.filter(a => a.regional_id === formData.regional_id);

  const filteredItems = pessoas.filter(p => {
    if (filterRegional !== 'all' && p.regional_id !== filterRegional) return false;
    if (search && !p.nome?.toLowerCase().includes(search.toLowerCase()) && 
        !p.matricula?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">Pessoas</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Gerencie os colaboradores</p>
        </div>
        <Button onClick={handleNew} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Nova Pessoa
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por nome ou matrícula..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterRegional} onValueChange={setFilterRegional}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Regional" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Regionais</SelectItem>
              {regionais.map(r => (
                <SelectItem key={r.id} value={r.id}>{r.sigla}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-800">
              <TableHead className="font-semibold">Pessoa</TableHead>
              <TableHead className="font-semibold">Matrícula</TableHead>
              <TableHead className="font-semibold">Regional</TableHead>
              <TableHead className="font-semibold">Funções</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Aprovação</TableHead>
              <TableHead className="font-semibold text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                  <User className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>Nenhuma pessoa cadastrada</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => {
                const regional = getRegional(item.regional_id);
                return (
                  <TableRow key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          {item.foto_perfil && (
                            <AvatarImage src={item.foto_perfil} alt={item.nome} />
                          )}
                          <AvatarFallback className="bg-blue-100 text-blue-700">
                            {item.nome?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{item.nome}</p>
                          <p className="text-sm text-slate-500">{item.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{item.matricula}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{regional?.sigla || '-'}</Badge>
                    </TableCell>
                    <TableCell>
                      <div 
                        className={`flex gap-1 flex-wrap ${currentUser?.role === 'admin' ? 'cursor-pointer hover:opacity-70 transition-opacity' : ''}`}
                        onClick={() => handleFuncoesClick(item)}
                        title={currentUser?.role === 'admin' ? 'Clique para editar funções' : ''}
                      >
                        {item.funcoes?.map(f => (
                          <Badge key={f} className={funcaoLabels[f]?.color}>
                            {funcaoLabels[f]?.label}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={`${item.ativo !== false ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'} ${currentUser?.role === 'admin' ? 'cursor-pointer hover:opacity-70 transition-opacity' : ''}`}
                        onClick={() => toggleStatus(item)}
                        title={currentUser?.role === 'admin' ? 'Clique para alterar status' : ''}
                      >
                        {item.ativo !== false ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={`${
                          item.status_aprovacao === 'aprovado' ? 'bg-green-100 text-green-700' :
                          item.status_aprovacao === 'rejeitado' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        } ${currentUser?.role === 'admin' ? 'cursor-pointer hover:opacity-70 transition-opacity' : ''}`}
                        onClick={() => toggleStatusAprovacao(item)}
                        title={currentUser?.role === 'admin' ? 'Clique para alterar status de aprovação' : ''}
                      >
                        {item.status_aprovacao === 'aprovado' ? 'Aprovado' :
                         item.status_aprovacao === 'rejeitado' ? 'Rejeitado' :
                         'Pendente'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Form Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedItem ? 'Editar Pessoa' : 'Nova Pessoa'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>Foto de Perfil</Label>
              <div className="flex items-center gap-4">
                {formData.foto_perfil ? (
                  <div className="relative">
                    <img
                      src={formData.foto_perfil}
                      alt="Foto de perfil"
                      className="w-20 h-20 rounded-full object-cover border-2 border-slate-200"
                    />
                    <button
                      onClick={removeImage}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                    <User className="w-10 h-10 text-slate-400" />
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
                  >
                    {uploadingImage ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    {uploadingImage ? 'Enviando...' : 'Escolher foto'}
                  </Button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Matrícula *</Label>
                <Input
                  value={formData.matricula}
                  onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                  placeholder="000000"
                />
              </div>
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome completo"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>E-mail *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@empresa.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Regional *</Label>
              <Select
                value={formData.regional_id}
                onValueChange={(v) => setFormData({ ...formData, regional_id: v, almoxarifados_ids: [] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {regionais.map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.sigla} - {r.descricao}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Funções *</Label>
              <div className="flex gap-4">
                {Object.entries(funcaoLabels).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-2">
                    <Checkbox
                      id={`funcao-${key}`}
                      checked={formData.funcoes.includes(key)}
                      onCheckedChange={() => toggleFuncao(key)}
                    />
                    <Label htmlFor={`funcao-${key}`} className="cursor-pointer">{val.label}</Label>
                  </div>
                ))}
              </div>
            </div>
            {formData.regional_id && (
              <div className="space-y-2">
                <Label>Almoxarifados Vinculados</Label>
                <div className="max-h-32 overflow-y-auto border rounded-lg p-3 space-y-2">
                  {filteredAlmoxarifados.length === 0 ? (
                    <p className="text-sm text-slate-500">Nenhum almoxarifado nesta regional</p>
                  ) : (
                    filteredAlmoxarifados.map(a => (
                      <div key={a.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`almox-${a.id}`}
                          checked={formData.almoxarifados_ids.includes(a.id)}
                          onCheckedChange={() => toggleAlmoxarifado(a.id)}
                        />
                        <Label htmlFor={`almox-${a.id}`} className="cursor-pointer text-sm">{a.nome}</Label>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button 
              onClick={handleSave} 
              disabled={!formData.matricula || !formData.nome || !formData.email || 
                       !formData.regional_id || formData.funcoes.length === 0 || saving}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Profile Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Perfil Completo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            {/* Foto de Perfil */}
            <div className="flex flex-col items-center gap-3">
              {viewingItem?.foto_perfil ? (
                <img
                  src={viewingItem.foto_perfil}
                  alt={viewingItem.nome}
                  className="w-24 h-24 rounded-full object-cover border-4 border-slate-200"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-3xl font-bold">
                  {viewingItem?.nome?.charAt(0) || '?'}
                </div>
              )}
            </div>

            {/* Informações Básicas */}
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-slate-500 dark:text-slate-400">Nome Completo</Label>
                <p className="text-base font-medium text-slate-900 dark:text-white mt-1">{viewingItem?.nome}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-slate-500 dark:text-slate-400">Matrícula</Label>
                  <p className="text-base font-mono text-slate-900 dark:text-white mt-1">{viewingItem?.matricula}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500 dark:text-slate-400">Status</Label>
                  <div className="mt-1">
                    <Badge className={viewingItem?.ativo !== false ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}>
                      {viewingItem?.ativo !== false ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-xs text-slate-500 dark:text-slate-400">E-mail</Label>
                <p className="text-base text-slate-900 dark:text-white mt-1">{viewingItem?.email}</p>
              </div>
              <div>
                <Label className="text-xs text-slate-500 dark:text-slate-400">Regional</Label>
                <p className="text-base text-slate-900 dark:text-white mt-1">
                  {regionais.find(r => r.id === viewingItem?.regional_id)?.sigla || '-'}
                </p>
              </div>
              <div>
                <Label className="text-xs text-slate-500 dark:text-slate-400">Funções</Label>
                <div className="flex gap-2 flex-wrap mt-1">
                  {viewingItem?.funcoes?.map(f => (
                    <Badge key={f} className={funcaoLabels[f]?.color}>
                      {funcaoLabels[f]?.label}
                    </Badge>
                  ))}
                </div>
              </div>
              {viewingItem?.almoxarifados_ids?.length > 0 && (
                <div>
                  <Label className="text-xs text-slate-500 dark:text-slate-400">Almoxarifados Vinculados</Label>
                  <div className="mt-2 space-y-1">
                    {almoxarifados
                      .filter(a => viewingItem.almoxarifados_ids.includes(a.id))
                      .map(a => (
                        <p key={a.id} className="text-sm text-slate-900 dark:text-white">• {a.nome}</p>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewModal(false)}>Fechar</Button>
            <Button onClick={() => {
              setShowViewModal(false);
              handleEdit(viewingItem);
            }}>
              <Edit className="w-4 h-4 mr-2" />
              Editar Perfil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Edit Funcoes Modal */}
      <Dialog open={showFuncoesModal} onOpenChange={setShowFuncoesModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Funções</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              {editingFuncoes.pessoa?.nome}
            </p>
            <div className="space-y-3">
              {Object.entries(funcaoLabels).map(([key, val]) => (
                <div key={key} className="flex items-center gap-3">
                  <Checkbox
                    id={`edit-funcao-${key}`}
                    checked={editingFuncoes.funcoes.includes(key)}
                    onCheckedChange={() => toggleEditingFuncao(key)}
                  />
                  <Label htmlFor={`edit-funcao-${key}`} className="cursor-pointer flex-1">
                    {val.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFuncoesModal(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={saveFuncoes} 
              disabled={saving || editingFuncoes.funcoes.length === 0}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Pessoa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{selectedItem?.nome}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}