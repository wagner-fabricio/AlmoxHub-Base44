import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PenLine, Trash2, Plus, Loader2, RotateCcw, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function OSAssinaturaTab({ os, onSave }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawing, setHasDrawing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nomeSignatario, setNomeSignatario] = useState('');
  const [assinaturas, setAssinaturas] = useState(os.assinaturas || []);
  const [showPad, setShowPad] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  useEffect(() => {
    if (showPad) setTimeout(() => initCanvas(), 50);
  }, [showPad]);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const src = e.touches ? e.touches[0] : e;
    return {
      x: (src.clientX - rect.left) * scaleX,
      y: (src.clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
    setHasDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);

  const clearCanvas = () => { initCanvas(); setHasDrawing(false); };

  const closePad = () => {
    setShowPad(false);
    setEditingId(null);
    setNomeSignatario('');
    setHasDrawing(false);
  };

  const handleSave = async () => {
    if (!hasDrawing) return;
    setSaving(true);
    try {
      const canvas = canvasRef.current;
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      const file = new File([blob], `assinatura_${Date.now()}.png`, { type: 'image/png' });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      const novaAssinatura = {
        id: `sig_${Date.now()}`,
        url: file_url,
        data_hora: new Date().toISOString(),
        nome_signatario: nomeSignatario.trim() || null
      };

      const listaAtual = os.assinaturas || [];
      const novas = editingId
        ? listaAtual.map(a => a.id === editingId ? novaAssinatura : a)
        : [...listaAtual, novaAssinatura];

      await base44.entities.OrdemServico.update(os.id, { assinaturas: novas });
      os.assinaturas = novas;
      setAssinaturas(novas);
      closePad();
      onSave?.();
    } catch (error) {
      console.error('Error saving signature:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const novas = (os.assinaturas || []).filter(a => a.id !== id);
    await base44.entities.OrdemServico.update(os.id, { assinaturas: novas });
    os.assinaturas = novas;
    setAssinaturas(novas);
    onSave?.();
  };

  const handleEdit = (assinatura) => {
    setEditingId(assinatura.id);
    setNomeSignatario(assinatura.nome_signatario || '');
    setShowPad(true);
  };

  return (
    <div className="space-y-4">
      {/* Texto da declaração */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
        <p className="text-sm text-amber-900 dark:text-amber-100 font-medium text-center leading-relaxed">
          Declaro que recebi os materiais listados na OS <strong>{os.codigo}</strong>
        </p>
      </div>

      {/* Lista de assinaturas */}
      {assinaturas.length > 0 && (
        <div className="space-y-3">
          {assinaturas.map((assinatura) => (
            <div key={assinatura.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {assinatura.nome_signatario || '—'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {format(new Date(assinatura.data_hora), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                   type="button"
                   variant="ghost"
                   size="icon"
                   onClick={() => handleEdit(assinatura)}
                   className="h-8 w-8 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                   title="Redesenhar"
                  >
                   <PenLine className="w-4 h-4" />
                  </Button>
                  <Button
                   type="button"
                   variant="ghost"
                   size="icon"
                   onClick={() => handleDelete(assinatura.id)}
                   className="h-8 w-8 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                   title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="p-4 bg-white dark:bg-slate-900 flex justify-center items-center min-h-[80px]">
                <img src={assinatura.url} alt="Assinatura" className="max-h-20 max-w-full object-contain" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Botão adicionar */}
      {!showPad && (
        <Button
          type="button"
          onClick={() => { setShowPad(true); setEditingId(null); setNomeSignatario(''); setHasDrawing(false); }}
          className="w-full gap-2 py-5"
          style={{ backgroundColor: '#0000FF' }}
        >
          <Plus className="w-4 h-4" />
          {assinaturas.length === 0 ? 'Adicionar Assinatura' : 'Nova Assinatura'}
        </Button>
      )}

      {/* Estado vazio */}
      {assinaturas.length === 0 && !showPad && (
        <div className="text-center py-8 text-slate-400 dark:text-slate-500">
          <PenLine className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhuma assinatura registrada</p>
          <p className="text-xs mt-1">Colete as assinaturas dos destinatários</p>
        </div>
      )}

      {/* Pad de assinatura */}
      {showPad && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-blue-300 dark:border-blue-700 overflow-hidden shadow-lg">
          <div className="flex items-center justify-between px-4 py-3 bg-blue-50 dark:bg-blue-900/30 border-b border-blue-200 dark:border-blue-700">
            <div className="flex items-center gap-2">
              <PenLine className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                {editingId ? 'Redesenhar Assinatura' : 'Nova Assinatura'}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={closePad} className="h-8 w-8">
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="p-4 space-y-3">
            <Input
              placeholder="Nome do signatário (opcional)"
              value={nomeSignatario}
              onChange={(e) => setNomeSignatario(e.target.value)}
            />

            <div className="relative rounded-xl overflow-hidden border-2 border-dashed border-slate-300 dark:border-slate-600 bg-white">
              <canvas
                ref={canvasRef}
                width={600}
                height={200}
                className="w-full touch-none cursor-crosshair block"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              {!hasDrawing && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <p className="text-sm text-slate-400">Assine aqui com o dedo ou mouse</p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={clearCanvas} className="gap-2">
                <RotateCcw className="w-4 h-4" />
                Limpar
              </Button>
              <Button
                onClick={handleSave}
                disabled={!hasDrawing || saving}
                className="flex-1 gap-2"
                style={{ backgroundColor: '#0000FF' }}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {saving ? 'Salvando...' : 'Salvar Assinatura'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}