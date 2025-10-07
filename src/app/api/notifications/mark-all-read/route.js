import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/lib/authoption.js';
import { notificationSchema } from '@/app/lib/db/notificationSchema';

// PUT /api/notifications/mark-all-read - Mark all notifications as read
export async function PUT(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const result = await notificationSchema.markAllAsRead(session.user.id);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            count: result.data.length,
            message: `Marked ${result.data.length} notifications as read`
        });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
