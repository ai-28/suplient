import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/lib/authoption';
import {
    createProgram,
    getProgramsByCoach,
    getProgramStats
} from '@/app/lib/db/programRepo';

// GET /api/programs - Get all programs for the authenticated coach
export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Ensure user is a coach
        if (session.user.role !== 'coach' && session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Access denied. Coaches only.' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const isTemplate = searchParams.get('isTemplate');
        const category = searchParams.get('category');
        const limit = parseInt(searchParams.get('limit')) || 50;
        const offset = parseInt(searchParams.get('offset')) || 0;

        // Get programs for the coach
        const programs = await getProgramsByCoach(session.user.id, {
            isTemplate: isTemplate === 'true' ? true : isTemplate === 'false' ? false : undefined,
            category,
            limit,
            offset
        });

        // Get program statistics
        const stats = await getProgramStats(session.user.id);

        return NextResponse.json({
            programs,
            stats,
            pagination: {
                limit,
                offset,
                total: programs.length
            }
        });

    } catch (error) {
        console.error('Error fetching programs:', error);
        return NextResponse.json(
            { error: 'Failed to fetch programs' },
            { status: 500 }
        );
    }
}

// POST /api/programs - Create a new program
export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Ensure user is a coach
        if (session.user.role !== 'coach' && session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Access denied. Coaches only.' }, { status: 403 });
        }

        const body = await request.json();
        const {
            name,
            description,
            duration,
            category = 'general',
            isTemplate = false,
            targetConditions = [],
            elements = []
        } = body;

        // Validation
        if (!name || name.trim().length === 0) {
            return NextResponse.json(
                { error: 'Program name is required' },
                { status: 400 }
            );
        }

        if (!duration || duration < 1 || duration > 52) {
            return NextResponse.json(
                { error: 'Duration must be between 1 and 52 weeks' },
                { status: 400 }
            );
        }

        // Create the program
        const program = await createProgram({
            name: name.trim(),
            description: description?.trim() || '',
            duration: parseInt(duration),
            category: category.trim(),
            isTemplate: Boolean(isTemplate),
            targetConditions: Array.isArray(targetConditions) ? targetConditions : [],
            coachId: session.user.id,
            elements: Array.isArray(elements) ? elements : []
        });

        return NextResponse.json({
            message: 'Program created successfully',
            program
        }, { status: 201 });

    } catch (error) {
        console.error('Error creating program:', error);
        return NextResponse.json(
            { error: 'Failed to create program' },
            { status: 500 }
        );
    }
}
