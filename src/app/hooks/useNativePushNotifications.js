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
    const lastUserIdRef = useRef(null);

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

    // Reset registration flag when user logs out or changes
    useEffect(() => {
        if (!session?.user) {
            // User logged out - reset registration flag
            hasRegisteredRef.current = false;
            lastUserIdRef.current = null;
            setIsRegistered(false);
            setToken(null);
        } else if (session.user.id !== lastUserIdRef.current) {
            // Different user logged in - reset registration flag
            hasRegisteredRef.current = false;
            lastUserIdRef.current = session.user.id;
            setIsRegistered(false);
            setToken(null);
        }
    }, [session?.user?.id]);

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
                // Short delay to ensure app is ready (safe minimum)
                const initialDelay = 800;
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
                console.log('[Native Push] Setting up registration listener...');
                const registrationListener = PushNotifications.addListener('registration', async (tokenData) => {
                    console.log('[Native Push] ✅ Registration event FIRED!');
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
                                // Get device ID
                                let deviceId = null;
                                try {
                                    const { Device } = await import('@capacitor/device');
                                    const deviceInfo = await Device.getId();
                                    console.log('[Native Push] Device info:', deviceInfo);
                                    // Try different possible property names
                                    deviceId = deviceInfo.identifier ||
                                        deviceInfo.uuid ||
                                        deviceInfo.id ||
                                        null;
                                    if (deviceId) {
                                        console.log('[Native Push] Device ID captured:', deviceId);
                                    } else {
                                        console.warn('[Native Push] Device ID not found in deviceInfo:', deviceInfo);
                                    }
                                } catch (deviceError) {
                                    console.error('[Native Push] Error getting device ID:', deviceError);
                                    // Continue without device ID - push notifications will still work
                                }

                                const response = await fetch('/api/push/register-native', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        token: tokenData.value,
                                        platform: platform,
                                        deviceId: deviceId
                                    })
                                });

                                if (response.ok) {
                                    const result = await response.json();
                                    console.log('[Native Push] Token registered successfully:', result);
                                } else {
                                    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                                    console.error('[Native Push] Failed to register token:', response.status, errorData);
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
                    console.error('[Native Push] Registration error event received:', error);
                    console.error('[Native Push] Registration error details:', JSON.stringify(error, null, 2));
                    if (isMounted) {
                        setIsLoading(false);
                    }
                });
                listenersRef.current.push(registrationErrorListener);
                console.log('[Native Push] Registration error listener added');

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
                        // Small delay before requesting permission (safe minimum)
                        const permissionDelay = 1000;
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

                // Register with FCM/APNs after permission is granted
                // Small delay to ensure permission is fully processed
                const postPermissionDelay = isAndroid ? 500 : 1000;
                await new Promise(resolve => setTimeout(resolve, postPermissionDelay));

                if (!isMounted) return;

                // Register with FCM/APNs with error handling
                try {
                    console.log(`[Native Push] About to call PushNotifications.register() for ${platform}`);
                    await PushNotifications.register();
                    console.log(`[Native Push] Registration initiated for ${platform}`);
                    console.log(`[Native Push] Waiting for registration event... (listeners are set up)`);

                    // Add a timeout to detect if event never fires
                    setTimeout(() => {
                        if (isMounted && !token) {
                            console.warn('[Native Push] ⚠️ Registration event not received after 30 seconds');
                            console.warn('[Native Push] This might indicate the simulator is not generating tokens');
                        }
                    }, 30000);

                    // Don't set loading to false here - wait for token in registration listener
                } catch (registerError) {
                    console.error('[Native Push] Registration error:', registerError);
                    console.error('[Native Push] Registration error details:', JSON.stringify(registerError, null, 2));
                    if (isMounted) {
                        setIsLoading(false);
                    }
                    return;
                }

            } catch (error) {
                console.error('[Native Push] Error registering for push:', error);
                if (isMounted) {
                    setIsSupported(false);
                    setIsLoading(false);
                }
            }
        };

        // Short delay to ensure app is stable after login (safe minimum)
        const registrationDelay = 1500;
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
