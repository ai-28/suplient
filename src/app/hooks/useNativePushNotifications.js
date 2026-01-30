"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { isNative, getPlatform } from '@/lib/capacitor';
import { toast } from 'sonner';

/**
 * Hook for managing native push notifications (FCM/APNs via Capacitor)
 * Only works on native iOS/Android apps, not web
 */
export function useNativePushNotifications() {
    const { data: session } = useSession();
    const [isRegistered, setIsRegistered] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [token, setToken] = useState(null);

    useEffect(() => {
        // Only for native platforms
        if (!isNative() || !session?.user) {
            setIsSupported(false);
            return;
        }

        // Check if Capacitor Push Notifications plugin is available
        if (typeof window !== 'undefined' && window.Capacitor) {
            setIsSupported(true);
            registerForPush();
        }
    }, [session]);

    const registerForPush = useCallback(async () => {
        if (!isNative() || !session?.user || !isSupported) return;

        try {
            // Dynamic import to prevent errors on web
            const { PushNotifications } = await import('@capacitor/push-notifications');

            // Request permission
            let permStatus = await PushNotifications.checkPermissions();
            if (permStatus.receive !== 'granted') {
                permStatus = await PushNotifications.requestPermissions();
            }

            if (permStatus.receive !== 'granted') {
                console.log('[Native Push] Permission denied');
                return;
            }

            // Register with FCM/APNs
            await PushNotifications.register();

            // Listen for registration token
            PushNotifications.addListener('registration', async (tokenData) => {
                console.log('[Native Push] Registration token received:', tokenData.value);
                setToken(tokenData.value);

                // Send token to server
                try {
                    const response = await fetch('/api/push/register-native', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            token: tokenData.value,
                            platform: getPlatform() // 'ios' or 'android'
                        })
                    });

                    if (response.ok) {
                        setIsRegistered(true);
                        console.log('[Native Push] Token registered successfully');
                    } else {
                        console.error('[Native Push] Failed to register token');
                    }
                } catch (error) {
                    console.error('[Native Push] Error registering token:', error);
                }
            });

            // Listen for registration errors
            PushNotifications.addListener('registrationError', (error) => {
                console.error('[Native Push] Registration error:', error);
                toast.error('Failed to register for push notifications');
            });

            // Listen for push notifications received
            PushNotifications.addListener('pushNotificationReceived', (notification) => {
                console.log('[Native Push] Push notification received:', notification);
                // Notification is automatically displayed by the OS
            });

            // Listen for notification actions
            PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
                console.log('[Native Push] Push notification action:', action);
                // Handle notification tap/action
            });
        } catch (error) {
            console.error('[Native Push] Error registering for push:', error);
            setIsSupported(false);
        }
    }, [session, isSupported]);

    const unregister = useCallback(async () => {
        if (!isNative() || !token) return false;

        setIsLoading(true);

        try {
            const { PushNotifications } = await import('@capacitor/push-notifications');
            
            // Remove from server
            await fetch('/api/push/unregister-native', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: token,
                    platform: getPlatform()
                })
            });

            setIsRegistered(false);
            setToken(null);
            toast.success('Push notifications disabled');
            setIsLoading(false);
            return true;
        } catch (error) {
            console.error('[Native Push] Error unregistering:', error);
            toast.error('Failed to disable push notifications');
            setIsLoading(false);
            return false;
        }
    }, [token]);

    return {
        isSupported,
        isRegistered,
        isLoading,
        token,
        unregister
    };
}
