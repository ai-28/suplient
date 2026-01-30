import { configureWebPush } from './vapid';
import { sql } from '@/app/lib/db/postgresql';

/**
 * Send web push notification to a user (Web Push API)
 * @param {string} userId - User ID to send notification to
 * @param {object} notification - Notification object with title, message, etc.
 * @returns {Promise<{sent: number, failed: number}>}
 */
export async function sendWebPushNotification(userId, notification) {
    try {
        console.log(`🔔 [Web Push] Attempting to send push notification to user ${userId}`, {
            notificationId: notification.id,
            type: notification.type,
            title: notification.title
        });

        // Get all web push subscriptions for the user
        const subscriptions = await sql`
            SELECT endpoint, "p256dh", auth, "userId"
            FROM "PushSubscription"
            WHERE "userId" = ${userId}
            AND (platform = 'web' OR platform IS NULL)
        `;

        if (subscriptions.length === 0) {
            console.log(`⚠️ [Web Push] No web push subscriptions found for user ${userId}`);
            return { sent: 0, failed: 0 };
        }

        console.log(`✅ [Web Push] Found ${subscriptions.length} web push subscription(s) for user ${userId}`);

        // Get user role for proper URL routing
        const userData = await sql`
            SELECT role FROM "User" WHERE id = ${userId}
        `;
        const userRole = userData.length > 0 ? userData[0].role : 'client';

        const webpush = await configureWebPush();

        // Ensure we have a message/body
        const notificationBody = notification.message || notification.body || 'You have a new notification';

        const payload = JSON.stringify({
            title: notification.title || 'New Notification',
            body: notificationBody,
            icon: '/assets/icons/icon-192x192.svg',
            badge: '/assets/icons/icon-96x96.svg',
            sound: 'default',
            data: {
                notificationId: notification.id,
                type: notification.type,
                priority: notification.priority || 'normal',
                url: getNotificationUrl(notification, userRole),
                ...(typeof notification.data === 'string'
                    ? JSON.parse(notification.data)
                    : notification.data || {})
            },
            tag: `notification-${notification.id}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            requireInteraction: notification.priority === 'urgent',
            timestamp: Date.now()
        });

        console.log(`📦 [Web Push] Push payload details:`, {
            title: notification.title,
            body: (notification.message || '').substring(0, 80),
            type: notification.type
        });

        let sent = 0;
        let failed = 0;
        const invalidEndpoints = [];

        // Send to all subscriptions
        const promises = subscriptions.map(async (subscription, index) => {
            try {
                const pushSubscription = {
                    endpoint: subscription.endpoint,
                    keys: {
                        p256dh: subscription.p256dh,
                        auth: subscription.auth
                    }
                };

                console.log(`📤 [Web Push] Sending push notification ${index + 1}/${subscriptions.length}`);

                await webpush.sendNotification(pushSubscription, payload, {
                    TTL: 24 * 60 * 60, // 24 hours
                    urgency: notification.priority === 'urgent' ? 'high' : 'normal'
                });

                sent++;
                console.log(`✅ [Web Push] Successfully sent push notification ${index + 1}/${subscriptions.length}`);
            } catch (error) {
                console.error(`❌ [Web Push] Error sending push notification ${index + 1}/${subscriptions.length}:`, {
                    error: error.message,
                    statusCode: error.statusCode
                });

                // If subscription is invalid (410 Gone, 404 Not Found), mark for removal
                if (error.statusCode === 410 || error.statusCode === 404) {
                    invalidEndpoints.push(subscription.endpoint);
                }

                failed++;
            }
        });

        await Promise.allSettled(promises);

        // Remove invalid subscriptions
        if (invalidEndpoints.length > 0) {
            for (const endpoint of invalidEndpoints) {
                await sql`
                    DELETE FROM "PushSubscription"
                    WHERE endpoint = ${endpoint}
                `;
            }
            console.log(`🗑️ [Web Push] Removed ${invalidEndpoints.length} invalid push subscriptions`);
        }

        console.log(`📊 [Web Push] Push notification summary for user ${userId}: ${sent} sent, ${failed} failed`);
        return { sent, failed };
    } catch (error) {
        console.error('[Web Push] Error in sendWebPushNotification:', error);
        return { sent: 0, failed: 0, error: error.message };
    }
}

/**
 * Get notification URL based on notification type, data, and user role
 */
function getNotificationUrl(notification, userRole = 'client') {
    const data = typeof notification.data === 'string'
        ? JSON.parse(notification.data)
        : notification.data || {};

    const notificationType = data.notificationType || notification.type;

    if (userRole === 'client') {
        switch (notificationType) {
            case 'new_message':
                return '/client/sessions';
            case 'resource_shared':
                return '/client/resources';
            case 'session_reminder':
                return '/client/sessions';
            case 'goal_achieved':
                return '/client/dashboard';
            case 'task_created':
            case 'task_completed':
                return '/client/tasks';
            default:
                return '/client/dashboard';
        }
    }

    if (userRole === 'coach') {
        if (data.clientId) {
            return `/coach/clients/${data.clientId}`;
        }
        if (data.groupId) {
            return `/coach/group/${data.groupId}`;
        }
        switch (notificationType) {
            case 'new_message':
                return '/coach/clients';
            case 'client_signup':
                return '/coach/clients';
            default:
                return '/coach/dashboard';
        }
    }

    if (userRole === 'admin') {
        if (data.coachId) {
            return `/admin/coaches/${data.coachId}`;
        }
        switch (notificationType) {
            case 'new_message':
                return '/admin/chat';
            default:
                return '/admin/dashboard';
        }
    }

    return '/client/dashboard';
}
