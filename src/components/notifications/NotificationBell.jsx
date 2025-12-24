import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createPageUrl } from '@/utils';

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUserPessoa, setCurrentUserPessoa] = useState(null);

  useEffect(() => {
    loadUnreadCount();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadUnreadCount = async () => {
    try {
      const user = await base44.auth.me();
      const pessoaData = await base44.entities.Pessoa.filter({ user_id: user.id });
      
      if (pessoaData[0]) {
        setCurrentUserPessoa(pessoaData[0]);
        const notificacoes = await base44.entities.Notificacao.filter({
          destinatario_id: pessoaData[0].id,
          lida: false
        });
        setUnreadCount(notificacoes.length);
      }
    } catch (e) {
      console.error('Error loading notifications:', e);
    }
  };

  const handleClick = () => {
    window.location.href = createPageUrl('Notifications');
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