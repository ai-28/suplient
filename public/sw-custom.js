// Service worker for PWA functionality with Web Push support
// This enables PWA installation, offline support, and push notifications

import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { RangeRequestsPlugin } from 'workbox-range-requests';

// Precache files
// next-pwa automatically injects self.__WB_MANIFEST AND precacheAndRoute during build
// We should NOT call precacheAndRoute manually - next-pwa handles it automatically
// Just reference self.__WB_MANIFEST once so next-pwa can inject it
// The precacheAndRoute call will be auto-injected by next-pwa
if (typeof self !== 'undefined') {
    // Reference self.__WB_MANIFEST so next-pwa can inject it
    // next-pwa will automatically add: precacheAndRoute(self.__WB_MANIFEST);
    const _manifest = self.__WB_MANIFEST;
}

// Service worker install event
// Note: next-pwa auto-injects precacheAndRoute which adds its own install listener
// Our install listener runs in addition to workbox's, so we can call skipWaiting
self.addEventListener('install', (event) => {
    console.log('[SW] ========================================');
    console.log('[SW] Service worker installing');
    console.log('[SW] Version: 2.0.0 - Push notifications enabled');
    console.log('[SW] Push event listener will be registered');
    console.log('[SW] ========================================');

    // CRITICAL: Skip waiting immediately to activate this service worker
    // This runs in parallel with workbox's precaching (which has its own install listener)
    event.waitUntil(
        Promise.resolve()
            .then(() => {
                console.log('[SW] Skipping waiting - activating immediately');
                return self.skipWaiting();
            })
            .then(() => {
                console.log('[SW] skipWaiting() completed - service worker will activate');
            })
            .catch(error => {
                console.error('[SW] Error during skipWaiting:', error);
                return Promise.resolve(); // Don't throw - allow activation
            })
    );
});

// Service worker activate event
self.addEventListener('activate', (event) => {
    console.log('[SW] ========================================');
    console.log('[SW] Service worker activated');
    console.log('[SW] Push notification handler is ready');
    console.log('[SW] ========================================');

    // Take control of all clients immediately and clean up old service workers
    event.waitUntil(
        Promise.all([
            // Claim all clients immediately
            self.clients.claim().then(() => {
                console.log('[SW] Service worker claimed all clients');
            }),
            // Clean up old caches (optional - keep for now)
            caches.keys().then(cacheNames => {
                console.log('[SW] Available caches:', cacheNames);
                // Keep all caches for now - you can add cleanup logic here if needed
                return Promise.resolve();
            })
        ]).then(() => {
            console.log('[SW] Service worker is now fully active');
            console.log('[SW] Ready to handle push notifications');

            // Notify all clients that service worker is active
            return self.clients.matchAll().then(clients => {
                clients.forEach(client => {
                    try {
                        client.postMessage({
                            type: 'SW_ACTIVATED',
                            timestamp: new Date().toISOString()
                        });
                    } catch (err) {
                        console.warn('[SW] Could not notify client:', err);
                    }
                });
            });
        }).catch(error => {
            console.error('[SW] Error during activate:', error);
            // Don't throw - allow activation to complete even if some steps fail
            return Promise.resolve();
        })
    );
});

// Runtime caching routes
// Cache Google Fonts
registerRoute(
    /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
    new NetworkFirst({
        cacheName: 'google-fonts-cache',
        plugins: [
            new ExpirationPlugin({
                maxEntries: 4,
                maxAgeSeconds: 365 * 24 * 60 * 60 // 1 year
            })
        ]
    })
);

// Cache static font files
registerRoute(
    /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
    new CacheFirst({
        cacheName: 'static-font-assets',
        plugins: [
            new ExpirationPlugin({
                maxEntries: 4,
                maxAgeSeconds: 7 * 24 * 60 * 60 // 7 days
            })
        ]
    })
);

