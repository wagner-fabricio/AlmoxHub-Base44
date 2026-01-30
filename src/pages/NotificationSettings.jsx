import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, Loader2, Check, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const notificationTypes = [
  {
    key: 'os_assignment',
    label: 'Atribuição de OS',
    description: 'Quando você for atribuído como líder ou executor de uma Ordem de Serviço'
  },
  {
    key: 'os_status_change',
    label: 'Mudança de Status',
    description: 'Quando o status de uma OS que você está envolvido for alterado'
  },
  {
    key: 'comment_mention',
    label: 'Menções em Comentários',
    description: 'Quando alguém mencionar você (@) em um comentário'
  },
  {
    key: 'deadline_approaching',
    label: 'Prazos Próximos',
    description: 'Alertas quando faltarem 3 dias ou menos para o prazo de uma OS'
  },
  {
    key: 'message_mention',
    label: 'Menções em Mensagens',
    description: 'Quando alguém mencionar você em uma conversa'
  }
];

export default function NotificationSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentPessoa, setCurrentPessoa] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState('default');
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    loadData();
    checkPushSupport();
  }, []);

  const checkPushSupport = () => {
    const supported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
    setPushSupported(supported);
    if (supported) {
      setPushPermission(Notification.permission);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      const pessoaData = await base44.entities.Pessoa.filter({ user_id: user.id });
      const pessoa = pessoaData[0];
      setCurrentPessoa(pessoa);

      if (pessoa) {
        const prefsData = await base44.entities.NotificationPreferences.filter({ pessoa_id: pessoa.id });
        if (prefsData.length > 0) {
          setPreferences(prefsData[0]);
        } else {
          // Criar preferências padrão
          const newPrefs = await base44.entities.NotificationPreferences.create({
            pessoa_id: pessoa.id,
            os_assignment: true,
            os_status_change: true,
            comment_mention: true,
            deadline_approaching: true,
            message_mention: true,
            push_enabled: false
          });
          setPreferences(newPrefs);
        }

        // Verificar se há subscription ativa
        const subs = await base44.entities.PushSubscription.filter({ 
          pessoa_id: pessoa.id,
          active: true 
        });
        setSubscription(subs.length > 0);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      toast.error('Erro ao carregar preferências');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key, value) => {
    if (!preferences) return;

    setSaving(true);
    try {
      const updated = { ...preferences, [key]: value };
      await base44.entities.NotificationPreferences.update(preferences.id, { [key]: value });
      setPreferences(updated);
      toast.success('Preferência atualizada');
    } catch (error) {
      console.error('Error updating preference:', error);
      toast.error('Erro ao atualizar preferência');
    } finally {
      setSaving(false);
    }
  };

  const requestPushPermission = async () => {
    if (!pushSupported) {
      toast.error('Push notifications não são suportadas neste navegador');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);

      if (permission === 'granted') {
        await subscribeToPush();
      } else {
        toast.error('Permissão negada para notificações');
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      toast.error('Erro ao solicitar permissão');
    }
  };

  const subscribeToPush = async () => {
    try {
      // Registrar service worker
      const registration = await navigator.serviceWorker.register('/push-sw.js');
      await navigator.serviceWorker.ready;

      // VAPID public key (deve ser configurado como variável de ambiente)
      const vapidPublicKey = 'YOUR_VAPID_PUBLIC_KEY'; // Será substituído por env var

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      // Salvar subscription no backend
      const subscriptionObj = JSON.parse(JSON.stringify(subscription));
      
      await base44.entities.PushSubscription.create({
        pessoa_id: currentPessoa.id,
        endpoint: subscriptionObj.endpoint,
        keys: subscriptionObj.keys,
        user_agent: navigator.userAgent,
        active: true
      });

      // Ativar push nas preferências
      await base44.entities.NotificationPreferences.update(preferences.id, { push_enabled: true });
      setPreferences({ ...preferences, push_enabled: true });
      setSubscription(true);

      toast.success('Push notifications ativadas!');
    } catch (error) {
      console.error('Error subscribing to push:', error);
      toast.error('Erro ao ativar push notifications');
    }
  };

  const unsubscribeFromPush = async () => {
    try {
      // Desativar todas subscriptions do usuário
      const subs = await base44.entities.PushSubscription.filter({ 
        pessoa_id: currentPessoa.id,
        active: true 
      });

      await Promise.all(
        subs.map(sub => base44.entities.PushSubscription.update(sub.id, { active: false }))
      );

      // Atualizar preferências
      await base44.entities.NotificationPreferences.update(preferences.id, { push_enabled: false });
      setPreferences({ ...preferences, push_enabled: false });
      setSubscription(false);

      toast.success('Push notifications desativadas');
    } catch (error) {
      console.error('Error unsubscribing:', error);
      toast.error('Erro ao desativar push notifications');
    }
  };

  // Converter VAPID key de base64 para Uint8Array
  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">
          Configurações de Notificações
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Gerencie como e quando você quer ser notificado
        </p>
      </div>

      {/* Push Notifications Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-500" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Receba notificações mesmo quando o AlmoxHub não estiver aberto
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!pushSupported ? (
            <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-900 dark:text-amber-200">
                  Push notifications não suportadas
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  Seu navegador não suporta push notifications. Tente usar Chrome, Firefox ou Edge.
                </p>
              </div>
            </div>
          ) : pushPermission === 'denied' ? (
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <BellOff className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-900 dark:text-red-200">
                  Permissão negada
                </p>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  Você bloqueou notificações para este site. Para ativar, acesse as configurações do navegador.
                </p>
              </div>
            </div>
          ) : preferences?.push_enabled && subscription ? (
            <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <Check className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-green-900 dark:text-green-200">
                  Push notifications ativadas
                </p>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  Você receberá notificações push de acordo com suas preferências abaixo.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={unsubscribeFromPush}
                className="shrink-0"
              >
                Desativar
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-200">
                  Push notifications disponíveis
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Clique para ativar e receber notificações em tempo real
                </p>
              </div>
              <Button onClick={requestPushPermission}>
                <Bell className="w-4 h-4 mr-2" />
                Ativar Push
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Tipos de Notificação</CardTitle>
          <CardDescription>
            Escolha quais eventos devem gerar notificações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {notificationTypes.map((type) => (
            <div
              key={type.key}
              className="flex items-start justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex-1 pr-4">
                <Label htmlFor={type.key} className="text-base font-medium cursor-pointer">
                  {type.label}
                </Label>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {type.description}
                </p>
              </div>
              <Switch
                id={type.key}
                checked={preferences?.[type.key] || false}
                onCheckedChange={(checked) => handleToggle(type.key, checked)}
                disabled={saving}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="mt-6 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div className="text-sm text-slate-600 dark:text-slate-400">
              <p className="font-medium text-slate-900 dark:text-white mb-2">
                Sobre as notificações push
              </p>
              <ul className="space-y-1 list-disc list-inside">
                <li>As notificações funcionam mesmo com o AlmoxHub fechado</li>
                <li>Você pode gerenciar permissões a qualquer momento nas configurações do navegador</li>
                <li>As notificações são enviadas apenas para os tipos que você habilitou acima</li>
                <li>Push notifications consomem bateria - desative se preferir apenas notificações no app</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}