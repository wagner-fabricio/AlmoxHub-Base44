import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X, Plus, Search, Tag } from 'lucide-react';

// Calcula se o texto deve ser branco ou preto baseado no contraste
function getTextColor(hexColor) {
  const hex = hexColor?.replace('#', '') || '000000';
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

function NovoRotuloModal({ open, onClose, onCreated, regionalId }) {
  const [nome, setNome] = useState('');
  const [cor, setCor] = useState('#3b82f6');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!nome.trim()) return;
    setLoading(true);
    try {
      const newRotulo = await base44.entities.Rotulo.create({
        nome: nome.trim(),
        cor,
        regional_id: regionalId || null,
        ativo: true
      });
      onCreated(newRotulo);
      setNome('');
      setCor('#3b82f6');
      onClose();
    } catch (e) {
      console.error('Erro ao criar rótulo:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Novo Rótulo
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Ex: Urgente, Revisão, Bloqueado..."
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />
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
              <input
                type="color"
                value={cor}
                onChange={e => setCor(e.target.value)}
                className="w-7 h-7 rounded-full border-0 cursor-pointer"
                title="Cor personalizada"
              />
            </div>
            {/* Preview */}
            <div className="mt-2">
              <span
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                style={{ backgroundColor: cor, color: getTextColor(cor) }}
              >
                {nome || 'Preview'}
              </span>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!nome.trim() || loading}>
              {loading ? 'Criando...' : 'Criar Rótulo'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function RotuloSelector({ selectedIds = [], onChange, regionalId, currentUserFuncoes = [] }) {
  const [rotulos, setRotulos] = useState([]);
  const [busca, setBusca] = useState('');
  const [showNovoModal, setShowNovoModal] = useState(false);

  useEffect(() => {
    loadRotulos();
  }, []);

  const loadRotulos = async () => {
    try {
      const data = await base44.entities.Rotulo.filter({ ativo: true });
      setRotulos(data);
    } catch (e) {
      console.error('Erro ao carregar rótulos:', e);
    }
  };

  // Filtrar por regional do usuário + globais
  const rotulosVisiveis = rotulos.filter(r => {
    if (!r.regional_id) return true; // globais
    if (r.regional_id === regionalId) return true; // da mesma regional
    return false;
  });

  const rotulosFiltrados = rotulosVisiveis.filter(r =>
    r.nome?.toLowerCase().includes(busca.toLowerCase())
  );

  const toggleRotulo = (id) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(i => i !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const podecriarRotulo = currentUserFuncoes?.includes('gestor') || currentUserFuncoes?.includes('lider');

  const handleRotuloCriado = (newRotulo) => {
    setRotulos(prev => [...prev, newRotulo]);
    onChange([...selectedIds, newRotulo.id]);
  };

  const selectedRotulos = rotulos.filter(r => selectedIds.includes(r.id));

  return (
    <div className="space-y-3">
      {/* Rótulos selecionados */}
      {selectedRotulos.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedRotulos.map(r => (
            <span
              key={r.id}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
              style={{ backgroundColor: r.cor, color: getTextColor(r.cor) }}
            >
              {r.nome}
              <button
                type="button"
                onClick={() => toggleRotulo(r.id)}
                className="hover:opacity-70 transition-opacity ml-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        <Input
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar rótulo..."
          className="pl-9 h-8 text-sm"
        />
      </div>

      {/* Grid de rótulos */}
      <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
        {rotulosFiltrados.map(r => {
          const isSelected = selectedIds.includes(r.id);
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => toggleRotulo(r.id)}
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-all hover:scale-105 ${
                isSelected ? 'ring-2 ring-offset-1 ring-slate-900 dark:ring-white scale-105' : 'opacity-75 hover:opacity-100'
              }`}
              style={{ backgroundColor: r.cor, color: getTextColor(r.cor) }}
            >
              {r.nome}
            </button>
          );
        })}
        {rotulosFiltrados.length === 0 && (
          <p className="text-xs text-slate-400 py-1">Nenhum rótulo encontrado</p>
        )}
      </div>

      {/* Botão criar */}
      {podecriarRotulo && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-blue-600 hover:text-blue-700 px-0"
          onClick={() => setShowNovoModal(true)}
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Criar novo rótulo
        </Button>
      )}

      <NovoRotuloModal
        open={showNovoModal}
        onClose={() => setShowNovoModal(false)}
        onCreated={handleRotuloCriado}
        regionalId={regionalId}
      />
    </div>
  );
}