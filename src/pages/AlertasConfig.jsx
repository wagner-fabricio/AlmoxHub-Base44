import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, AlertCircle, Bell } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function AlertasConfig() {
  const [showModal, setShowModal] = useState(false);
  const [editingAlerta, setEditingAlerta] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [selectedPessoas, setSelectedPessoas] = useState([]);
  const [formData, setFormData] = useState({
    nome: '',
    tipo_alerta: 'atraso_os',
    threshold_dias: 3,
    threshold_percentual: 50,
    canal: 'in-app',
    filtros: {},
    ativo: true
  });

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me()
  });

  const { data: alertas = [], isLoading } = useQuery({
    queryKey: ['alertas'],
    queryFn: () => base44.entities.AlertaConfig.list()
  });

  const { data: pessoas = [] } = useQuery({
    queryKey: ['pessoas'],
    queryFn: () => base44.entities.Pessoa.list()
  });

  const { data: regionais = [] } = useQuery({
    queryKey: ['regionais'],
    queryFn: () => base44.entities.Regional.list()
  });

  const { data: almoxarifados = [] } = useQuery({
    queryKey: ['almoxarifados'],
    queryFn: () => base44.entities.Almoxarifado.list()
  });

  const { data: categorias = [] } = useQuery({
    queryKey: ['categorias'],
    queryFn: () => base44.entities.Categoria.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.AlertaConfig.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['alertas']);
      setShowModal(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AlertaConfig.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['alertas']);
      setShowModal(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AlertaConfig.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['alertas']);
      setDeleteId(null);
    }
  });

  const resetForm = () => {
    setFormData({
      nome: '',
      tipo_alerta: 'atraso_os',
      threshold_dias: 3,
      threshold_percentual: 50,
      canal: 'in-app',
      filtros: {},
      ativo: true
    });
    setSelectedPessoas([]);
    setEditingAlerta(null);
  };

  const handleEdit = (alerta) => {
    setEditingAlerta(alerta);
    setFormData({
      nome: alerta.nome || '',
      tipo_alerta: alerta.tipo_alerta || 'atraso_os',
      threshold_dias: alerta.threshold_dias || 3,
      threshold_percentual: alerta.threshold_percentual || 50,
      canal: alerta.canal || 'in-app',
      filtros: alerta.filtros || {},
      ativo: alerta.ativo !== false
    });
    setSelectedPessoas(alerta.destinatarios_ids || []);
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      user_id: user.id,
      destinatarios_ids: selectedPessoas
    };

    if (editingAlerta) {
      updateMutation.mutate({ id: editingAlerta.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const togglePessoa = (pessoaId) => {
    setSelectedPessoas(prev => 
      prev.includes(pessoaId) 
        ? prev.filter(id => id !== pessoaId)
        : [...prev, pessoaId]
    );
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center">
            <Bell className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Alertas Configuráveis</h1>
            <p className="text-slate-600 dark:text-slate-400">Configure alertas personalizados para suas OS</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mb-6 flex justify-end">
        <Button onClick={() => { resetForm(); setShowModal(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Alerta
        </Button>
      </div>

      {/* Lista */}
      <div className="grid gap-4">
        {alertas.map(alerta => {
          const criador = pessoas.find(p => p.user_id === alerta.user_id);
          return (
            <Card key={alerta.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{alerta.nome}</h3>
                      {!alerta.ativo && <Badge variant="outline" className="text-red-600">Inativo</Badge>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Tipo de Alerta</p>
                        <p className="text-sm font-medium">{getTipoLabel(alerta.tipo_alerta)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Threshold</p>
                        <p className="text-sm font-medium">
                          {alerta.threshold_dias && `${alerta.threshold_dias} dias`}
                          {alerta.threshold_percentual && `${alerta.threshold_percentual}%`}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Canal</p>
                        <Badge className={getCanalColor(alerta.canal)}>{getCanalLabel(alerta.canal)}</Badge>
                      </div>
                    </div>

                    {alerta.destinatarios_ids?.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                          Destinatários ({alerta.destinatarios_ids.length}):
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {alerta.destinatarios_ids.slice(0, 5).map(id => {
                            const pessoa = pessoas.find(p => p.id === id);
                            return pessoa ? (
                              <Badge key={id} variant="outline">{pessoa.nome}</Badge>
                            ) : null;
                          })}
                          {alerta.destinatarios_ids.length > 5 && (
                            <Badge variant="outline">+{alerta.destinatarios_ids.length - 5}</Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button variant="outline" size="icon" onClick={() => handleEdit(alerta)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => setDeleteId(alerta.id)}>
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {alertas.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Bell className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400">Nenhum alerta configurado</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAlerta ? 'Editar' : 'Novo'} Alerta</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div>
                <Label>Nome do Alerta *</Label>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: OS com prazo próximo"
                  required
                />
              </div>

              <div>
                <Label>Tipo de Alerta *</Label>
                <Select value={formData.tipo_alerta} onValueChange={(v) => setFormData({ ...formData, tipo_alerta: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="atraso_os">OS Atrasada</SelectItem>
                    <SelectItem value="prazo_proximo">Prazo Próximo</SelectItem>
                    <SelectItem value="progresso_baixo">Progresso Baixo</SelectItem>
                    <SelectItem value="inatividade">Inatividade</SelectItem>
                    <SelectItem value="sem_movimentacao">Sem Movimentação</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {['prazo_proximo', 'inatividade', 'sem_movimentacao'].includes(formData.tipo_alerta) && (
                  <div>
                    <Label>Threshold (dias)</Label>
                    <Input
                      type="number"
                      value={formData.threshold_dias}
                      onChange={(e) => setFormData({ ...formData, threshold_dias: parseInt(e.target.value) })}
                    />
                  </div>
                )}
                {formData.tipo_alerta === 'progresso_baixo' && (
                  <div>
                    <Label>Threshold (%)</Label>
                    <Input
                      type="number"
                      value={formData.threshold_percentual}
                      onChange={(e) => setFormData({ ...formData, threshold_percentual: parseInt(e.target.value) })}
                    />
                  </div>
                )}
              </div>

              <div>
                <Label>Canal de Notificação</Label>
                <Select value={formData.canal} onValueChange={(v) => setFormData({ ...formData, canal: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in-app">In-App</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="push">Push</SelectItem>
                    <SelectItem value="todos">Todos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="border-t pt-4">
                <Label className="mb-3 block">Destinatários</Label>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {pessoas.map(pessoa => (
                    <label key={pessoa.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedPessoas.includes(pessoa.id)}
                        onChange={() => togglePessoa(pessoa.id)}
                        className="rounded"
                      />
                      <span className="text-sm">{pessoa.nome}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setShowModal(false); resetForm(); }}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingAlerta ? 'Atualizar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este alerta? Esta ação não pode ser desfeita.
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

function getTipoLabel(tipo) {
  const labels = {
    atraso_os: 'OS Atrasada',
    prazo_proximo: 'Prazo Próximo',
    progresso_baixo: 'Progresso Baixo',
    inatividade: 'Inatividade',
    sem_movimentacao: 'Sem Movimentação'
  };
  return labels[tipo] || tipo;
}

function getCanalLabel(canal) {
  const labels = {
    'in-app': 'In-App',
    email: 'Email',
    push: 'Push',
    todos: 'Todos'
  };
  return labels[canal] || canal;
}

function getCanalColor(canal) {
  const colors = {
    'in-app': 'bg-blue-100 text-blue-800',
    email: 'bg-green-100 text-green-800',
    push: 'bg-purple-100 text-purple-800',
    todos: 'bg-orange-100 text-orange-800'
  };
  return colors[canal] || 'bg-slate-100 text-slate-800';
}