"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { isNative } from '@/lib/capacitor';
import { toast } from 'sonner';

/**
 * Helper function to convert VAPID key from URL-safe base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

/**
 * Helper function to convert ArrayBuffer to base64
 */
function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

/**
 * Hook for managing web push notifications (Web Push API)
 * Only works on web platform, not native apps
 */
export function useWebPushNotifications() {
    const { data: session } = useSession();
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        let isMounted = true;

        // Only for web, not native
        if (isNative()) {
            setIsSupported(false);
            setIsSubscribed(false);
            return;
        }

        // Check if browser supports push notifications
        const supported = 'serviceWorker' in navigator && 'PushManager' in window;
        setIsSupported(supported);

        if (!supported) {
            setIsSubscribed(false);
            return;
        }

        if (!session?.user) {
            setIsSubscribed(false);
            return;
        }

        // Wait for service worker to be ready, then check subscription
        const checkAfterReady = async () => {
            try {
                // Check if document is in valid state
                if (document.readyState === 'unloading' || document.readyState === 'closed') {
                    return;
                }

                // Wait for service worker to be ready
                const registration = await navigator.serviceWorker.ready;

                if (!isMounted) return;

                // Small delay to ensure everything is initialized
                await new Promise(resolve => setTimeout(resolve, 200));

                if (!isMounted) return;

                // Get subscription from push manager
                const subscription = await registration.pushManager.getSubscription();

                if (!isMounted) return;

                if (subscription) {
                    console.log('[Web Push] ✅ Subscription found on page load:', subscription.endpoint.substring(0, 50) + '...');
                    setIsSubscribed(true);
                } else {
                    console.log('[Web Push] ⚠️ No subscription found on page load');
                    setIsSubscribed(false);
                }
            } catch (error) {
                if (!isMounted) return;

                // Handle InvalidStateError (page unloading)
                if (error.name === 'InvalidStateError') {
                    console.log('[Web Push] Service worker access blocked (page unloading)');
                    return;
                }
                console.error('[Web Push] Error checking subscription on page load:', error);
                setIsSubscribed(false);
            }
        };

        checkAfterReady();

        return () => {
            isMounted = false;
        };
    }, [session]);

    const checkSubscription = useCallback(async () => {
        // Check native first
        if (isNative() || !session?.user) {
            setIsSubscribed(false);
            return;
        }

        // Check if browser supports push notifications
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            setIsSubscribed(false);
            return;
        }

        // Check if document is in valid state
        if (document.readyState === 'unloading' || document.readyState === 'closed') {
            return;
        }

        try {
            // Wait for service worker to be ready
            const registration = await navigator.serviceWorker.ready;

            // Get subscription from push manager
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                console.log('[Web Push] Subscription found:', subscription.endpoint.substring(0, 50) + '...');
                setIsSubscribed(true);
            } else {
                console.log('[Web Push] No subscription found');
                setIsSubscribed(false);
            }
        } catch (error) {
            // Handle InvalidStateError (page unloading)
            if (error.name === 'InvalidStateError') {
                console.log('[Web Push] Service worker access blocked (page unloading)');
                return; // Page is unloading, ignore
            }
            console.error('[Web Push] Error checking push subscription:', error);
            setIsSubscribed(false);
        }
    }, [session]); // Removed isSupported from dependencies to avoid stale closure

    const requestPermission = useCallback(async () => {
        if (!isSupported || isNative()) return false;

        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }, [isSupported]);

    const subscribe = useCallback(async () => {
        if (!isSupported || isNative() || !session?.user) {
            return false;
        }

        setIsLoading(true);

        try {
            // Check if document is in valid state
            if (document.readyState === 'unloading' || document.readyState === 'closed') {
                setIsLoading(false);
                return false;
            }

            // Request permission first
            const hasPermission = await requestPermission();
            if (!hasPermission) {
                toast.error('Notification permission denied');
                setIsLoading(false);
                return false;
            }

            // Get VAPID public key
            const response = await fetch('/api/push/vapid-public-key');
            if (!response.ok) {
                throw new Error('Failed to get VAPID public key');
            }

            const { publicKey } = await response.json();
            if (!publicKey) {
                throw new Error('VAPID public key not available');
            }

            // Check document state again before accessing service worker
            if (document.readyState === 'unloading' || document.readyState === 'closed') {
                setIsLoading(false);
                return false;
            }

            // Get service worker registration
            const registration = await navigator.serviceWorker.ready;
            console.log('[Web Push] Service worker ready:', registration.active?.state);

            // Check if already subscribed
            const existingSubscription = await registration.pushManager.getSubscription();
            if (existingSubscription) {
                console.log('[Web Push] Already subscribed, using existing subscription');
                // Still send to server to update
            }

            // Subscribe to push
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey)
            });

            console.log('[Web Push] Push subscription created:', {
                endpoint: subscription.endpoint.substring(0, 50) + '...',
                hasKeys: !!subscription.getKey('p256dh')
            });

            // Send subscription to server
            const subscribeResponse = await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    endpoint: subscription.endpoint,
                    keys: {
                        p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
                        auth: arrayBufferToBase64(subscription.getKey('auth'))
                    },
                    platform: 'web'
                })
            });

            if (!subscribeResponse.ok) {
                throw new Error('Failed to save subscription');
            }

            setIsSubscribed(true);
            toast.success('Push notifications enabled!');
            setIsLoading(false);
            return true;
        } catch (error) {
            // Handle InvalidStateError (page unloading)
            if (error.name === 'InvalidStateError') {
                setIsLoading(false);
                return false; // Page is unloading, ignore
            }
            console.error('Error subscribing to push notifications:', error);
            toast.error('Failed to enable push notifications');
            setIsLoading(false);
            return false;
        }
    }, [isSupported, session, requestPermission]);

    const unsubscribe = useCallback(async () => {
        if (!isSupported || isNative() || !session?.user) {
            return false;
        }

        setIsLoading(true);

        try {
            // Check if document is in valid state
            if (document.readyState === 'unloading' || document.readyState === 'closed') {
                setIsLoading(false);
                return false;
            }

            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                await subscription.unsubscribe();

                // Remove from server
                await fetch('/api/push/unsubscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        endpoint: subscription.endpoint
                    })
                });

                setIsSubscribed(false);
                toast.success('Push notifications disabled');
                setIsLoading(false);
                return true;
            }

            setIsLoading(false);
            return false;
        } catch (error) {
            // Handle InvalidStateError (page unloading)
            if (error.name === 'InvalidStateError') {
                setIsLoading(false);
                return false; // Page is unloading, ignore
            }
            console.error('Error unsubscribing from push notifications:', error);
            toast.error('Failed to disable push notifications');
            setIsLoading(false);
            return false;
        }
    }, [isSupported, session]);

    return {
        isSupported,
        isSubscribed,
        isLoading,
        subscribe,
        unsubscribe
    };
}
