import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/lib/authoption';
import { taskRepo } from '@/app/lib/db/taskRepo';


// POST /api/tasks - Create a new task
export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            title,
            description,
            dueDate,
            taskType,
            selectedClients,
            selectedGroup,
            isRepetitive,
            repetitiveFrequency,
            repetitiveCount
        } = body;

        // Validate required fields
        if (!title || !taskType) {
            return NextResponse.json(
                { error: 'Title and task type are required' },
                { status: 400 }
            );
        }

        const coachId = session.user.id;
        let createdTasks = [];

        // Handle repetitive task logic properly
        const isRepetitiveTask = isRepetitive === true;
        const finalRepetitiveFrequency = isRepetitiveTask ? (repetitiveFrequency || null) : null;
        const finalRepetitiveCount = isRepetitiveTask ? (repetitiveCount || null) : null;

        if (taskType === 'personal') {
            // Create personal task for the coach
            const taskData = {
                title,
                description: description || null,
                dueDate: dueDate ? new Date(dueDate) : null,
                taskType: 'personal',
                coachId,
                clientId: null,
                groupId: null,
                isRepetitive: isRepetitiveTask,
                repetitiveFrequency: finalRepetitiveFrequency,
                repetitiveCount: finalRepetitiveCount
            };

            const task = await taskRepo.createTask(taskData);
            createdTasks.push(task);
        } else if (taskType === 'client' && selectedClients?.length > 0) {
            // Create tasks for selected clients
            for (const clientId of selectedClients) {
                const taskData = {
                    title,
                    description: description || null,
                    dueDate: dueDate ? new Date(dueDate) : null,
                    taskType: 'client',
                    coachId,
                    clientId,
                    groupId: null,
                    isRepetitive: isRepetitiveTask,
                    repetitiveFrequency: finalRepetitiveFrequency,
                    repetitiveCount: finalRepetitiveCount
                };

                const task = await taskRepo.createTask(taskData);
                createdTasks.push(task);
            }
        } else if (taskType === 'group' && selectedGroup?.id) {
            // Create group task
            const taskData = {
                title,
                description: description || null,
                dueDate: dueDate ? new Date(dueDate) : null,
                taskType: 'group',
                coachId,
                clientId: null,
                groupId: selectedGroup.id,
                isRepetitive: isRepetitiveTask,
                repetitiveFrequency: finalRepetitiveFrequency,
                repetitiveCount: finalRepetitiveCount
            };

            const task = await taskRepo.createTask(taskData);
            createdTasks.push(task);
        } else {
            return NextResponse.json(
                { error: 'Invalid task type or missing required data' },
                { status: 400 }
            );
        }

        return NextResponse.json({
            message: 'Tasks created successfully',
            tasks: createdTasks
        });
    } catch (error) {
        console.error('Create task error:', error);
        return NextResponse.json(
            { error: 'Failed to create task' },
            { status: 500 }
        );
    }
}
