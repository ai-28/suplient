import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/lib/authoption';
import { chatRepo } from '@/app/lib/db/chatSchema';

export async function GET(request, { params }) {
    try {
        console.log('🔍 Group conversation API called');

        const session = await getServerSession(authOptions);
        console.log('🔍 Session data:', {
            hasSession: !!session,
            userId: session?.user?.id,
            userRole: session?.user?.role
        });

        if (!session?.user?.id) {
            console.log('❌ No session found');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { groupId } = await params;
        console.log('🔍 Group ID:', groupId);

        if (!groupId) {
            return NextResponse.json(
                { error: 'Group ID is required' },
                { status: 400 }
            );
        }

        // Get or create group conversation
        let conversationId = await chatRepo.getGroupConversationId(groupId);

        if (!conversationId) {
            // Create group conversation if it doesn't exist
            conversationId = await chatRepo.createGroupConversation(groupId, session.user.id);
        } else {
            // Ensure coach is participant even for existing conversations
            conversationId = await chatRepo.createGroupConversation(groupId, session.user.id);
        }

        return NextResponse.json({
            success: true,
            conversationId
        });
    } catch (error) {
        console.error('Error getting group conversation:', error);
        return NextResponse.json(
            { error: 'Failed to get group conversation' },
            { status: 500 }
        );
    }
}
