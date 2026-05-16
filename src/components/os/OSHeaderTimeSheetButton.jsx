import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import IniciarSessaoModal from '@/components/timesheet/IniciarSessaoModal';

/**
 * Botão Play/Pause de TimeSheet para o cabeçalho da OS.
 * Visualmente alinhado com OSHeaderIconButton (fundo translúcido sobre o header azul).
 * Reusa a lógica do TimeSheetButton, mas com layout de ícone-only.
 */
export default function OSHeaderTimeSheetButton({ os, currentPessoa, onStateChange }) {
  const [loading, setLoading] = useState(false);
  const [showSelecaoModal, setShowSelecaoModal] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  if (!os?.id || !currentPessoa) return null;

  const sessaoAtiva = (os.timesheet_sessoes_ativas || []).find(
    s => s.pessoa_id === currentPessoa?.id
  );
  const estaPlayandoEu = !!sessaoAtiva;
  const osConcluida = os.status === 'concluido' || os.status === 'cancelado';

  if (osConcluida) return null;

  const handleClick = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (loading) return;

    if (estaPlayandoEu) {
      setLoading(true);
      try {
        const res = await base44.functions.invoke('registrarTimeSheet', {
          acao: 'pause',
          os_id: os.id,
          pessoa_id: currentPessoa.id
        });
        if (res?.data?.os && onStateChange) onStateChange(res.data.os);
      } catch (err) {
        console.error('TimeSheet error:', err);
      } finally {
        if (isMountedRef.current) setLoading(false);
      }
      return;
    }

    setShowSelecaoModal(true);
  };

  const handleConfirmarSelecao = async (pessoasIds) => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('registrarTimeSheet', {
        acao: 'play_multi',
        os_id: os.id,
        pessoas_ids: pessoasIds
      });
      if (res?.data?.os && onStateChange) onStateChange(res.data.os);
      if (isMountedRef.current) setShowSelecaoModal(false);
    } catch (err) {
      console.error('TimeSheet error:', err);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  };

  const label = estaPlayandoEu ? 'Pausar atividade' : 'Iniciar atividade';
  const Icon = loading ? Loader2 : (estaPlayandoEu ? Pause : Play);
  const bgClass = estaPlayandoEu
    ? 'bg-amber-400/90 hover:bg-amber-400 animate-pulse'
    : 'bg-white/20 hover:bg-white/30';

  return (
    <>
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={handleClick}
              disabled={loading}
              aria-label={label}
              className={`flex items-center justify-center w-8 h-8 rounded-lg text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${bgClass}`}
            >
              <Icon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{label}</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {showSelecaoModal && (
        <IniciarSessaoModal
          open={showSelecaoModal}
          onClose={() => setShowSelecaoModal(false)}
          os={os}
          currentPessoa={currentPessoa}
          onConfirm={handleConfirmarSelecao}
          loading={loading}
        />
      )}
    </>
  );
}