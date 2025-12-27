import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/lib/authoption';
import { sql } from '@/app/lib/db/postgresql';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'coach') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { draftId } = params;
    const coachId = session.user.id;

    if (!draftId) {
      return NextResponse.json({ error: 'Draft ID is required' }, { status: 400 });
    }

    const result = await sql`
      SELECT 
        id,
        "programData",
        "questionnaireData",
        name,
        "lastSavedAt",
        "createdAt"
      FROM "ProgramDraft"
      WHERE id = ${draftId} AND "coachId" = ${coachId}
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    const draft = result[0];

    return NextResponse.json({
      success: true,
      draft: {
        id: draft.id,
        programData: draft.programData,
        questionnaireData: draft.questionnaireData,
        name: draft.name,
        lastSavedAt: draft.lastSavedAt,
        createdAt: draft.createdAt
      }
    });
  } catch (error) {
    console.error('Error loading draft:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load draft' },
      { status: 500 }
    );
  }
}

