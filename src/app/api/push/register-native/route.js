import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/lib/authoption.js';
import { sql } from '@/app/lib/db/postgresql';

/**
 * POST /api/push/register-native
 * Register a native push token (FCM for Android, APNs for iOS)
 */
export async function POST(request) {
    console.log('[API] 🔔 ========== /api/push/register-native endpoint called ==========');
    console.log('[API] 📋 Request method:', request.method);
    console.log('[API] 📋 Request URL:', request.url);

    try {
        // Log request headers (sanitized)
        const headers = Object.fromEntries(request.headers.entries());
        console.log('[API] 📋 Request headers:', {
            'content-type': headers['content-type'],
            'user-agent': headers['user-agent']?.substring(0, 50) + '...',
            'origin': headers['origin'],
            'referer': headers['referer']?.substring(0, 50) + '...'
        });

        const session = await getServerSession(authOptions);
        console.log('[API] 📋 Session check:', {
            hasSession: !!session,
            hasUser: !!session?.user,
            userId: session?.user?.id,
            userEmail: session?.user?.email,
            userRole: session?.user?.role
        });

        if (!session?.user?.id) {
            console.log('[API] ❌ Unauthorized - no session or user ID');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        console.log('[API] 📦 Request body received:', {
            hasToken: !!body.token,
            tokenLength: body.token?.length,
            tokenPreview: body.token ? body.token.substring(0, 20) + '...' : 'null',
            platform: body.platform,
            hasDeviceId: !!body.deviceId,
            deviceId: body.deviceId || 'null'
        });

        const { token, platform, deviceId } = body;

        if (!token || !platform) {
            console.log('[API] ❌ Bad Request - missing token or platform:', {
                hasToken: !!token,
                hasPlatform: !!platform
            });
            return NextResponse.json(
                { error: 'Token and platform are required' },
                { status: 400 }
            );
        }

        if (platform !== 'ios' && platform !== 'android') {
            console.log('[API] ❌ Bad Request - invalid platform:', platform);
            return NextResponse.json(
                { error: 'Platform must be "ios" or "android"' },
                { status: 400 }
            );
        }

        console.log('[API] ✅ Validation passed, proceeding with token registration');

        // Check if exact token already exists
        console.log('[API] 🔍 Checking if token already exists in database...');
        const existingToken = await sql`
            SELECT id, "userId", platform, "deviceId" FROM "NativePushToken"
            WHERE token = ${token}
        `;

        console.log('[API] 🔍 Token existence check result:', {
            found: existingToken.length > 0,
            existingTokenCount: existingToken.length,
            existingTokenData: existingToken.length > 0 ? {
                id: existingToken[0].id,
                userId: existingToken[0].userId,
                platform: existingToken[0].platform,
                deviceId: existingToken[0].deviceId
            } : null
        });

        if (existingToken.length > 0) {
            // Update existing token (same token, maybe user changed)
            console.log('[API] 🔄 Updating existing token (same token, possibly different user)...');
            await sql`
                UPDATE "NativePushToken"
                SET 
                    "userId" = ${session.user.id},
                    platform = ${platform},
                    "deviceId" = ${deviceId || null},
                    "updatedAt" = CURRENT_TIMESTAMP
                WHERE token = ${token}
            `;
            console.log(`[API] ✅ Updated existing native push token (by token) for user ${session.user.id}, platform ${platform}`);
        } else {
            console.log('[API] 🔍 Token is new, checking for existing tokens for this user/device...');
            // Check if user already has a token for this platform and deviceId
            // This handles cases where FCM generates a new token for the same device
            let existingDeviceToken = null;

            if (deviceId) {
                console.log('[API] 🔍 Checking for existing token by deviceId:', deviceId);
                const deviceTokens = await sql`
                    SELECT id, token FROM "NativePushToken"
                    WHERE "userId" = ${session.user.id}
                    AND platform = ${platform}
                    AND "deviceId" = ${deviceId}
                `;
                console.log('[API] 🔍 Device token check result:', {
                    found: deviceTokens.length > 0,
                    count: deviceTokens.length
                });
                if (deviceTokens.length > 0) {
                    existingDeviceToken = deviceTokens[0];
                }
            } else {
                console.log('[API] ⚠️ No deviceId provided, skipping deviceId check');
            }

            if (existingDeviceToken) {
                // Update existing token for this device (FCM refreshed the token)
                console.log('[API] 🔄 Updating existing token for same device (token refresh)...');
                await sql`
                    UPDATE "NativePushToken"
                    SET 
                        token = ${token},
                        "deviceId" = ${deviceId || null},
                        "updatedAt" = CURRENT_TIMESTAMP
                    WHERE id = ${existingDeviceToken.id}
                `;
                console.log(`[API] ✅ Updated existing native push token (by deviceId) for user ${session.user.id}, platform ${platform}, old token replaced`);
            } else {
                // Check if user has any token for this platform (fallback - in case deviceId is null)
                console.log('[API] 🔍 Checking for existing tokens by platform (fallback)...');
                const platformTokens = await sql`
                    SELECT id FROM "NativePushToken"
                    WHERE "userId" = ${session.user.id}
                    AND platform = ${platform}
                    ORDER BY "updatedAt" DESC
                    LIMIT 1
                `;
                console.log('[API] 🔍 Platform token check result:', {
                    found: platformTokens.length > 0,
                    count: platformTokens.length,
                    hasDeviceId: !!deviceId
                });

                if (platformTokens.length > 0 && !deviceId) {
                    // Update most recent token for this platform (deviceId was null, so we can't match by device)
                    console.log('[API] 🔄 Updating most recent token for platform (no deviceId)...');
                    await sql`
                        UPDATE "NativePushToken"
                        SET 
                            token = ${token},
                            "deviceId" = ${deviceId || null},
                            "updatedAt" = CURRENT_TIMESTAMP
                        WHERE id = ${platformTokens[0].id}
                    `;
                    console.log(`[API] ✅ Updated existing native push token (by platform, no deviceId) for user ${session.user.id}, platform ${platform}`);
                } else {
                    // Insert new token (genuinely new device or first time)
                    console.log('[API] ➕ Inserting new token (first time or new device)...');
                    await sql`
                        INSERT INTO "NativePushToken" (
                            "userId",
                            token,
                            platform,
                            "deviceId",
                            "createdAt",
                            "updatedAt"
                        )
                        VALUES (
                            ${session.user.id},
                            ${token},
                            ${platform},
                            ${deviceId || null},
                            CURRENT_TIMESTAMP,
                            CURRENT_TIMESTAMP
                        )
                    `;
                    console.log(`[API] ✅ Inserted new native push token for user ${session.user.id}, platform ${platform}, deviceId: ${deviceId || 'null'}`);
                }
            }
        }

        console.log('[API] ✅ Token registration completed successfully');
        console.log('[API] ========== /api/push/register-native completed ==========');
        return NextResponse.json({ success: true, message: 'Token registered successfully' });
    } catch (error) {
        console.error('[API] ❌ ========== ERROR in /api/push/register-native ==========');
        console.error('[API] ❌ Error type:', error.constructor.name);
        console.error('[API] ❌ Error message:', error.message);
        console.error('[API] ❌ Error stack:', error.stack);
        console.error('[API] ❌ Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        console.error('[API] ========== END ERROR ==========');
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
