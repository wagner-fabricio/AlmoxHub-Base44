import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Search, Truck, FileSpreadsheet } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import BulkUpdateModal from '@/components/bulk/BulkUpdateModal';
import { SortableTableHead, useTableSort, useColumnFilters } from '@/components/ui/table-sortable';

const estadosBrasil = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", 
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", 
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

export default function VeiculosAxia() {
  const [veiculos, setVeiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVeiculo, setEditingVeiculo] = useState(null);
  const [search, setSearch] = useState('');
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);
  
  const { sortConfig, handleSort } = useTableSort();
  const { columnFilters, toggleFilter, clearFilter } = useColumnFilters({
    placa: [],
    estado: [],
    tipo: [],
    carroceria: []
  });
  const [formData, setFormData] = useState({
    proprietario: 'Axia Energia S.A.',
    renavam: '',
    placa: '',
    estado: '',
    tara: 0,
    carroceria: '',
    tipo: ''
  });

  useEffect(() => {
    loadVeiculos();
  }, []);

  const loadVeiculos = async () => {
    try {
      const data = await base44.entities.VeiculoAxia.list();
      setVeiculos(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error loading veiculos:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editingVeiculo) {
        await base44.entities.VeiculoAxia.update(editingVeiculo.id, formData);
      } else {
        await base44.entities.VeiculoAxia.create(formData);
      }
      loadVeiculos();
      handleClose();
    } catch (e) {
      console.error('Error saving veiculo:', e);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Deseja realmente excluir este veículo?')) {
      try {
        await base44.entities.VeiculoAxia.delete(id);
        loadVeiculos();
      } catch (e) {
        console.error('Error deleting veiculo:', e);
      }
    }
  };

  const handleEdit = (veiculo) => {
    setEditingVeiculo(veiculo);
    setFormData(veiculo);
    setModalOpen(true);
  };

  const handleNew = () => {
    setEditingVeiculo(null);
    setFormData({
      proprietario: 'Axia Energia S.A.',
      renavam: '',
      placa: '',
      estado: '',
      tara: 0,
      carroceria: '',
      tipo: ''
    });
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    setEditingVeiculo(null);
  };

  const getUniqueValues = (column) => {
    const values = new Set();
    veiculos.forEach(v => {
      if (column === 'placa') values.add(v.placa);
      if (column === 'estado') values.add(v.estado);
      if (column === 'tipo') values.add(v.tipo);
      if (column === 'carroceria') values.add(v.carroceria);
    });
    return Array.from(values).filter(Boolean).sort();
  };

  let filteredVeiculos = veiculos.filter(v => {
    const matchesSearch = 
      v?.placa?.toLowerCase().includes(search.toLowerCase()) ||
      v?.proprietario?.toLowerCase().includes(search.toLowerCase()) ||
      v?.renavam?.includes(search);
    
    if (!matchesSearch) return false;
    
    // Filtros de coluna
    if (columnFilters.placa.length > 0 && !columnFilters.placa.includes(v.placa)) return false;
    if (columnFilters.estado.length > 0 && !columnFilters.estado.includes(v.estado)) return false;
    if (columnFilters.tipo.length > 0 && !columnFilters.tipo.includes(v.tipo)) return false;
    if (columnFilters.carroceria.length > 0 && !columnFilters.carroceria.includes(v.carroceria)) return false;
    
    return true;
  });

  // Aplicar ordenação
  if (sortConfig.column && sortConfig.direction) {
    filteredVeiculos = [...filteredVeiculos].sort((a, b) => {
      let aValue, bValue;
      
      if (sortConfig.column === 'placa') {
        aValue = a.placa || '';
        bValue = b.placa || '';
      } else if (sortConfig.column === 'estado') {
        aValue = a.estado || '';
        bValue = b.estado || '';
      } else if (sortConfig.column === 'tipo') {
        aValue = a.tipo || '';
        bValue = b.tipo || '';
      } else if (sortConfig.column === 'carroceria') {
        aValue = a.carroceria || '';
        bValue = b.carroceria || '';
      } else if (sortConfig.column === 'tara') {
        aValue = a.tara || 0;
        bValue = b.tara || 0;
      }
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  const isValid = formData.placa && formData.estado;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-500">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Veículos Axia</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Gerenciamento da frota própria</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowBulkUpdate(true)} variant="outline">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Atualização em Massa
            </Button>
            <Button onClick={handleNew}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Veículo
            </Button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por placa, proprietário ou RENAVAM..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-800/50">
              <TableHead>
                <SortableTableHead
                  label="Placa"
                  column="placa"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  filterConfig={columnFilters}
                  onToggleFilter={toggleFilter}
                  onClearFilter={clearFilter}
                  getUniqueValues={getUniqueValues}
                />
              </TableHead>
              <TableHead>
                <SortableTableHead
                  label="UF"
                  column="estado"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  filterConfig={columnFilters}
                  onToggleFilter={toggleFilter}
                  onClearFilter={clearFilter}
                  getUniqueValues={getUniqueValues}
                />
              </TableHead>
              <TableHead>
                <SortableTableHead
                  label="Tipo"
                  column="tipo"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  filterConfig={columnFilters}
                  onToggleFilter={toggleFilter}
                  onClearFilter={clearFilter}
                  getUniqueValues={getUniqueValues}
                />
              </TableHead>
              <TableHead>
                <SortableTableHead
                  label="Carroceria"
                  column="carroceria"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  filterConfig={columnFilters}
                  onToggleFilter={toggleFilter}
                  onClearFilter={clearFilter}
                  getUniqueValues={getUniqueValues}
                />
              </TableHead>
              <TableHead>RENAVAM</TableHead>
              <TableHead>Proprietário</TableHead>
              <TableHead>
                <SortableTableHead
                  label="Tara (kg)"
                  column="tara"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                />
              </TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVeiculos.map((veiculo) => (
              <TableRow key={veiculo.id}>
                <TableCell className="font-semibold">{veiculo.placa}</TableCell>
                <TableCell>{veiculo.estado}</TableCell>
                <TableCell>{veiculo.tipo}</TableCell>
                <TableCell>{veiculo.carroceria}</TableCell>
                <TableCell className="font-mono text-sm">{veiculo.renavam}</TableCell>
                <TableCell>{veiculo.proprietario}</TableCell>
                <TableCell>{veiculo.tara?.toLocaleString('pt-BR')}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(veiculo)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(veiculo.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredVeiculos.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            Nenhum veículo encontrado
          </div>
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingVeiculo ? 'Editar Veículo' : 'Novo Veículo'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Placa *</Label>
                <Input
                  value={formData.placa}
                  onChange={(e) => setFormData({ ...formData, placa: e.target.value.toUpperCase() })}
                  placeholder="ABC-1234"
                />
              </div>

              <div className="space-y-2">
                <Label>Estado (UF) *</Label>
                <Select
                  value={formData.estado}
                  onValueChange={(v) => setFormData({ ...formData, estado: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {estadosBrasil.map(uf => (
                      <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(v) => setFormData({ ...formData, tipo: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Automóvel">Automóvel</SelectItem>
                    <SelectItem value="Toco">Toco</SelectItem>
                    <SelectItem value="Truck">Truck</SelectItem>
                    <SelectItem value="Utilitário">Utilitário</SelectItem>
                    <SelectItem value="Ônibus">Ônibus</SelectItem>
                    <SelectItem value="Motocicleta">Motocicleta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Carroceria</Label>
                <Select
                  value={formData.carroceria}
                  onValueChange={(v) => setFormData({ ...formData, carroceria: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Aberta">Aberta</SelectItem>
                    <SelectItem value="Baú">Baú</SelectItem>
                    <SelectItem value="Furgão">Furgão</SelectItem>
                    <SelectItem value="Munck">Munck</SelectItem>
                    <SelectItem value="Sem Carroceria">Sem Carroceria</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>RENAVAM</Label>
                <Input
                  value={formData.renavam}
                  onChange={(e) => setFormData({ ...formData, renavam: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Tara (kg)</Label>
                <Input
                  type="number"
                  value={formData.tara}
                  onChange={(e) => setFormData({ ...formData, tara: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label>Proprietário</Label>
                <Input
                  value={formData.proprietario}
                  onChange={(e) => setFormData({ ...formData, proprietario: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={handleClose}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!isValid}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Update Modal */}
      <BulkUpdateModal
        open={showBulkUpdate}
        onClose={() => setShowBulkUpdate(false)}
        entityName="VeiculoAxia"
        displayName="Veículos Axia"
        onRefresh={loadVeiculos}
      />
    </div>
  );
}