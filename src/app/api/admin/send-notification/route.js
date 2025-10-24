import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/lib/authoption';
import { sql } from '@/app/lib/db/postgresql';

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is admin
        if (!session?.user?.id || session?.user?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { message, clientIds, coachIds } = await request.json();

        if (!message || !message.trim()) {
            return NextResponse.json(
                { error: 'Message is required' },
                { status: 400 }
            );
        }

        if ((!clientIds || clientIds.length === 0) && (!coachIds || coachIds.length === 0)) {
            return NextResponse.json(
                { error: 'At least one recipient is required' },
                { status: 400 }
            );
        }

        const recipientIds = [...(clientIds || []), ...(coachIds || [])];
        let successCount = 0;
        let failCount = 0;

        // Create notifications for all recipients
        for (const userId of recipientIds) {
            try {
                // Insert notification into database
                await sql`
          INSERT INTO "Notification" 
          ("userId", type, title, message, "isRead", priority, "createdAt")
          VALUES (
            ${userId},
            'system',
            'Admin Notification',
            ${message.trim()},
            false,
            'high',
            CURRENT_TIMESTAMP
          )
        `;

                // Try to send real-time notification if socket is available
                try {
                    if (global.globalSocketIO) {
                        const notification = {
                            id: Math.random().toString(36).substr(2, 9), // Temporary ID for real-time
                            userId: userId,
                            type: 'system',
                            title: 'Admin Notification',
                            message: message.trim(),
                            isRead: false,
                            priority: 'high',
                            createdAt: new Date().toISOString(),
                        };

                        // Emit to user's notification room
                        global.globalSocketIO.to(`notifications_${userId}`).emit('new_notification', notification);
                        console.log(`✅ Real-time notification sent to user ${userId}`);
                    }
                } catch (socketError) {
                    console.warn(`⚠️ Socket emission failed for user ${userId}, but notification saved:`, socketError.message);
                }

                successCount++;
            } catch (error) {
                console.error(`❌ Failed to create notification for user ${userId}:`, error);
                failCount++;
            }
        }

        return NextResponse.json({
            success: true,
            message: `Notification sent successfully`,
            recipientCount: successCount,
            failedCount: failCount,
            details: {
                totalRecipients: recipientIds.length,
                sent: successCount,
                failed: failCount,
            }
        });

    } catch (error) {
        console.error('Error sending notifications:', error);
        return NextResponse.json(
            { error: 'Failed to send notifications', details: error.message },
            { status: 500 }
        );
    }
}

