// Minimal service worker for PWA functionality
// This enables PWA installation and offline support
// NO push notifications - removed as per requirements

import { precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { RangeRequestsPlugin } from 'workbox-range-requests';

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

// Service worker activate event
self.addEventListener('activate', (event) => {
    console.log('[SW] Service worker activated');
    // Take control of all clients immediately
    event.waitUntil(
        self.clients.claim().then(() => {
            console.log('[SW] Service worker claimed all clients');
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

// Note: Push notification handlers removed - no push notifications in this service worker
