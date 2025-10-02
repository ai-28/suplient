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
    const { emoji } = await request.json();

    if (!emoji) {
      return NextResponse.json(
        { error: 'Emoji is required' },
        { status: 400 }
      );
    }

    // Verify user can react to this message
    const canReact = await chatRepo.verifyMessageAccess(messageId, session.user.id);
    if (!canReact) {
      return NextResponse.json(
        { error: 'Not authorized to react to this message' },
        { status: 403 }
      );
    }

    const reaction = await chatRepo.addReaction(messageId, session.user.id, emoji);

    return NextResponse.json({
      success: true,
      reaction: {
        ...reaction,
        userName: session.user.name
      }
    });
  } catch (error) {
    console.error('Error adding reaction:', error);
    return NextResponse.json(
      { error: 'Failed to add reaction' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: messageId } = params;
    const { searchParams } = new URL(request.url);
    const emoji = searchParams.get('emoji');

    if (!emoji) {
      return NextResponse.json(
        { error: 'Emoji is required' },
        { status: 400 }
      );
    }

    // Verify user can react to this message
    const canReact = await chatRepo.verifyMessageAccess(messageId, session.user.id);
    if (!canReact) {
      return NextResponse.json(
        { error: 'Not authorized to react to this message' },
        { status: 403 }
      );
    }

    await chatRepo.removeReaction(messageId, session.user.id, emoji);

    return NextResponse.json({
      success: true,
      message: 'Reaction removed'
    });
  } catch (error) {
    console.error('Error removing reaction:', error);
    return NextResponse.json(
      { error: 'Failed to remove reaction' },
      { status: 500 }
    );
  }
}

