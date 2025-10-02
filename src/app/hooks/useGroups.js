import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export function useGroups() {
    const { data: session } = useSession();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!session?.user?.id) {
            setLoading(false);
            return;
        }

        const fetchGroups = async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await fetch('/api/groups', {
                    credentials: 'include'
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch groups');
                }

                const data = await response.json();

                if (data.success) {
                    setGroups(data.groups);
                } else {
                    throw new Error(data.error || 'Failed to fetch groups');
                }
            } catch (err) {
                console.error('Error fetching groups:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchGroups();
    }, [session?.user?.id]);

    return { groups, loading, error };
}