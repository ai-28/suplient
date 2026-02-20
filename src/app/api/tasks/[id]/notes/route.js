import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/lib/authoption';
import { sql } from '@/app/lib/db/postgresql';

// GET /api/tasks/[id]/notes - Get client notes for a task
export async function GET(request, { params }) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: taskId } = params;

        // Get the client ID from session
        const clientResult = await sql`
      SELECT c.id
      FROM "Client" c
      WHERE c."userId" = ${session.user.id}
      LIMIT 1
    `;

        if (clientResult.length === 0) {
            return NextResponse.json(
                { error: 'Client not found' },
                { status: 404 }
            );
        }

        const clientId = clientResult[0].id;

        // Verify the task belongs to this client
        const taskResult = await sql`
      SELECT t.id, t."clientId", t."groupId"
      FROM "Task" t
      WHERE t.id = ${taskId}
      AND (
        t."clientId" = ${clientId} 
        OR (t."groupId" IS NOT NULL AND ${clientId} = ANY(
          SELECT unnest(g."selectedMembers")
          FROM "Group" g
          WHERE g.id = t."groupId"
        ))
      )
      LIMIT 1
    `;

        if (taskResult.length === 0) {
            return NextResponse.json(
                { error: 'Task not found or access denied' },
                { status: 404 }
            );
        }

        // Get notes from TaskCompletion table
        const notesResult = await sql`
      SELECT "clientNotes"
      FROM "TaskCompletion"
      WHERE "taskId" = ${taskId} AND "clientId" = ${clientId}
      LIMIT 1
    `;

        const notes = notesResult.length > 0 ? (notesResult[0].clientNotes || '') : '';

        return NextResponse.json({ notes });

    } catch (error) {
        console.error('Get task notes error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch task notes' },
            { status: 500 }
        );
    }
}

// PUT /api/tasks/[id]/notes - Save client notes for a task
export async function PUT(request, { params }) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: taskId } = params;
        const body = await request.json();
        const { notes } = body;

        // Get the client ID from session
        const clientResult = await sql`
      SELECT c.id
      FROM "Client" c
      WHERE c."userId" = ${session.user.id}
      LIMIT 1
    `;

        if (clientResult.length === 0) {
            return NextResponse.json(
                { error: 'Client not found' },
                { status: 404 }
            );
        }

        const clientId = clientResult[0].id;

        // Verify the task belongs to this client
        const taskResult = await sql`
      SELECT t.id, t."clientId", t."groupId"
      FROM "Task" t
      WHERE t.id = ${taskId}
      AND (
        t."clientId" = ${clientId} 
        OR (t."groupId" IS NOT NULL AND ${clientId} = ANY(
          SELECT unnest(g."selectedMembers")
          FROM "Group" g
          WHERE g.id = t."groupId"
        ))
      )
      LIMIT 1
    `;

        if (taskResult.length === 0) {
            return NextResponse.json(
                { error: 'Task not found or access denied' },
                { status: 404 }
            );
        }

        // Ensure clientNotes and updatedAt columns exist in TaskCompletion table
        try {
            await sql`
            ALTER TABLE "TaskCompletion" 
            ADD COLUMN IF NOT EXISTS "clientNotes" TEXT
          `;
        } catch (migrationError) {
            // Column might already exist, ignore error
            console.log('Migration check for clientNotes:', migrationError.message);
        }

        try {
            await sql`
            ALTER TABLE "TaskCompletion" 
            ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          `;
        } catch (migrationError) {
            // Column might already exist, ignore error
            console.log('Migration check for updatedAt:', migrationError.message);
        }

        // Update or insert notes in TaskCompletion table
        // If task is not completed, we still want to save notes, so we'll insert/update with a NULL completedAt
        const result = await sql`
      INSERT INTO "TaskCompletion" ("taskId", "clientId", "clientNotes", "completedAt")
      VALUES (${taskId}, ${clientId}, ${notes || ''}, NULL)
      ON CONFLICT ("taskId", "clientId") 
      DO UPDATE SET 
        "clientNotes" = ${notes || ''},
        "updatedAt" = CURRENT_TIMESTAMP
      RETURNING "clientNotes"
    `;

        return NextResponse.json({
            success: true,
            message: 'Notes saved successfully',
            notes: result[0].clientNotes
        });

    } catch (error) {
        console.error('Save task notes error:', error);
        return NextResponse.json(
            { error: 'Failed to save task notes' },
            { status: 500 }
        );
    }
}
