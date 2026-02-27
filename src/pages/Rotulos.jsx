import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tag, Plus, Edit2, Trash2, Loader2, Search, Power } from 'lucide-react';

function getTextColor(hexColor) {
  const hex = (hexColor || '000000').replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280',
  '#0000FF', '#FF6B00', '#0A003C', '#A0B4D2', '#10B981',
];

function RotuloFormModal({ open, onClose, rotulo, regionais, onSaved }) {
  const [nome, setNome] = useState('');
  const [cor, setCor] = useState('#3b82f6');
  const [regionalId, setRegionalId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setNome(rotulo?.nome || '');
      setCor(rotulo?.cor || '#3b82f6');
      setRegionalId(rotulo?.regional_id || '');
    }
  }, [open, rotulo]);

  const handleSave = async () => {
    if (!nome.trim()) return;
    setLoading(true);
    try {
      const data = { nome: nome.trim(), cor, regional_id: regionalId || null, ativo: true };
      if (rotulo?.id) {
        await base44.entities.Rotulo.update(rotulo.id, data);
      } else {
        await base44.entities.Rotulo.create(data);
      }
      onSaved();
      onClose();
    } catch (e) {
      console.error('Erro ao salvar rótulo:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{rotulo?.id ? 'Editar Rótulo' : 'Novo Rótulo'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Urgente, Bloqueado..." />
          </div>
          <div className="space-y-2">
            <Label>Cor *</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${cor === c ? 'border-slate-900 dark:border-white scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setCor(c)}
                />
              ))}
              <input type="color" value={cor} onChange={e => setCor(e.target.value)} className="w-7 h-7 rounded-full border-0 cursor-pointer" />
            </div>
            <span
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
              style={{ backgroundColor: cor, color: getTextColor(cor) }}
            >
              {nome || 'Preview'}
            </span>
          </div>
          <div className="space-y-2">
            <Label>Regional (deixe vazio para rótulo global)</Label>
            <Select value={regionalId} onValueChange={setRegionalId}>
              <SelectTrigger>
                <SelectValue placeholder="Global (todas as regionais)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>Global</SelectItem>
                {regionais.map(r => (
                  <SelectItem key={r.id} value={r.id}>{r.sigla} - {r.descricao}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!nome.trim() || loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Rotulos() {
  const [rotulos, setRotulos] = useState([]);
  const [regionais, setRegionais] = useState([]);
  const [ordens, setOrdens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroRegional, setFiltroRegional] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingRotulo, setEditingRotulo] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rotulosData, regionaisData, ordensData] = await Promise.all([
        base44.entities.Rotulo.list(),
        base44.entities.Regional.list(),
        base44.entities.OrdemServico.list()
      ]);
      setRotulos(rotulosData);
      setRegionais(regionaisData);
      setOrdens(ordensData);
    } catch (e) {
      console.error('Erro ao carregar dados:', e);
    } finally {
      setLoading(false);
    }
  };

  const getOSCount = (rotuloId) => ordens.filter(os => os.rotulos_ids?.includes(rotuloId)).length;

  const toggleAtivo = async (rotulo) => {
    await base44.entities.Rotulo.update(rotulo.id, { ativo: !rotulo.ativo });
    loadData();
  };

  const handleDelete = async (rotulo) => {
    const count = getOSCount(rotulo.id);
    if (count > 0) {
      if (!window.confirm(`Este rótulo está vinculado a ${count} OS. Confirma a exclusão e desvinculação automática?`)) return;
      // Desvincular de todas as OS
      const osVinculadas = ordens.filter(os => os.rotulos_ids?.includes(rotulo.id));
      for (const os of osVinculadas) {
        await base44.entities.OrdemServico.update(os.id, {
          rotulos_ids: (os.rotulos_ids || []).filter(id => id !== rotulo.id)
        });
      }
    }
    await base44.entities.Rotulo.delete(rotulo.id);
    loadData();
  };

  const rotulosFiltrados = rotulos.filter(r => {
    const matchBusca = r.nome?.toLowerCase().includes(busca.toLowerCase());
    const matchRegional = filtroRegional === 'all' || 
      (filtroRegional === 'global' && !r.regional_id) || 
      r.regional_id === filtroRegional;
    return matchBusca && matchRegional;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Tag className="w-6 h-6 text-blue-600" />
            Rótulos
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Gerencie os rótulos de categorização das OS</p>
        </div>
        <Button
          onClick={() => { setEditingRotulo(null); setShowModal(true); }}
          className="flex items-center gap-2"
          style={{ background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)' }}
        >
          <Plus className="w-4 h-4" />
          Novo Rótulo
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar rótulo..." className="pl-9" />
        </div>
        <Select value={filtroRegional} onValueChange={setFiltroRegional}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as regionais</SelectItem>
            <SelectItem value="global">Apenas globais</SelectItem>
            {regionais.map(r => (
              <SelectItem key={r.id} value={r.id}>{r.sigla}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-slate-800">
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Total</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{rotulos.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-slate-800">
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Ativos</p>
            <p className="text-2xl font-bold text-green-600">{rotulos.filter(r => r.ativo).length}</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-slate-800">
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Globais</p>
            <p className="text-2xl font-bold text-blue-600">{rotulos.filter(r => !r.regional_id).length}</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-slate-800">
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Regionais</p>
            <p className="text-2xl font-bold text-purple-600">{rotulos.filter(r => !!r.regional_id).length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rotulosFiltrados.map(rotulo => {
          const osCount = getOSCount(rotulo.id);
          const regional = regionais.find(r => r.id === rotulo.regional_id);
          return (
            <Card key={rotulo.id} className={`bg-white dark:bg-slate-800 ${!rotulo.ativo ? 'opacity-50' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: rotulo.cor }}
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-white truncate">{rotulo.nome}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {regional ? (
                          <Badge variant="outline" className="text-xs">{regional.sigla}</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-blue-600 border-blue-200">Global</Badge>
                        )}
                        <span className="text-xs text-slate-500">{osCount} OS</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => toggleAtivo(rotulo)}
                      title={rotulo.ativo ? 'Inativar' : 'Ativar'}
                    >
                      <Power className={`w-3.5 h-3.5 ${rotulo.ativo ? 'text-green-500' : 'text-slate-400'}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => { setEditingRotulo(rotulo); setShowModal(true); }}
                    >
                      <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleDelete(rotulo)}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </Button>
                  </div>
                </div>
                {/* Preview */}
                <div className="mt-3">
                  <span
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{ backgroundColor: rotulo.cor, color: getTextColor(rotulo.cor) }}
                  >
                    {rotulo.nome}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {rotulosFiltrados.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-400">
            <Tag className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p>Nenhum rótulo encontrado</p>
          </div>
        )}
      </div>

      <RotuloFormModal
        open={showModal}
        onClose={() => setShowModal(false)}
        rotulo={editingRotulo}
        regionais={regionais}
        onSaved={loadData}
      />
    </div>
  );
}