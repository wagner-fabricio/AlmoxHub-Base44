import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import webpush from 'npm:web-push@3.6.7';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { pessoa_id, notification_type, title, body, data } = await req.json();

    // Validar tipo de notificação
    const validTypes = ['os_assignment', 'os_status_change', 'comment_mention', 'deadline_approaching', 'message_mention'];
    if (!validTypes.includes(notification_type)) {
      return Response.json({ error: 'Invalid notification type' }, { status: 400 });
    }

    // Buscar preferências do usuário
    const preferences = await base44.entities.NotificationPreferences.filter({ pessoa_id });
    const userPrefs = preferences[0];
    
    // Verificar se usuário quer receber este tipo de notificação
    if (!userPrefs || !userPrefs.push_enabled || !userPrefs[notification_type]) {
      return Response.json({ skipped: true, reason: 'User preferences disabled' });
    }

    // Buscar subscriptions ativas do usuário
    const subscriptions = await base44.entities.PushSubscription.filter({ 
      pessoa_id,
      active: true 
    });

    if (subscriptions.length === 0) {
      return Response.json({ skipped: true, reason: 'No active subscriptions' });
    }

    // Configurar web-push (usando variáveis de ambiente)
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    const vapidSubject = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@almoxhub.com';

    if (!vapidPublicKey || !vapidPrivateKey) {
      return Response.json({ error: 'VAPID keys not configured' }, { status: 500 });
    }

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

    const payload = JSON.stringify({
      title,
      body,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      data: {
        ...data,
        timestamp: new Date().toISOString(),
        notification_type
      }
    });

    // Enviar para todas as subscriptions do usuário
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: sub.keys
            },
            payload
          );
          return { success: true, subscription_id: sub.id };
        } catch (error) {
          // Se subscription expirou (410), marcar como inativa
          if (error.statusCode === 410) {
            await base44.asServiceRole.entities.PushSubscription.update(sub.id, { active: false });
          }
          throw error;
        }
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return Response.json({ 
      sent: successful, 
      failed,
      total_subscriptions: subscriptions.length 
    });

  } catch (error) {
    console.error('Error sending push notification:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});