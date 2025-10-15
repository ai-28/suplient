// Simple service worker to prevent 404 errors
// This is a minimal service worker that doesn't cache anything
// but prevents the 404 error from appearing in logs

self.addEventListener('install', (event) => {
    console.log('Service Worker installed');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker activated');
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Let all requests pass through without caching
    return;
});
