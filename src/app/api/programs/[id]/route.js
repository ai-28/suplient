import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/lib/authoption';
import {
    getProgramById,
    updateProgram,
    deleteProgram,
    duplicateProgram
} from '@/app/lib/db/programRepo';

// GET /api/programs/[id] - Get a specific program by ID
export async function GET(request, { params }) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;

        if (!id) {
            return NextResponse.json({ error: 'Program ID is required' }, { status: 400 });
        }

        // Get the program
        const program = await getProgramById(id);

        if (!program) {
            return NextResponse.json({ error: 'Program not found' }, { status: 404 });
        }

        // Check if user has access to this program
        if (program.coachId !== session.user.id && session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        return NextResponse.json({ program });

    } catch (error) {
        console.error('Error fetching program:', error);
        return NextResponse.json(
            { error: 'Failed to fetch program' },
            { status: 500 }
        );
    }
}

// PUT /api/programs/[id] - Update a program
export async function PUT(request, { params }) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;
        const body = await request.json();

        if (!id) {
            return NextResponse.json({ error: 'Program ID is required' }, { status: 400 });
        }

        // Get the existing program to check ownership
        const existingProgram = await getProgramById(id);
        if (!existingProgram) {
            return NextResponse.json({ error: 'Program not found' }, { status: 404 });
        }

        // Check if user has access to this program
        if (existingProgram.coachId !== session.user.id && session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        const {
            name,
            description,
            duration,
            category,
            isTemplate,
            targetConditions,
            elements
        } = body;

        // Validation
        if (name !== undefined && (!name || name.trim().length === 0)) {
            return NextResponse.json(
                { error: 'Program name cannot be empty' },
                { status: 400 }
            );
        }

        if (duration !== undefined && (duration < 1 || duration > 52)) {
            return NextResponse.json(
                { error: 'Duration must be between 1 and 52 weeks' },
                { status: 400 }
            );
        }

        // Update the program
        const updatedProgram = await updateProgram(id, {
            name: name?.trim(),
            description: description?.trim(),
            duration: duration ? parseInt(duration) : undefined,
            category: category?.trim(),
            isTemplate: isTemplate !== undefined ? Boolean(isTemplate) : undefined,
            targetConditions: Array.isArray(targetConditions) ? targetConditions : undefined,
            elements: Array.isArray(elements) ? elements : undefined
        });

        return NextResponse.json({
            message: 'Program updated successfully',
            program: updatedProgram
        });

    } catch (error) {
        console.error('Error updating program:', error);
        return NextResponse.json(
            { error: 'Failed to update program' },
            { status: 500 }
        );
    }
}

// DELETE /api/programs/[id] - Delete a program
export async function DELETE(request, { params }) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;

        if (!id) {
            return NextResponse.json({ error: 'Program ID is required' }, { status: 400 });
        }

        // Get the existing program to check ownership
        const existingProgram = await getProgramById(id);
        if (!existingProgram) {
            return NextResponse.json({ error: 'Program not found' }, { status: 404 });
        }

        // Check if user has access to this program
        if (existingProgram.coachId !== session.user.id && session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Delete the program
        const deleted = await deleteProgram(id);

        if (!deleted) {
            return NextResponse.json({ error: 'Failed to delete program' }, { status: 500 });
        }

        return NextResponse.json({
            message: 'Program deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting program:', error);
        return NextResponse.json(
            { error: 'Failed to delete program' },
            { status: 500 }
        );
    }
}
