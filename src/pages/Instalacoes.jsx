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
  const [currentUser, setCurrentUser] = useState(null);
  const [search, setSearch] = useState('');
  const [filterRegional, setFilterRegional] = useState('all');
  const [filterClassificacao, setFilterClassificacao] = useState('all');
  const [filterCidade, setFilterCidade] = useState('all');
  const [filterEstado, setFilterEstado] = useState('all');
  
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    logradouro: '',
    numero: '',
    complemento: '',
    cidade: '',
    estado: '',
    cep: '',
    latitude: '',
    longitude: '',
    classificacao: 'Outros',
    regional_id: '',
    local_negocios: '',
    cnpj: '',
    inscricao_estadual: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [user, instalacoesData, regionaisData] = await Promise.all([
        base44.auth.me(),
        base44.entities.Instalacao.list(),
        base44.entities.Regional.list()
      ]);
      setCurrentUser(user);
      setInstalacoes(instalacoesData);
      setRegionais(regionaisData);

      if (user.filtros_preferidos?.Instalacoes) {
        const saved = user.filtros_preferidos.Instalacoes;
        setSearch(saved.search || '');
        setFilterRegional(saved.filterRegional || 'all');
        setFilterClassificacao(saved.filterClassificacao || 'all');
        setFilterCidade(saved.filterCidade || 'all');
        setFilterEstado(saved.filterEstado || 'all');
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveFilters = async (filterUpdates) => {
    try {
      const savedFilters = currentUser?.filtros_preferidos || {};
      await base44.auth.updateMe({
        filtros_preferidos: {
          ...savedFilters,
          Instalacoes: filterUpdates
        }
      });
    } catch (e) {
      console.error('Error saving filters:', e);
    }
  };

  const handleCreate = () => {
    setSelectedItem(null);
    setFormData({
      nome: '',
      logradouro: '',
      numero: '',
      complemento: '',
      cidade: '',
      estado: '',
      cep: '',
      latitude: '',
      longitude: '',
      classificacao: 'Outros',
      regional_id: '',
      local_negocios: '',
      cnpj: '',
      inscricao_estadual: ''
    });
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setFormData({
      nome: item.nome || '',
      logradouro: item.logradouro || '',
      numero: item.numero || '',
      complemento: item.complemento || '',
      cidade: item.cidade || '',
      estado: item.estado || '',
      cep: item.cep || '',
      latitude: item.latitude || '',
      longitude: item.longitude || '',
      classificacao: item.classificacao || 'Outros',
      regional_id: item.regional_id || '',
      local_negocios: item.local_negocios || '',
      cnpj: item.cnpj || '',
      inscricao_estadual: item.inscricao_estadual || ''
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
        local_negocios: formData.local_negocios ? parseFloat(formData.local_negocios) : null,
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

  const cidades = [...new Set(instalacoes.map(i => i.cidade).filter(Boolean))].sort();
  const estados = [...new Set(instalacoes.map(i => i.estado).filter(Boolean))].sort();

  const filteredInstalacoes = instalacoes.filter(inst => {
    const matchesSearch = 
      inst.nome?.toLowerCase().includes(search.toLowerCase()) ||
      inst.logradouro?.toLowerCase().includes(search.toLowerCase()) ||
      inst.cidade?.toLowerCase().includes(search.toLowerCase()) ||
      inst.cep?.toLowerCase().includes(search.toLowerCase());
    
    const matchesRegional = filterRegional === 'all' || inst.regional_id === filterRegional;
    const matchesClassificacao = filterClassificacao === 'all' || inst.classificacao === filterClassificacao;
    const matchesCidade = filterCidade === 'all' || inst.cidade === filterCidade;
    const matchesEstado = filterEstado === 'all' || inst.estado === filterEstado;
    
    return matchesSearch && matchesRegional && matchesClassificacao && matchesCidade && matchesEstado;
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
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por nome, endereço ou CEP..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                saveFilters({ search: e.target.value, filterRegional, filterClassificacao, filterCidade, filterEstado });
              }}
              className="pl-10 bg-slate-50 dark:bg-slate-900"
            />
          </div>
          <Select value={filterRegional} onValueChange={(v) => { setFilterRegional(v); saveFilters({ search, filterRegional: v, filterClassificacao, filterCidade, filterEstado }); }}>
            <SelectTrigger className="w-full lg:w-36 bg-slate-50 dark:bg-slate-900">
              <SelectValue placeholder="Regional" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {regionais.map((r) => (
                <SelectItem key={r.id} value={r.id}>{r.sigla}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterClassificacao} onValueChange={(v) => { setFilterClassificacao(v); saveFilters({ search, filterRegional, filterClassificacao: v, filterCidade, filterEstado }); }}>
            <SelectTrigger className="w-full lg:w-40 bg-slate-50 dark:bg-slate-900">
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
          <Select value={filterEstado} onValueChange={(v) => { setFilterEstado(v); saveFilters({ search, filterRegional, filterClassificacao, filterCidade, filterEstado: v }); }}>
            <SelectTrigger className="w-full lg:w-32 bg-slate-50 dark:bg-slate-900">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {estados.map((e) => (
                <SelectItem key={e} value={e}>{e}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterCidade} onValueChange={(v) => { setFilterCidade(v); saveFilters({ search, filterRegional, filterClassificacao, filterCidade: v, filterEstado }); }}>
            <SelectTrigger className="w-full lg:w-40 bg-slate-50 dark:bg-slate-900">
              <SelectValue placeholder="Cidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {cidades.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
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
              <TableHead>Cidade</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Regional</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInstalacoes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                  <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>Nenhuma instalação encontrada</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredInstalacoes.map((inst) => {
                const regional = regionais.find(r => r.id === inst.regional_id);
                const enderecoCompleto = [inst.logradouro, inst.numero].filter(Boolean).join(', ');
                return (
                  <TableRow key={inst.id}>
                    <TableCell className="font-medium">{inst.nome}</TableCell>
                    <TableCell>
                      <Badge className={classificacaoColors[inst.classificacao]}>
                        {inst.classificacao}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{enderecoCompleto || '-'}</TableCell>
                    <TableCell>{inst.cidade || '-'}</TableCell>
                    <TableCell>{inst.estado || '-'}</TableCell>
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
              <Label>Logradouro *</Label>
              <Input
                value={formData.logradouro}
                onChange={(e) => setFormData({ ...formData, logradouro: e.target.value })}
                placeholder="Rua, Avenida, etc"
              />
            </div>
            <div>
              <Label>Número</Label>
              <Input
                value={formData.numero}
                onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                placeholder="123"
              />
            </div>
            <div>
              <Label>Complemento</Label>
              <Input
                value={formData.complemento}
                onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                placeholder="Apto, Bloco, etc"
              />
            </div>
            <div>
              <Label>Cidade *</Label>
              <Input
                value={formData.cidade}
                onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                placeholder="São Paulo"
              />
            </div>
            <div>
              <Label>Estado (UF) *</Label>
              <Input
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                placeholder="SP"
                maxLength={2}
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
              <Label>Local de Negócios</Label>
              <Input
                type="number"
                value={formData.local_negocios}
                onChange={(e) => setFormData({ ...formData, local_negocios: e.target.value })}
                placeholder="Número"
              />
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
            <div>
              <Label>CNPJ</Label>
              <Input
                value={formData.cnpj}
                onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                placeholder="00.000.000/0000-00"
              />
            </div>
            <div>
              <Label>Inscrição Estadual</Label>
              <Input
                value={formData.inscricao_estadual}
                onChange={(e) => setFormData({ ...formData, inscricao_estadual: e.target.value })}
                placeholder="123.456.789.012"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.nome || !formData.logradouro || !formData.cidade || !formData.estado || !formData.classificacao}
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