import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/lib/authoption.js';
import { sendWebPushNotification } from '@/app/lib/push/webPushService';

/**
 * POST /api/push/test
 * Test push notification endpoint
 */
export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const result = await sendWebPushNotification(session.user.id, {
            id: 'test-' + Date.now(),
            title: 'Test Notification',
            message: 'This is a test push notification',
            type: 'test',
            priority: 'normal'
        });

        return NextResponse.json({ 
            success: true, 
            result,
            message: 'Test notification sent. Check your browser for the notification.'
        });
    } catch (error) {
        console.error('Error sending test push notification:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
