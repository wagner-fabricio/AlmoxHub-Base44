import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tv2, Plus, Trash2, GripVertical, Play, Clock } from 'lucide-react';

export const DASHBOARD_SLIDES = [
  { id: 'dash_geral', label: 'Dashboard — Geral', source: 'dashboard' },
  { id: 'dash_torre', label: 'Dashboard — Torre de Controle', source: 'dashboard' },
  { id: 'dash_recebimento', label: 'Dashboard — Painel Recebimento', source: 'dashboard' },
  { id: 'dash_expedicao', label: 'Dashboard — Painel Expedição', source: 'dashboard' },
  { id: 'dash_produtividade', label: 'Dashboard — Produtividade', source: 'dashboard' },
];

export const OS_SLIDES = [
  { id: 'os_kanban', label: 'OS — Kanban (Geral)', source: 'os' },
  { id: 'os_kanban_expedicao', label: 'OS — Kanban Expedição', source: 'os' },
  { id: 'os_kanban_recebimento', label: 'OS — Kanban Recebimento', source: 'os' },
  { id: 'os_timesheet', label: 'OS — TimeSheet Ao Vivo', source: 'os' },
  { id: 'os_pendencias_expedicao', label: 'OS — Pendências Expedição', source: 'os' },
  { id: 'os_pendencias_recebimento', label: 'OS — Pendências Recebimento', source: 'os' },
];

const ALL_SLIDES = [...DASHBOARD_SLIDES, ...OS_SLIDES];

const DEFAULT_SLIDES = [
  { id: 'dash_torre', label: 'Dashboard — Torre de Controle', source: 'dashboard', duration: 5 },
  { id: 'dash_expedicao', label: 'Dashboard — Painel Expedição', source: 'dashboard', duration: 5 },
  { id: 'os_timesheet', label: 'OS — TimeSheet Ao Vivo', source: 'os', duration: 5 },
];

export default function PresentationSetupModal({ open, onClose, onStart }) {
  const [slides, setSlides] = useState(DEFAULT_SLIDES);
  const [sourceFilter, setSourceFilter] = useState('all');

  const addSlide = (slideId) => {
    const def = ALL_SLIDES.find(s => s.id === slideId);
    if (!def) return;
    if (slides.some(s => s.id === slideId)) return; // já existe
    setSlides(prev => [...prev, { ...def, duration: 5 }]);
  };

  const removeSlide = (idx) => setSlides(prev => prev.filter((_, i) => i !== idx));

  const updateDuration = (idx, val) => {
    const num = Math.max(1, parseInt(val) || 1);
    setSlides(prev => prev.map((s, i) => i === idx ? { ...s, duration: num } : s));
  };

  const availableToAdd = ALL_SLIDES.filter(s => {
    if (sourceFilter !== 'all' && s.source !== sourceFilter) return false;
    return !slides.some(sl => sl.id === s.id);
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Tv2 className="w-5 h-5 text-blue-600" />
            Configurar Apresentação
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Adicionar slide */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Adicionar tela</p>
            <div className="flex gap-2">
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-40 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as fontes</SelectItem>
                  <SelectItem value="dashboard">Dashboard</SelectItem>
                  <SelectItem value="os">Ordens de Serviço</SelectItem>
                </SelectContent>
              </Select>
              <Select value="" onValueChange={addSlide}>
                <SelectTrigger className="flex-1 h-8 text-xs">
                  <SelectValue placeholder="Selecione uma tela para adicionar..." />
                </SelectTrigger>
                <SelectContent>
                  {availableToAdd.length === 0
                    ? <SelectItem value="_none" disabled>Todas as telas já adicionadas</SelectItem>
                    : availableToAdd.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                      ))
                  }
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Lista de slides */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Sequência de telas ({slides.length})
            </p>
            {slides.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">Adicione pelo menos uma tela acima.</p>
            )}
            {slides.map((s, idx) => (
              <div key={s.id} className="flex items-center gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5">
                <GripVertical className="w-4 h-4 text-slate-300 shrink-0" />
                <span className={`w-2 h-2 rounded-full shrink-0 ${s.source === 'dashboard' ? 'bg-blue-500' : 'bg-amber-500'}`} />
                <span className="flex-1 text-sm text-slate-700 dark:text-slate-300 truncate">{s.label}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <Input
                    type="number"
                    min="1"
                    max="60"
                    value={s.duration}
                    onChange={e => updateDuration(idx, e.target.value)}
                    className="w-14 h-7 text-xs text-center px-1"
                  />
                  <span className="text-xs text-slate-400">min</span>
                </div>
                <button onClick={() => removeSlide(idx)} className="text-slate-400 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Legenda */}
          <div className="flex gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" /> Dashboard</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> Ordens de Serviço</span>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={() => onStart(slides)}
            disabled={slides.length === 0}
            className="bg-blue-600 hover:bg-blue-700 gap-2"
          >
            <Play className="w-4 h-4" />
            Iniciar Apresentação
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}