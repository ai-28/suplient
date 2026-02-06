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
        let timeoutId = null;
        const platform = getPlatform();
        const isAndroid = platform === 'android';

        const registerForPush = async () => {
            try {
                // Longer delay for Android to ensure app is fully stable
                const initialDelay = isAndroid ? 5000 : 3000;
                await new Promise(resolve => setTimeout(resolve, initialDelay));

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

                // Set up listeners FIRST before requesting permissions
                // This ensures listeners are ready when registration completes
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
                        // Use a delay to ensure state is stable
                        setTimeout(async () => {
                            if (!isMounted) return;
                            try {
                                const response = await fetch('/api/push/register-native', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        token: tokenData.value,
                                        platform: platform
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
                        }, 1000);
                    } catch (error) {
                        console.error('[Native Push] Error in registration listener:', error);
                        if (isMounted) {
                            setIsLoading(false);
                        }
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
                });
                listenersRef.current.push(registrationErrorListener);

                // Listen for push notifications received (when app is in foreground)
                const pushReceivedListener = PushNotifications.addListener('pushNotificationReceived', (notification) => {
                    if (!isMounted) return;
                    console.log('[Native Push] Push notification received (foreground):', notification);
                });
                listenersRef.current.push(pushReceivedListener);

                // Listen for notification actions (when user taps notification)
                const pushActionListener = PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
                    if (!isMounted) return;
                    console.log('[Native Push] Push notification action performed:', action);
                });
                listenersRef.current.push(pushActionListener);

                // Now check and request permissions
                let permStatus;
                try {
                    permStatus = await PushNotifications.checkPermissions();
                    
                    if (permStatus.receive !== 'granted') {
                        // Longer delay for Android before requesting permission
                        const permissionDelay = isAndroid ? 1000 : 500;
                        await new Promise(resolve => setTimeout(resolve, permissionDelay));
                        
                        if (!isMounted) return;
                        
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

                // On Android, skip calling register() - it may cause crash
                // The plugin should handle registration automatically after permission is granted
                // Or we can register later when the app is more stable
                if (isAndroid) {
                    console.log('[Native Push] Android: Permission granted, skipping explicit register() call to prevent crash');
                    console.log('[Native Push] Android: Registration should happen automatically via listeners');
                    // Don't call register() - let the plugin handle it automatically
                    // The listeners are already set up, so if registration happens, we'll get the token
                    // Set loading to false after a delay
                    setTimeout(() => {
                        if (isMounted) {
                            setIsLoading(false);
                        }
                    }, 2000);
                    return;
                } else {
                    // iOS: Normal flow
                    const postPermissionDelay = 1000;
                    await new Promise(resolve => setTimeout(resolve, postPermissionDelay));

                    if (!isMounted) return;

                    // Register with FCM/APNs with error handling
                    try {
                        await PushNotifications.register();
                        console.log('[Native Push] Registration initiated');
                        // Don't set loading to false here - wait for token
                    } catch (registerError) {
                        console.error('[Native Push] Registration error:', registerError);
                        if (isMounted) {
                            setIsLoading(false);
                        }
                        return;
                    }
                }

            } catch (error) {
                console.error('[Native Push] Error registering for push:', error);
                if (isMounted) {
                    setIsSupported(false);
                    setIsLoading(false);
                }
            }
        };

        // Delay registration to ensure app is stable after login
        // Longer delay for Android (5 seconds) vs iOS (3 seconds)
        const registrationDelay = isAndroid ? 5000 : 3000;
        timeoutId = setTimeout(() => {
            if (isMounted) {
                registerForPush();
            }
        }, registrationDelay);

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
