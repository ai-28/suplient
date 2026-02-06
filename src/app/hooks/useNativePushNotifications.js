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
        // Temporary: Skip notification registration on Android to prevent crashes
        // TODO: Re-enable after fixing the crash issue
        if (getPlatform() === 'android') {
            console.log('[Native Push] Skipping registration on Android to prevent crashes');
            return;
        }
        
        if (!isSupported || !session?.user || hasRegisteredRef.current) return;
        hasRegisteredRef.current = true;

        let isMounted = true;
        let timeoutId = null;

        const registerForPush = async () => {
            try {
                // Add longer delay to ensure app is fully loaded after login
                // This prevents crashes when permission is granted
                await new Promise(resolve => setTimeout(resolve, 3000));

                if (!isMounted) return;

                // Safe state update
                if (isMounted) {
                    setIsLoading(true);
                }

                // Dynamic import to prevent errors on web
                const { PushNotifications } = await import('@capacitor/push-notifications');

                // Check if plugin is available
                if (!PushNotifications) {
                    console.warn('[Native Push] PushNotifications plugin not available');
                    if (isMounted) {
                        setIsLoading(false);
                    }
                    return;
                }

                // Request permission with error handling
                let permStatus;
                try {
                    permStatus = await PushNotifications.checkPermissions();
                    if (permStatus.receive !== 'granted') {
                        // Add small delay before requesting to ensure UI is stable
                        await new Promise(resolve => setTimeout(resolve, 500));
                        permStatus = await PushNotifications.requestPermissions();
                    }
                } catch (permError) {
                    console.error('[Native Push] Permission request error:', permError);
                    if (isMounted) {
                        setIsLoading(false);
                    }
                    return;
                }

                if (!isMounted) return;

                if (permStatus.receive !== 'granted') {
                    console.log('[Native Push] Permission denied');
                    if (isMounted) {
                        setIsLoading(false);
                    }
                    return;
                }

                // Add delay after permission granted to prevent crash
                await new Promise(resolve => setTimeout(resolve, 500));

                if (!isMounted) return;

                // Register with FCM/APNs with error handling
                try {
                    await PushNotifications.register();
                } catch (registerError) {
                    console.error('[Native Push] Registration error:', registerError);
                    // Don't crash - just log and continue
                    if (isMounted) {
                        setIsLoading(false);
                    }
                    // Don't show toast on Android - might cause crash
                    // Just log the error
                    return;
                }

                // Listen for registration token
                const registrationListener = PushNotifications.addListener('registration', async (tokenData) => {
                    if (!isMounted) return;

                    try {
                        console.log('[Native Push] Registration token received:', tokenData.value);
                        if (isMounted) {
                            setToken(tokenData.value);
                            setIsRegistered(true);
                            setIsLoading(false);
                        }

                        // Send token to server with error handling
                        try {
                            const response = await fetch('/api/push/register-native', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    token: tokenData.value,
                                    platform: getPlatform()
                                })
                            });

                            if (response.ok) {
                                console.log('[Native Push] Token registered successfully');
                            } else {
                                console.error('[Native Push] Failed to register token');
                            }
                        } catch (error) {
                            console.error('[Native Push] Error registering token:', error);
                            // Don't crash - token is still registered locally
                        }
                    } catch (error) {
                        console.error('[Native Push] Error in registration listener:', error);
                    }
                });
                listenersRef.current.push(registrationListener);

                // Listen for registration errors
                const registrationErrorListener = PushNotifications.addListener('registrationError', (error) => {
                    if (!isMounted) return;
                    console.error('[Native Push] Registration error:', error);
                    if (isMounted) {
                        setIsLoading(false);
                    }
                    // Don't show toast on Android - might cause crash
                    // Just log the error
                });
                listenersRef.current.push(registrationErrorListener);

                // Listen for push notifications received (when app is in foreground)
                const pushReceivedListener = PushNotifications.addListener('pushNotificationReceived', (notification) => {
                    if (!isMounted) return;
                    console.log('[Native Push] Push notification received (foreground):', notification);
                    // Notification is automatically displayed by the OS
                });
                listenersRef.current.push(pushReceivedListener);

                // Listen for notification actions (when user taps notification)
                const pushActionListener = PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
                    if (!isMounted) return;
                    console.log('[Native Push] Push notification action performed:', action);
                    // Handle notification tap - navigate to relevant screen
                });
                listenersRef.current.push(pushActionListener);

            } catch (error) {
                console.error('[Native Push] Error registering for push:', error);
                // Don't crash the app - just disable push notifications
                if (isMounted) {
                    setIsSupported(false);
                    setIsLoading(false);
                }
                // Don't show error toast - might cause crash
            }
        };

        // Delay registration to ensure app is stable after login
        // Increased delay to 3 seconds for Android stability
        timeoutId = setTimeout(() => {
            if (isMounted) {
                registerForPush();
            }
        }, 3000); // 3 second delay after login

        // Cleanup function
        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            isMounted = false;
            // Remove all listeners safely
            listenersRef.current.forEach(listener => {
                try {
                    if (listener && typeof listener.remove === 'function') {
                        listener.remove();
                    }
                } catch (e) {
                    console.warn('[Native Push] Error removing listener:', e);
                }
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
