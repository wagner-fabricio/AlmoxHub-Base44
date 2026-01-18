import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Search, Building2, FileSpreadsheet } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import BulkUpdateModal from '@/components/bulk/BulkUpdateModal';

export default function Transportadoras() {
  const [transportadoras, setTransportadoras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransportadora, setEditingTransportadora] = useState(null);
  const [search, setSearch] = useState('');
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);
  const [formData, setFormData] = useState({
    cnpj: '',
    razao_social: '',
    telefones: '',
    codigo_sap: ''
  });

  useEffect(() => {
    loadTransportadoras();
  }, []);

  const loadTransportadoras = async () => {
    try {
      const data = await base44.entities.Transportadora.list();
      setTransportadoras(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error loading transportadoras:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editingTransportadora) {
        await base44.entities.Transportadora.update(editingTransportadora.id, formData);
      } else {
        await base44.entities.Transportadora.create(formData);
      }
      loadTransportadoras();
      handleClose();
    } catch (e) {
      console.error('Error saving transportadora:', e);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Deseja realmente excluir esta transportadora?')) {
      try {
        await base44.entities.Transportadora.delete(id);
        loadTransportadoras();
      } catch (e) {
        console.error('Error deleting transportadora:', e);
      }
    }
  };

  const handleEdit = (transportadora) => {
    setEditingTransportadora(transportadora);
    setFormData(transportadora);
    setModalOpen(true);
  };

  const handleNew = () => {
    setEditingTransportadora(null);
    setFormData({
      cnpj: '',
      razao_social: '',
      telefones: '',
      codigo_sap: ''
    });
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    setEditingTransportadora(null);
  };

  const formatCNPJ = (cnpj) => {
    if (!cnpj) return '';
    const cleaned = cnpj.replace(/\D/g, '');
    if (cleaned.length !== 14) return cnpj;
    return cleaned.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  };

  const filteredTransportadoras = transportadoras.filter(t => 
    t?.razao_social?.toLowerCase().includes(search.toLowerCase()) ||
    t?.cnpj?.includes(search.replace(/\D/g, '')) ||
    t?.codigo_sap?.includes(search)
  );

  const isValid = formData.cnpj?.replace(/\D/g, '').length === 14 && formData.razao_social;

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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Transportadoras</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Cadastro de empresas de transporte</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowBulkUpdate(true)} variant="outline">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Atualização em Massa
            </Button>
            <Button onClick={handleNew}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Transportadora
            </Button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por razão social, CNPJ ou código SAP..."
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
              <TableHead>CNPJ</TableHead>
              <TableHead>Razão Social</TableHead>
              <TableHead>Telefones</TableHead>
              <TableHead>Código SAP</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransportadoras.map((transp) => (
              <TableRow key={transp.id}>
                <TableCell className="font-mono text-sm">{formatCNPJ(transp.cnpj)}</TableCell>
                <TableCell className="font-semibold">{transp.razao_social}</TableCell>
                <TableCell>{transp.telefones || '-'}</TableCell>
                <TableCell>{transp.codigo_sap || '-'}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(transp)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(transp.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredTransportadoras.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            Nenhuma transportadora encontrada
          </div>
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingTransportadora ? 'Editar Transportadora' : 'Nova Transportadora'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>CNPJ *</Label>
                <Input
                  value={formData.cnpj}
                  onChange={(e) => setFormData({ ...formData, cnpj: e.target.value.replace(/\D/g, '') })}
                  placeholder="00000000000000"
                  maxLength={14}
                />
                {formData.cnpj && (
                  <p className="text-xs text-slate-500">{formatCNPJ(formData.cnpj)}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Código SAP</Label>
                <Input
                  value={formData.codigo_sap}
                  onChange={(e) => setFormData({ ...formData, codigo_sap: e.target.value })}
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label>Razão Social *</Label>
                <Input
                  value={formData.razao_social}
                  onChange={(e) => setFormData({ ...formData, razao_social: e.target.value })}
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label>Telefones</Label>
                <Input
                  value={formData.telefones}
                  onChange={(e) => setFormData({ ...formData, telefones: e.target.value })}
                  placeholder="(00) 0000-0000, (00) 00000-0000"
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
        entityName="Transportadora"
        displayName="Transportadoras"
        onRefresh={loadTransportadoras}
      />
    </div>
  );
}