import React, { useState, useEffect, useRef } from 'react';
import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Play, Pause, Square, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Formata minutos em HH:MM
function formatarTempo(minutos) {
  const h = Math.floor(minutos / 60);
  const m = Math.floor(minutos % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Calcula minutos decorridos desde uma data ISO
function minutosDesde(isoString) {
  return (Date.now() - new Date(isoString).getTime()) / 60000;
}

export default function TimeSheetButton({
  os,
  currentPessoa,
  onUpdate,          // callback após play/pause para forçar reload se necessário
  size = 'sm',       // 'sm' | 'xs'
  showTimer = true,  // mostrar cronômetro ao vivo
  stopOnConcluido = false, // se true, botão não aparece em OS concluída/cancelada
}) {
  const [loading, setLoading] = useState(false);
  const [sessoesAtivas, setSessoesAtivas] = useState(os?.timesheet_sessoes_ativas || []);
  const [totalMinutos, setTotalMinutos] = useState(os?.timesheet_total_minutos || 0);
  const [timerDisplay, setTimerDisplay] = useState('');
  const intervalRef = useRef(null);

  // Minha sessão ativa
  const minhaSessao = sessoesAtivas.find(s => s.pessoa_id === currentPessoa?.id);
  const euEstajoPlaying = !!minhaSessao;
  const alguemEstaPlaying = sessoesAtivas.length > 0;

  // Verificar permissão
  const isAdmin = false; // não temos acesso ao user.role aqui, usamos papel da pessoa
  const isGestor = currentPessoa?.funcoes?.includes('gestor');
  const isLider = os?.lider_id === currentPessoa?.id;
  const isExecutor = os?.executores_ids?.includes(currentPessoa?.id);
  const isGestorRegional = isGestor && os?.regional_id === currentPessoa?.regional_id;
  const temPermissao = isLider || isExecutor || isGestorRegional;

  const osFinalizada = ['concluido', 'cancelado'].includes(os?.status);

  // Sincronizar estado quando os muda (ex: via subscribe externo)
  useEffect(() => {
    setSessoesAtivas(os?.timesheet_sessoes_ativas || []);
    setTotalMinutos(os?.timesheet_total_minutos || 0);
  }, [os?.timesheet_sessoes_ativas, os?.timesheet_total_minutos]);

  // Cronômetro ao vivo
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (alguemEstaPlaying && showTimer) {
      const atualizar = () => {
        // Soma todas as sessões ativas
        const minutosAtivos = sessoesAtivas.reduce((acc, s) => {
          return acc + minutosDesde(s.inicio);
        }, 0);
        // Usa apenas a sessão mais relevante para o display (minha ou a primeira)
        const sessaoRef = minhaSessao || sessoesAtivas[0];
        const minutosDecorridos = minutosDesde(sessaoRef.inicio);
        setTimerDisplay(formatarTempo(totalMinutos + minutosDecorridos));
      };
      atualizar();
      intervalRef.current = setInterval(atualizar, 30000); // atualiza a cada 30s
    } else if (!alguemEstaPlaying) {
      setTimerDisplay(totalMinutos > 0 ? formatarTempo(totalMinutos) : '');
    }

    return () => clearInterval(intervalRef.current);
  }, [alguemEstaPlaying, sessoesAtivas, totalMinutos, minhaSessao]);

  const handleClick = async (e) => {
    e.stopPropagation(); // não abrir a OS ao clicar no botão
    if (!temPermissao || loading || !currentPessoa) return;

    setLoading(true);
    try {
      const action = euEstajoPlaying ? 'pause' : 'play';

      const response = await base44.functions.invoke('registrarTimeSheet', {
        action,
        os_id: os.id
      });

      if (response.data?.success) {
        // Atualizar estado local otimisticamente
        if (action === 'play') {
          const novaSessao = {
            entrada_id: response.data.entry_id,
            pessoa_id: currentPessoa.id,
            pessoa_nome: currentPessoa.nome,
            inicio: new Date().toISOString()
          };
          setSessoesAtivas(prev => [...prev, novaSessao]);
        } else {
          setSessoesAtivas(prev => prev.filter(s => s.pessoa_id !== currentPessoa.id));
          if (response.data.total_minutos !== undefined) {
            setTotalMinutos(response.data.total_minutos);
          }
        }
        onUpdate?.();
      }
    } catch (err) {
      console.error('Erro no TimeSheet:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!currentPessoa || !temPermissao) return null;
  if (osFinalizada && stopOnConcluido) return null;

  // Configuração visual do botão
  let icon, label, colorClass;

  if (osFinalizada) {
    icon = <Square className="w-3.5 h-3.5" />;
    label = 'Encerrada';
    colorClass = 'text-slate-400 bg-slate-100 cursor-not-allowed';
  } else if (euEstajoPlaying) {
    icon = <Pause className="w-3.5 h-3.5" />;
    label = 'Pausar';
    colorClass = 'text-amber-700 bg-amber-100 hover:bg-amber-200 border-amber-300 animate-pulse-subtle';
  } else if (alguemEstaPlaying) {
    icon = <Play className="w-3.5 h-3.5" />;
    label = 'Entrar';
    colorClass = 'text-green-700 bg-green-100 hover:bg-green-200 border-green-300';
  } else {
    icon = <Play className="w-3.5 h-3.5" />;
    label = 'Iniciar';
    colorClass = 'text-blue-700 bg-blue-100 hover:bg-blue-200 border-blue-300';
  }

  const isXs = size === 'xs';

  return (
    <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
      <button
        onClick={handleClick}
        disabled={loading || osFinalizada}
        title={`${label} atividade`}
        className={`
          inline-flex items-center gap-1 rounded-full border font-medium transition-all
          ${isXs ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'}
          ${colorClass}
          ${loading ? 'opacity-60 cursor-wait' : ''}
        `}
      >
        {loading ? (
          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : icon}
        {!isXs && <span>{label}</span>}
      </button>

      {showTimer && timerDisplay && (
        <span className={`flex items-center gap-0.5 font-mono font-semibold ${
          euEstajoPlaying ? 'text-amber-600' : alguemEstaPlaying ? 'text-green-600' : 'text-slate-500'
        } ${isXs ? 'text-xs' : 'text-xs'}`}>
          <Timer className="w-3 h-3" />
          {timerDisplay}
        </span>
      )}
    </div>
  );
}