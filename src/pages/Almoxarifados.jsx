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
import { Plus, Edit, Trash2, Warehouse, Loader2, Search, MapPin } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function Almoxarifados() {
  const [loading, setLoading] = useState(true);
  const [almoxarifados, setAlmoxarifados] = useState([]);
  const [regionais, setRegionais] = useState([]);
  const [search, setSearch] = useState('');
  const [filterRegional, setFilterRegional] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    regional_id: '',
    endereco: '',
    latitude: '',
    longitude: '',
    ativo: true
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [almoxData, regionaisData] = await Promise.all([
        base44.entities.Almoxarifado.list(),
        base44.entities.Regional.list()
      ]);
      setAlmoxarifados(almoxData);
      setRegionais(regionaisData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNew = () => {
    setSelectedItem(null);
    setFormData({
      nome: '',
      regional_id: '',
      endereco: '',
      latitude: '',
      longitude: '',
      ativo: true
    });
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setFormData({
      nome: item.nome || '',
      regional_id: item.regional_id || '',
      endereco: item.endereco || '',
      latitude: item.latitude || '',
      longitude: item.longitude || '',
      ativo: item.ativo !== false
    });
    setShowModal(true);
  };

  const handleDelete = (item) => {
    setSelectedItem(item);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    try {
      await base44.entities.Almoxarifado.delete(selectedItem.id);
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
      const data = {
        ...formData,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null
      };
      
      if (selectedItem) {
        await base44.entities.Almoxarifado.update(selectedItem.id, data);
      } else {
        await base44.entities.Almoxarifado.create(data);
      }
      loadData();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

  const getRegional = (id) => regionais.find(r => r.id === id);

  const filteredItems = almoxarifados.filter(a => {
    if (filterRegional !== 'all' && a.regional_id !== filterRegional) return false;
    if (search && !a.nome?.toLowerCase().includes(search.toLowerCase())) return false;
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
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">Almoxarifados</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Gerencie os almoxarifados</p>
        </div>
        <Button onClick={handleNew} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Novo Almoxarifado
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por nome..."
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
              <TableHead className="font-semibold">Nome</TableHead>
              <TableHead className="font-semibold">Regional</TableHead>
              <TableHead className="font-semibold">Endereço</TableHead>
              <TableHead className="font-semibold">Coordenadas</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                  <Warehouse className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>Nenhum almoxarifado cadastrado</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => {
                const regional = getRegional(item.regional_id);
                return (
                  <TableRow key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                          <Warehouse className="w-5 h-5 text-amber-600" />
                        </div>
                        <span className="font-medium text-slate-900 dark:text-white">{item.nome}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{regional?.sigla || '-'}</Badge>
                    </TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-400 max-w-xs truncate">
                      {item.endereco || '-'}
                    </TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-400">
                      {item.latitude && item.longitude ? (
                        <span className="font-mono text-xs">
                          {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge className={item.ativo !== false ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}>
                        {item.ativo !== false ? 'Ativo' : 'Inativo'}
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
            <DialogTitle>{selectedItem ? 'Editar Almoxarifado' : 'Novo Almoxarifado'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome do almoxarifado"
              />
            </div>
            <div className="space-y-2">
              <Label>Regional *</Label>
              <Select
                value={formData.regional_id}
                onValueChange={(v) => setFormData({ ...formData, regional_id: v })}
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
              <Label>Endereço</Label>
              <Input
                value={formData.endereco}
                onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                placeholder="Endereço completo"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Latitude</Label>
                <Input
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  placeholder="-23.5505"
                />
              </div>
              <div className="space-y-2">
                <Label>Longitude</Label>
                <Input
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  placeholder="-46.6333"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!formData.nome || !formData.regional_id || saving}>
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
            <AlertDialogTitle>Excluir Almoxarifado</AlertDialogTitle>
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