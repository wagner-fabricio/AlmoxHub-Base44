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
import { Plus, Edit, Trash2, Warehouse, Loader2, Search, MapPin, FileSpreadsheet } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import BulkUpdateModal from '@/components/bulk/BulkUpdateModal';

export default function Almoxarifados() {
  const [loading, setLoading] = useState(true);
  const [almoxarifados, setAlmoxarifados] = useState([]);
  const [regionais, setRegionais] = useState([]);
  const [instalacoes, setInstalacoes] = useState([]);
  const [selectedInstalacao, setSelectedInstalacao] = useState(null);
  const [showInstalacaoModal, setShowInstalacaoModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filterRegional, setFilterRegional] = useState('all');
  const [filterRegiao, setFilterRegiao] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    regional_id: '',
    tipo_almoxarifado: '',
    endereco: '',
    latitude: '',
    longitude: '',
    regiao: '',
    instalacao_id: '',
    local_negocios: '',
    ativo: true
  });
  const [saving, setSaving] = useState(false);
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [almoxData, regionaisData, instalacoesData] = await Promise.all([
        base44.entities.Almoxarifado.list(),
        base44.entities.Regional.list(),
        base44.entities.Instalacao.list()
      ]);
      setAlmoxarifados(almoxData);
      setRegionais(regionaisData);
      setInstalacoes(instalacoesData);
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
      tipo_almoxarifado: '',
      endereco: '',
      latitude: '',
      longitude: '',
      regiao: '',
      instalacao_id: '',
      local_negocios: '',
      ativo: true
    });
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setFormData({
      nome: item.nome || '',
      regional_id: item.regional_id || '',
      tipo_almoxarifado: item.tipo_almoxarifado || '',
      endereco: item.endereco || '',
      latitude: item.latitude || '',
      longitude: item.longitude || '',
      regiao: item.regiao || '',
      instalacao_id: item.instalacao_id || '',
      local_negocios: item.local_negocios || '',
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
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        local_negocios: formData.local_negocios ? parseFloat(formData.local_negocios) : null
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
  const getInstalacao = (id) => instalacoes.find(i => i.id === id);

  const handleViewInstalacao = (instalacaoId) => {
    const instalacao = getInstalacao(instalacaoId);
    if (instalacao) {
      setSelectedInstalacao(instalacao);
      setShowInstalacaoModal(true);
    }
  };

  const filteredItems = almoxarifados.filter(a => {
    if (filterRegional !== 'all' && a.regional_id !== filterRegional) return false;
    if (filterRegiao !== 'all' && a.regiao !== filterRegiao) return false;
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
        <div className="flex gap-2">
          <Button onClick={() => setShowBulkUpdate(true)} variant="outline">
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Atualização em Massa
          </Button>
          <Button onClick={handleNew} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Novo Almoxarifado
          </Button>
        </div>
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
          <Select value={filterRegiao} onValueChange={setFilterRegiao}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Região" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Regiões</SelectItem>
              <SelectItem value="Norte">Norte</SelectItem>
              <SelectItem value="Nordeste">Nordeste</SelectItem>
              <SelectItem value="Centro Oeste">Centro Oeste</SelectItem>
              <SelectItem value="Sudeste">Sudeste</SelectItem>
              <SelectItem value="Sul">Sul</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Cards de Contagem */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 gap-3 mb-6">
        {/* Card Total */}
        <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-0" style={{ background: 'linear-gradient(135deg, #0000FF 0%, #0A003C 100%)' }}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12" />
          <div className="relative p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                <Warehouse className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white mb-1">{filteredItems.length}</p>
            <p className="text-xs text-white/80 font-medium">Total Geral</p>
          </div>
        </Card>

        {/* Cards por Regional */}
        {regionais.map((regional, index) => {
          const count = filteredItems.filter(a => a.regional_id === regional.id).length;
          const colors = [
            { bg: 'from-blue-50 to-blue-100', text: 'text-blue-600', icon: 'bg-blue-500' },
            { bg: 'from-purple-50 to-purple-100', text: 'text-purple-600', icon: 'bg-purple-500' },
            { bg: 'from-green-50 to-green-100', text: 'text-green-600', icon: 'bg-green-500' },
            { bg: 'from-orange-50 to-orange-100', text: 'text-orange-600', icon: 'bg-orange-500' },
            { bg: 'from-pink-50 to-pink-100', text: 'text-pink-600', icon: 'bg-pink-500' },
            { bg: 'from-cyan-50 to-cyan-100', text: 'text-cyan-600', icon: 'bg-cyan-500' },
          ];
          const color = colors[index % colors.length];
          
          return (
            <Card key={regional.id} className={`relative overflow-hidden group hover:shadow-lg transition-all duration-300 border border-slate-200/50 dark:border-slate-700 bg-gradient-to-br ${color.bg} dark:from-slate-800 dark:to-slate-800/50`}>
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/30 dark:bg-white/5 rounded-full -mr-10 -mt-10" />
              <div className="relative p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-9 h-9 rounded-lg ${color.icon} flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm`}>
                    <MapPin className="w-4 h-4 text-white" />
                  </div>
                </div>
                <p className={`text-2xl font-bold ${color.text} dark:text-white mb-1`}>{count}</p>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 truncate" title={regional.sigla}>
                  {regional.sigla}
                </p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-800">
              <TableHead className="font-semibold">Nome</TableHead>
              <TableHead className="font-semibold">Regional</TableHead>
              <TableHead className="font-semibold">Região</TableHead>
              <TableHead className="font-semibold">Instalação</TableHead>
              <TableHead className="font-semibold">Endereço</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                  <Warehouse className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>Nenhum almoxarifado cadastrado</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => {
                const regional = getRegional(item.regional_id);
                const instalacao = getInstalacao(item.instalacao_id);
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
                    <TableCell className="text-slate-600 dark:text-slate-400">
                      {item.regiao || '-'}
                    </TableCell>
                    <TableCell className="text-left">
                      {instalacao ? (
                        <button
                          onClick={() => handleViewInstalacao(item.instalacao_id)}
                          className="text-blue-600 hover:text-blue-800 hover:underline font-medium text-left"
                        >
                          {instalacao.nome}
                        </button>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-400 max-w-xs truncate">
                      {item.endereco || '-'}
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
                disabled
                placeholder="Endereço completo"
                className="bg-slate-100 dark:bg-slate-800"
              />
            </div>
            <div className="space-y-2">
              <Label>Região</Label>
              <Input
                value={formData.regiao}
                disabled
                placeholder="Região"
                className="bg-slate-100 dark:bg-slate-800"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo Almoxarifado</Label>
                <Input
                  value={formData.tipo_almoxarifado}
                  onChange={(e) => setFormData({ ...formData, tipo_almoxarifado: e.target.value })}
                  placeholder="Tipo do almoxarifado"
                />
              </div>
              <div className="space-y-2">
                <Label>Instalação</Label>
                <Select
                  value={formData.instalacao_id}
                  onValueChange={(v) => {
                    const instalacao = instalacoes.find(i => i.id === v);
                    const enderecoCompleto = instalacao 
                      ? [
                          instalacao.logradouro,
                          instalacao.numero,
                          instalacao.bairro,
                          instalacao.cidade,
                          instalacao.estado
                        ].filter(Boolean).join(', ')
                      : '';
                    setFormData({ 
                      ...formData, 
                      instalacao_id: v,
                      local_negocios: instalacao?.local_negocios || '',
                      latitude: instalacao?.latitude || '',
                      longitude: instalacao?.longitude || '',
                      regiao: instalacao?.regiao || '',
                      endereco: enderecoCompleto
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {instalacoes.map(i => (
                      <SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Local de Negócios</Label>
                <Input
                  type="number"
                  value={formData.local_negocios}
                  disabled
                  placeholder="Número"
                  className="bg-slate-100 dark:bg-slate-800"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Latitude</Label>
                <Input
                  type="number"
                  step="any"
                  value={formData.latitude}
                  disabled
                  placeholder="-23.5505"
                  className="bg-slate-100 dark:bg-slate-800"
                />
              </div>
              <div className="space-y-2">
                <Label>Longitude</Label>
                <Input
                  type="number"
                  step="any"
                  value={formData.longitude}
                  disabled
                  placeholder="-46.6333"
                  className="bg-slate-100 dark:bg-slate-800"
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

      {/* Instalação Details Modal */}
      <Dialog open={showInstalacaoModal} onOpenChange={setShowInstalacaoModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Instalação</DialogTitle>
          </DialogHeader>
          {selectedInstalacao && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-500 text-xs">Nome</Label>
                  <p className="font-medium text-slate-900 dark:text-white">{selectedInstalacao.nome}</p>
                </div>
                <div>
                  <Label className="text-slate-500 text-xs">Classificação</Label>
                  <p className="font-medium text-slate-900 dark:text-white">{selectedInstalacao.classificacao || '-'}</p>
                </div>
              </div>
              <div>
                <Label className="text-slate-500 text-xs">Endereço</Label>
                <p className="font-medium text-slate-900 dark:text-white">
                  {selectedInstalacao.logradouro && selectedInstalacao.numero 
                    ? `${selectedInstalacao.logradouro}, ${selectedInstalacao.numero}`
                    : selectedInstalacao.logradouro || '-'}
                </p>
                {selectedInstalacao.complemento && (
                  <p className="text-sm text-slate-600">{selectedInstalacao.complemento}</p>
                )}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-slate-500 text-xs">Cidade</Label>
                  <p className="font-medium text-slate-900 dark:text-white">{selectedInstalacao.cidade || '-'}</p>
                </div>
                <div>
                  <Label className="text-slate-500 text-xs">Estado</Label>
                  <p className="font-medium text-slate-900 dark:text-white">{selectedInstalacao.estado || '-'}</p>
                </div>
                <div>
                  <Label className="text-slate-500 text-xs">CEP</Label>
                  <p className="font-medium text-slate-900 dark:text-white">{selectedInstalacao.cep || '-'}</p>
                </div>
              </div>
              {(selectedInstalacao.latitude && selectedInstalacao.longitude) && (
                <div>
                  <Label className="text-slate-500 text-xs">Coordenadas</Label>
                  <p className="font-mono text-sm text-slate-700 dark:text-slate-300">
                    {selectedInstalacao.latitude.toFixed(6)}, {selectedInstalacao.longitude.toFixed(6)}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInstalacaoModal(false)}>Fechar</Button>
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

      {/* Bulk Update Modal */}
      <BulkUpdateModal
        open={showBulkUpdate}
        onClose={() => setShowBulkUpdate(false)}
        entityName="Almoxarifado"
        displayName="Almoxarifados"
        onRefresh={loadData}
      />
    </div>
  );
}