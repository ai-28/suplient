"use client"

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

/**
 * Global notification listener that shows toasts for notifications
 * even when NotificationBell is not mounted on the current page.
 * This ensures clients see notifications on all pages, not just dashboard.
 */
export function GlobalNotificationListener() {
    const { data: session } = useSession();

    useEffect(() => {
        if (!session?.user?.id) return;

        const handleNewNotification = (event) => {
            const notification = event.detail;

            // Check if notifications are enabled for this user
            const notificationsEnabled = localStorage.getItem('notificationsEnabled');
            if (notificationsEnabled === 'false') {
                return;
            }

            // Check if notification already exists to prevent duplicates
            // We'll use a simple Set to track recent notification IDs
            const recentNotifications = window.__recentNotifications || new Set();
            if (recentNotifications.has(notification.id)) {
                console.log('Notification already shown, skipping duplicate:', notification.id);
                return;
            }

            // Add to recent notifications (clean up after 5 seconds to prevent memory leak)
            recentNotifications.add(notification.id);
            window.__recentNotifications = recentNotifications;
            setTimeout(() => {
                recentNotifications.delete(notification.id);
            }, 5000);

            // Show toast notification
            // Use a unique key to prevent duplicate toasts from sonner
            toast.success(notification.title, {
                description: notification.message,
                duration: 5000,
                id: `notification-${notification.id}`, // Unique ID prevents duplicate toasts
            });
        };

        // Add event listener for real-time notifications
        window.addEventListener('new_notification', handleNewNotification);

        // Cleanup event listener
        return () => {
            window.removeEventListener('new_notification', handleNewNotification);
        };
    }, [session?.user?.id]);

    return null; // This component doesn't render anything
}
