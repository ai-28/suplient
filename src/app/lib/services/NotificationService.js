// Global socket instance for notifications
// We'll use global.globalSocketIO set by server.js

// Notification service for real-time notifications
class NotificationService {
    static async createAndEmitNotification(notificationData) {
        try {
            // Check if notifications are enabled for this user
            const { sql } = await import('@/app/lib/db/postgresql');
            const userCheck = await sql`
                SELECT "notificationsEnabled" 
                FROM "User" 
                WHERE id = ${notificationData.userId}
            `;

            // If user doesn't exist or notifications are disabled, skip creating notification
            if (userCheck.length === 0) {
                console.log(`⚠️ User ${notificationData.userId} not found, skipping notification`);
                return null;
            }

            // Check if notifications are enabled (default to true if column doesn't exist yet)
            const notificationsEnabled = userCheck[0].notificationsEnabled !== false;
            if (!notificationsEnabled) {
                console.log(`🔕 Notifications disabled for user ${notificationData.userId}, skipping notification`);
                return null;
            }

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

                // Send push notification (web and/or native based on user's tokens)
                try {
                    console.log(`📨 [Notification Service] Checking push tokens for user ${notificationData.userId}`);
                    const { sql } = await import('@/app/lib/db/postgresql');

                    // Check what push tokens the user has
                    console.log(`📨 [Notification Service] Querying native tokens for user ${notificationData.userId}...`);
                    const nativeTokens = await sql`
                        SELECT DISTINCT platform 
                        FROM "NativePushToken" 
                        WHERE "userId" = ${notificationData.userId}
                    `;
                    console.log(`📨 [Notification Service] Native tokens query result:`, {
                        count: nativeTokens.length,
                        platforms: nativeTokens.map(t => t.platform)
                    });

                    const webSubscriptions = await sql`
                        SELECT id 
                        FROM "PushSubscription" 
                        WHERE "userId" = ${notificationData.userId}
                        LIMIT 1
                    `;
                    console.log(`📨 [Notification Service] Web subscriptions query result:`, {
                        count: webSubscriptions.length
                    });

                    // Send native push notifications for each platform the user has tokens for
                    if (nativeTokens.length > 0) {
                        console.log(`📨 [Notification Service] ✅ Found ${nativeTokens.length} native token platform(s), will send native push`);
                        const { sendNativePushNotification } = await import('@/app/lib/push/nativePushService');

                        for (const token of nativeTokens) {
                            const platform = token.platform; // 'ios' or 'android'
                            console.log(`📨 [Notification Service] Processing ${platform} push notification for notification ID: ${result.data.id}`);
                            console.log(`📨 [Native Push] Attempting to send ${platform} push notification for notification ID: ${result.data.id}`);
                            const pushResult = await sendNativePushNotification(notificationData.userId, result.data, platform);
                            console.log(`📨 [Native Push] ${platform} push notification result:`, JSON.stringify(pushResult, null, 2));

                            if (pushResult.sent === 0 && pushResult.failed === 0) {
                                console.warn(`⚠️ [Native Push] No ${platform} push tokens found for user ${notificationData.userId}`);
                            } else if (pushResult.failed > 0) {
                                console.warn(`⚠️ [Native Push] Some ${platform} push notifications failed: ${pushResult.failed} failed, ${pushResult.sent} sent`);
                            } else {
                                console.log(`✅ [Native Push] ${platform} push notification sent successfully: ${pushResult.sent} sent`);
                            }
                        }
                    } else {
                        console.log(`📨 [Notification Service] ⚠️ No native tokens found for user ${notificationData.userId}, skipping native push`);
                    }

                    // Send web push notification if user has web subscriptions
                    if (webSubscriptions.length > 0) {
                        const { sendWebPushNotification } = await import('@/app/lib/push/webPushService');
                        console.log(`📨 [Web Push] Attempting to send web push notification for notification ID: ${result.data.id}`);
                        const pushResult = await sendWebPushNotification(notificationData.userId, result.data);
                        console.log(`📨 [Web Push] Push notification result:`, pushResult);

                        if (pushResult.sent === 0 && pushResult.failed === 0) {
                            console.warn(`⚠️ [Web Push] No web push subscriptions found for user ${notificationData.userId} - user may not have enabled push notifications`);
                        } else if (pushResult.failed > 0) {
                            console.warn(`⚠️ [Web Push] Some push notifications failed: ${pushResult.failed} failed, ${pushResult.sent} sent`);
                        } else {
                            console.log(`✅ [Web Push] Push notification sent successfully: ${pushResult.sent} sent`);
                        }
                    }
                } catch (pushError) {
                    console.error('❌ Push notification failed:', {
                        error: pushError.message,
                        stack: pushError.stack,
                        userId: notificationData.userId,
                        notificationId: result.data?.id
                    });
                    // Don't fail the whole operation if push fails
                }

                return result.data;
            } else {
                console.error('Failed to create notification:', result.error);
                return null;
            }
        } catch (error) {
            // If column doesn't exist yet, log warning but still create notification (backward compatibility)
            if (error.message && error.message.includes('notificationsEnabled')) {
                console.warn('⚠️ notificationsEnabled column not found, creating notification anyway (backward compatibility)');
                // Fall through to create notification
                try {
                    const { notificationSchema } = await import('@/app/lib/db/notificationSchema');
                    const result = await notificationSchema.createNotification(notificationData);
                    return result.success ? result.data : null;
                } catch (fallbackError) {
                    console.error('Error creating notification (fallback):', fallbackError);
                    return null;
                }
            }
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

    static async notifyNoteCreated(userId, coachId, coachName, noteTitle) {
        return await this.createAndEmitNotification({
            userId: userId,
            type: 'system',
            title: 'New Note Added',
            message: `${coachName} added a note about you: "${noteTitle}"`,
            data: { userId, coachId, coachName, noteTitle, notificationType: 'note_created' },
            priority: 'normal'
        });
    }

    static async notifyNewMessage(recipientId, senderId, senderName, senderRole, conversationId, messageContent, messageType = 'text', clientId = null) {
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
                messageType,
                ...(clientId && { clientId }) // Include clientId if provided
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

    static async notifyAdminTaskAssigned(coachId, adminId, adminName, taskTitle, taskId) {
        return await this.createAndEmitNotification({
            userId: coachId,
            type: 'system',
            title: 'New Task Assigned',
            message: `${adminName} assigned you a new task: "${taskTitle}"`,
            data: {
                adminId,
                adminName,
                taskTitle,
                taskId,
                notificationType: 'admin_task_assigned'
            },
            priority: 'normal'
        });
    }

    static async notifyCoachTaskCompleted(adminId, coachId, coachName, taskTitle, taskId) {
        return await this.createAndEmitNotification({
            userId: adminId,
            type: 'system',
            title: 'Task Completed',
            message: `${coachName} completed the task: "${taskTitle}"`,
            data: {
                adminId,
                coachId,
                coachName,
                taskTitle,
                taskId,
                notificationType: 'coach_task_completed'
            },
            priority: 'normal'
        });
    }
}

// CommonJS exports
module.exports = {
    NotificationService
};
