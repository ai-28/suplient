import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/lib/authoption';
import { duplicateProgram } from '@/app/lib/db/programRepo';

// POST /api/programs/[id]/duplicate - Duplicate a program
export async function POST(request, { params }) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Ensure user is a coach
        if (session.user.role !== 'coach' && session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Access denied. Coaches only.' }, { status: 403 });
        }

        const { id } = params;
        const body = await request.json();
        const { newName } = body;

        if (!id) {
            return NextResponse.json({ error: 'Program ID is required' }, { status: 400 });
        }

        if (!newName || newName.trim().length === 0) {
            return NextResponse.json({ error: 'New program name is required' }, { status: 400 });
        }

        // Duplicate the program
        const duplicatedProgram = await duplicateProgram(id, newName.trim(), session.user.id);

        return NextResponse.json({
            message: 'Program duplicated successfully',
            program: duplicatedProgram
        }, { status: 201 });

    } catch (error) {
        console.error('Error duplicating program:', error);

        if (error.message === 'Original program not found') {
            return NextResponse.json({ error: 'Original program not found' }, { status: 404 });
        }

        return NextResponse.json(
            { error: 'Failed to duplicate program' },
            { status: 500 }
        );
    }
}
