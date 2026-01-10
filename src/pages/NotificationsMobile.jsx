import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Loader2, 
  Bell, 
  CheckCircle, 
  Trash2,
  MessageSquare,
  UserPlus,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { createPageUrl } from '@/utils';

const notificationIcons = {
  mencao: MessageSquare,
  atribuicao: UserPlus,
  mudanca_status: AlertCircle,
};

const notificationColors = {
  mencao: 'bg-blue-100 text-blue-600',
  atribuicao: 'bg-green-100 text-green-600',
  mudanca_status: 'bg-amber-100 text-amber-600',
};

export default function NotificationsMobile() {
  const [loading, setLoading] = useState(true);
  const [notificacoes, setNotificacoes] = useState([]);
  const [currentUserPessoa, setCurrentUserPessoa] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      const pessoaData = await base44.entities.Pessoa.filter({ user_id: user.id });
      
      if (pessoaData[0]) {
        setCurrentUserPessoa(pessoaData[0]);
        const notifs = await base44.entities.Notificacao.filter({
          destinatario_id: pessoaData[0].id
        });
        setNotificacoes(notifs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await base44.entities.Notificacao.update(notificationId, { lida: true });
      await loadNotifications();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifs = notificacoes.filter(n => !n.lida);
      await Promise.all(
        unreadNotifs.map(n => base44.entities.Notificacao.update(n.id, { lida: true }))
      );
      await loadNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await base44.entities.Notificacao.delete(notificationId);
      await loadNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.lida) {
      await markAsRead(notification.id);
    }

    if (notification.contexto_adicional?.os_id) {
      window.location.href = createPageUrl('EmFluxo');
    } else if (notification.referencia_tipo === 'conversa') {
      window.location.href = createPageUrl('EmFluxo');
    }
  };

  const filteredNotifications = notificacoes.filter(n => {
    if (filter === 'unread') return !n.lida;
    if (filter === 'read') return n.lida;
    return true;
  });

  const unreadCount = notificacoes.filter(n => !n.lida).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="p-4 shadow-lg sticky top-0 z-10" style={{ backgroundColor: '#0000FF' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.location.href = createPageUrl('EmFluxo')}
              className="text-white hover:bg-white/20 rounded-full shrink-0"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-white">Notificações</h1>
              {unreadCount > 0 && (
                <p className="text-xs text-white/80">{unreadCount} não lida{unreadCount !== 1 ? 's' : ''}</p>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-white hover:bg-white/20 text-xs"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Marcar todas
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white border-b border-slate-200 sticky top-[72px] z-10">
        <div className="flex">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-600'
            }`}
          >
            Todas ({notificacoes.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              filter === 'unread'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-600'
            }`}
          >
            Não lidas ({unreadCount})
          </button>
          <button
            onClick={() => setFilter('read')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              filter === 'read'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-600'
            }`}
          >
            Lidas ({notificacoes.length - unreadCount})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500">
              {filter === 'unread' ? 'Nenhuma notificação não lida' : 
               filter === 'read' ? 'Nenhuma notificação lida' :
               'Nenhuma notificação'}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => {
            const Icon = notificationIcons[notification.tipo] || Bell;
            const colorClass = notificationColors[notification.tipo] || 'bg-slate-100 text-slate-600';

            return (
              <div
                key={notification.id}
                className={`bg-white rounded-xl p-4 shadow-sm border-l-4 transition-all active:scale-95 ${
                  !notification.lida ? 'border-blue-500' : 'border-slate-200'
                }`}
              >
                <div className="flex gap-3">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${colorClass}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => handleNotificationClick(notification)}
                      className="w-full text-left"
                    >
                      <p className={`text-sm mb-1 ${!notification.lida ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                        {notification.mensagem}
                      </p>
                      <p className="text-xs text-slate-500">
                        {format(new Date(notification.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </button>

                    {/* Actions */}
                    <div className="flex gap-2 mt-3">
                      {!notification.lida && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markAsRead(notification.id)}
                          className="text-xs h-7"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Marcar como lida
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteNotification(notification.id)}
                        className="text-xs h-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}