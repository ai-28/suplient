import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export function useClients() {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { data: session } = useSession();

    const fetchClients = async () => {
        if (!session?.user?.id) return;

        try {
            setLoading(true);
            setError(null);

            const response = await fetch('/api/clients/bycoach', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    coachId: session.user.id
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch clients');
            }

            const data = await response.json();
            setClients(data.clients || []);
        } catch (err) {
            console.error('Error fetching clients:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, [session?.user?.id]);

    const refetchClients = () => {
        fetchClients();
    };

    // Transform clients data for the CreateGroupDialog
    const availableClients = clients.map(client => ({
        id: client.id,
        name: client.name,
        initials: client.name.split(' ').map(n => n[0]).join('').toUpperCase(),
        email: client.email,
        phone: client.phone
    }));

    return {
        clients,
        availableClients,
        loading,
        error,
        refetchClients
    };
}