// Cache images
registerRoute(
    /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
    new CacheFirst({
        cacheName: 'static-image-assets',
        plugins: [
            new ExpirationPlugin({
                maxEntries: 64,
                maxAgeSeconds: 24 * 60 * 60 // 1 day
            })
        ]
    })
);

// Cache Next.js images
registerRoute(
    /\/_next\/image\?url=.+$/i,
    new CacheFirst({
        cacheName: 'next-image',
        plugins: [
            new ExpirationPlugin({
                maxEntries: 64,
                maxAgeSeconds: 24 * 60 * 60 // 1 day
            })
        ]
    })
);

// Cache audio files
registerRoute(
    /\.(?:mp3|wav|ogg)$/i,
    new NetworkFirst({
        cacheName: 'static-audio-assets',
        plugins: [
            new RangeRequestsPlugin(),
            new ExpirationPlugin({
                maxEntries: 32,
                maxAgeSeconds: 24 * 60 * 60 // 1 day
            })
        ]
    })
);

// Cache video files
registerRoute(
    /\.(?:mp4)$/i,
    new NetworkFirst({
        cacheName: 'static-video-assets',
        plugins: [
            new RangeRequestsPlugin(),
            new ExpirationPlugin({
                maxEntries: 32,
                maxAgeSeconds: 24 * 60 * 60 // 1 day
            })
        ]
    })
);

// Cache JavaScript files
registerRoute(
    /\.(?:js)$/i,
    new CacheFirst({
        cacheName: 'static-js-assets',
        plugins: [
            new ExpirationPlugin({
                maxEntries: 32,
                maxAgeSeconds: 24 * 60 * 60 // 1 day
            })
        ]
    })
);

// Cache CSS files
registerRoute(
    /\.(?:css|less)$/i,
    new CacheFirst({
        cacheName: 'static-style-assets',
        plugins: [
            new ExpirationPlugin({
                maxEntries: 32,
                maxAgeSeconds: 24 * 60 * 60 // 1 day
            })
        ]
    })
);

// Cache Next.js static JS files
registerRoute(
    /\/_next\/static.+\.js$/i,
    new NetworkFirst({
        cacheName: 'next-static-js-assets',
        plugins: [
            new ExpirationPlugin({
                maxEntries: 64,
                maxAgeSeconds: 365 * 24 * 60 * 60 // 1 year
            })
        ]
    })
);

// Cache API requests with network-first strategy
registerRoute(
    ({ url }) => {
        return url.pathname.startsWith('/api/');
    },
    new NetworkFirst({
        cacheName: 'apis',
        plugins: [
            new ExpirationPlugin({
                maxEntries: 16,
                maxAgeSeconds: 24 * 60 * 60 // 1 day
            })
        ],
        networkTimeoutSeconds: 10
    }),
    'GET'
);

// Cache navigation requests
registerRoute(
    ({ request }) => {
        return request.mode === 'navigate';
    },
    new NetworkFirst({
        cacheName: 'others',
        plugins: [
            new ExpirationPlugin({
                maxEntries: 32,
                maxAgeSeconds: 24 * 60 * 60 // 1 day
            })
        ],
        networkTimeoutSeconds: 10
    })
);

// Push notification handler for web (Web Push API)
// This MUST be at the top level, not inside any function
console.log('[SW] ========================================');
console.log('[SW] Registering push event listener at service worker load...');
console.log('[SW] Push listener will fire when browser receives push from server');
console.log('[SW] ========================================');

