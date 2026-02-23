import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Settings, Loader2, RotateCcw } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const AVAILABLE_WIDGETS = [
  { id: 'kpis', name: 'KPIs Principais', category: 'Métricas', defaultVisible: true },
  { id: 'insights', name: 'Insights e Observações', category: 'Métricas', defaultVisible: true },
  { id: 'kpis-secondary', name: 'KPIs Secundários', category: 'Métricas', defaultVisible: true },
  { id: 'esforco-pessoa', name: 'Esforço por Pessoa', category: 'Gráficos', defaultVisible: true },
  { id: 'os-regional', name: 'OS por Regional', category: 'Gráficos', defaultVisible: true },
  { id: 'os-status', name: 'OS por Status', category: 'Gráficos', defaultVisible: true },
  { id: 'os-categoria', name: 'OS por Categoria', category: 'Gráficos', defaultVisible: true },
  { id: 'top-almoxarifados', name: 'Top 5 Almoxarifados', category: 'Gráficos', defaultVisible: true },
];

export default function DashboardCustomizer({ currentUser, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [visibleWidgets, setVisibleWidgets] = useState(() => {
    const saved = currentUser?.dashboard_visible_widgets;
    if (saved && Array.isArray(saved)) {
      return saved;
    }
    return AVAILABLE_WIDGETS.filter(w => w.defaultVisible).map(w => w.id);
  });

  const toggleWidget = (widgetId) => {
    if (visibleWidgets.includes(widgetId)) {
      setVisibleWidgets(visibleWidgets.filter(id => id !== widgetId));
    } else {
      setVisibleWidgets([...visibleWidgets, widgetId]);
    }
  };

  const resetToDefault = () => {
    setVisibleWidgets(AVAILABLE_WIDGETS.filter(w => w.defaultVisible).map(w => w.id));
  };

  const saveConfiguration = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({
        dashboard_visible_widgets: visibleWidgets
      });
      if (onUpdate) onUpdate();
      setOpen(false);
    } catch (error) {
      console.error('Erro ao salvar configuração');
      alert('Erro ao salvar configuração. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const categorias = [...new Set(AVAILABLE_WIDGETS.map(w => w.category))];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Settings className="w-4 h-4" />
          Personalizar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Personalizar Dashboard</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Escolha quais widgets deseja exibir no seu dashboard
            </p>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={resetToDefault}
              className="gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Resetar
            </Button>
          </div>

          {categorias.map(categoria => (
            <div key={categoria}>
              <h4 className="text-sm font-semibold mb-3 text-slate-900 dark:text-white">
                {categoria}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {AVAILABLE_WIDGETS
                  .filter(w => w.category === categoria)
                  .map(widget => (
                    <label 
                      key={widget.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                    >
                      <Checkbox 
                        checked={visibleWidgets.includes(widget.id)}
                        onCheckedChange={() => toggleWidget(widget.id)}
                      />
                      <span className="text-sm font-medium text-slate-900 dark:text-white">
                        {widget.name}
                      </span>
                    </label>
                  ))}
              </div>
            </div>
          ))}

          <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button 
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              onClick={saveConfiguration}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}