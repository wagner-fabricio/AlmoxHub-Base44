import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import webpush from 'npm:web-push@3.6.7';

const VALID_TYPES = ['os_assignment', 'os_status_change', 'comment_mention', 'deadline_approaching', 'message_mention'];

async function enviarParaPessoa(base44, vapidReady, pessoa_id, notification_type, title, body, data, prefsCache, subsCache) {
  // Cache de preferências por pessoa_id
  let userPrefs = prefsCache.get(pessoa_id);
  if (userPrefs === undefined) {
    const prefs = await base44.entities.NotificationPreferences.filter({ pessoa_id });
    userPrefs = prefs[0] || null;
    prefsCache.set(pessoa_id, userPrefs);
  }

  if (!userPrefs || !userPrefs.push_enabled || !userPrefs[notification_type]) {
    return { pessoa_id, skipped: true, reason: 'preferences_disabled' };
  }

  // Cache de subscriptions por pessoa_id
  let subscriptions = subsCache.get(pessoa_id);
  if (subscriptions === undefined) {
    subscriptions = await base44.entities.PushSubscription.filter({ pessoa_id, active: true });
    subsCache.set(pessoa_id, subscriptions);
  }

  if (!subscriptions || subscriptions.length === 0) {
    return { pessoa_id, skipped: true, reason: 'no_subscriptions' };
  }

  if (!vapidReady) {
    return { pessoa_id, skipped: true, reason: 'vapid_not_configured' };
  }

  const payload = JSON.stringify({
    title,
    body,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    data: {
      ...(data || {}),
      timestamp: new Date().toISOString(),
      notification_type
    }
  });

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, payload);
        return { success: true };
      } catch (error) {
        if (error.statusCode === 410) {
          await base44.asServiceRole.entities.PushSubscription.update(sub.id, { active: false });
        }
        throw error;
      }
    })
  );

  const sent = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  return { pessoa_id, sent, failed };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Configurar VAPID uma única vez por invocação
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    const vapidSubject = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@almoxhub.com';
    const vapidReady = !!(vapidPublicKey && vapidPrivateKey);
    if (vapidReady) {
      webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    }

    const prefsCache = new Map();
    const subsCache = new Map();

    // Modo BATCH: { recipients: [{ pessoa_id, notification_type, title, body, data }, ...] }
    if (Array.isArray(body.recipients) && body.recipients.length > 0) {
      const results = [];
      for (const r of body.recipients) {
        if (!VALID_TYPES.includes(r.notification_type)) {
          results.push({ pessoa_id: r.pessoa_id, skipped: true, reason: 'invalid_type' });
          continue;
        }
        try {
          const res = await enviarParaPessoa(
            base44, vapidReady, r.pessoa_id, r.notification_type, r.title, r.body, r.data,
            prefsCache, subsCache
          );
          results.push(res);
        } catch (err) {
          results.push({ pessoa_id: r.pessoa_id, error: err.message });
        }
      }
      return Response.json({
        batch: true,
        total: results.length,
        sent: results.filter(r => r.sent > 0).length,
        skipped: results.filter(r => r.skipped).length
      });
    }

    // Modo SINGLE (compatibilidade): { pessoa_id, notification_type, title, body, data }
    const { pessoa_id, notification_type, title, body: msgBody, data } = body;

    if (!VALID_TYPES.includes(notification_type)) {
      return Response.json({ error: 'Invalid notification type' }, { status: 400 });
    }

    const result = await enviarParaPessoa(
      base44, vapidReady, pessoa_id, notification_type, title, msgBody, data,
      prefsCache, subsCache
    );

    if (result.skipped) {
      return Response.json({ skipped: true, reason: result.reason });
    }
    return Response.json({ sent: result.sent, failed: result.failed });

  } catch (error) {
    console.error('Error sending push notification:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});