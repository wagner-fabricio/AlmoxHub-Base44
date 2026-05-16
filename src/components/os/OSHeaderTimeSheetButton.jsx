import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Loader2, Clock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import IniciarSessaoModal from '@/components/timesheet/IniciarSessaoModal';
import { useApp } from '@/components/contexts/AppContext';
import { formatarTempo } from '@/components/timesheet/TimeSheetButton';

/**
 * Botão Play/Pause de TimeSheet para o cabeçalho da OS.
 * Visualmente alinhado com OSHeaderIconButton (fundo translúcido sobre o header azul).
 * Reusa a lógica do TimeSheetButton, mas com layout de ícone-only.
 */
export default function OSHeaderTimeSheetButton({ os, currentPessoa, onStateChange }) {
  const [loading, setLoading] = useState(false);
  const [showSelecaoModal, setShowSelecaoModal] = useState(false);
  const [now, setNow] = useState(Date.now());
  const isMountedRef = useRef(true);
  const { pessoas = [] } = useApp();

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // Tick a cada 1s enquanto houver sessão ativa para atualizar o contador ao vivo
  const temSessaoAtivaNaOS = (os?.timesheet_sessoes_ativas || []).length > 0;
  useEffect(() => {
    if (!temSessaoAtivaNaOS) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [temSessaoAtivaNaOS]);

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

  // Cálculo do tempo total: minutos acumulados + tempo decorrido das sessões ativas
  const totalMinutosBase = os.timesheet_total_minutos || 0;
  const minutosSessoesAtivas = (os.timesheet_sessoes_ativas || []).reduce((sum, s) => {
    if (!s.inicio) return sum;
    const inicio = new Date(s.inicio).getTime();
    return sum + Math.max(0, (now - inicio) / 60000);
  }, 0);
  const totalMinutos = totalMinutosBase + minutosSessoesAtivas;
  const tempoFormatado = formatarTempo(totalMinutos);

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

      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={`hidden sm:flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-white/15 text-white text-xs font-mono font-semibold tabular-nums select-none ${temSessaoAtivaNaOS ? 'ring-1 ring-amber-300/60' : ''}`}
              aria-label={`Tempo total: ${tempoFormatado}`}
            >
              <Clock className="w-3.5 h-3.5 opacity-80" />
              <span>{tempoFormatado}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">Tempo total registrado nesta OS</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {showSelecaoModal && (
        <IniciarSessaoModal
          open={showSelecaoModal}
          onClose={() => setShowSelecaoModal(false)}
          os={os}
          pessoas={pessoas}
          currentPessoa={currentPessoa}
          onConfirm={handleConfirmarSelecao}
          loading={loading}
        />
      )}
    </>
  );
}