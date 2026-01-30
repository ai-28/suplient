"use client";

import { useEffect } from 'react';

export function useServiceWorker() {
    useEffect(() => {
        if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
            return;
        }

        // Check if document is in valid state
        if (document.readyState === 'unloading' || document.readyState === 'closed') {
            return;
        }

        let isMounted = true;

        const initServiceWorker = async () => {
            try {
                // Double-check document state before accessing service worker
                if (!isMounted || document.readyState === 'unloading' || document.readyState === 'closed') {
                    return;
                }

                const registration = await navigator.serviceWorker.ready;

                if (!isMounted) return;

                console.log('Service Worker is ready:', registration);

                // Check for updates
                registration.addEventListener('updatefound', () => {
                    if (!isMounted) return;
                    const newWorker = registration.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (!isMounted) return;
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                console.log('New content available, please refresh');
                                // You can show a toast notification here
                            }
                        });
                    }
                });
            } catch (error) {
                // Handle InvalidStateError (page unloading)
                if (error.name === 'InvalidStateError') {
                    console.log('Service Worker access blocked (page unloading)');
                    return;
                }
                // In development, service worker might not be available (PWA disabled)
                if (process.env.NODE_ENV === 'development') {
                    console.log('Service Worker not available in development (PWA disabled)');
                } else {
                    console.log('Service Worker not ready:', error);
                }
            }
        };

        initServiceWorker();

        // Listen for service worker messages
        const handleMessage = (event) => {
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
        };

        navigator.serviceWorker.addEventListener('message', handleMessage);

        return () => {
            isMounted = false;
            navigator.serviceWorker.removeEventListener('message', handleMessage);
        };
    }, []);
}
