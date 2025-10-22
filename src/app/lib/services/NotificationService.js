// Global socket instance for notifications
// We'll use global.globalSocketIO set by server.js

// Notification service for real-time notifications
class NotificationService {
    static async createAndEmitNotification(notificationData) {
        try {
            // First create the notification in the database
            const { notificationSchema } = await import('@/app/lib/db/notificationSchema');
            const result = await notificationSchema.createNotification(notificationData);

            if (result.success) {
                // Try to emit real-time notification via socket
                try {
                    if (global.globalSocketIO) {
                        const roomName = `notifications_${notificationData.userId}`;
                        global.globalSocketIO.to(roomName).emit('new_notification', result.data);
                    } else {
                        console.warn('Global socket not available, notification saved but not emitted');
                    }
                } catch (socketError) {
                    console.warn('Socket emission failed, notification saved but not emitted:', socketError.message);
                }

                return result.data;
            } else {
                console.error('Failed to create notification:', result.error);
                return null;
            }
        } catch (error) {
            console.error('Error creating and emitting notification:', error);
            return null;
        }
    }

    // Helper methods for common notification types
    static async notifyClientSignup(clientId, coachId, clientName) {
        return await this.createAndEmitNotification({
            userId: coachId,
            type: 'client_signup',
            title: 'New Client Signup',
            message: `${clientName} has signed up and is ready to start their journey!`,
            data: { clientId, clientName, coachId },
            priority: 'high'
        });
    }

    static async notifyTaskCompletion(clientId, coachId, clientName, taskTitle) {
        return await this.createAndEmitNotification({
            userId: coachId,
            type: 'task_completed',
            title: 'Task Completed',
            message: `${clientName} completed the task: "${taskTitle}"`,
            data: { clientId, clientName, taskTitle, coachId },
            priority: 'normal'
        });
    }

    static async notifyDailyCheckin(clientId, coachId, clientName) {
        return await this.createAndEmitNotification({
            userId: coachId,
            type: 'daily_checkin',
            title: 'Daily Check-in',
            message: `${clientName} completed their daily check-in`,
            data: { clientId, clientName, coachId },
            priority: 'normal'
        });
    }


    static async notifySessionReminder(userId, sessionTitle, sessionTime) {
        return await this.createAndEmitNotification({
            userId: userId,
            type: 'session_reminder',
            title: 'Session Reminder',
            message: `Your session "${sessionTitle}" is starting in 15 minutes`,
            data: { sessionTitle, sessionTime },
            priority: 'urgent'
        });
    }

    static async emitUnreadCountUpdate(conversationId, participantId) {
        try {
            if (global.globalSocketIO) {
                const roomName = `notifications_${participantId}`;
                console.log(`🔔 Emitting unread count update to room: ${roomName} for conversation: ${conversationId}`);

                global.globalSocketIO.to(roomName).emit('update_unread_count', {
                    conversationId,
                    participantId
                });

                // Check if room exists and has members
                const room = global.globalSocketIO.sockets.adapter.rooms.get(roomName);
                console.log(`Room ${roomName} exists:`, !!room, 'Members:', room?.size || 0);

                return true;
            } else {
                console.warn('Global socket not available for unread count update');
                return false;
            }
        } catch (socketError) {
            console.warn('Socket emission failed for unread count update:', socketError.message);
            return false;
        }
    }

    static async notifyGoalAchievement(clientId, coachId, clientName, goalTitle) {
        return await this.createAndEmitNotification({
            userId: coachId,
            type: 'goal_achieved',
            title: 'Goal Achieved!',
            message: `${clientName} achieved their goal: "${goalTitle}"`,
            data: { clientId, clientName, goalTitle, coachId },
            priority: 'high'
        });
    }

    // Client-specific notification methods
    static async notifyResourceShared(userId, coachId, coachName, resourceTitle) {
        return await this.createAndEmitNotification({
            userId: userId,
            type: 'system', // Use system type for resource sharing
            title: 'New Resource Shared',
            message: `${coachName} shared a new resource: "${resourceTitle}"`,
            data: { userId, coachId, coachName, resourceTitle, notificationType: 'resource_shared' },
            priority: 'normal'
        });
    }

    static async notifyTaskCreated(userId, coachId, coachName, taskTitle) {
        return await this.createAndEmitNotification({
            userId: userId,
            type: 'system', // Use 'system' type since 'task_assigned' is not allowed
            title: 'New Task Assigned',
            message: `${coachName} assigned you a new task: "${taskTitle}"`,
            data: { userId, coachId, coachName, taskTitle, notificationType: 'task_created' },
            priority: 'normal'
        });
    }

    static async notifyNewMessage(recipientId, senderId, senderName, senderRole, conversationId, messageContent, messageType = 'text') {
        return await this.createAndEmitNotification({
            userId: recipientId,
            type: 'new_message',
            title: 'New Message',
            message: `${senderName}: ${messageContent.length > 50 ? messageContent.substring(0, 50) + '...' : messageContent}`,
            data: {
                conversationId,
                senderId,
                senderName,
                senderRole,
                messageContent,
                messageType
            },
            priority: 'normal'
        });
    }

    static async notifyGroupJoinRequest(coachId, groupId, groupName, clientId, clientName, clientEmail, message) {
        return await this.createAndEmitNotification({
            userId: coachId,
            type: 'system',
            title: 'New Group Join Request',
            message: `${clientName} wants to join your group "${groupName}"`,
            data: {
                groupId,
                groupName,
                clientId,
                clientName,
                clientEmail,
                message: message || '',
                notificationType: 'group_join_request'
            },
            priority: 'high'
        });
    }
}

// CommonJS exports
module.exports = {
    NotificationService
};
