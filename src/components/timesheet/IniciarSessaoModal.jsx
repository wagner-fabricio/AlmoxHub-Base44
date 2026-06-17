import React, { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, Loader2 } from 'lucide-react';
import { useApp } from '@/components/contexts/AppContext';

/**
 * Modal de seleção de quem entrará em sessão no TimeSheet de uma OS.
 * Lista os executores + líder da OS, incluindo também a pessoa logada caso
 * não esteja entre eles.
 */
export default function IniciarSessaoModal({
  open,
  onClose,
  os,
  pessoas = [],
  currentPessoa,
  onConfirm,
  loading = false
}) {
  const [selecionados, setSelecionados] = useState([]);
  const { categorias = [], subcategorias = [] } = useApp();

  // Identifica categoria e subcategorias da OS
  const categoriaOS = useMemo(() => {
    if (!os?.categoria_id) return null;
    return categorias.find(c => c.id === os.categoria_id);
  }, [os?.categoria_id, categorias]);

  const subcategoriasOS = useMemo(() => {
    if (!os?.subcategorias_ids?.length) return [];
    return subcategorias.filter(s => os.subcategorias_ids.includes(s.id));
  }, [os?.subcategorias_ids, subcategorias]);

  // Monta a lista de candidatos: executores + líder + (pessoa logada se não estiver)
  const candidatos = useMemo(() => {
    if (!os) return [];
    const ids = new Set();
    (os.executores_ids || []).forEach(id => ids.add(id));
    if (os.lider_id) ids.add(os.lider_id);
    if (currentPessoa?.id) ids.add(currentPessoa.id);

    return Array.from(ids)
      .map(id => pessoas.find(p => p.id === id))
      .filter(Boolean);
  }, [os, pessoas, currentPessoa]);

  // Pré-seleciona a pessoa logada quando o modal abre.
  // Ela sempre está entre os candidatos (adicionada acima), então sempre pode iniciar.
  useEffect(() => {
    if (open && currentPessoa?.id) {
      setSelecionados([currentPessoa.id]);
    } else if (!open) {
      setSelecionados([]);
    }
  }, [open, currentPessoa?.id]);

  const todosSelecionados = candidatos.length > 0 && selecionados.length === candidatos.length;

  const toggleTodos = () => {
    if (todosSelecionados) {
      setSelecionados([]);
    } else {
      setSelecionados(candidatos.map(p => p.id));
    }
  };

  const toggleUm = (id) => {
    setSelecionados(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    if (selecionados.length === 0 || loading) return;
    onConfirm(selecionados);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-md w-[calc(100vw-2rem)] sm:w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg pr-6">
            <Play className="w-5 h-5 text-blue-500 shrink-0" />
            <span>Iniciar sessão de trabalho</span>
          </DialogTitle>
        </DialogHeader>

        {/* Info da OS */}
        {os && (
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                {os.codigo || 'OS sem código'}
              </span>
              {categoriaOS && (
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: (categoriaOS.cor || '#3b82f6') + '20',
                    color: categoriaOS.cor || '#3b82f6'
                  }}
                >
                  {categoriaOS.nome}
                </span>
              )}
            </div>
            {subcategoriasOS.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {subcategoriasOS.map(s => (
                  <span
                    key={s.id}
                    className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                  >
                    {s.nome}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="py-1">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
            Selecione quem entrará em sessão nesta OS:
          </p>

          {candidatos.length === 0 ? (
            <div className="text-center py-6 text-sm text-slate-400">
              Nenhum executor ou líder definido nesta OS.
            </div>
          ) : (
            <>
              <label className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 cursor-pointer mb-2">
                <Checkbox
                  checked={todosSelecionados}
                  onCheckedChange={toggleTodos}
                />
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  Selecionar todos ({candidatos.length})
                </span>
              </label>

              <ScrollArea className="max-h-[40vh] sm:max-h-64">
                <div className="space-y-1">
                  {candidatos.map(p => {
                    const checked = selecionados.includes(p.id);
                    const ehLider = p.id === os.lider_id;
                    const ehLogado = p.id === currentPessoa?.id;
                    return (
                      <label
                        key={p.id}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggleUm(p.id)}
                        />
                        {p.foto_perfil ? (
                          <img
                            src={p.foto_perfil}
                            alt={p.nome}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                            {p.nome?.charAt(0) || '?'}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                            {p.nome}
                            {ehLogado && <span className="text-xs text-slate-400 ml-1">(você)</span>}
                          </p>
                          {ehLider && (
                            <p className="text-xs text-amber-600 dark:text-amber-400">Líder</p>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </ScrollArea>
            </>
          )}
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selecionados.length === 0 || loading}
            className="bg-blue-500 hover:bg-blue-600 text-white w-full sm:w-auto"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            Iniciar ({selecionados.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}