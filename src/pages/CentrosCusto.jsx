import React, { useState, useEffect } from 'react';
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
import { Plus, Pencil, Trash2, Search, DollarSign, TrendingUp, AlertCircle, ShieldOff } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApp } from '@/components/contexts/AppContext';

export default function CentrosCusto() {
  const { currentUser, regionais, pessoas } = useApp();
  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState('all');
  const [filterRegional, setFilterRegional] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingCC, setEditingCC] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [formData, setFormData] = useState({
    codigo: '',
    nome: '',
    descricao: '',
    tipo: 'operacional',
    regional_id: '',
    gestor_id: '',
    orcamento_anual: 0,
    ativo: true
  });

  const queryClient = useQueryClient();

  const { data: centrosCusto = [], isLoading } = useQuery({
    queryKey: ['centrosCusto'],
    queryFn: () => base44.entities.CentroCusto.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CentroCusto.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['centrosCusto']);
      setShowModal(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CentroCusto.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['centrosCusto']);
      setShowModal(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CentroCusto.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['centrosCusto']);
      setDeleteId(null);
    }
  });

  const resetForm = () => {
    setFormData({
      codigo: '',
      nome: '',
      descricao: '',
      tipo: 'operacional',
      regional_id: '',
      gestor_id: '',
      orcamento_anual: 0,
      ativo: true
    });
    setEditingCC(null);
  };

  const handleEdit = (cc) => {
    setEditingCC(cc);
    setFormData({
      codigo: cc.codigo || '',
      nome: cc.nome || '',
      descricao: cc.descricao || '',
      tipo: cc.tipo || 'operacional',
      regional_id: cc.regional_id || '',
      gestor_id: cc.gestor_id || '',
      orcamento_anual: cc.orcamento_anual || 0,
      ativo: cc.ativo !== false
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingCC) {
      updateMutation.mutate({ id: editingCC.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredCCs = centrosCusto.filter(cc => {
    const matchSearch = !search || 
      cc.codigo?.toLowerCase().includes(search.toLowerCase()) ||
      cc.nome?.toLowerCase().includes(search.toLowerCase());
    const matchTipo = filterTipo === 'all' || cc.tipo === filterTipo;
    const matchRegional = filterRegional === 'all' || cc.regional_id === filterRegional;
    return matchSearch && matchTipo && matchRegional;
  });

  const getTipoBadge = (tipo) => {
    const colors = {
      operacional: 'bg-blue-100 text-blue-800',
      investimento: 'bg-green-100 text-green-800',
      administrativo: 'bg-purple-100 text-purple-800'
    };
    return <Badge className={colors[tipo]}>{tipo}</Badge>;
  };

  const getConsumoPercentual = (cc) => {
    if (!cc.orcamento_anual || cc.orcamento_anual === 0) return 0;
    return ((cc.gasto_acumulado || 0) / cc.orcamento_anual) * 100;
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
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Centros de Custo</h1>
            <p className="text-slate-600 dark:text-slate-400">Gerenciar centros de custo e orçamentos</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total CCs</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{centrosCusto.length}</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Ativos</p>
                <p className="text-2xl font-bold text-green-600">{centrosCusto.filter(c => c.ativo).length}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Operacionais</p>
                <p className="text-2xl font-bold text-blue-600">{centrosCusto.filter(c => c.tipo === 'operacional').length}</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Investimento</p>
                <p className="text-2xl font-bold text-green-600">{centrosCusto.filter(c => c.tipo === 'investimento').length}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
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
                  placeholder="Buscar por código ou nome..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="operacional">Operacional</SelectItem>
                <SelectItem value="investimento">Investimento</SelectItem>
                <SelectItem value="administrativo">Administrativo</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterRegional} onValueChange={setFilterRegional}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Regional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas regionais</SelectItem>
                {regionais.map(r => (
                  <SelectItem key={r.id} value={r.id}>{r.sigla}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={() => { resetForm(); setShowModal(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Centro de Custo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista */}
      <div className="grid gap-4">
        {filteredCCs.map(cc => {
          const consumo = getConsumoPercentual(cc);
          const regional = regionais.find(r => r.id === cc.regional_id);
          const gestor = pessoas.find(p => p.id === cc.gestor_id);

          return (
            <Card key={cc.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{cc.codigo}</h3>
                      {getTipoBadge(cc.tipo)}
                      {!cc.ativo && <Badge variant="outline" className="text-red-600">Inativo</Badge>}
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 mb-3">{cc.nome}</p>
                    {cc.descricao && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{cc.descricao}</p>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Regional</p>
                        <p className="text-sm font-medium">{regional?.sigla || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Gestor</p>
                        <p className="text-sm font-medium">{gestor?.nome || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Orçamento Anual</p>
                        <p className="text-sm font-medium">R$ {(cc.orcamento_anual || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>

                    {/* Barra de Consumo */}
                    {cc.orcamento_anual > 0 && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-slate-500 dark:text-slate-400">Consumo do Orçamento</p>
                          <p className="text-xs font-medium">{consumo.toFixed(1)}%</p>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${
                              consumo >= 80 ? 'bg-red-500' : consumo >= 50 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(consumo, 100)}%` }}
                          />
                        </div>
                        {consumo >= 80 && (
                          <div className="flex items-center gap-2 mt-2 text-xs text-red-600 dark:text-red-400">
                            <AlertCircle className="w-4 h-4" />
                            Atenção: Consumo acima de 80% do orçamento
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button variant="outline" size="icon" onClick={() => handleEdit(cc)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => setDeleteId(cc.id)}>
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredCCs.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <DollarSign className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400">Nenhum centro de custo encontrado</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de Form */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="px-6 py-5 border-b -m-6 mb-0" style={{ background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)' }}>
            <DialogTitle className="text-white">
              {editingCC ? 'Editar' : 'Novo'} Centro de Custo
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-6 py-6 px-6">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-5 flex items-center gap-2">
                  <div className="w-1 h-4 bg-gradient-to-b from-[#22c55e] to-[#84cc16] rounded-full"></div>
                  Informações
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Código *</Label>
                      <Input
                        value={formData.codigo}
                        onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                        placeholder="CC-001"
                        required
                        className="border-slate-300 dark:border-slate-600 rounded-lg"
                      />
                    </div>
                    <div>
                      <Label>Tipo *</Label>
                      <Select value={formData.tipo} onValueChange={(v) => setFormData({ ...formData, tipo: v })}>
                        <SelectTrigger className="border-slate-300 dark:border-slate-600 rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="operacional">Operacional</SelectItem>
                          <SelectItem value="investimento">Investimento</SelectItem>
                          <SelectItem value="administrativo">Administrativo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Nome *</Label>
                    <Input
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder="Nome do centro de custo"
                      required
                      className="border-slate-300 dark:border-slate-600 rounded-lg"
                    />
                  </div>

                  <div>
                    <Label>Descrição</Label>
                    <Textarea
                      value={formData.descricao}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                      placeholder="Descrição detalhada..."
                      rows={3}
                      className="border-slate-300 dark:border-slate-600 rounded-lg"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Regional</Label>
                      <Select value={formData.regional_id} onValueChange={(v) => setFormData({ ...formData, regional_id: v })}>
                        <SelectTrigger className="border-slate-300 dark:border-slate-600 rounded-lg">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {regionais.map(r => (
                            <SelectItem key={r.id} value={r.id}>{r.sigla} - {r.descricao}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Gestor</Label>
                      <Select value={formData.gestor_id} onValueChange={(v) => setFormData({ ...formData, gestor_id: v })}>
                        <SelectTrigger className="border-slate-300 dark:border-slate-600 rounded-lg">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {pessoas.filter(p => p.funcoes?.includes('gestor')).map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Orçamento Anual (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.orcamento_anual}
                      onChange={(e) => setFormData({ ...formData, orcamento_anual: parseFloat(e.target.value) || 0 })}
                      className="border-slate-300 dark:border-slate-600 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 px-6 py-4 flex justify-end gap-3 rounded-b-lg">
              <Button type="button" variant="outline" onClick={() => { setShowModal(false); resetForm(); }}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} style={{ background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)', color: 'white' }}>
                {editingCC ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este centro de custo? Esta ação não pode ser desfeita.
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