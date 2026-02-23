import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Search, Building2, Phone, Mail, MapPin, FileText } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function Fornecedores() {
  const [search, setSearch] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('all');
  const [filterAtivo, setFilterAtivo] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingFornecedor, setEditingFornecedor] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [formData, setFormData] = useState({
    razao_social: '',
    nome_fantasia: '',
    cnpj: '',
    inscricao_estadual: '',
    categoria: 'materiais',
    codigo_sap: '',
    observacoes: '',
    endereco: {
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      cep: ''
    },
    contatos: [],
    ativo: true
  });

  const queryClient = useQueryClient();

  const { data: fornecedores = [], isLoading } = useQuery({
    queryKey: ['fornecedores'],
    queryFn: () => base44.entities.Fornecedor.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Fornecedor.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['fornecedores']);
      setShowModal(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Fornecedor.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['fornecedores']);
      setShowModal(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Fornecedor.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['fornecedores']);
      setDeleteId(null);
    }
  });

  const resetForm = () => {
    setFormData({
      razao_social: '',
      nome_fantasia: '',
      cnpj: '',
      inscricao_estadual: '',
      categoria: 'materiais',
      codigo_sap: '',
      observacoes: '',
      endereco: {
        logradouro: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        estado: '',
        cep: ''
      },
      contatos: [],
      ativo: true
    });
    setEditingFornecedor(null);
  };

  const handleEdit = (fornecedor) => {
    setEditingFornecedor(fornecedor);
    setFormData({
      razao_social: fornecedor.razao_social || '',
      nome_fantasia: fornecedor.nome_fantasia || '',
      cnpj: fornecedor.cnpj || '',
      inscricao_estadual: fornecedor.inscricao_estadual || '',
      categoria: fornecedor.categoria || 'materiais',
      codigo_sap: fornecedor.codigo_sap || '',
      observacoes: fornecedor.observacoes || '',
      endereco: fornecedor.endereco || {
        logradouro: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        estado: '',
        cep: ''
      },
      contatos: fornecedor.contatos || [],
      ativo: fornecedor.ativo !== false
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingFornecedor) {
      updateMutation.mutate({ id: editingFornecedor.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredFornecedores = fornecedores.filter(f => {
    const matchSearch = !search || 
      f.razao_social?.toLowerCase().includes(search.toLowerCase()) ||
      f.nome_fantasia?.toLowerCase().includes(search.toLowerCase()) ||
      f.cnpj?.includes(search);
    const matchCategoria = filterCategoria === 'all' || f.categoria === filterCategoria;
    const matchAtivo = filterAtivo === 'all' || 
      (filterAtivo === 'ativo' && f.ativo !== false) ||
      (filterAtivo === 'inativo' && f.ativo === false);
    return matchSearch && matchCategoria && matchAtivo;
  });

  const getCategoriaBadge = (categoria) => {
    const colors = {
      materiais: 'bg-blue-100 text-blue-800',
      servicos: 'bg-purple-100 text-purple-800',
      transporte: 'bg-green-100 text-green-800',
      equipamentos: 'bg-orange-100 text-orange-800'
    };
    return <Badge className={colors[categoria]}>{categoria}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Fornecedores</h1>
            <p className="text-slate-600 dark:text-slate-400">Gerenciar cadastro de fornecedores e parceiros</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{fornecedores.length}</p>
              </div>
              <Building2 className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Ativos</p>
                <p className="text-2xl font-bold text-green-600">{fornecedores.filter(f => f.ativo !== false).length}</p>
              </div>
              <Building2 className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Materiais</p>
                <p className="text-2xl font-bold text-blue-600">{fornecedores.filter(f => f.categoria === 'materiais').length}</p>
              </div>
              <Building2 className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Serviços</p>
                <p className="text-2xl font-bold text-purple-600">{fornecedores.filter(f => f.categoria === 'servicos').length}</p>
              </div>
              <Building2 className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar por razão social, nome fantasia ou CNPJ..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={filterCategoria} onValueChange={setFilterCategoria}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                <SelectItem value="materiais">Materiais</SelectItem>
                <SelectItem value="servicos">Serviços</SelectItem>
                <SelectItem value="transporte">Transporte</SelectItem>
                <SelectItem value="equipamentos">Equipamentos</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterAtivo} onValueChange={setFilterAtivo}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ativo">Ativos</SelectItem>
                <SelectItem value="inativo">Inativos</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={() => { resetForm(); setShowModal(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Fornecedor
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista */}
      <div className="grid gap-4">
        {filteredFornecedores.map(fornecedor => (
          <Card key={fornecedor.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {fornecedor.razao_social}
                    </h3>
                    {getCategoriaBadge(fornecedor.categoria)}
                    {fornecedor.ativo === false && (
                      <Badge variant="outline" className="text-red-600">Inativo</Badge>
                    )}
                  </div>
                  
                  {fornecedor.nome_fantasia && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                      Nome Fantasia: {fornecedor.nome_fantasia}
                    </p>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span>CNPJ: {fornecedor.cnpj || '-'}</span>
                    </div>
                    {fornecedor.codigo_sap && (
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span>SAP: {fornecedor.codigo_sap}</span>
                      </div>
                    )}
                    {fornecedor.endereco?.cidade && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span>{fornecedor.endereco.cidade}/{fornecedor.endereco.estado}</span>
                      </div>
                    )}
                  </div>

                  {fornecedor.contatos && fornecedor.contatos.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Contatos:</p>
                      {fornecedor.contatos.slice(0, 2).map((contato, idx) => (
                        <div key={idx} className="text-sm mb-1">
                          <span className="font-medium">{contato.nome}</span>
                          {contato.cargo && <span className="text-slate-500"> - {contato.cargo}</span>}
                          {contato.email && (
                            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 ml-4">
                              <Mail className="w-3 h-3" />
                              {contato.email}
                            </div>
                          )}
                          {contato.telefone && (
                            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 ml-4">
                              <Phone className="w-3 h-3" />
                              {contato.telefone}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  <Button variant="outline" size="icon" onClick={() => handleEdit(fornecedor)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => setDeleteId(fornecedor.id)}>
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredFornecedores.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400">Nenhum fornecedor encontrado</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de Form */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingFornecedor ? 'Editar' : 'Novo'} Fornecedor</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Razão Social *</Label>
                  <Input
                    value={formData.razao_social}
                    onChange={(e) => setFormData({ ...formData, razao_social: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Nome Fantasia</Label>
                  <Input
                    value={formData.nome_fantasia}
                    onChange={(e) => setFormData({ ...formData, nome_fantasia: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>CNPJ *</Label>
                  <Input
                    value={formData.cnpj}
                    onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                    placeholder="00.000.000/0000-00"
                    required
                  />
                </div>
                <div>
                  <Label>Inscrição Estadual</Label>
                  <Input
                    value={formData.inscricao_estadual}
                    onChange={(e) => setFormData({ ...formData, inscricao_estadual: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Código SAP</Label>
                  <Input
                    value={formData.codigo_sap}
                    onChange={(e) => setFormData({ ...formData, codigo_sap: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Categoria *</Label>
                <Select value={formData.categoria} onValueChange={(v) => setFormData({ ...formData, categoria: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="materiais">Materiais</SelectItem>
                    <SelectItem value="servicos">Serviços</SelectItem>
                    <SelectItem value="transporte">Transporte</SelectItem>
                    <SelectItem value="equipamentos">Equipamentos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Endereço</h4>
                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-3">
                    <Label>Logradouro</Label>
                    <Input
                      value={formData.endereco.logradouro}
                      onChange={(e) => setFormData({ ...formData, endereco: { ...formData.endereco, logradouro: e.target.value }})}
                    />
                  </div>
                  <div>
                    <Label>Número</Label>
                    <Input
                      value={formData.endereco.numero}
                      onChange={(e) => setFormData({ ...formData, endereco: { ...formData.endereco, numero: e.target.value }})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-3">
                  <div>
                    <Label>Bairro</Label>
                    <Input
                      value={formData.endereco.bairro}
                      onChange={(e) => setFormData({ ...formData, endereco: { ...formData.endereco, bairro: e.target.value }})}
                    />
                  </div>
                  <div>
                    <Label>Cidade</Label>
                    <Input
                      value={formData.endereco.cidade}
                      onChange={(e) => setFormData({ ...formData, endereco: { ...formData.endereco, cidade: e.target.value }})}
                    />
                  </div>
                  <div>
                    <Label>Estado</Label>
                    <Input
                      value={formData.endereco.estado}
                      onChange={(e) => setFormData({ ...formData, endereco: { ...formData.endereco, estado: e.target.value }})}
                      placeholder="UF"
                      maxLength={2}
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label>Observações</Label>
                <Textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setShowModal(false); resetForm(); }}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingFornecedor ? 'Atualizar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este fornecedor? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(deleteId)}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}