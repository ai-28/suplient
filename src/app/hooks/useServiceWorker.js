"use client";

import { useEffect } from 'react';

export function useServiceWorker() {
    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            // next-pwa handles service worker registration automatically
            // We just need to wait for it to be ready and listen for messages/updates

            navigator.serviceWorker.ready
                .then((registration) => {
                    console.log('Service Worker is ready:', registration);

                    // Check for updates
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        if (newWorker) {
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    console.log('New content available, please refresh');
                                    // You can show a toast notification here
                                }
                            });
                        }
                    });
                })
                .catch((error) => {
                    // In development, service worker might not be available (PWA disabled)
                    if (process.env.NODE_ENV === 'development') {
                        console.log('Service Worker not available in development (PWA disabled)');
                    } else {
                        console.log('Service Worker not ready:', error);
                    }
                });

            // Listen for service worker messages
            navigator.serviceWorker.addEventListener('message', (event) => {
                console.log('📨 ========================================');
                console.log('📨 MESSAGE FROM SERVICE WORKER');
                console.log('📨 ========================================');
                console.log('📨 Type:', event.data.type);
                console.log('📨 Data:', event.data);
                console.log('📨 ========================================');

                if (event.data.type === 'PUSH_RECEIVED') {
                    console.log('✅✅✅ PUSH EVENT RECEIVED BY SERVICE WORKER! ✅✅✅');
                    console.log('✅ Timestamp:', event.data.timestamp);
                    console.log('✅ Has Data:', event.data.hasData);
                }

                if (event.data.type === 'NOTIFICATION_SHOWN') {
                    console.log('✅✅✅ NOTIFICATION DISPLAYED! ✅✅✅');
                    console.log('✅ Title:', event.data.title);
                    console.log('✅ Body:', event.data.body);
                }
            });
        }
    }, []);
}
