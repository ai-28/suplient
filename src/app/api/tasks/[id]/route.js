import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/lib/authoption';
import { taskRepo } from '@/app/lib/db/taskRepo';

// GET /api/tasks/[id] - Get a specific task
export async function GET(request, { params }) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const taskId = params.id;
        const task = await taskRepo.getTaskById(taskId);

        if (!task) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        // Check if user has permission to view this task
        const canView =
            task.coachId === session.user.id ||
            task.clientId === session.user.id ||
            session.user.role === 'admin';

        if (!canView) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        return NextResponse.json({ task });
    } catch (error) {
        console.error('Get task error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch task' },
            { status: 500 }
        );
    }
}

// PUT /api/tasks/[id] - Update a specific task
export async function PUT(request, { params }) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const taskId = params.id;
        const body = await request.json();

        // First check if task exists and user has permission
        const existingTask = await taskRepo.getTaskById(taskId);

        if (!existingTask) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        // Check permissions - only coach who created the task or admin can update
        const canUpdate =
            existingTask.coachId === session.user.id ||
            session.user.role === 'admin';

        if (!canUpdate) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const {
            title,
            description,
            dueDate,
            status,
            isRepetitive,
            repetitiveFrequency,
            repetitiveCount
        } = body;

        // Only update fields that are provided in the request
        const updateData = {};

        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
        if (status !== undefined) updateData.status = status;
        if (isRepetitive !== undefined) updateData.isRepetitive = isRepetitive;
        if (repetitiveFrequency !== undefined) updateData.repetitiveFrequency = repetitiveFrequency;
        if (repetitiveCount !== undefined) updateData.repetitiveCount = repetitiveCount;

        // Always update the updatedAt timestamp
        updateData.updatedAt = new Date();

        const updatedTask = await taskRepo.updateTask(taskId, updateData);

        return NextResponse.json({
            message: 'Task updated successfully',
            task: updatedTask
        });
    } catch (error) {
        console.error('Update task error:', error);
        return NextResponse.json(
            { error: 'Failed to update task' },
            { status: 500 }
        );
    }
}

// DELETE /api/tasks/[id] - Delete a specific task
export async function DELETE(request, { params }) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const taskId = await params.id;

        // First check if task exists and user has permission
        const existingTask = await taskRepo.getTaskById(taskId);

        if (!existingTask) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        // Check permissions - only coach who created the task or admin can delete
        const canDelete =
            existingTask.coachId === session.user.id ||
            session.user.role === 'admin';

        if (!canDelete) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const deletedTask = await taskRepo.deleteTask(taskId);

        return NextResponse.json({
            message: 'Task deleted successfully',
            task: deletedTask
        });
    } catch (error) {
        console.error('Delete task error:', error);
        return NextResponse.json(
            { error: 'Failed to delete task' },
            { status: 500 }
        );
    }
}
