import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Tag, ChevronRight, Loader2, Folder, FolderOpen } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useApp } from '@/components/contexts/AppContext';

export default function Categorias() {
  const { refreshCategorias, currentUser } = useApp();
  const isAdmin = currentUser?.role === 'admin';
  const [loading, setLoading] = useState(true);
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});
  
  const [showCategoriaModal, setShowCategoriaModal] = useState(false);
  const [showSubcategoriaModal, setShowSubcategoriaModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteType, setDeleteType] = useState('');
  
  const [selectedCategoria, setSelectedCategoria] = useState(null);
  const [selectedSubcategoria, setSelectedSubcategoria] = useState(null);
  
  const [categoriaForm, setCategoriaForm] = useState({ nome: '', descricao: '', cor: '#3B82F6' });
  const [subcategoriaForm, setSubcategoriaForm] = useState({ nome: '', descricao: '', categoria_id: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [catData, subData] = await Promise.all([
        base44.entities.Categoria.list(),
        base44.entities.Subcategoria.list()
      ]);
      setCategorias(catData);
      setSubcategorias(subData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (id) => {
    setExpandedCategories(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Categoria handlers
  const handleNewCategoria = () => {
    setSelectedCategoria(null);
    setCategoriaForm({ nome: '', descricao: '', cor: '#3B82F6' });
    setShowCategoriaModal(true);
  };

  const handleEditCategoria = (cat) => {
    setSelectedCategoria(cat);
    setCategoriaForm({
      nome: cat.nome || '',
      descricao: cat.descricao || '',
      cor: cat.cor || '#3B82F6'
    });
    setShowCategoriaModal(true);
  };

  const handleDeleteCategoria = (cat) => {
    setSelectedCategoria(cat);
    setDeleteType('categoria');
    setShowDeleteDialog(true);
  };

  const handleSaveCategoria = async () => {
    setSaving(true);
    try {
      if (selectedCategoria) {
        await base44.entities.Categoria.update(selectedCategoria.id, categoriaForm);
      } else {
        await base44.entities.Categoria.create(categoriaForm);
      }
      await Promise.all([loadData(), refreshCategorias()]);
      setShowCategoriaModal(false);
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

  // Subcategoria handlers
  const handleNewSubcategoria = (categoriaId) => {
    setSelectedSubcategoria(null);
    setSubcategoriaForm({ nome: '', descricao: '', categoria_id: categoriaId });
    setShowSubcategoriaModal(true);
  };

  const handleEditSubcategoria = (sub) => {
    setSelectedSubcategoria(sub);
    setSubcategoriaForm({
      nome: sub.nome || '',
      descricao: sub.descricao || '',
      categoria_id: sub.categoria_id || ''
    });
    setShowSubcategoriaModal(true);
  };

  const handleDeleteSubcategoria = (sub) => {
    setSelectedSubcategoria(sub);
    setDeleteType('subcategoria');
    setShowDeleteDialog(true);
  };

  const handleSaveSubcategoria = async () => {
    setSaving(true);
    try {
      if (selectedSubcategoria) {
        await base44.entities.Subcategoria.update(selectedSubcategoria.id, subcategoriaForm);
      } else {
        await base44.entities.Subcategoria.create(subcategoriaForm);
      }
      await Promise.all([loadData(), refreshCategorias()]);
      setShowSubcategoriaModal(false);
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    try {
      if (deleteType === 'categoria') {
        await base44.entities.Categoria.delete(selectedCategoria.id);
        // Also delete subcategories
        const subs = subcategorias.filter(s => s.categoria_id === selectedCategoria.id);
        for (const sub of subs) {
          await base44.entities.Subcategoria.delete(sub.id);
        }
      } else {
        await base44.entities.Subcategoria.delete(selectedSubcategoria.id);
      }
      await Promise.all([loadData(), refreshCategorias()]);
    } catch (error) {
      console.error('Error deleting:', error);
    } finally {
      setShowDeleteDialog(false);
    }
  };

  const getSubcategorias = (categoriaId) => {
    return subcategorias.filter(s => s.categoria_id === categoriaId);
  };

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
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">Categorias</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Gerencie categorias e subcategorias de OS</p>
        </div>
        {isAdmin && (
          <Button onClick={handleNewCategoria} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Nova Categoria
          </Button>
        )}
      </div>

      {/* Categories List */}
      <div className="space-y-4">
        {categorias.length === 0 ? (
          <Card className="p-12 text-center">
            <Tag className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500">Nenhuma categoria cadastrada</p>
          </Card>
        ) : (
          categorias.map((cat) => {
            const subs = getSubcategorias(cat.id);
            const isExpanded = expandedCategories[cat.id];
            
            return (
              <Card key={cat.id} className="overflow-hidden">
                <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(cat.id)}>
                  <CollapsibleTrigger asChild>
                    <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${cat.cor}20` }}
                        >
                          {isExpanded ? (
                            <FolderOpen className="w-5 h-5" style={{ color: cat.cor }} />
                          ) : (
                            <Folder className="w-5 h-5" style={{ color: cat.cor }} />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900 dark:text-white">{cat.nome}</h3>
                          {cat.descricao && (
                            <p className="text-sm text-slate-500">{cat.descricao}</p>
                          )}
                        </div>
                        <Badge variant="outline" className="ml-4">
                          {subs.length} subcategoria{subs.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {isAdmin && (
                          <>
                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleEditCategoria(cat); }}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDeleteCategoria(cat); }}>
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </>
                        )}
                        <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="px-4 pb-4 pl-14 space-y-2">
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm font-medium text-slate-500">Subcategorias</span>
                        {isAdmin && (
                          <Button size="sm" variant="outline" onClick={() => handleNewSubcategoria(cat.id)}>
                            <Plus className="w-3 h-3 mr-1" />
                            Adicionar
                          </Button>
                        )}
                      </div>
                      {subs.length === 0 ? (
                        <p className="text-sm text-slate-400 italic py-2">Nenhuma subcategoria</p>
                      ) : (
                        <div className="space-y-1">
                          {subs.map((sub) => (
                            <div 
                              key={sub.id}
                              className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <Tag className="w-4 h-4 text-slate-400" />
                                <div className="flex-1">
                                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    {sub.nome}
                                  </span>
                                  {sub.descricao && (
                                    <p className="text-xs text-slate-500 mt-0.5">{sub.descricao}</p>
                                  )}
                                </div>
                              </div>
                              {isAdmin && (
                                <div className="flex items-center gap-1">
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditSubcategoria(sub)}>
                                    <Edit className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteSubcategoria(sub)}>
                                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })
        )}
      </div>

      {/* Categoria Modal */}
      <Dialog open={showCategoriaModal} onOpenChange={setShowCategoriaModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="px-6 py-5 border-b -m-6 mb-0" style={{ background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)' }}>
            <DialogTitle className="text-white">
              {selectedCategoria ? 'Editar Categoria' : 'Nova Categoria'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-6 px-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-5 flex items-center gap-2">
                <div className="w-1 h-4 bg-gradient-to-b from-[#22c55e] to-[#84cc16] rounded-full"></div>
                Informações
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input
                    value={categoriaForm.nome}
                    onChange={(e) => setCategoriaForm({ ...categoriaForm, nome: e.target.value })}
                    placeholder="Nome da categoria"
                    className="border-slate-300 dark:border-slate-600 rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input
                    value={categoriaForm.descricao}
                    onChange={(e) => setCategoriaForm({ ...categoriaForm, descricao: e.target.value })}
                    placeholder="Descrição opcional"
                    className="border-slate-300 dark:border-slate-600 rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cor</Label>
                  <div className="flex gap-3">
                    <Input
                      type="color"
                      value={categoriaForm.cor}
                      onChange={(e) => setCategoriaForm({ ...categoriaForm, cor: e.target.value })}
                      className="w-20 h-10 p-1 border-slate-300 dark:border-slate-600 rounded-lg"
                    />
                    <Input
                      value={categoriaForm.cor}
                      onChange={(e) => setCategoriaForm({ ...categoriaForm, cor: e.target.value })}
                      placeholder="#3B82F6"
                      className="flex-1 border-slate-300 dark:border-slate-600 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 px-6 py-4 flex justify-end gap-3 rounded-b-lg">
            <Button variant="outline" onClick={() => setShowCategoriaModal(false)}>Cancelar</Button>
            <Button onClick={handleSaveCategoria} disabled={!categoriaForm.nome || saving} style={{ background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)', color: 'white' }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Subcategoria Modal */}
      <Dialog open={showSubcategoriaModal} onOpenChange={setShowSubcategoriaModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="px-6 py-5 border-b -m-6 mb-0" style={{ background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)' }}>
            <DialogTitle className="text-white">
              {selectedSubcategoria ? 'Editar Subcategoria' : 'Nova Subcategoria'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-6 px-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-5 flex items-center gap-2">
                <div className="w-1 h-4 bg-gradient-to-b from-[#22c55e] to-[#84cc16] rounded-full"></div>
                Informações
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input
                    value={subcategoriaForm.nome}
                    onChange={(e) => setSubcategoriaForm({ ...subcategoriaForm, nome: e.target.value })}
                    placeholder="Nome da subcategoria"
                    className="border-slate-300 dark:border-slate-600 rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input
                    value={subcategoriaForm.descricao}
                    onChange={(e) => setSubcategoriaForm({ ...subcategoriaForm, descricao: e.target.value })}
                    placeholder="Descrição opcional"
                    className="border-slate-300 dark:border-slate-600 rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="border-t bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 px-6 py-4 flex justify-end gap-3 rounded-b-lg">
            <Button variant="outline" onClick={() => setShowSubcategoriaModal(false)}>Cancelar</Button>
            <Button onClick={handleSaveSubcategoria} disabled={!subcategoriaForm.nome || saving} style={{ background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)', color: 'white' }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Excluir {deleteType === 'categoria' ? 'Categoria' : 'Subcategoria'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteType === 'categoria' 
                ? `Tem certeza que deseja excluir a categoria "${selectedCategoria?.nome}" e todas suas subcategorias?`
                : `Tem certeza que deseja excluir a subcategoria "${selectedSubcategoria?.nome}"?`
              }
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