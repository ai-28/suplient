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
        console.log(`🔍 [Native Push Service] Querying tokens for user ${userId}, platform ${platform}...`);
        const tokens = await sql`
            SELECT token, "deviceId"
            FROM "NativePushToken"
            WHERE "userId" = ${userId}
            AND platform = ${platform}
        `;

        console.log(`🔍 [Native Push Service] Token query result:`, {
            count: tokens.length,
            tokens: tokens.map(t => ({
                tokenPreview: t.token ? t.token.substring(0, 20) + '...' : 'null',
                hasDeviceId: !!t.deviceId,
                deviceId: t.deviceId || 'null'
            }))
        });

        if (tokens.length === 0) {
            console.log(`⚠️ [Native Push] No ${platform} push tokens found for user ${userId}`);
            console.log(`⚠️ [Native Push] This means the user has not registered a ${platform} push token yet`);
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
        console.error(`[Native Push] ❌ ========== ERROR in sendNativePushNotification ==========`);
        console.error(`[Native Push] ❌ Platform: ${platform}`);
        console.error(`[Native Push] ❌ User ID: ${userId}`);
        console.error(`[Native Push] ❌ Error type:`, error.constructor.name);
        console.error(`[Native Push] ❌ Error message:`, error.message);
        console.error(`[Native Push] ❌ Error stack:`, error.stack);
        console.error(`[Native Push] ❌ Full error object:`, JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        console.error(`[Native Push] ========== END ERROR ==========`);
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
                    channelId: 'high_importance_channel'
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
        // Validate notification object
        if (!notification) {
            console.error('[APNs] ❌ Notification object is undefined or null');
            return { sent: 0, failed: tokens.length, error: 'Notification object is undefined' };
        }
        if (!notification.title || !notification.message) {
            console.error('[APNs] ❌ Notification object missing required fields:', {
                hasTitle: !!notification.title,
                hasMessage: !!notification.message,
                notification: JSON.stringify(notification, null, 2)
            });
            return { sent: 0, failed: tokens.length, error: 'Notification object missing required fields' };
        }

        console.log('[APNs] ✅ Notification object validated:', {
            id: notification.id,
            title: notification.title,
            message: notification.message,
            type: notification.type
        });

        // Dynamic import
        const apn = (await import('apn')).default;
        const fs = (await import('fs')).default;
        const path = (await import('path')).default;

        // Validate required credentials
        console.log('[APNs] 🔍 Validating APNs credentials...');
        console.log('[APNs] 🔍 Environment variables check:', {
            hasAPNS_KEY_ID: !!process.env.APNS_KEY_ID,
            APNS_KEY_ID: process.env.APNS_KEY_ID || 'NOT SET',
            hasAPNS_TEAM_ID: !!process.env.APNS_TEAM_ID,
            APNS_TEAM_ID: process.env.APNS_TEAM_ID || 'NOT SET',
            hasAPNS_KEY: !!process.env.APNS_KEY,
            hasAPNS_KEY_PATH: !!process.env.APNS_KEY_PATH,
            APNS_KEY_PATH: process.env.APNS_KEY_PATH || 'NOT SET',
            NODE_ENV: process.env.NODE_ENV
        });

        if (!process.env.APNS_KEY_ID || !process.env.APNS_TEAM_ID) {
            console.error('❌ [APNs] ========== APNs CREDENTIALS MISSING ==========');
            console.error('❌ [APNs] Missing APNS_KEY_ID:', !process.env.APNS_KEY_ID);
            console.error('❌ [APNs] Missing APNS_TEAM_ID:', !process.env.APNS_TEAM_ID);
            console.error('❌ [APNs] ========== END CREDENTIALS ERROR ==========');
            return { sent: 0, failed: tokens.length, error: 'APNs credentials not configured' };
        }

        // Get the APNs key (either from file path or environment variable)
        console.log('[APNs] 🔍 Loading APNs key...');
        let apnsKey;
        if (process.env.APNS_KEY_PATH) {
            // Use key file path
            console.log('[APNs] 🔍 Using APNS_KEY_PATH method');
            const keyPath = path.resolve(process.env.APNS_KEY_PATH);
            console.log('[APNs] 🔍 Resolved key path:', keyPath);
            if (!fs.existsSync(keyPath)) {
                console.error(`❌ [APNs] ========== KEY FILE NOT FOUND ==========`);
                console.error(`❌ [APNs] Key file path: ${keyPath}`);
                console.error(`❌ [APNs] File exists: ${fs.existsSync(keyPath)}`);
                console.error(`❌ [APNs] Current working directory: ${process.cwd()}`);
                console.error(`❌ [APNs] ========== END KEY FILE ERROR ==========`);
                return { sent: 0, failed: tokens.length, error: 'APNs key file not found' };
            }
            apnsKey = keyPath;
            console.log('[APNs] ✅ Key file found and loaded');
        } else if (process.env.APNS_KEY) {
            // Use key content from environment variable
            console.log('[APNs] 🔍 Using APNS_KEY method (from environment variable)');
            apnsKey = process.env.APNS_KEY.replace(/\\n/g, '\n');
            console.log('[APNs] ✅ Key loaded from environment variable (length:', apnsKey.length, 'chars)');
        } else {
            console.error('❌ [APNs] ========== NO APNs KEY CONFIGURED ==========');
            console.error('❌ [APNs] APNS_KEY_PATH:', process.env.APNS_KEY_PATH || 'NOT SET');
            console.error('❌ [APNs] APNS_KEY:', process.env.APNS_KEY ? 'SET (hidden)' : 'NOT SET');
            console.error('❌ [APNs] Provide either APNS_KEY_PATH or APNS_KEY');
            console.error('❌ [APNs] ========== END KEY ERROR ==========');
            return { sent: 0, failed: tokens.length, error: 'APNs key not configured' };
        }

        // Initialize APNs provider
        console.log('[APNs] 🔧 Initializing APNs provider...');
        const providerConfig = {
            token: {
                key: apnsKey, // Pass the actual path or key content directly
                keyId: process.env.APNS_KEY_ID,
                teamId: process.env.APNS_TEAM_ID
            },
            production: process.env.NODE_ENV === 'production'
        };
        console.log('[APNs] 🔧 Provider config:', {
            keyType: typeof apnsKey === 'string' && apnsKey.length > 100 ? 'string (key content)' : 'file path',
            keyPath: typeof apnsKey === 'string' && apnsKey.length < 200 ? apnsKey : 'key content (hidden)',
            keyId: providerConfig.token.keyId,
            teamId: providerConfig.token.teamId,
            production: providerConfig.production,
            NODE_ENV: process.env.NODE_ENV
        });

        let apnProvider;
        try {
            apnProvider = new apn.Provider(providerConfig);
            console.log('[APNs] ✅ Provider initialized successfully');
        } catch (providerError) {
            console.error('[APNs] ❌ ========== PROVIDER INITIALIZATION ERROR ==========');
            console.error('[APNs] ❌ Error type:', providerError.constructor.name);
            console.error('[APNs] ❌ Error message:', providerError.message);
            console.error('[APNs] ❌ Error stack:', providerError.stack);
            console.error('[APNs] ❌ Full error:', JSON.stringify(providerError, Object.getOwnPropertyNames(providerError), 2));
            console.error('[APNs] ========== END PROVIDER ERROR ==========');
            throw providerError;
        }

        console.log(`✅ [APNs] APNs provider initialized (${process.env.NODE_ENV === 'production' ? 'production' : 'development'})`);

        const bundleId = process.env.APNS_BUNDLE_ID || 'com.suplient.user';
        console.log(`📦 [APNs] Using bundle ID (topic): ${bundleId}`);
        console.log(`📦 [APNs] Environment variables check:`, {
            hasAPNS_BUNDLE_ID: !!process.env.APNS_BUNDLE_ID,
            APNS_BUNDLE_ID: process.env.APNS_BUNDLE_ID || 'not set (using fallback)',
            hasAPNS_KEY_ID: !!process.env.APNS_KEY_ID,
            hasAPNS_TEAM_ID: !!process.env.APNS_TEAM_ID,
            hasAPNS_KEY: !!process.env.APNS_KEY,
            hasAPNS_KEY_PATH: !!process.env.APNS_KEY_PATH,
            NODE_ENV: process.env.NODE_ENV
        });

        const apnNotification = new apn.Notification();

        // Safely construct alert object
        const alertTitle = notification.title || 'Notification';
        const alertBody = notification.message || 'You have a new notification';

        apnNotification.alert = {
            title: alertTitle,
            body: alertBody
        };
        apnNotification.sound = 'default';
        apnNotification.badge = 1;
        apnNotification.topic = bundleId;

        console.log(`📦 [APNs] Notification payload:`, {
            topic: apnNotification.topic,
            title: apnNotification.alert?.title || alertTitle,
            body: apnNotification.alert?.body || alertBody,
            sound: apnNotification.sound,
            badge: apnNotification.badge,
            tokenCount: tokens.length,
            hasAlert: !!apnNotification.alert
        });
        apnNotification.payload = {
            notificationId: notification.id,
            type: notification.type,
            ...(typeof notification.data === 'string'
                ? JSON.parse(notification.data)
                : notification.data || {})
        };
        apnNotification.priority = notification.priority === 'urgent' ? 10 : 5;

        const tokenList = tokens.map(t => t.token);
        console.log(`📤 [APNs] Sending notification to ${tokenList.length} token(s)...`);
        console.log(`📤 [APNs] Token list preview:`, tokenList.map(t => t.substring(0, 20) + '...'));

        const results = await apnProvider.send(apnNotification, tokenList);

        console.log(`📊 [APNs] Send results received:`, {
            sentCount: results.sent?.length || 0,
            failedCount: results.failed?.length || 0
        });

        let sent = 0;
        let failed = 0;
        const invalidTokens = [];

        results.sent.forEach((result) => {
            sent++;
            console.log(`✅ [APNs] Successfully sent to token:`, result.device?.substring(0, 20) + '...');
        });

        results.failed.forEach((failure) => {
            failed++;
            console.error(`❌ [APNs] ========== FAILED TO SEND NOTIFICATION ==========`);
            console.error(`❌ [APNs] Device token:`, failure.device?.substring(0, 30) + '...');
            console.error(`❌ [APNs] Response status:`, failure.response?.status);
            console.error(`❌ [APNs] Response reason:`, failure.response?.reason);
            console.error(`❌ [APNs] Response description:`, failure.response?.description);
            console.error(`❌ [APNs] Error message:`, failure.error?.message || failure.error);
            console.error(`❌ [APNs] Full failure object:`, JSON.stringify(failure, Object.getOwnPropertyNames(failure), 2));
            console.error(`❌ [APNs] ========== END FAILURE DETAILS ==========`);

            if (failure.response && (failure.response.status === 410 || failure.response.status === 400)) {
                invalidTokens.push(failure.device);
                console.log(`🗑️ [APNs] Marking token as invalid (status ${failure.response.status}):`, failure.device?.substring(0, 20) + '...');
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
        console.error('[APNs] ❌ ========== ERROR IN sendAPNsNotification ==========');
        console.error('[APNs] ❌ Error type:', error.constructor.name);
        console.error('[APNs] ❌ Error message:', error.message);
        console.error('[APNs] ❌ Error stack:', error.stack);
        console.error('[APNs] ❌ Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        console.error('[APNs] ❌ Environment check at error time:', {
            hasAPNS_KEY_ID: !!process.env.APNS_KEY_ID,
            hasAPNS_TEAM_ID: !!process.env.APNS_TEAM_ID,
            hasAPNS_KEY: !!process.env.APNS_KEY,
            hasAPNS_KEY_PATH: !!process.env.APNS_KEY_PATH,
            NODE_ENV: process.env.NODE_ENV
        });
        console.error('[APNs] ========== END ERROR ==========');
        return { sent: 0, failed: tokens.length, error: error.message };
    }
}
