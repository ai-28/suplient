import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/lib/authoption';
import { chatRepo } from '@/app/lib/db/chatSchema';

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: messageId } = params;
    const { conversationId } = await request.json();

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    // Verify user is participant
    const participants = await chatRepo.getConversationParticipants(conversationId);
    const isParticipant = participants.some(p => p.id === session.user.id);

    if (!isParticipant) {
      return NextResponse.json(
        { error: 'Not authorized to mark messages as read in this conversation' },
        { status: 403 }
      );
    }

    await chatRepo.markMessagesAsRead(conversationId, session.user.id, [messageId]);

    return NextResponse.json({
      success: true,
      message: 'Message marked as read'
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark message as read' },
      { status: 500 }
    );
  }
}

