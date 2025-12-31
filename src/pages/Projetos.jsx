import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, FolderKanban, Loader2, Search, ChevronDown, ChevronUp, ExternalLink, LayoutGrid, List, GanttChart, Users } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { createPageUrl } from '../utils';
import ProjetosList from '../components/projetos/ProjetosList';
import OSDetailModal from '../components/os/OSDetailModal';
import ProjetosGantt from '../components/projetos/ProjetosGantt';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

const defaultColors = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
];

export default function Projetos() {
  const [loading, setLoading] = useState(true);
  const [projetos, setProjetos] = useState([]);
  const [ordens, setOrdens] = useState([]);
  const [pessoas, setPessoas] = useState([]);
  const [almoxarifados, setAlmoxarifados] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [expandedProjetoId, setExpandedProjetoId] = useState(null);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedOS, setSelectedOS] = useState(null);
  const [showOSModal, setShowOSModal] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    cor: '#3B82F6',
    lider_id: '',
    outros_envolvidos_ids: [],
    ativo: true
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [projetosData, ordensData, pessoasData, almoxarifadosData, categoriasData] = await Promise.all([
        base44.entities.Projeto.list(),
        base44.entities.OrdemServico.list(),
        base44.entities.Pessoa.list(),
        base44.entities.Almoxarifado.list(),
        base44.entities.Categoria.list()
      ]);
      setProjetos(projetosData);
      setOrdens(ordensData);
      setPessoas(pessoasData);
      setAlmoxarifados(almoxarifadosData);
      setCategorias(categoriasData);
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
      descricao: '',
      cor: defaultColors[Math.floor(Math.random() * defaultColors.length)],
      lider_id: '',
      outros_envolvidos_ids: [],
      ativo: true
    });
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setFormData({
      nome: item.nome || '',
      descricao: item.descricao || '',
      cor: item.cor || '#3B82F6',
      lider_id: item.lider_id || '',
      outros_envolvidos_ids: item.outros_envolvidos_ids || [],
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
      await base44.entities.Projeto.delete(selectedItem.id);
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
      if (selectedItem) {
        await base44.entities.Projeto.update(selectedItem.id, formData);
      } else {
        await base44.entities.Projeto.create(formData);
      }
      loadData();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

  const getOSCount = (projetoId) => {
    return ordens.filter(os => os.projetos_ids?.includes(projetoId)).length;
  };

  const getProjetoOrdens = (projetoId) => {
    return ordens.filter(os => os.projetos_ids?.includes(projetoId));
  };

  const getProjetoExecutores = (projetoId) => {
    const projetoOrdens = ordens.filter(os => os.projetos_ids?.includes(projetoId));
    const executoresIds = new Set();
    
    projetoOrdens.forEach(os => {
      if (os.executores_ids && Array.isArray(os.executores_ids)) {
        os.executores_ids.forEach(id => executoresIds.add(id));
      }
    });
    
    return Array.from(executoresIds);
  };

  const toggleExpanded = (projetoId) => {
    setExpandedProjetoId(expandedProjetoId === projetoId ? null : projetoId);
  };

  const filteredItems = projetos.filter(p => 
    p.nome?.toLowerCase().includes(search.toLowerCase())
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
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">Projetos</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Grupos de O.S com objetivos correlacionados</p>
        </div>
        <Button onClick={handleNew} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Novo Projeto
        </Button>
      </div>

      {/* Search and View Toggle */}
      <Card className="p-4 mb-6">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar projetos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
            <Button
              variant={viewMode === 'cards' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('cards')}
              className="rounded-none"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-none border-l border-slate-200 dark:border-slate-700"
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'gantt' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('gantt')}
              className="rounded-none border-l border-slate-200 dark:border-slate-700"
            >
              <GanttChart className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Projects View */}
      {filteredItems.length === 0 ? (
        <Card className="p-12 text-center">
          <FolderKanban className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500">Nenhum projeto cadastrado</p>
        </Card>
      ) : viewMode === 'gantt' ? (
        <ProjetosGantt
          projetos={filteredItems}
          ordens={ordens}
          pessoas={pessoas}
          categorias={categorias}
          onOpenOS={(os) => {
            setSelectedOS(os);
            setShowOSModal(true);
          }}
        />
      ) : viewMode === 'list' ? (
        <ProjetosList
          projetos={filteredItems}
          ordens={ordens}
          pessoas={pessoas}
          categorias={categorias}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onOpenOS={(os) => {
            setSelectedOS(os);
            setShowOSModal(true);
          }}
        />
      ) : (
        <div className="space-y-4">
          {filteredItems.map((projeto) => {
            const osCount = getOSCount(projeto.id);
            const projetoOrdens = getProjetoOrdens(projeto.id);
            const isExpanded = expandedProjetoId === projeto.id;
            
            return (
              <div key={projeto.id}>
                <Card 
                  className="p-5 hover:shadow-lg transition-all duration-200 border-t-4 cursor-pointer"
                  style={{ borderTopColor: projeto.cor }}
                  onClick={() => toggleExpanded(projeto.id)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${projeto.cor}20` }}
                      >
                        <FolderKanban className="w-6 h-6" style={{ color: projeto.cor }} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{projeto.nome}</h3>
                        {projeto.descricao && (
                          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">
                            {projeto.descricao}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(projeto)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(projeto)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline">
                      {osCount} OS
                    </Badge>
                    <Badge className={projeto.ativo !== false ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}>
                      {projeto.ativo !== false ? 'Ativo' : 'Inativo'}
                    </Badge>
                    {projeto.lider_id && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        Líder: {pessoas.find(p => p.id === projeto.lider_id)?.nome || 'N/A'}
                      </Badge>
                    )}
                    {(() => {
                      const executoresIds = getProjetoExecutores(projeto.id);
                      if (executoresIds.length > 0) {
                        return (
                          <Badge variant="outline" className="flex items-center gap-1">
                            {executoresIds.length} Executor{executoresIds.length > 1 ? 'es' : ''}
                          </Badge>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </Card>

                {isExpanded && projetoOrdens.length > 0 && (
                  <Card className="mt-2 p-4">
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Ordens de Serviço</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Código</TableHead>
                          <TableHead>Categoria</TableHead>
                          <TableHead>Líder</TableHead>
                          <TableHead>Almoxarifado</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {projetoOrdens.map((os) => {
                          const lider = pessoas.find(p => p.id === os.lider_id);
                          const almoxarifado = almoxarifados.find(a => a.id === os.almoxarifado_id);
                          const categoria = categorias.find(c => c.id === os.categoria_id);
                          
                          return (
                            <TableRow key={os.id}>
                              <TableCell className="font-mono text-sm">{os.codigo}</TableCell>
                              <TableCell>{categoria?.nome || '-'}</TableCell>
                              <TableCell>{lider?.nome || '-'}</TableCell>
                              <TableCell>{almoxarifado?.nome || '-'}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.location.href = createPageUrl('OrdensServico') + `?os_id=${os.id}`}
                                >
                                  <ExternalLink className="w-4 h-4 mr-1" />
                                  Abrir
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </Card>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Form Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedItem ? 'Editar Projeto' : 'Novo Projeto'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome do projeto"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descrição opcional"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex gap-2 flex-wrap">
                {defaultColors.map(color => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-lg transition-transform hover:scale-110 ${
                      formData.cor === color ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({ ...formData, cor: color })}
                    type="button"
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Líder Responsável</Label>
              <Select
                value={formData.lider_id}
                onValueChange={(value) => setFormData({ ...formData, lider_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o líder" />
                </SelectTrigger>
                <SelectContent>
                  {pessoas.map((pessoa) => (
                    <SelectItem key={pessoa.id} value={pessoa.id}>
                      {pessoa.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Outros Envolvidos</Label>
              <ScrollArea className="h-40 border rounded-lg p-3">
                <div className="space-y-2">
                  {pessoas.map((pessoa) => (
                    <label key={pessoa.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-2 rounded">
                      <Checkbox
                        checked={formData.outros_envolvidos_ids?.includes(pessoa.id)}
                        onCheckedChange={(checked) => {
                          const newIds = checked
                            ? [...(formData.outros_envolvidos_ids || []), pessoa.id]
                            : (formData.outros_envolvidos_ids || []).filter(id => id !== pessoa.id);
                          setFormData({ ...formData, outros_envolvidos_ids: newIds });
                        }}
                      />
                      <span className="text-sm">{pessoa.nome}</span>
                    </label>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!formData.nome || saving}>
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
            <AlertDialogTitle>Excluir Projeto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o projeto "{selectedItem?.nome}"?
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

      {/* OS Detail Modal */}
      {selectedOS && (
        <OSDetailModal
          open={showOSModal}
          onClose={() => {
            setShowOSModal(false);
            setSelectedOS(null);
          }}
          os={selectedOS}
          regionais={[]}
          almoxarifados={almoxarifados}
          pessoas={pessoas}
          categorias={categorias}
          subcategorias={[]}
          onEdit={() => {}}
          onDelete={() => {}}
          canDelete={false}
          onRefresh={loadData}
        />
      )}
    </div>
  );
}