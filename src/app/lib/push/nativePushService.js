import { sql } from '@/app/lib/db/postgresql';

/**
 * Send native push notification to a user (FCM for Android, APNs for iOS)
 * @param {string} userId - User ID to send notification to
 * @param {object} notification - Notification object with title, message, etc.
 * @param {string} platform - 'ios' or 'android'
 * @returns {Promise<{sent: number, failed: number}>}
 */
export async function sendNativePushNotification(userId, notification, platform) {
    try {
        console.log(`🔔 [Native Push] Attempting to send ${platform} push notification to user ${userId}`, {
            notificationId: notification.id,
            type: notification.type,
            title: notification.title
        });

        // Get all native push tokens for the user and platform
        const tokens = await sql`
            SELECT token, "deviceId"
            FROM "NativePushToken"
            WHERE "userId" = ${userId}
            AND platform = ${platform}
        `;

        if (tokens.length === 0) {
            console.log(`⚠️ [Native Push] No ${platform} push tokens found for user ${userId}`);
            return { sent: 0, failed: 0 };
        }

        console.log(`✅ [Native Push] Found ${tokens.length} ${platform} push token(s) for user ${userId}`);

        if (platform === 'android') {
            return await sendFCMNotification(tokens, notification);
        } else if (platform === 'ios') {
            return await sendAPNsNotification(tokens, notification);
        }

        return { sent: 0, failed: 0 };
    } catch (error) {
        console.error(`[Native Push] Error in sendNativePushNotification for ${platform}:`, error);
        return { sent: 0, failed: 0, error: error.message };
    }
}

/**
 * Send notification via Firebase Cloud Messaging (FCM) for Android
 */
async function sendFCMNotification(tokens, notification) {
    try {
        // Dynamic import to prevent bundling issues
        const admin = (await import('firebase-admin')).default;

        // Initialize Firebase Admin if not already initialized
        if (!admin.apps.length) {
            const serviceAccount = {
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
            };

            if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
                console.error('❌ [FCM] Firebase credentials not configured');
                return { sent: 0, failed: tokens.length };
            }

            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
        }

        const message = {
            notification: {
                title: notification.title,
                body: notification.message
            },
            data: {
                notificationId: notification.id,
                type: notification.type,
                priority: notification.priority || 'normal',
                ...(typeof notification.data === 'string'
                    ? JSON.parse(notification.data)
                    : notification.data || {})
            },
            android: {
                priority: notification.priority === 'urgent' ? 'high' : 'normal',
                notification: {
                    sound: 'default',
                    channelId: 'default'
                }
            },
            tokens: tokens.map(t => t.token)
        };

        const response = await admin.messaging().sendEachForMulticast(message);
        
        console.log(`📊 [FCM] Push notification summary: ${response.successCount} sent, ${response.failureCount} failed`);

        // Remove invalid tokens
        if (response.responses) {
            const invalidTokens = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success && (resp.error?.code === 'messaging/invalid-registration-token' || 
                                     resp.error?.code === 'messaging/registration-token-not-registered')) {
                    invalidTokens.push(tokens[idx].token);
                }
            });

            if (invalidTokens.length > 0) {
                for (const token of invalidTokens) {
                    await sql`
                        DELETE FROM "NativePushToken"
                        WHERE token = ${token}
                    `;
                }
                console.log(`🗑️ [FCM] Removed ${invalidTokens.length} invalid tokens`);
            }
        }

        return { sent: response.successCount, failed: response.failureCount };
    } catch (error) {
        console.error('[FCM] Error sending FCM notification:', error);
        return { sent: 0, failed: tokens.length, error: error.message };
    }
}

/**
 * Send notification via Apple Push Notification Service (APNs) for iOS
 */
async function sendAPNsNotification(tokens, notification) {
    try {
        // Dynamic import
        const apn = (await import('apn')).default;

        // Initialize APNs provider
        const apnProvider = new apn.Provider({
            token: {
                key: process.env.APNS_KEY_PATH || process.env.APNS_KEY?.replace(/\\n/g, '\n'),
                keyId: process.env.APNS_KEY_ID,
                teamId: process.env.APNS_TEAM_ID
            },
            production: process.env.NODE_ENV === 'production'
        });

        if (!process.env.APNS_KEY_ID || !process.env.APNS_TEAM_ID) {
            console.error('❌ [APNs] APNs credentials not configured');
            return { sent: 0, failed: tokens.length };
        }

        const apnNotification = new apn.Notification();
        apnNotification.alert = {
            title: notification.title,
            body: notification.message
        };
        apnNotification.sound = 'default';
        apnNotification.badge = 1;
        apnNotification.topic = process.env.APNS_BUNDLE_ID || 'com.suplient.app';
        apnNotification.payload = {
            notificationId: notification.id,
            type: notification.type,
            ...(typeof notification.data === 'string'
                ? JSON.parse(notification.data)
                : notification.data || {})
        };
        apnNotification.priority = notification.priority === 'urgent' ? 10 : 5;

        const results = await apnProvider.send(apnNotification, tokens.map(t => t.token));
        
        let sent = 0;
        let failed = 0;
        const invalidTokens = [];

        results.sent.forEach((result) => {
            sent++;
        });

        results.failed.forEach((failure) => {
            failed++;
            if (failure.response && (failure.response.status === 410 || failure.response.status === 400)) {
                invalidTokens.push(failure.device);
            }
        });

        // Remove invalid tokens
        if (invalidTokens.length > 0) {
            for (const token of invalidTokens) {
                await sql`
                    DELETE FROM "NativePushToken"
                    WHERE token = ${token}
                `;
            }
            console.log(`🗑️ [APNs] Removed ${invalidTokens.length} invalid tokens`);
        }

        console.log(`📊 [APNs] Push notification summary: ${sent} sent, ${failed} failed`);
        return { sent, failed };
    } catch (error) {
        console.error('[APNs] Error sending APNs notification:', error);
        return { sent: 0, failed: tokens.length, error: error.message };
    }
}
