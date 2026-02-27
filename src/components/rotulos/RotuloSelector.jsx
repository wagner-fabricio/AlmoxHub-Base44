import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X, Plus, Search, Tag, Check, ChevronDown } from 'lucide-react';

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
        nome: nome.trim(), cor, regional_id: regionalId || null, ativo: true
      });
      onCreated(newRotulo);
      setNome(''); setCor('#3b82f6'); onClose();
    } catch (e) { console.error('Erro ao criar rótulo:', e); }
    finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Tag className="w-4 h-4" />Novo Rótulo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Urgente, Revisão..." onKeyDown={e => e.key === 'Enter' && handleCreate()} autoFocus />
          </div>
          <div className="space-y-2">
            <Label>Cor *</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map(c => (
                <button key={c} type="button" className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${cor === c ? 'border-slate-900 dark:border-white scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} onClick={() => setCor(c)} />
              ))}
              <input type="color" value={cor} onChange={e => setCor(e.target.value)} className="w-7 h-7 rounded-full border-0 cursor-pointer" title="Cor personalizada" />
            </div>
            <div className="mt-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: cor, color: getTextColor(cor) }}>
                {nome || 'Preview'}
              </span>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!nome.trim() || loading}>{loading ? 'Criando...' : 'Criar Rótulo'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function RotuloSelector({ selectedIds = [], onChange, regionalId, currentUserFuncoes = [] }) {
  const [rotulos, setRotulos] = useState([]);
  const [busca, setBusca] = useState('');
  const [open, setOpen] = useState(false);
  const [showNovoModal, setShowNovoModal] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const loadRotulos = async () => {
      try {
        const data = await base44.entities.Rotulo.filter({ ativo: true });
        setRotulos(data);
      } catch (e) { console.error(e); }
    };
    loadRotulos();
  }, []);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setBusca('');
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const rotulosVisiveis = rotulos.filter(r => !r.regional_id || r.regional_id === regionalId);
  const rotulosFiltrados = rotulosVisiveis.filter(r => r.nome?.toLowerCase().includes(busca.toLowerCase()));
  const selectedRotulos = rotulos.filter(r => selectedIds.includes(r.id));
  const podecriarRotulo = currentUserFuncoes?.includes('gestor') || currentUserFuncoes?.includes('lider');

  const toggleRotulo = (id) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter(i => i !== id) : [...selectedIds, id]);
  };

  const handleOpenDropdown = () => {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleRotuloCriado = (newRotulo) => {
    setRotulos(prev => [...prev, newRotulo]);
    onChange([...selectedIds, newRotulo.id]);
  };

  return (
    <div className="space-y-2" ref={containerRef}>
      {/* Trigger field — estilo Select */}
      <div
        className="relative flex items-center min-h-9 w-full border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 cursor-pointer hover:border-slate-400 transition-colors px-3 py-1.5 gap-1.5 flex-wrap"
        onClick={handleOpenDropdown}
      >
        {selectedRotulos.length > 0 ? (
          <>
            {selectedRotulos.map(r => (
              <span
                key={r.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ backgroundColor: r.cor, color: getTextColor(r.cor) }}
                onClick={e => e.stopPropagation()}
              >
                {r.nome}
                <button type="button" onClick={(e) => { e.stopPropagation(); toggleRotulo(r.id); }} className="hover:opacity-70 transition-opacity">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </>
        ) : (
          <span className="text-sm text-slate-400">Selecionar rótulos...</span>
        )}
        <ChevronDown className="w-4 h-4 text-slate-400 ml-auto shrink-0" />
      </div>

      {/* Dropdown Planner-style */}
      {open && (
        <div className="relative z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl w-72 overflow-hidden">
          {/* Busca */}
          <div className="p-3 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              ref={inputRef}
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Pesquisar rótulo"
              className="flex-1 text-sm outline-none bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400"
            />
            {busca && <button type="button" onClick={() => setBusca('')}><X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" /></button>}
          </div>

          {/* Lista */}
          <div className="max-h-64 overflow-y-auto py-1">
            {rotulosFiltrados.length > 0 ? rotulosFiltrados.map(r => {
              const isSelected = selectedIds.includes(r.id);
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => toggleRotulo(r.id)}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <span
                    className="flex-1 text-left px-3 py-1.5 rounded-md text-sm font-medium truncate"
                    style={{ backgroundColor: r.cor, color: getTextColor(r.cor) }}
                  >
                    {r.nome}
                  </span>
                  <div className={`w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300 dark:border-slate-500'}`}>
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                </button>
              );
            }) : (
              <p className="text-sm text-slate-400 text-center py-4">Nenhum rótulo encontrado</p>
            )}
          </div>

          {/* Criar novo */}
          {podecriarRotulo && (
            <div className="border-t border-slate-100 dark:border-slate-700 p-2">
              <button
                type="button"
                onClick={() => { setOpen(false); setShowNovoModal(true); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Criar novo rótulo
              </button>
            </div>
          )}
        </div>
      )}

      <NovoRotuloModal open={showNovoModal} onClose={() => setShowNovoModal(false)} onCreated={handleRotuloCriado} regionalId={regionalId} />
    </div>
  );
}