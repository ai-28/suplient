import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/lib/authoption';
import { sql } from '@/app/lib/db/postgresql';

export async function GET(request) {
    try {

        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({
                success: false,
                error: 'Unauthorized'
            }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const clientId = searchParams.get('clientId');
        const coachId = searchParams.get('coachId');


        if (!clientId || !coachId) {
            return NextResponse.json({
                success: false,
                error: 'Client ID and Coach ID are required',
                receivedParams: { clientId, coachId }
            }, { status: 400 });
        }

        // Check if client exists
        const clientResult = await sql`
            SELECT id, "userId", "coachId" FROM "Client" WHERE "userId" = ${clientId}
        `;

        if (clientResult.length === 0) {
            return NextResponse.json({
                success: false,
                error: 'Client not found',
                clientId: clientId
            }, { status: 404 });
        }

        const clientData = clientResult[0];

        // Check if coach matches
        if (clientData.coachId !== coachId) {
            return NextResponse.json({
                success: false,
                error: 'Coach mismatch',
                clientCoachId: clientData.coachId,
                requestedCoachId: coachId
            }, { status: 403 });
        }

        const clientUserId = clientData.userId;

        // Look for existing conversation (simplified query)
        const existingConversation = await sql`
            SELECT c.id
            FROM "Conversation" c
            WHERE c.type = 'personal'
            AND c."createdBy" = ${coachId}
            AND c."isActive" = true
            AND EXISTS (
                SELECT 1 FROM "ConversationParticipant" cp1 
                WHERE cp1."conversationId" = c.id AND cp1."userId" = ${coachId}
            )
            AND EXISTS (
                SELECT 1 FROM "ConversationParticipant" cp2 
                WHERE cp2."conversationId" = c.id AND cp2."userId" = ${clientUserId}
            )
            LIMIT 1
        `;

        if (existingConversation.length > 0) {
            return NextResponse.json({
                success: true,
                conversationId: existingConversation[0].id
            });
        }

        // Create new conversation
        const newConversation = await sql`
            INSERT INTO "Conversation" (type, "createdBy", "isActive")
            VALUES ('personal', ${coachId}, true)
            RETURNING id
        `;

        const conversationId = newConversation[0].id;

        // Add participants with roles
        await sql`
            INSERT INTO "ConversationParticipant" ("conversationId", "userId", role, "isActive")
            VALUES (${conversationId}, ${coachId}, 'admin', true)
        `;

        await sql`
            INSERT INTO "ConversationParticipant" ("conversationId", "userId", role, "isActive")
            VALUES (${conversationId}, ${clientUserId}, 'member', true)
        `;

        return NextResponse.json({
            success: true,
            conversationId: conversationId
        });

    } catch (error) {
        console.error('❌ DEBUG: Error in conversation lookup:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to lookup conversation',
            details: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}