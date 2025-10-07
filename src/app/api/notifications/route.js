import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/lib/authoption.js';
import { notificationSchema } from '@/app/lib/db/notificationSchema';

// GET /api/notifications - Get notifications for the current user
export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit')) || 50;
        const offset = parseInt(searchParams.get('offset')) || 0;
        const isRead = searchParams.get('isRead');
        const type = searchParams.get('type');
        const priority = searchParams.get('priority');

        const options = {
            limit,
            offset,
            isRead: isRead !== null ? isRead === 'true' : null,
            type,
            priority
        };

        // Use relationship-based filtering
        const result = await notificationSchema.getUserNotificationsWithRelations(
            session.user.id,
            session.user.role,
            options
        );

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        // Get unread count
        const unreadResult = await notificationSchema.getUnreadCount(session.user.id);
        const unreadCount = unreadResult.success ? unreadResult.data : 0;

        return NextResponse.json({
            notifications: result.data,
            unreadCount,
            total: result.data.length
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/notifications - Create a new notification
export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { userId, type, title, message, data, priority } = body;

        // Validate required fields
        if (!userId || !type || !title || !message) {
            return NextResponse.json({
                error: 'Missing required fields: userId, type, title, message'
            }, { status: 400 });
        }

        const notificationData = {
            userId,
            type,
            title,
            message,
            data,
            priority: priority || 'normal'
        };

        const result = await notificationSchema.createNotification(notificationData);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json(result.data);
    } catch (error) {
        console.error('Error creating notification:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
