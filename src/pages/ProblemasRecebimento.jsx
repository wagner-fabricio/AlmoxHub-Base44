import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ProblemasRecebimento() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [problemas, setProblemas] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProblema, setEditingProblema] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [problemaToDelete, setProblemaToDelete] = useState(null);
  const [formData, setFormData] = useState({
    descricao_resumida: '',
    explicacao: ''
  });
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      
      // Verificar se o usuário é gestor
      if (userData.role !== 'admin') {
        const pessoas = await base44.entities.Pessoa.filter({ user_id: userData.id });
        const pessoa = pessoas[0];
        
        if (!pessoa || !pessoa.funcoes?.includes('gestor')) {
          toast.error('Acesso negado', { description: 'Apenas gestores podem acessar este módulo' });
          return;
        }
      }
      
      const problemasData = await base44.entities.ProblemaRecebimento.list('-created_date');
      setProblemas(problemasData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (problema = null) => {
    if (problema) {
      setEditingProblema(problema);
      setFormData({
        descricao_resumida: problema.descricao_resumida,
        explicacao: problema.explicacao
      });
    } else {
      setEditingProblema(null);
      setFormData({
        descricao_resumida: '',
        explicacao: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProblema(null);
    setFormData({
      descricao_resumida: '',
      explicacao: ''
    });
  };

  const handleSave = async () => {
    if (!formData.descricao_resumida || !formData.explicacao) {
      toast.error('Preencha todos os campos');
      return;
    }

    setSaving(true);
    try {
      if (editingProblema) {
        await base44.entities.ProblemaRecebimento.update(editingProblema.id, formData);
        toast.success('Problema atualizado com sucesso');
      } else {
        await base44.entities.ProblemaRecebimento.create(formData);
        toast.success('Problema cadastrado com sucesso');
      }
      
      await loadData();
      handleCloseModal();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar problema');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!problemaToDelete) return;

    try {
      await base44.entities.ProblemaRecebimento.delete(problemaToDelete.id);
      toast.success('Problema excluído com sucesso');
      await loadData();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast.error('Erro ao excluir problema');
    } finally {
      setShowDeleteDialog(false);
      setProblemaToDelete(null);
    }
  };

  const openDeleteDialog = (problema) => {
    setProblemaToDelete(problema);
    setShowDeleteDialog(true);
  };

  const filteredProblemas = problemas.filter(p => 
    p.descricao_resumida?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.explicacao?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Problemas de Recebimento
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Cadastro de problemas comuns no processo de recebimento
          </p>
        </div>
        <Button onClick={() => handleOpenModal()} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Novo Problema
        </Button>
      </div>

      <div className="mb-6">
        <Input
          placeholder="Buscar problemas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="grid gap-4">
        {filteredProblemas.map((problema) => (
          <Card key={problema.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <AlertCircle className="w-5 h-5 text-orange-500 mt-1 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg text-slate-900 dark:text-white break-words">
                      {problema.descricao_resumida}
                    </CardTitle>
                  </div>
                </div>
                <div className="flex gap-2 ml-4 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenModal(problema)}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openDeleteDialog(problema)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                {problema.explicacao}
              </p>
            </CardContent>
          </Card>
        ))}

        {filteredProblemas.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">
                {searchTerm ? 'Nenhum problema encontrado' : 'Nenhum problema cadastrado'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de Cadastro/Edição */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="px-6 py-5 border-b -m-6 mb-0" style={{ background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)' }}>
            <DialogTitle className="text-white">
              {editingProblema ? 'Editar Problema' : 'Novo Problema'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-6 px-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-5 flex items-center gap-2">
                <div className="w-1 h-4 bg-gradient-to-b from-[#22c55e] to-[#84cc16] rounded-full"></div>
                Informações do Problema
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Descrição Resumida *</Label>
                  <Input
                    value={formData.descricao_resumida}
                    onChange={(e) => setFormData({ ...formData, descricao_resumida: e.target.value })}
                    placeholder="Ex: Cadastro do Pedido - Pedido não liberado"
                    className="border-slate-300 dark:border-slate-600 rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Explicação *</Label>
                  <Textarea
                    value={formData.explicacao}
                    onChange={(e) => setFormData({ ...formData, explicacao: e.target.value })}
                    placeholder="Descreva o problema em detalhes..."
                    rows={6}
                    className="border-slate-300 dark:border-slate-600 rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="border-t bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 px-6 py-4 flex justify-end gap-3 rounded-b-lg">
            <Button variant="outline" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} style={{ background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)', color: 'white' }}>
              {saving ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...</>
              ) : (
                'Salvar'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este problema? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}