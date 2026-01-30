import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/lib/authoption.js';
import { sql } from '@/app/lib/db/postgresql';

/**
 * POST /api/push/unregister-native
 * Unregister a native push token
 */
export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { token, platform } = body;

        if (!token) {
            return NextResponse.json(
                { error: 'Token is required' },
                { status: 400 }
            );
        }

        // Delete token
        await sql`
            DELETE FROM "NativePushToken"
            WHERE token = ${token}
            AND "userId" = ${session.user.id}
            ${platform ? sql`AND platform = ${platform}` : sql``}
        `;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error unregistering native push token:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
