import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export function useGroups() {
    const { data: session } = useSession();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchGroups = async () => {
        if (!session?.user?.id) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/groups', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch groups');
            }

            const data = await response.json();
            const fetchedGroups = data.groups;

            // Transform the data to match the expected format
            const transformedGroups = fetchedGroups.map(group => ({
                id: group.id,
                name: group.name,
                members: group.memberCount || 0,
                nextSession: "TBD", // This would need to be calculated based on actual session data
                avatars: [], // This would need to be populated from member data
                stage: group.stage || "upcoming", // Use actual stage from database
                description: group.description || "",
                startDate: new Date(group.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
                unreadMessages: 0, // This would need to be calculated from actual message data
                lastComment: "", // This would need to be fetched from actual message data
                // Additional fields from database
                capacity: group.capacity,
                frequency: group.frequency,
                duration: group.duration,
                location: group.location,
                focusArea: group.focusArea,
                selectedMembers: group.selectedMembers || [],
                createdAt: group.createdAt,
                updatedAt: group.updatedAt
            }));

            setGroups(transformedGroups);
        } catch (err) {
            console.error("Error fetching groups:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroups();
    }, [session?.user?.id]);

    const updateGroupStage = async (groupId, newStage) => {
        try {
            const response = await fetch(`/api/groups/${groupId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ stage: newStage }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update group stage');
            }

            // Refresh the groups list
            await fetchGroups();
        } catch (error) {
            console.error('Error updating group stage:', error);
            throw error;
        }
    };

    return { groups, loading, error, refetchGroups: fetchGroups, updateGroupStage };
}
