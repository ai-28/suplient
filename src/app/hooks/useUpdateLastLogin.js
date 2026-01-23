import { useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';

const STORAGE_KEY = 'lastLoginUpdate';
const THROTTLE_INTERVAL = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Hook to update coach's lastLogin timestamp
 * Includes client-side throttling to prevent excessive API calls
 * 
 * Usage:
 * - Automatically updates lastLogin when coach accesses platform
 * - Updates when coach comes back online after being offline
 */
export function useUpdateLastLogin() {
    const { data: session, status } = useSession();
    const wasOfflineRef = useRef(false);

    const updateLastLogin = useCallback(async (force = false) => {
        // Only update for coaches
        if (status !== 'authenticated' || !session?.user || session.user.role !== 'coach') {
            return;
        }

        // Client-side throttling: check localStorage
        if (!force) {
            const lastUpdate = localStorage.getItem(STORAGE_KEY);
            if (lastUpdate) {
                const timeSinceLastUpdate = Date.now() - parseInt(lastUpdate);
                
                // Don't update if last update was less than 1 hour ago
                if (timeSinceLastUpdate < THROTTLE_INTERVAL) {
                    console.log('⏱️ Last login update throttled (client-side)');
                    return;
                }
            }
        }

        try {
            const response = await fetch('/api/coach/update-last-login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.updated) {
                    localStorage.setItem(STORAGE_KEY, Date.now().toString());
                    console.log('✅ Last login updated:', data.lastLogin);
                } else {
                    console.log('⏱️ Last login update throttled (server-side)');
                }
            } else {
                console.error('Failed to update last login:', response.statusText);
            }
        } catch (error) {
            console.error('Error updating last login:', error);
        }
    }, [status, session?.user]);

    // Update on mount (when coach accesses platform)
    useEffect(() => {
        if (status === 'authenticated' && session?.user?.role === 'coach') {
            updateLastLogin();
        }
    }, [status, session?.user?.id, session?.user?.role, updateLastLogin]);

    // Handle online/offline events
    useEffect(() => {
        if (status !== 'authenticated' || !session?.user || session.user.role !== 'coach') {
            return;
        }

        const handleOnline = () => {
            if (wasOfflineRef.current) {
                // User was offline and came back online - update lastLogin
                updateLastLogin(true);
                wasOfflineRef.current = false;
            }
        };

        const handleOffline = () => {
            wasOfflineRef.current = true;
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [status, session?.user?.id, session?.user?.role, updateLastLogin]);

    return { updateLastLogin };
}
