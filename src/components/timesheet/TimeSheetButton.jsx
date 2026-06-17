import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import IniciarSessaoModal from './IniciarSessaoModal';
import FinalizarSessaoModal from './FinalizarSessaoModal';
import { useApp } from '@/components/contexts/AppContext';

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
  onRequestSelecao, // callback opcional para abrir o modal no nível da página
  size = 'default', // 'sm' | 'default'
  className = ''
}) {
  const [loading, setLoading] = useState(false);
  const [tempoExibido, setTempoExibido] = useState(0); // em minutos (float)
  const [showSelecaoModal, setShowSelecaoModal] = useState(false);
  const [showFinalizarModal, setShowFinalizarModal] = useState(false);
  const intervalRef = useRef(null);
  const { pessoas = [] } = useApp();

  // Fallback: se currentPessoa não chegou via props/contexto (race condition no load),
  // resolve a pessoa logada sob demanda para não deixar o botão "morto".
  const [pessoaResolvida, setPessoaResolvida] = useState(currentPessoa || null);
  useEffect(() => {
    if (currentPessoa) { setPessoaResolvida(currentPessoa); return; }
    let cancelado = false;
    (async () => {
      try {
        const user = await base44.auth.me();
        const p = (pessoas || []).find(x => x.user_id === user?.id)
          || (await base44.entities.Pessoa.filter({ user_id: user.id }))[0];
        if (!cancelado && p) setPessoaResolvida(p);
      } catch { /* ignore */ }
    })();
    return () => { cancelado = true; };
  }, [currentPessoa, pessoas]);

  const pessoaAtiva = currentPessoa || pessoaResolvida;

  const sessaoAtiva = (os.timesheet_sessoes_ativas || []).find(
    s => s.pessoa_id === pessoaAtiva?.id
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
    e.preventDefault();
    if (loading || osConcluida || !pessoaAtiva) return;

    // Se EU estou em play → abrir modal de finalizar (ou pausar direto se só eu estiver)
    if (estaPlayandoEu) {
      const totalSessoes = (os.timesheet_sessoes_ativas || []).length;
      if (totalSessoes > 1) {
        // Há outras pessoas em sessão → abrir modal para escolher
        setShowFinalizarModal(true);
        return;
      }
      // Só eu em sessão → pausa direto (comportamento antigo, sem fricção)
      setLoading(true);
      try {
        const res = await base44.functions.invoke('registrarTimeSheet', {
          acao: 'pause',
          os_id: os.id,
          pessoa_id: pessoaAtiva.id
        });
        if (res?.data?.os && onStateChange) onStateChange(res.data.os);
      } catch (err) {
        console.error('TimeSheet error:', err);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Eu não estou em play → abre modal de seleção
    // Se o pai forneceu callback, delega (recomendado para evitar conflitos com cards)
    if (onRequestSelecao) {
      onRequestSelecao(os);
    } else {
      setShowSelecaoModal(true);
    }
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

  const handleConfirmarFinalizacao = async (pessoasIds) => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('registrarTimeSheet', {
        acao: 'pause_multi',
        os_id: os.id,
        pessoas_ids: pessoasIds
      });
      if (res?.data?.os && onStateChange) onStateChange(res.data.os);
      setShowFinalizarModal(false);
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
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        disabled={loading}
        title={tooltip}
        className={`
          inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 whitespace-nowrap shrink-0
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
        {mostrarTempo && <span className="whitespace-nowrap">{tempoTotal}</span>}
      </button>

      {!onRequestSelecao && showSelecaoModal && (
        <IniciarSessaoModal
          open={showSelecaoModal}
          onClose={() => setShowSelecaoModal(false)}
          os={os}
          pessoas={pessoas}
          currentPessoa={pessoaAtiva}
          onConfirm={handleConfirmarSelecao}
          loading={loading}
        />
      )}

      {showFinalizarModal && (
        <FinalizarSessaoModal
          open={showFinalizarModal}
          onClose={() => setShowFinalizarModal(false)}
          os={os}
          pessoas={pessoas}
          currentPessoa={pessoaAtiva}
          onConfirm={handleConfirmarFinalizacao}
          loading={loading}
        />
      )}
    </>
  );
}