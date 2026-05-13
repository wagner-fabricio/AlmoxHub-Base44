import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useApp } from '@/components/contexts/AppContext';
import IniciarSessaoModal from './IniciarSessaoModal';

// Formata minutos acumulados + segundos correndo em "Xh YYmin" ou "YYmin"
export const formatarTempo = (minutos) => {
  if (!minutos && minutos !== 0) return '0min';
  const h = Math.floor(minutos / 60);
  const m = Math.floor(minutos % 60);
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}min`;
  return `${m}min`;
};

// Calcula minutos correndo desde o início da sessão da pessoa
const minutosDesdeInicio = (inicio) => {
  if (!inicio) return 0;
  return (Date.now() - new Date(inicio).getTime()) / 60000;
};

export default function TimeSheetButton({
  os,
  currentPessoa,
  onStateChange,
  size = 'default', // 'sm' | 'default'
  className = ''
}) {
  const [loading, setLoading] = useState(false);
  const [tempoExibido, setTempoExibido] = useState(0); // em minutos (float)
  const [showSelecaoModal, setShowSelecaoModal] = useState(false);
  const intervalRef = useRef(null);
  const { pessoas } = useApp();

  const sessaoAtiva = (os.timesheet_sessoes_ativas || []).find(
    s => s.pessoa_id === currentPessoa?.id
  );
  const estaPlayandoEu = !!sessaoAtiva;
  const algumEmPlay = (os.timesheet_sessoes_ativas || []).length > 0;
  const osConcluida = os.status === 'concluido' || os.status === 'cancelado';

  // Cronômetro local — atualiza a cada minuto
  useEffect(() => {
    const calcular = () => {
      const minutosAcumulados = os.timesheet_total_minutos || 0;
      if (estaPlayandoEu && sessaoAtiva?.inicio) {
        setTempoExibido(minutosAcumulados + minutosDesdeInicio(sessaoAtiva.inicio));
      } else {
        setTempoExibido(minutosAcumulados);
      }
    };

    calcular();

    if (estaPlayandoEu) {
      intervalRef.current = setInterval(calcular, 60000); // atualiza a cada minuto
    }

    return () => clearInterval(intervalRef.current);
  }, [estaPlayandoEu, sessaoAtiva?.inicio, os.timesheet_total_minutos]);

  const acionar = async (e) => {
    e.stopPropagation(); // não abrir a OS ao clicar no botão
    if (loading || osConcluida || !currentPessoa) return;

    // Se já existe alguém em play → pause_all (pausa tudo)
    if (algumEmPlay) {
      setLoading(true);
      try {
        const res = await base44.functions.invoke('registrarTimeSheet', {
          acao: 'pause_all',
          os_id: os.id
        });
        if (res?.data?.os && onStateChange) onStateChange(res.data.os);
      } catch (err) {
        console.error('TimeSheet error:', err);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Ninguém em play → abre modal de seleção
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
      setShowSelecaoModal(false);
    } catch (err) {
      console.error('TimeSheet error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (osConcluida) {
    const total = os.timesheet_total_minutos || 0;
    if (!total) return null;
    return (
      <div className={`flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 ${className}`}>
        <Square className="w-3 h-3" />
        <span>{formatarTempo(total)}</span>
      </div>
    );
  }

  const isMobile = size === 'mobile';
  const isSmall = size === 'sm';

  // Estado visual do botão
  let bgColor, icon, tooltip, pulsar;
  if (estaPlayandoEu) {
    bgColor = 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white';
    icon = <Pause className={isMobile ? 'w-5 h-5' : isSmall ? 'w-3 h-3' : 'w-4 h-4'} />;
    tooltip = 'Pausar atividade';
    pulsar = true;
  } else if (algumEmPlay) {
    bgColor = 'bg-green-500 hover:bg-green-600 active:bg-green-700 text-white';
    icon = <Play className={isMobile ? 'w-5 h-5' : isSmall ? 'w-3 h-3' : 'w-4 h-4'} />;
    tooltip = 'Entrar na atividade';
    pulsar = false;
  } else {
    bgColor = 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white';
    icon = <Play className={isMobile ? 'w-5 h-5' : isSmall ? 'w-3 h-3' : 'w-4 h-4'} />;
    tooltip = 'Iniciar atividade';
    pulsar = false;
  }

  const tempoTotal = formatarTempo(tempoExibido);
  const mostrarTempo = tempoExibido >= 1; // só mostra se tiver pelo menos 1 min

  // Tamanhos por modo
  const sizeClass = isMobile
    ? 'px-4 py-2.5 text-sm min-w-[44px] min-h-[44px]'
    : isSmall
    ? 'px-2 py-0.5 text-xs'
    : 'px-3 py-1 text-xs';

  return (
    <>
      <button
        onClick={acionar}
        disabled={loading}
        title={tooltip}
        className={`
          inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200
          ${sizeClass}
          ${bgColor}
          ${pulsar ? 'animate-pulse' : ''}
          ${loading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
          ${className}
        `}
      >
        {loading ? (
          <span className={`inline-block rounded-full border-2 border-white border-t-transparent animate-spin ${isMobile ? 'w-5 h-5' : isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
        ) : icon}
        {mostrarTempo && <span>{tempoTotal}</span>}
      </button>

      <IniciarSessaoModal
        open={showSelecaoModal}
        onClose={() => setShowSelecaoModal(false)}
        os={os}
        pessoas={pessoas}
        currentPessoa={currentPessoa}
        onConfirm={handleConfirmarSelecao}
        loading={loading}
      />
    </>
  );
}