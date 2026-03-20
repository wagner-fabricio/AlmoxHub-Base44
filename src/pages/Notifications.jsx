import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CheckCheck, Loader2, MessageSquare, UserPlus, RefreshCw, Bell, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { createPageUrl } from '@/utils';
import OSFormModal from '@/components/os/OSFormModal';

const notificationIcons = {
  mencao: MessageSquare,
  atribuicao: UserPlus,
  mudanca_status: RefreshCw,
};

const notificationColors = {
  mencao: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
  atribuicao: 'text-green-500 bg-green-50 dark:bg-green-900/20',
  mudanca_status: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20',
};

export default function Notifications() {
  const [loading, setLoading] = useState(true);
  const [notificacoes, setNotificacoes] = useState([]);
  const [pessoas, setPessoas] = useState([]);
  const [currentUserPessoa, setCurrentUserPessoa] = useState(null);
  const [filter, setFilter] = useState('all'); // all, unread
  const [selectedOS, setSelectedOS] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      const [pessoasData, pessoaData] = await Promise.all([
        base44.entities.Pessoa.list(),
        base44.entities.Pessoa.filter({ user_id: user.id })
      ]);
      
      setPessoas(pessoasData);
      
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

  const markAsRead = async (notifId) => {
    try {
      await base44.entities.Notificacao.update(notifId, { lida: true });
      setNotificacoes(notificacoes.map(n => 
        n.id === notifId ? { ...n, lida: true } : n
      ));
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
      setNotificacoes(notificacoes.map(n => ({ ...n, lida: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notifId) => {
    try {
      await base44.entities.Notificacao.delete(notifId);
      setNotificacoes(notificacoes.filter(n => n.id !== notifId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const deleteAllNotifications = async () => {
    if (!confirm('Tem certeza que deseja excluir todas as notificações?')) return;
    
    try {
      await Promise.all(
        notificacoes.map(n => base44.entities.Notificacao.delete(n.id))
      );
      setNotificacoes([]);
    } catch (error) {
      console.error('Error deleting all notifications:', error);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.lida) {
      await markAsRead(notif.id);
    }
  };

  const handleOSLinkClick = async (e, notif) => {
    e.stopPropagation();
    if (!notif.lida) {
      await markAsRead(notif.id);
    }
    if (notif.referencia_id) {
      try {
        const osData = await base44.entities.OrdemServico.filter({ id: notif.referencia_id });
        if (osData[0]) setSelectedOS(osData[0]);
      } catch {}
    }
  };

  // Renderiza a mensagem substituindo o código ALMHUB por um link clicável
  const renderMensagem = (mensagem, notif) => {
    const regex = /(ALMHUB-\d{8}-\d+)/g;
    const parts = mensagem.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <button
          key={i}
          onClick={(e) => handleOSLinkClick(e, notif)}
          className="font-bold text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300 cursor-pointer"
        >
          {part}
        </button>
      ) : part
    );
  };

  const getRemetente = (remetenteId) => {
    return pessoas.find(p => p.id === remetenteId);
  };

  const filteredNotificacoes = filter === 'unread' 
    ? notificacoes.filter(n => !n.lida)
    : notificacoes;

  const unreadCount = notificacoes.filter(n => !n.lida).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Bell className="w-8 h-8 text-blue-500" />
            Notificações
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : 'Todas lidas'}
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline">
              <CheckCheck className="w-4 h-4 mr-2" />
              Marcar todas como lidas
            </Button>
          )}
          {notificacoes.length > 0 && (
            <Button onClick={deleteAllNotifications} variant="outline" className="text-red-600 hover:text-red-700">
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir todas
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          size="sm"
        >
          Todas ({notificacoes.length})
        </Button>
        <Button
          variant={filter === 'unread' ? 'default' : 'outline'}
          onClick={() => setFilter('unread')}
          size="sm"
        >
          Não lidas ({unreadCount})
        </Button>
      </div>



      {/* Notifications List */}
      {filteredNotificacoes.length === 0 ? (
        <Card className="p-12 text-center">
          <Bell className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            {filter === 'unread' ? 'Nenhuma notificação não lida' : 'Nenhuma notificação'}
          </h3>
          <p className="text-slate-500 dark:text-slate-400">
            {filter === 'unread' 
              ? 'Você está em dia com suas notificações!' 
              : 'Quando você receber notificações, elas aparecerão aqui'}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredNotificacoes.map((notif) => {
            const remetente = getRemetente(notif.remetente_id);
            const Icon = notificationIcons[notif.tipo] || Bell;
            const colorClass = notificationColors[notif.tipo] || 'text-slate-500 bg-slate-50';

            return (
              <Card
                key={notif.id}
                className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                  !notif.lida ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800' : ''
                }`}
                onClick={() => handleNotificationClick(notif)}
              >
                <div className="flex gap-4">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${colorClass}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1">
                       <p className={`text-sm ${!notif.lida ? 'font-semibold' : 'font-medium'} text-slate-900 dark:text-white`}>
                         {renderMensagem(notif.mensagem, notif)}
                       </p>
                      {!notif.lida && (
                        <Badge className="bg-blue-500 text-white shrink-0">Nova</Badge>
                      )}
                    </div>

                    {/* Remetente */}
                    {remetente && (
                      <div className="flex items-center gap-2 mt-2">
                        <Avatar className="w-6 h-6">
                          {remetente.foto_perfil && (
                            <AvatarImage src={remetente.foto_perfil} alt={remetente.nome} />
                          )}
                          <AvatarFallback className="bg-slate-200 text-slate-700 text-xs">
                            {remetente.nome?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-slate-600 dark:text-slate-400">
                          {remetente.nome}
                        </span>
                      </div>
                    )}

                    {/* Time */}
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                      {format(new Date(notif.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>


                </div>
              </Card>
            );
          })}
        </div>
      )}
      {selectedOS && (
        <OSFormModal
          os={selectedOS}
          onClose={() => setSelectedOS(null)}
          onSave={() => setSelectedOS(null)}
          readOnly={true}
        />
      )}
    </div>
  );
}