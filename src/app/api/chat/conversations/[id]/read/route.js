import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/lib/authoption';
import { chatRepo } from '@/app/lib/db/chatSchema';

export async function PUT(request, { params }) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: conversationId } = await params;

        // Verify user is participant
        console.log('🔍 Checking participants for conversation:', conversationId);
        const participants = await chatRepo.getConversationParticipants(conversationId);
        console.log('🔍 Participants found:', participants);
        const isParticipant = participants.some(p => p.id === session.user.id);
        console.log('🔍 Is user participant:', isParticipant, 'User ID:', session.user.id);

        if (!isParticipant) {
            console.log('❌ User not authorized to access conversation');
            return NextResponse.json(
                { error: 'Not authorized to access this conversation' },
                { status: 403 }
            );
        }

        // Mark messages as read
        console.log('✅ Marking messages as read for user:', session.user.id);
        await chatRepo.markMessagesAsRead(conversationId, session.user.id);
        console.log('✅ Messages marked as read successfully');

        // Emit real-time update for unread message counts
        try {
            const { io } = await import('socket.io');
            if (io && global.globalSocketIO) {
                // Get all participants to notify them of the read status update
                const participants = await chatRepo.getConversationParticipants(conversationId);

                for (const participant of participants) {
                    global.globalSocketIO.to(`notifications_${participant.id}`).emit('update_unread_count', {
                        conversationId,
                        participantId: participant.id
                    });
                }
                console.log('✅ Real-time unread count updates emitted after marking as read');
            }
        } catch (socketError) {
            console.error('❌ Error emitting unread count updates:', socketError);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
