// Custom service worker with push notification support
// This file is used as the source for next-pwa to generate the final service worker
// Version: 2.0 - Enhanced push notification handling

import { precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { RangeRequestsPlugin } from 'workbox-range-requests';

// Log service worker version on install
console.log('[SW] Service Worker v2.0 loaded - Enhanced push notifications');

// Precache files (workbox will inject the manifest)
precacheAndRoute(self.__WB_MANIFEST);

// Take control of clients immediately
clientsClaim();

// Service worker install event
self.addEventListener('install', (event) => {
    console.log('[SW] Service worker installing');
    // Force the waiting service worker to become the active service worker
    self.skipWaiting();
});

// Service worker activate event - ensure it stays active for push notifications
self.addEventListener('activate', (event) => {
    console.log('[SW] Service worker activated at:', new Date().toISOString());
    // Take control of all clients immediately
    event.waitUntil(
        self.clients.claim().then(() => {
            console.log('[SW] Service worker claimed all clients');
            return self.clients.matchAll().then(clients => {
                console.log('[SW] Active clients:', clients.length);
            });
        })
    );
});

// Runtime caching routes (matching next.config.mjs configuration)
// Google Fonts
registerRoute(
    /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
    new CacheFirst({
        cacheName: 'google-fonts-cache',
        plugins: [
            new ExpirationPlugin({
                maxEntries: 4,
                maxAgeSeconds: 365 * 24 * 60 * 60 // 365 days
            })
        ]
    })
);

// Font files
registerRoute(
    /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
    new StaleWhileRevalidate({
        cacheName: 'static-font-assets',
        plugins: [
            new ExpirationPlugin({
                maxEntries: 4,
                maxAgeSeconds: 7 * 24 * 60 * 60 // 7 days
            })
        ]
    })
);

// Images
registerRoute(
    /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
    new StaleWhileRevalidate({
        cacheName: 'static-image-assets',
        plugins: [
            new ExpirationPlugin({
                maxEntries: 64,
                maxAgeSeconds: 24 * 60 * 60 // 24 hours
            })
        ]
    })
);

// Next.js images
registerRoute(
    /\/_next\/image\?url=.+$/i,
    new StaleWhileRevalidate({
        cacheName: 'next-image',
        plugins: [
            new ExpirationPlugin({
                maxEntries: 64,
                maxAgeSeconds: 24 * 60 * 60 // 24 hours
            })
        ]
    })
);

// Audio files
registerRoute(
    /\.(?:mp3|wav|ogg)$/i,
    new CacheFirst({
        cacheName: 'static-audio-assets',
        plugins: [
            new RangeRequestsPlugin(),
            new ExpirationPlugin({
                maxEntries: 32,
                maxAgeSeconds: 24 * 60 * 60 // 24 hours
            })
        ]
    })
);

// Video files
registerRoute(
    /\.(?:mp4)$/i,
    new CacheFirst({
        cacheName: 'static-video-assets',
        plugins: [
            new RangeRequestsPlugin(),
            new ExpirationPlugin({
                maxEntries: 32,
                maxAgeSeconds: 24 * 60 * 60 // 24 hours
            })
        ]
    })
);

// JS files
registerRoute(
    /\.(?:js)$/i,
    new StaleWhileRevalidate({
        cacheName: 'static-js-assets',
        plugins: [
            new ExpirationPlugin({
                maxEntries: 32,
                maxAgeSeconds: 24 * 60 * 60 // 24 hours
            })
        ]
    })
);

// CSS files
registerRoute(
    /\.(?:css|less)$/i,
    new StaleWhileRevalidate({
        cacheName: 'static-style-assets',
        plugins: [
            new ExpirationPlugin({
                maxEntries: 32,
                maxAgeSeconds: 24 * 60 * 60 // 24 hours
            })
        ]
    })
);

// Next.js static JS
registerRoute(
    /\/_next\/static.+\.js$/i,
    new CacheFirst({
        cacheName: 'next-static-js-assets',
        plugins: [
            new ExpirationPlugin({
                maxEntries: 64,
                maxAgeSeconds: 24 * 60 * 60 * 365 // 365 days
            })
        ]
    })
);

// API routes
registerRoute(
    ({ url }) => url.pathname.startsWith('/api/'),
    new NetworkFirst({
        cacheName: 'apis',
        plugins: [
            new ExpirationPlugin({
                maxEntries: 16,
                maxAgeSeconds: 24 * 60 * 60 // 24 hours
            })
        ],
        networkTimeoutSeconds: 10
    }),
    'GET'
);

// All other routes
registerRoute(
    ({ request }) => request.mode === 'navigate',
    new NetworkFirst({
        cacheName: 'others',
        plugins: [
            new ExpirationPlugin({
                maxEntries: 32,
                maxAgeSeconds: 24 * 60 * 60 // 24 hours
            })
        ],
        networkTimeoutSeconds: 10
    })
);

// Push notification handler
self.addEventListener('push', (event) => {
    // Wrap everything in try-catch to ensure notification is always shown
    try {
        console.log('[SW] ===== Push event received =====');
        console.log('[SW] Time:', new Date().toISOString());
        console.log('[SW] Has data:', !!event.data);

        // Default notification data - will be overridden if push data exists
        let notificationData = {
            title: 'New Notification',
            body: 'You have a new notification',
            icon: '/assets/icons/icon-192x192.svg',
            badge: '/assets/icons/icon-96x96.svg',
            tag: 'default',
            data: {},
            priority: 'normal'
        };

        // Try to extract data from push event
        if (event.data) {
            try {
                // Method 1: Try json() first (most common)
                const pushPayload = event.data.json();
                console.log('[SW] Push data (JSON):', JSON.stringify(pushPayload));

                // Extract notification data from payload
                notificationData = {
                    title: pushPayload.title || notificationData.title,
                    body: pushPayload.body || notificationData.body,
                    icon: pushPayload.icon || notificationData.icon,
                    badge: pushPayload.badge || notificationData.badge,
                    tag: pushPayload.tag || notificationData.tag,
                    data: pushPayload.data || {},
                    sound: pushPayload.sound || 'default',
                    requireInteraction: pushPayload.requireInteraction || false,
                    timestamp: pushPayload.timestamp || Date.now(),
                    priority: pushPayload.data?.priority || pushPayload.priority || 'normal'
                };

                console.log('[SW] ✅ Extracted notification:', {
                    title: notificationData.title,
                    body: notificationData.body.substring(0, 50),
                    type: notificationData.data?.type
                });
            } catch (jsonError) {
                console.log('[SW] ⚠️ JSON parse failed, trying text:', jsonError);

                // Method 2: Try text() and parse as JSON
                try {
                    const dataText = event.data.text();
                    console.log('[SW] Push data (text):', dataText);

                    const textPayload = JSON.parse(dataText);
                    notificationData = {
                        title: textPayload.title || notificationData.title,
                        body: textPayload.body || dataText,
                        icon: textPayload.icon || notificationData.icon,
                        badge: textPayload.badge || notificationData.badge,
                        tag: textPayload.tag || notificationData.tag,
                        data: textPayload.data || {},
                        priority: textPayload.data?.priority || textPayload.priority || 'normal'
                    };
                    console.log('[SW] ✅ Parsed from text:', {
                        title: notificationData.title,
                        body: notificationData.body.substring(0, 50)
                    });
                } catch (textError) {
                    // Method 3: Use text as body
                    console.log('[SW] ⚠️ Text parse failed, using raw text:', textError);
                    try {
                        notificationData.body = event.data.text();
                    } catch (e) {
                        console.error('[SW] ❌ Could not extract any data from push event');
                    }
                }
            }
        } else {
            console.log('[SW] ⚠️ No data in push event - using defaults');
        }

        // Customize vibration pattern based on priority
        let vibratePattern = [200, 100, 200]; // Default: short-short-long

        const priority = notificationData.priority || notificationData.data?.priority || 'normal';
        if (priority === 'urgent') {
            vibratePattern = [300, 100, 300, 100, 300]; // Longer pattern for urgent notifications
        } else if (priority === 'high') {
            vibratePattern = [200, 100, 200, 100, 200]; // Medium pattern for high priority
        } else if (priority === 'low') {
            vibratePattern = [100, 50, 100]; // Shorter pattern for low priority
        }

        // Ensure we have valid title and body
        const notificationTitle = notificationData.title || 'New Notification';
        const notificationBody = notificationData.body || 'You have a new notification';

        const notificationOptions = {
            body: notificationBody,
            icon: notificationData.icon || '/assets/icons/icon-192x192.svg',
            badge: notificationData.badge || '/assets/icons/icon-96x96.svg',
            sound: notificationData.sound || 'default', // Use system default sound (or custom if provided)
            tag: notificationData.tag || `notification-${Date.now()}`,
            data: notificationData.data || {},
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
        };

        console.log('[SW] 📢 Showing notification:');
        console.log('[SW]   Title:', notificationTitle);
        console.log('[SW]   Body:', notificationBody);
        console.log('[SW]   Type:', notificationData.data?.type || 'unknown');

        // CRITICAL: Always show notification, even if there's an error
        // This prevents the default "This site has been updated" message
        const showNotificationPromise = self.registration.showNotification(notificationTitle, notificationOptions)
            .then(() => {
                console.log('[SW] ✅ Notification displayed successfully');
            })
            .catch((error) => {
                console.error('[SW] ❌ Error showing notification:', error);
                // Try to show a basic notification as fallback
                return self.registration.showNotification(notificationTitle, {
                    body: notificationBody,
                    icon: '/assets/icons/icon-192x192.svg',
                    badge: '/assets/icons/icon-96x96.svg',
                    tag: notificationData.tag || 'fallback',
                    data: notificationData.data || {}
                }).catch((fallbackError) => {
                    console.error('[SW] ❌ Fallback notification also failed:', fallbackError);
                });
            });

        // CRITICAL: Use waitUntil to keep service worker alive
        event.waitUntil(showNotificationPromise);
    } catch (error) {
        // Ultimate fallback: show a basic notification if everything fails
        console.error('[SW] ❌ CRITICAL ERROR in push handler:', error);
        event.waitUntil(
            self.registration.showNotification('New Notification', {
                body: 'You have a new notification',
                icon: '/assets/icons/icon-192x192.svg',
                badge: '/assets/icons/icon-96x96.svg',
                tag: 'error-fallback',
                data: { error: true }
            }).catch((fallbackError) => {
                console.error('[SW] ❌ Even fallback notification failed:', fallbackError);
            })
        );
    }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked at:', new Date().toISOString());
    console.log('[SW] Notification action:', event.action);
    console.log('[SW] Notification data:', event.notification.data);

    event.notification.close();

    const notificationData = event.notification.data || {};
    const urlToOpen = notificationData.url || '/client/dashboard';
    console.log('[SW] Opening URL:', urlToOpen);

    if (event.action === 'open' || !event.action) {
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true })
                .then((clientList) => {
                    console.log('[SW] Found clients:', clientList.length);
                    // Check if there's already a window open
                    for (let i = 0; i < clientList.length; i++) {
                        const client = clientList[i];
                        if (client.url === urlToOpen && 'focus' in client) {
                            console.log('[SW] Focusing existing window:', client.url);
                            return client.focus();
                        }
                    }
                    // If no window is open, open a new one
                    if (clients.openWindow) {
                        console.log('[SW] Opening new window:', urlToOpen);
                        return clients.openWindow(urlToOpen);
                    }
                })
                .catch((error) => {
                    console.error('[SW] Error handling notification click:', error);
                })
        );
    }
});
