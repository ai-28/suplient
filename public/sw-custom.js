// Custom service worker with push notification support
// This file is used as the source for next-pwa to generate the final service worker
// Version: 2.1 - Fixed push notification content display
const SW_VERSION = '2.1';
console.log(`[SW] Service Worker v${SW_VERSION} loaded - Push notifications enabled`);

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

// Push notification handler - ULTRA SIMPLIFIED VERSION
// This MUST be registered to prevent default browser message
self.addEventListener('push', (event) => {
    console.log('[SW] ========================================');
    console.log('[SW] PUSH EVENT RECEIVED - Service Worker v' + SW_VERSION);
    console.log('[SW] ========================================');
    console.log('[SW] Time:', new Date().toISOString());
    console.log('[SW] Event has data:', !!event.data);

    // Default values
    let title = 'New Notification';
    let body = 'You have a new notification';
    let icon = '/assets/icons/icon-192x192.svg';
    let badge = '/assets/icons/icon-96x96.svg';
    let tag = 'notification-' + Date.now();
    let data = {};
    let vibratePattern = [200, 100, 200];

    // Parse push data - try multiple methods
    if (event.data) {
        try {
            // Method 1: Direct JSON
            const payload = event.data.json();
            console.log('[SW] ✅ Parsed JSON payload:', JSON.stringify(payload));

            if (payload && typeof payload === 'object') {
                title = payload.title || title;
                body = payload.body || payload.message || body;
                icon = payload.icon || icon;
                badge = payload.badge || badge;
                tag = payload.tag || tag;
                data = payload.data || {};

                const priority = payload.data?.priority || payload.priority || 'normal';
                if (priority === 'urgent') vibratePattern = [300, 100, 300, 100, 300];
                else if (priority === 'high') vibratePattern = [200, 100, 200, 100, 200];
                else if (priority === 'low') vibratePattern = [100, 50, 100];
            }
        } catch (jsonError) {
            console.log('[SW] ⚠️ JSON parse error:', jsonError.message);
            try {
                // Method 2: Text then parse
                const textData = event.data.text();
                console.log('[SW] Raw text data:', textData.substring(0, 200));
                const parsed = JSON.parse(textData);
                if (parsed && typeof parsed === 'object') {
                    title = parsed.title || title;
                    body = parsed.body || parsed.message || textData;
                    data = parsed.data || {};
                } else {
                    body = textData;
                }
            } catch (textError) {
                console.log('[SW] ⚠️ Text parse error:', textError.message);
                try {
                    body = event.data.text() || body;
                } catch (e) {
                    console.error('[SW] ❌ Could not extract any data');
                }
            }
        }
    } else {
        console.log('[SW] ⚠️ No data in push event');
    }

    console.log('[SW] Final notification values:');
    console.log('[SW]   Title:', title);
    console.log('[SW]   Body:', body.substring(0, 100));

    // CRITICAL: Always show notification to prevent default browser message
    const showNotif = () => {
        return self.registration.showNotification(title, {
            body: body,
            icon: icon,
            badge: badge,
            tag: tag,
            data: data,
            vibrate: vibratePattern,
            timestamp: Date.now(),
            requireInteraction: false,
            actions: [
                { action: 'open', title: 'Open' },
                { action: 'close', title: 'Close' }
            ]
        });
    };

    // Show notification with error handling
    const notificationPromise = showNotif()
        .then(() => {
            console.log('[SW] ✅ Notification displayed:', title);
        })
        .catch((error) => {
            console.error('[SW] ❌ Error showing notification:', error);
            // Try absolute minimal notification
            return self.registration.showNotification(title, {
                body: body,
                icon: icon
            }).catch((fallbackError) => {
                console.error('[SW] ❌ Fallback also failed:', fallbackError);
            });
        });

    // CRITICAL: Use waitUntil - this keeps service worker alive
    event.waitUntil(notificationPromise);
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
