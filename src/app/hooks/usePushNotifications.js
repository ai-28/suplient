"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

/**
 * Hook for managing web push notifications
 */
export function usePushNotifications() {
    const { data: session } = useSession();
    const [isSupported, setIsSupported] = useState(false);
    const [permission, setPermission] = useState('default');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [subscription, setSubscription] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true);
            checkPermission();
            checkSubscription();
        }
    }, [session]);

    const checkPermission = async () => {
        if ('Notification' in window) {
            setPermission(Notification.permission);
        }
    };

    const checkSubscription = useCallback(async () => {
        if (!isSupported || !session?.user?.id) return;

        try {
            const registration = await navigator.serviceWorker.ready;
            const sub = await registration.pushManager.getSubscription();
            setSubscription(sub);
            setIsSubscribed(!!sub);
        } catch (error) {
            console.error('Error checking subscription:', error);
        }
    }, [isSupported, session?.user?.id]);

    const requestPermission = useCallback(async () => {
        if (!isSupported) {
            toast.error('Push notifications are not supported in this browser');
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        const permission = await Notification.requestPermission();
        setPermission(permission);

        if (permission === 'granted') {
            return true;
        } else if (permission === 'denied') {
            toast.error('Push notifications were denied. Please enable them in your browser settings.');
            return false;
        }

        return false;
    }, [isSupported]);

    const subscribe = useCallback(async () => {
        if (!isSupported || !session?.user?.id) {
            toast.error('Push notifications are not available');
            return false;
        }

        setIsLoading(true);

        try {
            // Request permission first
            const hasPermission = await requestPermission();
            if (!hasPermission) {
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

            // Get service worker registration
            const registration = await navigator.serviceWorker.ready;

            // Subscribe to push
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey)
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
                    }
                })
            });

            if (!subscribeResponse.ok) {
                throw new Error('Failed to save subscription');
            }

            setSubscription(subscription);
            setIsSubscribed(true);
            toast.success('Push notifications enabled!');
            setIsLoading(false);
            return true;
        } catch (error) {
            console.error('Error subscribing to push notifications:', error);
            toast.error('Failed to enable push notifications');
            setIsLoading(false);
            return false;
        }
    }, [isSupported, session?.user?.id, requestPermission]);

    const unsubscribe = useCallback(async () => {
        if (!subscription) {
            return false;
        }

        setIsLoading(true);

        try {
            await subscription.unsubscribe();

            // Remove from server
            await fetch('/api/push/unsubscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ endpoint: subscription.endpoint })
            });

            setSubscription(null);
            setIsSubscribed(false);
            toast.success('Push notifications disabled');
            setIsLoading(false);
            return true;
        } catch (error) {
            console.error('Error unsubscribing:', error);
            toast.error('Failed to disable push notifications');
            setIsLoading(false);
            return false;
        }
    }, [subscription]);

    return {
        isSupported,
        permission,
        isSubscribed,
        isLoading,
        subscribe,
        unsubscribe,
        requestPermission
    };
}

/**
 * Convert VAPID public key from base64 URL to Uint8Array
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
 * Convert ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}
