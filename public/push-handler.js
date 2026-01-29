// Push notification handler for service worker
// This file should be imported in your service worker

self.addEventListener('push', (event) => {
    console.log('Push notification received:', event);

    let notificationData = {
        title: 'New Notification',
        body: 'You have a new notification',
        icon: '/assets/icons/icon-192x192.svg',
        badge: '/assets/icons/icon-96x96.svg',
        tag: 'default',
        data: {}
    };

    if (event.data) {
        try {
            notificationData = event.data.json();
        } catch (e) {
            notificationData.body = event.data.text();
        }
    }

    // Customize vibration pattern based on priority
    let vibratePattern = [200, 100, 200]; // Default: short-short-long

    const priority = notificationData.data?.priority || notificationData.priority || 'normal';
    if (priority === 'urgent') {
        vibratePattern = [300, 100, 300, 100, 300]; // Longer pattern for urgent notifications
    } else if (priority === 'high') {
        vibratePattern = [200, 100, 200, 100, 200]; // Medium pattern for high priority
    } else if (priority === 'low') {
        vibratePattern = [100, 50, 100]; // Shorter pattern for low priority
    }

    const promiseChain = self.registration.showNotification(notificationData.title, {
        body: notificationData.body,
        icon: notificationData.icon || '/assets/icons/icon-192x192.svg',
        badge: notificationData.badge || '/assets/icons/icon-96x96.svg',
        sound: notificationData.sound || 'default', // Use system default sound (or custom if provided)
        tag: notificationData.tag,
        data: notificationData.data,
        requireInteraction: notificationData.requireInteraction || false,
        timestamp: notificationData.timestamp || Date.now(),
        vibrate: vibratePattern, // Dynamic vibration based on priority
        actions: [
            {
                action: 'open',
                title: 'Open'
            },
            {
                action: 'close',
                title: 'Close'
            }
        ]
    });

    event.waitUntil(promiseChain);
});

self.addEventListener('notificationclick', (event) => {
    console.log('Notification clicked:', event);

    event.notification.close();

    const notificationData = event.notification.data || {};
    const urlToOpen = notificationData.url || '/client/dashboard';

    if (event.action === 'open' || !event.action) {
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true })
                .then((clientList) => {
                    // Check if there's already a window open
                    for (let i = 0; i < clientList.length; i++) {
                        const client = clientList[i];
                        if (client.url === urlToOpen && 'focus' in client) {
                            return client.focus();
                        }
                    }
                    // If no window is open, open a new one
                    if (clients.openWindow) {
                        return clients.openWindow(urlToOpen);
                    }
                })
        );
    }
});
