import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Search, UserSquare2, FileSpreadsheet } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import BulkUpdateModal from '@/components/bulk/BulkUpdateModal';

export default function Condutores() {
  const [condutores, setCondutores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);
  const [formData, setFormData] = useState({
    nome_completo: '',
    cpf: '',
    rg: '',
    email: '',
    telefone: ''
  });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const data = await base44.entities.Condutor.list();
      setCondutores(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error loading condutores:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editing) {
        await base44.entities.Condutor.update(editing.id, formData);
      } else {
        await base44.entities.Condutor.create(formData);
      }
      load();
      handleClose();
    } catch (e) {
      console.error('Error saving condutor:', e);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Deseja realmente excluir este condutor?')) {
      try {
        await base44.entities.Condutor.delete(id);
        load();
      } catch (e) {
        console.error('Error deleting condutor:', e);
      }
    }
  };

  const handleEdit = (c) => {
    setEditing(c);
    setFormData({
      nome_completo: c.nome_completo || '',
      cpf: c.cpf || '',
      rg: c.rg || '',
      email: c.email || '',
      telefone: c.telefone || ''
    });
    setModalOpen(true);
  };

  const handleNew = () => {
    setEditing(null);
    setFormData({ nome_completo: '', cpf: '', rg: '', email: '', telefone: '' });
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const filtered = condutores.filter(c => {
    const s = search.toLowerCase();
    return (
      c?.nome_completo?.toLowerCase().includes(s) ||
      c?.cpf?.includes(search) ||
      c?.email?.toLowerCase().includes(s) ||
      c?.telefone?.includes(search)
    );
  });

  const isValid = formData.nome_completo.trim() && formData.cpf.trim();

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
              <UserSquare2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Condutores</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Cadastro de condutores de veículos</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowBulkUpdate(true)} variant="outline">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Atualização em Massa
            </Button>
            <Button onClick={handleNew}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Condutor
            </Button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por nome, CPF, e-mail ou telefone..."
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
              <TableHead>Nome completo</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead>RG</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-semibold">{c.nome_completo}</TableCell>
                <TableCell className="font-mono text-sm">{c.cpf}</TableCell>
                <TableCell className="font-mono text-sm">{c.rg}</TableCell>
                <TableCell>{c.email}</TableCell>
                <TableCell>{c.telefone}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(c)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            Nenhum condutor encontrado
          </div>
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="px-6 py-5 border-b -m-6 mb-0" style={{ background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)' }}>
            <DialogTitle className="text-white">
              {editing ? 'Editar Condutor' : 'Novo Condutor'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-6 px-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-5 flex items-center gap-2">
                <div className="w-1 h-4 bg-gradient-to-b from-[#22c55e] to-[#84cc16] rounded-full"></div>
                Dados do Condutor
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome completo *</Label>
                  <Input
                    value={formData.nome_completo}
                    onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
                    placeholder="Nome completo"
                    className="border-slate-300 dark:border-slate-600 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>CPF *</Label>
                    <Input
                      value={formData.cpf}
                      onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                      placeholder="000.000.000-00"
                      className="border-slate-300 dark:border-slate-600 rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>RG</Label>
                    <Input
                      value={formData.rg}
                      onChange={(e) => setFormData({ ...formData, rg: e.target.value })}
                      placeholder="00.000.000-0"
                      className="border-slate-300 dark:border-slate-600 rounded-lg"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>E-mail</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="email@exemplo.com"
                      className="border-slate-300 dark:border-slate-600 rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <Input
                      value={formData.telefone}
                      onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                      placeholder="(00) 00000-0000"
                      className="border-slate-300 dark:border-slate-600 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 px-6 py-4 flex justify-end gap-3 rounded-b-lg">
            <Button variant="outline" onClick={handleClose}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!isValid} style={{ background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)', color: 'white' }}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Update Modal */}
      <BulkUpdateModal
        open={showBulkUpdate}
        onClose={() => setShowBulkUpdate(false)}
        entityName="Condutor"
        displayName="Condutores"
        onRefresh={load}
      />
    </div>
  );
}