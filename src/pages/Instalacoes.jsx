import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Pencil, Trash2, Loader2, MapPin, Building2 } from 'lucide-react';

const classificacaoColors = {
  'Usina': 'bg-green-100 text-green-700',
  'Subestação': 'bg-blue-100 text-blue-700',
  'Almoxarifado': 'bg-amber-100 text-amber-700',
  'Outros': 'bg-slate-100 text-slate-700'
};

export default function Instalacoes() {
  const [loading, setLoading] = useState(true);
  const [instalacoes, setInstalacoes] = useState([]);
  const [regionais, setRegionais] = useState([]);
  const [search, setSearch] = useState('');
  const [filterRegional, setFilterRegional] = useState('all');
  const [filterClassificacao, setFilterClassificacao] = useState('all');
  
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    endereco: '',
    cep: '',
    latitude: '',
    longitude: '',
    classificacao: 'Outros',
    regional_id: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [instalacoesData, regionaisData] = await Promise.all([
        base44.entities.Instalacao.list(),
        base44.entities.Regional.list()
      ]);
      setInstalacoes(instalacoesData);
      setRegionais(regionaisData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedItem(null);
    setFormData({
      nome: '',
      endereco: '',
      cep: '',
      latitude: '',
      longitude: '',
      classificacao: 'Outros',
      regional_id: ''
    });
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setFormData({
      nome: item.nome || '',
      endereco: item.endereco || '',
      cep: item.cep || '',
      latitude: item.latitude || '',
      longitude: item.longitude || '',
      classificacao: item.classificacao || 'Outros',
      regional_id: item.regional_id || ''
    });
    setShowModal(true);
  };

  const handleDelete = (item) => {
    setSelectedItem(item);
    setShowDeleteDialog(true);
  };

  const handleSave = async () => {
    try {
      const data = {
        ...formData,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      };

      if (selectedItem) {
        await base44.entities.Instalacao.update(selectedItem.id, data);
      } else {
        await base44.entities.Instalacao.create(data);
      }
      
      setShowModal(false);
      loadData();
    } catch (error) {
      console.error('Error saving:', error);
    }
  };

  const confirmDelete = async () => {
    try {
      await base44.entities.Instalacao.delete(selectedItem.id);
      setShowDeleteDialog(false);
      loadData();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const filteredInstalacoes = instalacoes.filter(inst => {
    const matchesSearch = 
      inst.nome?.toLowerCase().includes(search.toLowerCase()) ||
      inst.endereco?.toLowerCase().includes(search.toLowerCase()) ||
      inst.cep?.toLowerCase().includes(search.toLowerCase());
    
    const matchesRegional = filterRegional === 'all' || inst.regional_id === filterRegional;
    const matchesClassificacao = filterClassificacao === 'all' || inst.classificacao === filterClassificacao;
    
    return matchesSearch && matchesRegional && matchesClassificacao;
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
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">Instalações</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Gerencie as instalações da Axia Energia</p>
        </div>
        <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Nova Instalação
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por nome, endereço ou CEP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-slate-50 dark:bg-slate-900"
            />
          </div>
          <Select value={filterRegional} onValueChange={setFilterRegional}>
            <SelectTrigger className="w-full lg:w-48 bg-slate-50 dark:bg-slate-900">
              <SelectValue placeholder="Regional" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Regionais</SelectItem>
              {regionais.map((r) => (
                <SelectItem key={r.id} value={r.id}>{r.sigla}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterClassificacao} onValueChange={setFilterClassificacao}>
            <SelectTrigger className="w-full lg:w-48 bg-slate-50 dark:bg-slate-900">
              <SelectValue placeholder="Classificação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="Usina">Usina</SelectItem>
              <SelectItem value="Subestação">Subestação</SelectItem>
              <SelectItem value="Almoxarifado">Almoxarifado</SelectItem>
              <SelectItem value="Outros">Outros</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Classificação</TableHead>
              <TableHead>Endereço</TableHead>
              <TableHead>CEP</TableHead>
              <TableHead>Regional</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInstalacoes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                  <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>Nenhuma instalação encontrada</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredInstalacoes.map((inst) => {
                const regional = regionais.find(r => r.id === inst.regional_id);
                return (
                  <TableRow key={inst.id}>
                    <TableCell className="font-medium">{inst.nome}</TableCell>
                    <TableCell>
                      <Badge className={classificacaoColors[inst.classificacao]}>
                        {inst.classificacao}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{inst.endereco}</TableCell>
                    <TableCell>{inst.cep || '-'}</TableCell>
                    <TableCell>
                      {regional ? (
                        <span className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          {regional.sigla}
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(inst)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(inst)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Form Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedItem ? 'Editar Instalação' : 'Nova Instalação'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="md:col-span-2">
              <Label>Nome *</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome da instalação"
              />
            </div>
            <div className="md:col-span-2">
              <Label>Endereço *</Label>
              <Input
                value={formData.endereco}
                onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                placeholder="Endereço completo"
              />
            </div>
            <div>
              <Label>CEP</Label>
              <Input
                value={formData.cep}
                onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                placeholder="00000-000"
              />
            </div>
            <div>
              <Label>Classificação *</Label>
              <Select
                value={formData.classificacao}
                onValueChange={(value) => setFormData({ ...formData, classificacao: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Usina">Usina</SelectItem>
                  <SelectItem value="Subestação">Subestação</SelectItem>
                  <SelectItem value="Almoxarifado">Almoxarifado</SelectItem>
                  <SelectItem value="Outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Regional</Label>
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
              <Label>Latitude</Label>
              <Input
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                placeholder="-23.550520"
              />
            </div>
            <div>
              <Label>Longitude</Label>
              <Input
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                placeholder="-46.633308"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.nome || !formData.endereco || !formData.classificacao}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a instalação "{selectedItem?.nome}"? 
              Esta ação não pode ser desfeita.
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