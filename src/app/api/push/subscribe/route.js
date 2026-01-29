import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/lib/authoption.js';
import { sql } from '@/app/lib/db/postgresql';

/**
 * POST /api/push/subscribe
 * Subscribe a user to push notifications
 */
export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { endpoint, keys } = body;

        if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
            return NextResponse.json(
                { error: 'Invalid subscription data' },
                { status: 400 }
            );
        }

        // Check if subscription already exists
        const existing = await sql`
            SELECT id FROM "PushSubscription"
            WHERE endpoint = ${endpoint}
        `;

        if (existing.length > 0) {
            // Update existing subscription
            await sql`
                UPDATE "PushSubscription"
                SET 
                    "userId" = ${session.user.id},
                    "p256dh" = ${keys.p256dh},
                    auth = ${keys.auth},
                    "userAgent" = ${request.headers.get('user-agent') || 'unknown'},
                    "updatedAt" = CURRENT_TIMESTAMP
                WHERE endpoint = ${endpoint}
            `;
        } else {
            // Insert new subscription
            await sql`
                INSERT INTO "PushSubscription" (
                    "userId", 
                    endpoint, 
                    "p256dh", 
                    auth, 
                    "userAgent",
                    "createdAt",
                    "updatedAt"
                )
                VALUES (
                    ${session.user.id},
                    ${endpoint},
                    ${keys.p256dh},
                    ${keys.auth},
                    ${request.headers.get('user-agent') || 'unknown'},
                    CURRENT_TIMESTAMP,
                    CURRENT_TIMESTAMP
                )
            `;
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error subscribing to push notifications:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
