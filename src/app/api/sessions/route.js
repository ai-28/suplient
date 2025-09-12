import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/lib/authoption';
import { sessionRepo } from '@/app/lib/db/sessionRepo';

// GET /api/sessions - Get sessions for the logged-in coach
export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const coachId = session.user.id;
        const sessions = await sessionRepo.getSessionsByCoach(coachId);

        return NextResponse.json({
            message: 'Sessions fetched successfully',
            sessions
        });
    } catch (error) {
        console.error('Get sessions error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch sessions' },
            { status: 500 }
        );
    }
}

// POST /api/sessions - Create a new session
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
            sessionDate,
            sessionTime,
            duration,
            sessionType,
            clientId,
            groupId,
            location,
            meetingLink,
            status,
            mood,
            notes
        } = body;

        // Validate required fields
        if (!title || !sessionDate || !sessionTime || !sessionType) {
            return NextResponse.json(
                { error: 'Title, session date, session time, and session type are required' },
                { status: 400 }
            );
        }

        // Validate session type and related fields
        if (sessionType === 'individual' && !clientId) {
            return NextResponse.json(
                { error: 'Client ID is required for individual sessions' },
                { status: 400 }
            );
        }

        if (sessionType === 'group' && !groupId) {
            return NextResponse.json(
                { error: 'Group ID is required for group sessions' },
                { status: 400 }
            );
        }

        const coachId = session.user.id;
        const sessionData = {
            title,
            description: description || null,
            sessionDate: new Date(sessionDate),
            sessionTime,
            duration: duration ? parseInt(duration) : 60,
            sessionType,
            coachId,
            clientId: clientId || null,
            groupId: groupId || null,
            location: location || null,
            meetingLink: meetingLink || null,
            status: status || 'scheduled',
            mood: mood || 'neutral',
            notes: notes || null
        };

        const newSession = await sessionRepo.createSession(sessionData);

        return NextResponse.json({
            message: 'Session created successfully',
            session: newSession
        });
    } catch (error) {
        console.error('Create session error:', error);
        return NextResponse.json(
            { error: 'Failed to create session' },
            { status: 500 }
        );
    }
}
