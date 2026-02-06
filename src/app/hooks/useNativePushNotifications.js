"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
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
    const listenersRef = useRef([]);
    const hasRegisteredRef = useRef(false);

    // Check support on mount
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Only for native platforms
        if (!isNative()) {
            setIsSupported(false);
            return;
        }

        // Check if Capacitor Push Notifications plugin is available
        if (window.Capacitor) {
            setIsSupported(true);
        }
    }, []);

    // Register for push when session is available
    useEffect(() => {
        if (!isSupported || !session?.user || hasRegisteredRef.current) return;
        hasRegisteredRef.current = true;

        let isMounted = true;

        const registerForPush = async () => {
            try {
                setIsLoading(true);

                // Dynamic import to prevent errors on web
                const { PushNotifications } = await import('@capacitor/push-notifications');

                // Request permission
                let permStatus = await PushNotifications.checkPermissions();
                if (permStatus.receive !== 'granted') {
                    permStatus = await PushNotifications.requestPermissions();
                }

                if (permStatus.receive !== 'granted') {
                    console.log('[Native Push] Permission denied');
                    setIsLoading(false);
                    return;
                }

                // Register with FCM/APNs
                await PushNotifications.register();

                // Listen for registration token
                const registrationListener = PushNotifications.addListener('registration', async (tokenData) => {
                    if (!isMounted) return;

                    console.log('[Native Push] Registration token received:', tokenData.value);
                    setToken(tokenData.value);
                    setIsRegistered(true);
                    setIsLoading(false);

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
                            console.log('[Native Push] Token registered successfully');
                        } else {
                            console.error('[Native Push] Failed to register token');
                        }
                    } catch (error) {
                        console.error('[Native Push] Error registering token:', error);
                    }
                });
                listenersRef.current.push(registrationListener);

                // Listen for registration errors
                const registrationErrorListener = PushNotifications.addListener('registrationError', (error) => {
                    if (!isMounted) return;
                    console.error('[Native Push] Registration error:', error);
                    setIsLoading(false);
                    toast.error('Failed to register for push notifications');
                });
                listenersRef.current.push(registrationErrorListener);

                // Listen for push notifications received (when app is in foreground)
                const pushReceivedListener = PushNotifications.addListener('pushNotificationReceived', (notification) => {
                    if (!isMounted) return;
                    console.log('[Native Push] Push notification received (foreground):', notification);
                    // Notification is automatically displayed by the OS
                    // You can show a custom in-app notification here if needed
                });
                listenersRef.current.push(pushReceivedListener);

                // Listen for notification actions (when user taps notification)
                const pushActionListener = PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
                    if (!isMounted) return;
                    console.log('[Native Push] Push notification action performed:', action);
                    // Handle notification tap - navigate to relevant screen
                    // You can access action.notification.data for custom data
                });
                listenersRef.current.push(pushActionListener);

            } catch (error) {
                console.error('[Native Push] Error registering for push:', error);
                setIsSupported(false);
                setIsLoading(false);
            }
        };

        registerForPush();

        // Cleanup function
        return () => {
            isMounted = false;
            // Remove all listeners
            listenersRef.current.forEach(listener => {
                listener.remove();
            });
            listenersRef.current = [];
        };
    }, [isSupported, session?.user]);

    const unregister = useCallback(async () => {
        if (!isNative() || !token) return false;

        setIsLoading(true);

        try {
            const { PushNotifications } = await import('@capacitor/push-notifications');

            // Remove from server
            const response = await fetch('/api/push/unregister-native', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: token,
                    platform: getPlatform()
                })
            });

            if (response.ok) {
                // Unregister from native platform
                await PushNotifications.unregister();

                setIsRegistered(false);
                setToken(null);
                toast.success('Push notifications disabled');
                setIsLoading(false);
                return true;
            } else {
                throw new Error('Failed to unregister from server');
            }
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
