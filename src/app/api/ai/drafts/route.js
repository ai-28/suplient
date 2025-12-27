import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/lib/authoption';
import { sql } from '@/app/lib/db/postgresql';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'coach') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const coachId = session.user.id;

    const drafts = await sql`
      SELECT 
        id,
        name,
        "lastSavedAt",
        "createdAt",
        "updatedAt",
        "questionnaireData"->>'programName' as "programName"
      FROM "ProgramDraft"
      WHERE "coachId" = ${coachId}
      ORDER BY "lastSavedAt" DESC
    `;

    return NextResponse.json({
      success: true,
      drafts: drafts.map(draft => ({
        id: draft.id,
        name: draft.name,
        programName: draft.programName,
        lastSavedAt: draft.lastSavedAt,
        createdAt: draft.createdAt,
        updatedAt: draft.updatedAt
      }))
    });
  } catch (error) {
    console.error('Error fetching drafts:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch drafts' },
      { status: 500 }
    );
  }
}

