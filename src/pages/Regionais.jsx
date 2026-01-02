import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, MapPin, Loader2, Search } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function Regionais() {
  const [loading, setLoading] = useState(true);
  const [regionais, setRegionais] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedRegional, setSelectedRegional] = useState(null);
  const [formData, setFormData] = useState({
    sigla: '',
    descricao: '',
    area_abrangencia: '',
    gerencia: '',
    gestor_nome: '',
    gestor_email: '',
    gestor_telefone: '',
    cidade_sede: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Regional.list();
      setRegionais(data);
    } catch (error) {
      console.error('Error loading regionais:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNew = () => {
    setSelectedRegional(null);
    setFormData({ 
      sigla: '', 
      descricao: '', 
      area_abrangencia: '', 
      gerencia: '',
      gestor_nome: '',
      gestor_email: '',
      gestor_telefone: '',
      cidade_sede: ''
    });
    setShowModal(true);
  };

  const handleEdit = (regional) => {
    setSelectedRegional(regional);
    setFormData({
      sigla: regional.sigla || '',
      descricao: regional.descricao || '',
      area_abrangencia: regional.area_abrangencia || '',
      gerencia: regional.gerencia || '',
      gestor_nome: regional.gestor_nome || '',
      gestor_email: regional.gestor_email || '',
      gestor_telefone: regional.gestor_telefone || '',
      cidade_sede: regional.cidade_sede || ''
    });
    setShowModal(true);
  };

  const handleDelete = (regional) => {
    setSelectedRegional(regional);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    try {
      await base44.entities.Regional.delete(selectedRegional.id);
      loadData();
    } catch (error) {
      console.error('Error deleting regional:', error);
    } finally {
      setShowDeleteDialog(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (selectedRegional) {
        await base44.entities.Regional.update(selectedRegional.id, formData);
      } else {
        await base44.entities.Regional.create(formData);
      }
      loadData();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving regional:', error);
    } finally {
      setSaving(false);
    }
  };

  const filteredRegionais = regionais.filter(r => 
    r.sigla?.toLowerCase().includes(search.toLowerCase()) ||
    r.descricao?.toLowerCase().includes(search.toLowerCase())
  );

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
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">Regionais</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Gerencie as regionais da empresa</p>
        </div>
        <Button onClick={handleNew} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Nova Regional
        </Button>
      </div>

      {/* Search */}
      <Card className="p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por sigla ou descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-800">
              <TableHead className="font-semibold">Sigla</TableHead>
              <TableHead className="font-semibold">Descrição</TableHead>
              <TableHead className="font-semibold">Gerência</TableHead>
              <TableHead className="font-semibold">Cidade Sede</TableHead>
              <TableHead className="font-semibold">Gestor</TableHead>
              <TableHead className="font-semibold">Área de Abrangência</TableHead>
              <TableHead className="font-semibold text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRegionais.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                  <MapPin className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>Nenhuma regional cadastrada</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredRegionais.map((regional) => (
                <TableRow key={regional.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="font-semibold text-slate-900 dark:text-white">{regional.sigla}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600 dark:text-slate-400">{regional.descricao}</TableCell>
                  <TableCell className="text-slate-600 dark:text-slate-400">
                    {regional.gerencia || '-'}
                  </TableCell>
                  <TableCell className="text-slate-600 dark:text-slate-400">
                    {regional.cidade_sede || '-'}
                  </TableCell>
                  <TableCell className="text-slate-600 dark:text-slate-400">
                    {regional.gestor_nome || '-'}
                  </TableCell>
                  <TableCell className="text-slate-600 dark:text-slate-400 max-w-xs truncate">
                    {regional.area_abrangencia || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(regional)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(regional)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Form Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedRegional ? 'Editar Regional' : 'Nova Regional'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Sigla *</Label>
              <Input
                value={formData.sigla}
                onChange={(e) => setFormData({ ...formData, sigla: e.target.value.toUpperCase() })}
                placeholder="Ex: NE, SE, SUL"
                maxLength={10}
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição *</Label>
              <Input
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Ex: Regional Nordeste"
              />
            </div>
            <div className="space-y-2">
              <Label>Gerência</Label>
              <Select
                value={formData.gerencia}
                onValueChange={(v) => setFormData({ ...formData, gerencia: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GLOA">GLOA</SelectItem>
                  <SelectItem value="GLAO">GLAO</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cidade Sede</Label>
              <Input
                value={formData.cidade_sede}
                onChange={(e) => setFormData({ ...formData, cidade_sede: e.target.value })}
                placeholder="Ex: São Paulo"
              />
            </div>
            <div className="space-y-2">
              <Label>Nome do Gestor</Label>
              <Input
                value={formData.gestor_nome}
                onChange={(e) => setFormData({ ...formData, gestor_nome: e.target.value })}
                placeholder="Nome completo do gestor"
              />
            </div>
            <div className="space-y-2">
              <Label>E-mail do Gestor</Label>
              <Input
                type="email"
                value={formData.gestor_email}
                onChange={(e) => setFormData({ ...formData, gestor_email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Telefone do Gestor</Label>
              <Input
                value={formData.gestor_telefone}
                onChange={(e) => setFormData({ ...formData, gestor_telefone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div className="space-y-2">
              <Label>Área de Abrangência</Label>
              <Textarea
                value={formData.area_abrangencia}
                onChange={(e) => setFormData({ ...formData, area_abrangencia: e.target.value })}
                placeholder="Estados e municípios cobertos..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!formData.sigla || !formData.descricao || saving}>
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
            <AlertDialogTitle>Excluir Regional</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a regional "{selectedRegional?.sigla}"? 
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