import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, Loader2, Check, AlertTriangle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const notificationTypes = [
  {
    key: 'os_assignment',
    label: 'Atribuição de OS',
    description: 'Quando você for atribuído a uma OS',
    icon: '📋'
  },
  {
    key: 'os_status_change',
    label: 'Mudança de Status',
    description: 'Mudanças em OS que você está envolvido',
    icon: '🔄'
  },
  {
    key: 'comment_mention',
    label: 'Menções em Comentários',
    description: 'Quando alguém mencionar você (@)',
    icon: '💬'
  },
  {
    key: 'deadline_approaching',
    label: 'Prazos Próximos',
    description: 'Alertas de prazos em 3 dias ou menos',
    icon: '⏰'
  },
  {
    key: 'message_mention',
    label: 'Menções em Mensagens',
    description: 'Menções em conversas',
    icon: '✉️'
  }
];

export default function NotificationSettingsMobile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentPessoa, setCurrentPessoa] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState('default');

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
      await base44.entities.NotificationPreferences.update(preferences.id, { [key]: value });
      setPreferences({ ...preferences, [key]: value });
      toast.success('✓ Atualizado');
    } catch (error) {
      console.error('Error updating preference:', error);
      toast.error('Erro ao atualizar');
    } finally {
      setSaving(false);
    }
  };

  const requestPushPermission = async () => {
    if (!pushSupported) {
      toast.error('Push não suportado neste navegador');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);

      if (permission === 'granted') {
        await base44.entities.NotificationPreferences.update(preferences.id, { push_enabled: true });
        setPreferences({ ...preferences, push_enabled: true });
        toast.success('Push ativado!');
      } else {
        toast.error('Permissão negada');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao ativar');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-blue-600 text-white p-4 shadow-lg">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.history.back()}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Notificações</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Push Card */}
        <Card className="overflow-hidden">
          <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Push Notifications</h3>
                <p className="text-sm text-blue-100">Alertas em tempo real</p>
              </div>
            </div>
          </div>

          <div className="p-4">
            {!pushSupported ? (
              <div className="text-center py-6">
                <BellOff className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Não suportado neste navegador
                </p>
              </div>
            ) : preferences?.push_enabled ? (
              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <Check className="w-6 h-6 text-green-600 shrink-0" />
                <p className="flex-1 text-sm font-medium text-green-900 dark:text-green-200">
                  Push ativado
                </p>
              </div>
            ) : (
              <Button 
                onClick={requestPushPermission}
                className="w-full bg-blue-600 hover:bg-blue-700 py-6"
              >
                <Bell className="w-5 h-5 mr-2" />
                Ativar Push Notifications
              </Button>
            )}
          </div>
        </Card>

        {/* Notification Types */}
        <div className="space-y-3">
          {notificationTypes.map((type) => (
            <Card key={type.key} className="overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{type.icon}</span>
                      <Label htmlFor={type.key} className="text-base font-semibold">
                        {type.label}
                      </Label>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
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
              </div>
            </Card>
          ))}
        </div>

        {/* Info */}
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900 dark:text-blue-200">
                <p className="font-medium mb-2">💡 Dica</p>
                <p>As notificações push funcionam mesmo com o app fechado. Desative tipos específicos para receber apenas o que é importante para você.</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}