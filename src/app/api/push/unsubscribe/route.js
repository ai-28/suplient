import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/lib/authoption.js';
import { sql } from '@/app/lib/db/postgresql';

/**
 * POST /api/push/unsubscribe
 * Unsubscribe a user from web push notifications
 */
export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { endpoint } = body;

        if (!endpoint) {
            return NextResponse.json(
                { error: 'Endpoint is required' },
                { status: 400 }
            );
        }

        // Delete subscription
        await sql`
            DELETE FROM "PushSubscription"
            WHERE endpoint = ${endpoint}
            AND "userId" = ${session.user.id}
        `;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error unsubscribing from push notifications:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
