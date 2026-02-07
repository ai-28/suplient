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

        // Check if token already exists
        const existing = await sql`
            SELECT id FROM "NativePushToken"
            WHERE token = ${token}
        `;

        if (existing.length > 0) {
            // Update existing token
            await sql`
                UPDATE "NativePushToken"
                SET 
                    "userId" = ${session.user.id},
                    platform = ${platform},
                    "deviceId" = ${deviceId || null},
                    "updatedAt" = CURRENT_TIMESTAMP
                WHERE token = ${token}
            `;
            console.log(`[API] Updated existing native push token for user ${session.user.id}, platform ${platform}`);
        } else {
            // Insert new token
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

        return NextResponse.json({ success: true, message: 'Token registered successfully' });
    } catch (error) {
        console.error('Error registering native push token:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
