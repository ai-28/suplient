import { configureWebPush } from './vapid';
import { sql } from '@/app/lib/db/postgresql';

/**
 * Send push notification to a user
 * @param {string} userId - User ID to send notification to
 * @param {object} notification - Notification object with title, message, etc.
 * @returns {Promise<{sent: number, failed: number}>}
 */
export async function sendPushNotification(userId, notification) {
    try {
        // Get all push subscriptions for the user
        const subscriptions = await sql`
            SELECT endpoint, "p256dh", auth
            FROM "PushSubscription"
            WHERE "userId" = ${userId}
        `;

        if (subscriptions.length === 0) {
            console.log(`No push subscriptions found for user ${userId}`);
            return { sent: 0, failed: 0 };
        }

        const webpush = await configureWebPush();
        const payload = JSON.stringify({
            title: notification.title,
            body: notification.message,
            icon: '/assets/icons/icon-192x192.svg',
            badge: '/assets/icons/icon-96x96.svg',
            sound: 'default', // Use system default notification sound
            data: {
                notificationId: notification.id,
                type: notification.type,
                priority: notification.priority || 'normal', // Include priority for vibration patterns
                url: getNotificationUrl(notification),
                ...(typeof notification.data === 'string'
                    ? JSON.parse(notification.data)
                    : notification.data || {})
            },
            tag: `notification-${notification.id}`,
            requireInteraction: notification.priority === 'urgent',
            timestamp: Date.now()
        });

        let sent = 0;
        let failed = 0;
        const invalidEndpoints = [];

        // Send to all subscriptions
        const promises = subscriptions.map(async (subscription) => {
            try {
                const pushSubscription = {
                    endpoint: subscription.endpoint,
                    keys: {
                        p256dh: subscription.p256dh,
                        auth: subscription.auth
                    }
                };

                await webpush.sendNotification(pushSubscription, payload);
                sent++;
            } catch (error) {
                console.error('Error sending push notification:', error);

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
            // Delete invalid subscriptions one by one (PostgreSQL array syntax)
            for (const endpoint of invalidEndpoints) {
                await sql`
                    DELETE FROM "PushSubscription"
                    WHERE endpoint = ${endpoint}
                `;
            }
            console.log(`Removed ${invalidEndpoints.length} invalid push subscriptions`);
        }

        return { sent, failed };
    } catch (error) {
        console.error('Error in sendPushNotification:', error);
        return { sent: 0, failed: 0, error: error.message };
    }
}

/**
 * Get notification URL based on notification type and data
 */
function getNotificationUrl(notification) {
    const data = typeof notification.data === 'string'
        ? JSON.parse(notification.data)
        : notification.data || {};

    // Map notification types to URLs (similar to NotificationBell logic)
    if (data.clientId) {
        return `/coach/clients/${data.clientId}`;
    }
    if (data.groupId) {
        return `/coach/group/${data.groupId}`;
    }
    if (data.conversationId) {
        return `/client/sessions`;
    }

    // Default routes based on notification type
    switch (notification.type) {
        case 'new_message':
            return '/client/sessions';
        case 'resource_shared':
            return '/client/resources';
        case 'session_reminder':
            return '/client/sessions';
        case 'task_completed':
        case 'task_created':
            return '/client/tasks';
        default:
            return '/client/dashboard';
    }
}
