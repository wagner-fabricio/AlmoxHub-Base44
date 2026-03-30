import { useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Hook para controle automático de TimeSheet durante edição de OS.
 * 
 * Regra:
 * - Se a OS já está em "playing" quando o modal abre → NÃO inicia nova sessão
 * - Se a OS está idle/paused → inicia play automático
 * - Ao fechar: se foi o hook que iniciou → pausa automaticamente
 * - Se durante a edição outro usuário pausar (via realtime) → respeita
 */
export default function useTimeSheetEdit({ os, currentPessoa, open, onOSChange }) {
  const playIniciado = useRef(false);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    if (!open || !os?.id || !currentPessoa?.id) return;

    // Verificar se OS pode ter TimeSheet
    if (os.status === 'concluido' || os.status === 'cancelado') return;

    const jaEstaEmPlay = (os.timesheet_sessoes_ativas || []).length > 0;

    if (!jaEstaEmPlay) {
      // OS idle/paused → iniciar play automático
      base44.functions.invoke('registrarTimeSheet', {
        acao: 'play',
        os_id: os.id,
        iniciado_por_edicao: true
      }).then(res => {
        if (res?.data?.os) {
          playIniciado.current = true;
          onOSChange?.(res.data.os);
        }
      }).catch(() => {});
    }

    // Subscribe para mudanças em tempo real
    unsubscribeRef.current = base44.entities.OrdemServico.subscribe((event) => {
      if (event.id === os.id && event.data) {
        onOSChange?.(event.data);
        // Se foi pausado por outro usuário enquanto editávamos, não vamos pausar de novo
        if (event.data.timesheet_status !== 'playing') {
          playIniciado.current = false;
        }
      }
    });

    return () => {
      unsubscribeRef.current?.();
    };
  }, [open, os?.id]);

  // Ao fechar o modal
  useEffect(() => {
    if (open) return; // só age no fechamento

    if (playIniciado.current && os?.id && currentPessoa?.id) {
      // Verificar se ainda está em play antes de pausar
      const sessaoAtiva = (os.timesheet_sessoes_ativas || []).find(
        s => s.pessoa_id === currentPessoa.id
      );
      if (sessaoAtiva) {
        base44.functions.invoke('registrarTimeSheet', {
          acao: 'pause',
          os_id: os.id,
          pessoa_id_alvo: currentPessoa.id
        }).then(res => {
          if (res?.data?.os) onOSChange?.(res.data.os);
        }).catch(() => {});
      }
    }

    playIniciado.current = false;
    unsubscribeRef.current?.();
  }, [open]);
}