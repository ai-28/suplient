import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/lib/authoption';
import { chatRepo } from '@/app/lib/db/chatSchema';
import { sql } from '@/app/lib/db/postgresql';

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const clientId = searchParams.get('clientId');
        const coachId = searchParams.get('coachId');

        if (!clientId || !coachId) {
            return NextResponse.json(
                { error: 'Both clientId and coachId are required' },
                { status: 400 }
            );
        }

        // Get the actual User IDs from Client and User tables
        let actualClientUserId, actualCoachUserId;

        // If clientId is from Client table, get the userId
        const clientData = await sql`
      SELECT "userId" FROM "Client" WHERE id = ${clientId}
    `;

        if (clientData.length > 0) {
            actualClientUserId = clientData[0].userId;
        } else {
            // If not found in Client table, assume it's already a User ID
            actualClientUserId = clientId;
        }

        // If coachId is from User table, use it directly
        const coachData = await sql`
      SELECT id FROM "User" WHERE id = ${coachId} AND role = 'coach'
    `;

        if (coachData.length > 0) {
            actualCoachUserId = coachId;
        } else {
            return NextResponse.json(
                { error: 'Invalid coach ID' },
                { status: 400 }
            );
        }

        // Check if user has permission to access this conversation
        if (session.user.role === 'coach' && session.user.id !== actualCoachUserId) {
            return NextResponse.json(
                { error: 'Unauthorized to access this conversation' },
                { status: 403 }
            );
        }

        if (session.user.role === 'client' && session.user.id !== actualClientUserId) {
            return NextResponse.json(
                { error: 'Unauthorized to access this conversation' },
                { status: 403 }
            );
        }

        // Get or create personal conversation using actual User IDs
        const conversationId = await chatRepo.createPersonalConversation(actualCoachUserId, actualClientUserId);

        return NextResponse.json({
            success: true,
            conversationId
        });
    } catch (error) {
        console.error('Error looking up conversation:', error);

        // Return more specific error messages
        if (error.message.includes('Users not found')) {
            return NextResponse.json(
                { error: 'One or both users do not exist in the system' },
                { status: 404 }
            );
        }

        if (error.message.includes('Invalid coach ID') || error.message.includes('Invalid client ID')) {
            return NextResponse.json(
                { error: 'Invalid user role for conversation' },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to lookup conversation' },
            { status: 500 }
        );
    }
}
