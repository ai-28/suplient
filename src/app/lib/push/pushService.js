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
        console.log(`🔔 Attempting to send push notification to user ${userId} (type: ${typeof userId})`, {
            notificationId: notification.id,
            type: notification.type,
            title: notification.title
        });

        // Get all push subscriptions for the user
        const subscriptions = await sql`
            SELECT endpoint, "p256dh", auth, "userId"
            FROM "PushSubscription"
            WHERE "userId" = ${userId}
        `;

        if (subscriptions.length === 0) {
            console.log(`⚠️ No push subscriptions found for user ${userId}`);
            console.log(`🔍 Debug: Querying for userId = ${userId} (type: ${typeof userId})`);

            // Debug: Check all subscriptions to see what userIds exist
            const allSubscriptions = await sql`
                SELECT "userId", endpoint, "createdAt"
                FROM "PushSubscription"
                ORDER BY "createdAt" DESC
                LIMIT 10
            `;
            console.log(`🔍 Debug: Found ${allSubscriptions.length} total subscriptions in DB:`,
                allSubscriptions.map(s => ({
                    userId: s.userId,
                    userIdType: typeof s.userId,
                    endpoint: s.endpoint?.substring(0, 50) + '...'
                }))
            );

            // Try to find if there's a subscription with a similar userId (case/whitespace issue)
            const similarSubs = await sql`
                SELECT "userId", endpoint
                FROM "PushSubscription"
                WHERE "userId"::text LIKE ${`%${userId}%`}
            `;
            if (similarSubs.length > 0) {
                console.log(`⚠️ Found similar userIds in DB:`, similarSubs.map(s => ({
                    userId: s.userId,
                    userIdType: typeof s.userId
                })));
            }

            return { sent: 0, failed: 0 };
        }

        console.log(`✅ Found ${subscriptions.length} push subscription(s) for user ${userId}`);

        // Get user role for proper URL routing
        const userData = await sql`
            SELECT role FROM "User" WHERE id = ${userId}
        `;
        const userRole = userData.length > 0 ? userData[0].role : 'client';

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
                url: getNotificationUrl(notification, userRole), // Pass user role
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
        const promises = subscriptions.map(async (subscription, index) => {
            try {
                const pushSubscription = {
                    endpoint: subscription.endpoint,
                    keys: {
                        p256dh: subscription.p256dh,
                        auth: subscription.auth
                    }
                };

                console.log(`📤 Sending push notification ${index + 1}/${subscriptions.length} to endpoint: ${subscription.endpoint.substring(0, 50)}...`);
                await webpush.sendNotification(pushSubscription, payload);
                sent++;
                console.log(`✅ Successfully sent push notification ${index + 1}/${subscriptions.length}`);
            } catch (error) {
                console.error(`❌ Error sending push notification ${index + 1}/${subscriptions.length}:`, {
                    error: error.message,
                    statusCode: error.statusCode,
                    endpoint: subscription.endpoint.substring(0, 50) + '...'
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
            // Delete invalid subscriptions one by one (PostgreSQL array syntax)
            for (const endpoint of invalidEndpoints) {
                await sql`
                    DELETE FROM "PushSubscription"
                    WHERE endpoint = ${endpoint}
                `;
            }
            console.log(`🗑️ Removed ${invalidEndpoints.length} invalid push subscriptions`);
        }

        console.log(`📊 Push notification summary for user ${userId}: ${sent} sent, ${failed} failed`);
        return { sent, failed };
    } catch (error) {
        console.error('Error in sendPushNotification:', error);
        return { sent: 0, failed: 0, error: error.message };
    }
}

/**
 * Get notification URL based on notification type, data, and user role
 * Matches the routing logic from NotificationBell component
 */
function getNotificationUrl(notification, userRole = 'client') {
    const data = typeof notification.data === 'string'
        ? JSON.parse(notification.data)
        : notification.data || {};

    // Get actual notification type (handles system type with notificationType in data)
    const notificationType = data.notificationType || notification.type;

    // CLIENT ROUTES
    if (userRole === 'client') {
        // Check for specific data-based routing first
        if (data.clientId) {
            // Shouldn't happen for clients, but fallback
            return '/client/dashboard';
        }

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

            case 'note_created':
                return '/client/dashboard';

            case 'system':
                // Handle system notifications with notificationType in data
                if (data.notificationType === 'resource_shared') {
                    return '/client/resources';
                }
                if (data.notificationType === 'task_created') {
                    return '/client/tasks';
                }
                if (data.notificationType === 'note_created') {
                    return '/client/dashboard';
                }
                return '/client/dashboard';

            default:
                return '/client/dashboard';
        }
    }

    // COACH ROUTES
    if (userRole === 'coach') {
        // Check for clientId first (most specific route)
        if (data.clientId) {
            switch (notificationType) {
                case 'client_signup':
                case 'new_message':
                case 'goal_achieved':
                    return `/coach/clients/${data.clientId}`;

                case 'task_completed':
                    return '/coach/tasks';

                case 'daily_checkin':
                    return `/coach/clients/${data.clientId}?tab=overview`;

                default:
                    return `/coach/clients/${data.clientId}`;
            }
        }

        // Check for groupId
        if (data.groupId) {
            return `/coach/group/${data.groupId}`;
        }

        // Type-based routing
        switch (notificationType) {
            case 'client_signup':
                return '/coach/clients';

            case 'task_completed':
                return '/coach/tasks';

            case 'daily_checkin':
                return '/coach/clients';

            case 'new_message':
                // For new messages without clientId, try to get from conversationId or senderId
                if (data.conversationId) {
                    // Fallback to clients list - notification click handler can fetch client
                    return '/coach/clients';
                }
                if (data.senderId) {
                    // Fallback to clients list
                    return '/coach/clients';
                }
                return '/coach/clients';

            case 'group_join_request':
                if (data.groupId) {
                    return `/coach/group/${data.groupId}`;
                }
                return '/coach/groups';

            case 'goal_achieved':
                if (data.clientId) {
                    return `/coach/clients/${data.clientId}?tab=progress`;
                }
                return '/coach/clients';

            case 'system':
                // Handle system notifications with notificationType in data
                if (data.notificationType === 'admin_task_assigned') {
                    return '/coach/tasks';
                }
                if (data.notificationType === 'group_join_request') {
                    if (data.groupId) {
                        return `/coach/group/${data.groupId}`;
                    }
                    return '/coach/groups';
                }
                return '/coach/dashboard';

            default:
                return '/coach/dashboard';
        }
    }

    // ADMIN ROUTES
    if (userRole === 'admin') {
        // Check for specific IDs
        if (data.clientId) {
            return `/admin/clients`;
        }
        if (data.coachId) {
            return `/admin/coaches/${data.coachId}`;
        }
        if (data.groupId) {
            return '/admin/groups';
        }

        switch (notificationType) {
            case 'coach_task_completed':
                return '/admin/tasks';

            case 'new_message':
                return '/admin/chat';

            default:
                return '/admin/dashboard';
        }
    }

    // Default fallback
    return '/client/dashboard';
}
