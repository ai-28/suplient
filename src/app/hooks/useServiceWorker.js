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

        const registerServiceWorker = async () => {
            try {
                // Double-check document state before accessing service worker
                if (!isMounted || document.readyState === 'unloading' || document.readyState === 'closed') {
                    return;
                }

                // Check if service worker is already registered
                const existingRegistrations = await navigator.serviceWorker.getRegistrations();

                // Unregister any redundant service workers first
                for (const reg of existingRegistrations) {
                    if (reg.active?.state === 'redundant' || reg.waiting?.state === 'redundant') {
                        console.log('🗑️ Unregistering redundant service worker:', reg.scope);
                        try {
                            await reg.unregister();
                            console.log('✅ Redundant service worker unregistered');
                        } catch (err) {
                            console.warn('⚠️ Error unregistering redundant SW:', err);
                        }
                    }
                }

                // Find active service worker registration
                const existingRegistration = existingRegistrations.find(
                    reg => (reg.active?.scriptURL?.includes('/sw.js') && reg.active?.state !== 'redundant') ||
                        (reg.waiting?.scriptURL?.includes('/sw.js') && reg.waiting?.state !== 'redundant') ||
                        (reg.installing?.scriptURL?.includes('/sw.js') && reg.installing?.state !== 'redundant')
                );

                if (existingRegistration) {
                    console.log('✅ Service Worker already registered:', existingRegistration);
                    console.log('Active state:', existingRegistration.active?.state);
                    console.log('Waiting state:', existingRegistration.waiting?.state);
                    console.log('Installing state:', existingRegistration.installing?.state);

                    // If there's a waiting worker, skip waiting to activate it
                    if (existingRegistration.waiting) {
                        console.log('⏳ Waiting service worker found, it will activate automatically');
                        existingRegistration.waiting.addEventListener('statechange', () => {
                            if (existingRegistration.waiting?.state === 'activated') {
                                console.log('✅ Waiting service worker activated!');
                            }
                        });
                    }

                    // Wait for it to be ready
                    try {
                        const registration = await navigator.serviceWorker.ready;
                        if (!isMounted) return;
                        setupServiceWorkerListeners(registration);
                        return;
                    } catch (err) {
                        console.warn('⚠️ Service worker not ready, will register new one:', err);
                        // Continue to register a new one
                    }
                }

                // Register service worker if not already registered
                console.log('📝 Registering service worker...');
                const registration = await navigator.serviceWorker.register('/sw.js', {
                    scope: '/'
                });

                if (!isMounted) return;

                console.log('✅ Service Worker registered successfully!');
                console.log('Registration:', registration);
                console.log('State:', registration.installing?.state || registration.waiting?.state || registration.active?.state);

                // Wait for service worker to be ready
                const readyRegistration = await navigator.serviceWorker.ready;
                if (!isMounted) return;

                setupServiceWorkerListeners(readyRegistration);

                // Listen for installation state changes
                if (registration.installing) {
                    registration.installing.addEventListener('statechange', () => {
                        if (!isMounted) return;
                        console.log('Service Worker state changed to:', registration.installing.state);
                    });
                }
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
                    console.error('Error registering service worker:', error);
                }
            }
        };

        const setupServiceWorkerListeners = (registration) => {
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
        };

        registerServiceWorker();

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

            if (event.data.type === 'SW_ACTIVATED') {
                console.log('✅✅✅ SERVICE WORKER ACTIVATED! ✅✅✅');
                console.log('✅ Timestamp:', event.data.timestamp);
            }
        };

        navigator.serviceWorker.addEventListener('message', handleMessage);

        return () => {
            isMounted = false;
            navigator.serviceWorker.removeEventListener('message', handleMessage);
        };
    }, []);
}
