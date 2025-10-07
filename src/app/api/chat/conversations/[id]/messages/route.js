import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/lib/authoption';
import { chatRepo } from '@/app/lib/db/chatSchema';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: conversationId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 50;
    const offset = parseInt(searchParams.get('offset')) || 0;

    // Verify user is participant
    const participants = await chatRepo.getConversationParticipants(conversationId);
    const isParticipant = participants.some(p => p.id === session.user.id);

    if (!isParticipant) {
      return NextResponse.json(
        { error: 'Not authorized to access this conversation' },
        { status: 403 }
      );
    }

    const messages = await chatRepo.getConversationMessages(conversationId, limit, offset);

    return NextResponse.json({
      success: true,
      messages
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: conversationId } = await params;
    const { content, type = 'text', replyToId, fileUrl, fileName, fileSize, fileType, audioUrl, audioDuration, waveformData } = await request.json();

    if (!content && !fileUrl && !audioUrl) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    // Verify user is participant
    const participants = await chatRepo.getConversationParticipants(conversationId);
    const isParticipant = participants.some(p => p.id === session.user.id);

    if (!isParticipant) {
      return NextResponse.json(
        { error: 'Not authorized to send messages to this conversation' },
        { status: 403 }
      );
    }

    const message = await chatRepo.sendMessage(conversationId, session.user.id, content, type, {
      replyToId,
      fileUrl,
      fileName,
      fileSize,
      fileType,
      audioUrl,
      audioDuration,
      waveformData
    });


    // Emit real-time update for unread message counts
    try {
      const { NotificationService } = await import('@/app/lib/services/NotificationService');

      // Emit to all participants to update their unread counts
      for (const participant of participants) {
        await NotificationService.emitUnreadCountUpdate(conversationId, participant.id);
      }
    } catch (socketError) {
      console.error('Error emitting unread count updates:', socketError);
    }

    return NextResponse.json({
      success: true,
      message: {
        ...message,
        senderId: session.user.id,
        senderName: session.user.name,
        senderRole: session.user.role,
        timestamp: message.createdAt
      }
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

