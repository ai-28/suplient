import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export function useTasks() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { data: session } = useSession();

    const fetchTasks = async () => {
        if (!session?.user?.id) return;

        try {
            setLoading(true);
            setError(null);

            const response = await fetch('/api/tasks/bycoachId', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    coachId: session.user.id
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch tasks');
            }

            const data = await response.json();
            setTasks(data.tasks || []);
        } catch (err) {
            console.error('Error fetching tasks:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, [session?.user?.id]);

    const refetchTasks = () => {
        fetchTasks();
    };

    const updateTaskStatus = async (taskId, newStatus) => {
        try {
            const response = await fetch(`/api/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: newStatus
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update task status');
            }

            // Refetch tasks to get updated data
            await fetchTasks();
        } catch (error) {
            console.error('Error updating task status:', error);
            throw error;
        }
    };

    // Categorize tasks by type
    const personalTasks = tasks.filter(task => task.taskType === 'personal');
    const clientTasks = tasks.filter(task => task.taskType === 'client');
    const groupTasks = tasks.filter(task => task.taskType === 'group');

    // Calculate stats
    const stats = {
        totalTasks: tasks.length,
        completedTasks: tasks.filter(task => task.status === 'completed').length,
        overdueTasks: tasks.filter(task => {
            if (!task.dueDate) return false;
            const dueDate = new Date(task.dueDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return dueDate < today && task.status !== 'completed';
        }).length,
        personalTasks: personalTasks.length,
        clientTasks: clientTasks.length,
        groupTasks: groupTasks.length
    };

    return {
        tasks,
        personalTasks,
        clientTasks,
        groupTasks,
        stats,
        loading,
        error,
        refetchTasks,
        updateTaskStatus
    };
}
