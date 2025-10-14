import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/lib/authoption';
import { sql } from '@/app/lib/db/postgresql';

export async function GET(request) {
    try {
        console.log('🔍 DEBUG: Conversation lookup API called');

        const session = await getServerSession(authOptions);
        console.log('🔍 DEBUG: Session:', {
            hasSession: !!session,
            userId: session?.user?.id,
            userRole: session?.user?.role,
            userEmail: session?.user?.email
        });

        if (!session?.user?.id) {
            console.log('❌ DEBUG: No session found');
            return NextResponse.json({
                success: false,
                error: 'Unauthorized'
            }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const clientId = searchParams.get('clientId');
        const coachId = searchParams.get('coachId');

        console.log('🔍 DEBUG: Parameters:', { clientId, coachId });

        if (!clientId || !coachId) {
            console.log('❌ DEBUG: Missing parameters');
            return NextResponse.json({
                success: false,
                error: 'Client ID and Coach ID are required',
                receivedParams: { clientId, coachId }
            }, { status: 400 });
        }

        // Check if client exists
        console.log('🔍 DEBUG: Looking up client by user ID...');
        const clientResult = await sql`
            SELECT id, "userId", "coachId" FROM "Client" WHERE "userId" = ${clientId}
        `;
        console.log('🔍 DEBUG: Client result:', clientResult);

        if (clientResult.length === 0) {
            console.log('❌ DEBUG: Client not found for user ID:', clientId);
            return NextResponse.json({
                success: false,
                error: 'Client not found',
                clientId: clientId
            }, { status: 404 });
        }

        const clientData = clientResult[0];
        console.log('🔍 DEBUG: Client data:', clientData);

        // Check if coach matches
        if (clientData.coachId !== coachId) {
            console.log('❌ DEBUG: Coach mismatch:', {
                clientCoachId: clientData.coachId,
                requestedCoachId: coachId
            });
            return NextResponse.json({
                success: false,
                error: 'Coach mismatch',
                clientCoachId: clientData.coachId,
                requestedCoachId: coachId
            }, { status: 403 });
        }

        const clientUserId = clientData.userId;
        console.log('🔍 DEBUG: Client user ID:', clientUserId);

        // Look for existing conversation (simplified query)
        console.log('🔍 DEBUG: Looking for existing conversation...');
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
        console.log('🔍 DEBUG: Existing conversation:', existingConversation);

        if (existingConversation.length > 0) {
            console.log('✅ DEBUG: Found existing conversation:', existingConversation[0].id);
            return NextResponse.json({
                success: true,
                conversationId: existingConversation[0].id
            });
        }

        // Create new conversation
        console.log('🔍 DEBUG: Creating new conversation...');
        const newConversation = await sql`
            INSERT INTO "Conversation" (type, "createdBy", "isActive")
            VALUES ('personal', ${coachId}, true)
            RETURNING id
        `;

        const conversationId = newConversation[0].id;
        console.log('🔍 DEBUG: New conversation ID:', conversationId);

        // Add participants with roles
        await sql`
            INSERT INTO "ConversationParticipant" ("conversationId", "userId", role, "isActive")
            VALUES (${conversationId}, ${coachId}, 'admin', true)
        `;

        await sql`
            INSERT INTO "ConversationParticipant" ("conversationId", "userId", role, "isActive")
            VALUES (${conversationId}, ${clientUserId}, 'member', true)
        `;

        console.log('✅ DEBUG: Created new conversation with participants');
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