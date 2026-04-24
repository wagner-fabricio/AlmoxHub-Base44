import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createPageUrl } from '@/utils';
import { useApp } from '@/components/contexts/AppContext';

export default function NotificationBell() {
  const { currentPessoa } = useApp();
  const [unreadCount, setUnreadCount] = useState(0);
  const intervalRef = useRef(null);

  const loadUnreadCount = async (pessoaId) => {
    if (!pessoaId) return;
    try {
      const notificacoes = await base44.entities.Notificacao.filter({
        destinatario_id: pessoaId,
        lida: false
      });
      setUnreadCount(Array.isArray(notificacoes) ? notificacoes.length : 0);
    } catch (e) {
      // silently fail
    }
  };

  useEffect(() => {
    if (!currentPessoa?.id) return;

    loadUnreadCount(currentPessoa.id);

    // Poll a cada 60s (era 30s com 2x requests — agora 1 request a cada 60s)
    intervalRef.current = setInterval(() => loadUnreadCount(currentPessoa.id), 60000);
    return () => clearInterval(intervalRef.current);
  }, [currentPessoa?.id]);

  // Atualizar em tempo real via subscribe
  useEffect(() => {
    if (!currentPessoa?.id) return;
    const unsub = base44.entities.Notificacao.subscribe((event) => {
      if (event.type === 'create' && event.data?.destinatario_id === currentPessoa.id && !event.data?.lida) {
        setUnreadCount(prev => prev + 1);
      } else if (event.type === 'update' && event.data?.lida) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    });
    return unsub;
  }, [currentPessoa?.id]);

  const handleClick = () => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth <= 768;
    window.location.href = createPageUrl(isMobile ? 'NotificationsMobile' : 'Notifications');
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      className="relative rounded-xl"
    >
      <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />
      {unreadCount > 0 && (
        <Badge
          className="absolute -top-1 -right-1 h-5 min-w-[20px] flex items-center justify-center bg-red-500 text-white text-xs px-1 rounded-full"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </Button>
  );
}