import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/lib/authoption';
import { sessionRepo } from '@/app/lib/db/sessionRepo';

// GET /api/sessions/[id] - Get a specific session
export async function GET(request, { params }) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const sessionData = await sessionRepo.getSessionById(id);

        if (!sessionData) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        // Check if user has permission to view this session
        const canView =
            sessionData.coachId === session.user.id ||
            sessionData.clientId === session.user.id ||
            session.user.role === 'admin';

        if (!canView) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        return NextResponse.json({ session: sessionData });
    } catch (error) {
        console.error('Get session error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch session' },
            { status: 500 }
        );
    }
}

// PUT /api/sessions/[id] - Update a specific session
export async function PUT(request, { params }) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();

        // First check if session exists and user has permission
        const existingSession = await sessionRepo.getSessionById(id);

        if (!existingSession) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        // Check permissions - only coach who created the session or admin can update
        const canUpdate =
            existingSession.coachId === session.user.id ||
            session.user.role === 'admin';

        if (!canUpdate) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

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

        const updateData = {
            title,
            description,
            sessionDate: sessionDate ? new Date(sessionDate) : undefined,
            sessionTime,
            duration: duration ? parseInt(duration) : undefined,
            sessionType,
            clientId,
            groupId,
            location,
            meetingLink,
            status,
            mood,
            notes
        };

        const updatedSession = await sessionRepo.updateSession(id, updateData);

        return NextResponse.json({
            message: 'Session updated successfully',
            session: updatedSession
        });
    } catch (error) {
        console.error('Update session error:', error);
        return NextResponse.json(
            { error: 'Failed to update session' },
            { status: 500 }
        );
    }
}

// DELETE /api/sessions/[id] - Delete a specific session
export async function DELETE(request, { params }) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // First check if session exists and user has permission
        const existingSession = await sessionRepo.getSessionById(id);

        if (!existingSession) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        // Check permissions - only coach who created the session or admin can delete
        const canDelete =
            existingSession.coachId === session.user.id ||
            session.user.role === 'admin';

        if (!canDelete) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const deletedSession = await sessionRepo.deleteSession(id);

        return NextResponse.json({
            message: 'Session deleted successfully',
            session: deletedSession
        });
    } catch (error) {
        console.error('Delete session error:', error);
        return NextResponse.json(
            { error: 'Failed to delete session' },
            { status: 500 }
        );
    }
}
