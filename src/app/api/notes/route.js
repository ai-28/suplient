import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/lib/authoption';
import { noteRepo } from '@/app/lib/db/noteRepo';

// GET /api/notes - Get notes by client ID
export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const clientId = searchParams.get('clientId');

        if (!clientId) {
            return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
        }

        const notes = await noteRepo.getNotesByClientId(clientId);

        return NextResponse.json({
            message: 'Notes fetched successfully',
            notes: notes
        });

    } catch (error) {
        console.error('Get notes error:', error);
        return NextResponse.json(
            { error: 'Failed to get notes' },
            { status: 500 }
        );
    }
}

// POST /api/notes - Create a new note
export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { title, description, clientId } = body;

        // Validate required fields
        if (!title || !clientId) {
            return NextResponse.json({
                error: 'Title and client ID are required'
            }, { status: 400 });
        }

        const noteData = {
            title,
            description: description || '',
            clientId
        };

        const newNote = await noteRepo.createNote(noteData);

        return NextResponse.json({
            message: 'Note created successfully',
            note: newNote
        }, { status: 201 });

    } catch (error) {
        console.error('Create note error:', error);
        return NextResponse.json(
            { error: 'Failed to create note' },
            { status: 500 }
        );
    }
}