self.addEventListener('push', (event) => {
    console.log('[SW] ========================================');
    console.log('[SW] PUSH EVENT RECEIVED - Web Push Notification');
    console.log('[SW] ========================================');
    console.log('[SW] Time:', new Date().toISOString());
    console.log('[SW] Event has data:', !!event.data);
    console.log('[SW] Event type:', event.type);
    console.log('[SW] Event:', event);

    // Notify all clients that push was received (this will show in main console)
    self.clients.matchAll().then(clients => {
        console.log('[SW] Notifying', clients.length, 'client(s) about push event');
        clients.forEach(client => {
            try {
                client.postMessage({
                    type: 'PUSH_RECEIVED',
                    timestamp: new Date().toISOString(),
                    hasData: !!event.data,
                    message: 'Push event received by service worker!'
                });
            } catch (err) {
                console.error('[SW] Error posting message to client:', err);
            }
        });
    }).catch(err => {
        console.error('[SW] Error notifying clients:', err);
    });

    // CRITICAL: Always call waitUntil to prevent default browser message
    const notificationPromise = (async () => {
        // Default values
        let title = 'New Notification';
        let body = 'You have a new notification';
        let icon = '/assets/Suplient-logo.png';
        let badge = '/assets/Suplient-logo.png';
        // Generate unique tag to allow multiple notifications
        let tag = 'notification-' + Date.now() + '-' + Math.random().toString(36).substring(7);
        let data = {};
        let vibratePattern = [200, 100, 200];

        // Parse push data
        if (event.data) {
            try {
                const payload = event.data.json();
                console.log('[SW] ✅ Parsed JSON payload:', JSON.stringify(payload));
                console.log('[SW] Payload type:', typeof payload);
                console.log('[SW] Payload keys:', payload ? Object.keys(payload) : 'null');

                if (payload && typeof payload === 'object') {
                    title = payload.title || title;
                    body = payload.body || payload.message || body;
                    console.log('[SW] Extracted title:', title);
                    console.log('[SW] Extracted body:', body);
                    icon = payload.icon || icon;
                    badge = payload.badge || badge;
                    // Use unique tag
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
                    const textData = event.data.text();
                    const parsed = JSON.parse(textData);
                    if (parsed && typeof parsed === 'object') {
                        title = parsed.title || title;
                        body = parsed.body || parsed.message || textData;
                        data = parsed.data || {};
                        tag = parsed.tag ? `${parsed.tag}-${Date.now()}` : tag;
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
            console.log('[SW] ⚠️ No data in push event - using defaults');
            // For DevTools test push, try to get text
            try {
                if (event.data && typeof event.data.text === 'function') {
                    const text = event.data.text();
                    if (text) {
                        body = text;
                        title = 'Test Notification';
                        console.log('[SW] Using text data as body:', text);
                    }
                }
            } catch (e) {
                console.log('[SW] Could not read text data:', e);
            }
        }

        console.log('[SW] Final notification values:');
        console.log('[SW]   Title:', title);
        console.log('[SW]   Body:', body.substring(0, 100));
        console.log('[SW]   Tag:', tag);

        // ALWAYS show notification - this prevents the default browser message
        try {
            await self.registration.showNotification(title, {
                body: body,
                icon: icon,
                badge: badge,
                tag: tag, // Unique tag ensures multiple notifications can show
                data: data,
                vibrate: vibratePattern,
                timestamp: Date.now(),
                requireInteraction: false,
                actions: [
                    { action: 'open', title: 'Open' },
                    { action: 'close', title: 'Close' }
                ]
            });
            console.log('[SW] ✅ Notification displayed:', title);

            // Notify all clients that notification was shown
            self.clients.matchAll().then(clients => {
                clients.forEach(client => {
                    client.postMessage({
                        type: 'NOTIFICATION_SHOWN',
                        title: title,
                        body: body,
                        timestamp: new Date().toISOString()
                    });
                });
            }).catch(err => {
                console.error('[SW] Error notifying clients:', err);
            });
        } catch (error) {
            console.error('[SW] ❌ Error showing notification:', error);
            console.error('[SW] Error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
            // Try minimal notification as last resort
            try {
                await self.registration.showNotification(title, {
                    body: body,
                    icon: icon,
                    tag: tag
                });
                console.log('[SW] ✅ Fallback notification displayed');
            } catch (fallbackError) {
                console.error('[SW] ❌ Fallback also failed:', fallbackError);
            }
        }
    })();

    // CRITICAL: Use waitUntil - this keeps service worker alive and prevents default message
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
