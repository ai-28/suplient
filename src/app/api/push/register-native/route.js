import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/lib/authoption.js';
import { sql } from '@/app/lib/db/postgresql';

/**
 * POST /api/push/register-native
 * Register a native push token (FCM for Android, APNs for iOS)
 */
export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { token, platform, deviceId } = body;

        if (!token || !platform) {
            return NextResponse.json(
                { error: 'Token and platform are required' },
                { status: 400 }
            );
        }

        if (platform !== 'ios' && platform !== 'android') {
            return NextResponse.json(
                { error: 'Platform must be "ios" or "android"' },
                { status: 400 }
            );
        }

        // Check if exact token already exists
        const existingToken = await sql`
            SELECT id FROM "NativePushToken"
            WHERE token = ${token}
        `;

        if (existingToken.length > 0) {
            // Update existing token (same token, maybe user changed)
            await sql`
                UPDATE "NativePushToken"
                SET 
                    "userId" = ${session.user.id},
                    platform = ${platform},
                    "deviceId" = ${deviceId || null},
                    "updatedAt" = CURRENT_TIMESTAMP
                WHERE token = ${token}
            `;
            console.log(`[API] Updated existing native push token (by token) for user ${session.user.id}, platform ${platform}`);
        } else {
            // Check if user already has a token for this platform and deviceId
            // This handles cases where FCM generates a new token for the same device
            let existingDeviceToken = null;
            
            if (deviceId) {
                const deviceTokens = await sql`
                    SELECT id, token FROM "NativePushToken"
                    WHERE "userId" = ${session.user.id}
                    AND platform = ${platform}
                    AND "deviceId" = ${deviceId}
                `;
                if (deviceTokens.length > 0) {
                    existingDeviceToken = deviceTokens[0];
                }
            }
            
            if (existingDeviceToken) {
                // Update existing token for this device (FCM refreshed the token)
                await sql`
                    UPDATE "NativePushToken"
                    SET 
                        token = ${token},
                        "deviceId" = ${deviceId || null},
                        "updatedAt" = CURRENT_TIMESTAMP
                    WHERE id = ${existingDeviceToken.id}
                `;
                console.log(`[API] Updated existing native push token (by deviceId) for user ${session.user.id}, platform ${platform}, old token replaced`);
            } else {
                // Check if user has any token for this platform (fallback - in case deviceId is null)
                const platformTokens = await sql`
                    SELECT id FROM "NativePushToken"
                    WHERE "userId" = ${session.user.id}
                    AND platform = ${platform}
                    ORDER BY "updatedAt" DESC
                    LIMIT 1
                `;
                
                if (platformTokens.length > 0 && !deviceId) {
                    // Update most recent token for this platform (deviceId was null, so we can't match by device)
                    await sql`
                        UPDATE "NativePushToken"
                        SET 
                            token = ${token},
                            "deviceId" = ${deviceId || null},
                            "updatedAt" = CURRENT_TIMESTAMP
                        WHERE id = ${platformTokens[0].id}
                    `;
                    console.log(`[API] Updated existing native push token (by platform, no deviceId) for user ${session.user.id}, platform ${platform}`);
                } else {
                    // Insert new token (genuinely new device or first time)
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
                    console.log(`[API] Inserted new native push token for user ${session.user.id}, platform ${platform}, deviceId: ${deviceId || 'null'}`);
                }
            }
        }

        return NextResponse.json({ success: true, message: 'Token registered successfully' });
    } catch (error) {
        console.error('Error registering native push token:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
