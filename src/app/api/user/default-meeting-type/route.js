import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/lib/authoption';
import { sql } from '@/app/lib/db/postgresql';

// GET - Fetch default meeting type
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only coaches can have default meeting type
    if (session.user.role !== 'coach') {
      return NextResponse.json({ error: 'Only coaches can have default meeting type' }, { status: 403 });
    }

    // Check if defaultMeetingType column exists, if not return 'none'
    try {
      const user = await sql`
        SELECT "defaultMeetingType"
        FROM "User"
        WHERE id = ${session.user.id}
      `;

      if (user.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const defaultMeetingType = user[0].defaultMeetingType || 'none';

      return NextResponse.json({
        success: true,
        defaultMeetingType: defaultMeetingType
      });
    } catch (error) {
      // If column doesn't exist, return 'none'
      if (error.message?.includes('column "defaultMeetingType" does not exist')) {
        return NextResponse.json({
          success: true,
          defaultMeetingType: 'none'
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error fetching default meeting type:', error);
    return NextResponse.json(
      { error: 'Failed to fetch default meeting type' },
      { status: 500 }
    );
  }
}

// PUT - Update default meeting type
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only coaches can set default meeting type
    if (session.user.role !== 'coach') {
      return NextResponse.json({ error: 'Only coaches can set default meeting type' }, { status: 403 });
    }

    const body = await request.json();
    const { defaultMeetingType } = body;

    // Validate meeting type
    const validMeetingTypes = ['none', 'google_meet', 'zoom', 'teams'];
    if (!validMeetingTypes.includes(defaultMeetingType)) {
      return NextResponse.json(
        { error: 'Invalid meeting type' },
        { status: 400 }
      );
    }

    // Ensure defaultMeetingType column exists
    try {
      await sql`
        ALTER TABLE "User" 
        ADD COLUMN IF NOT EXISTS "defaultMeetingType" VARCHAR(50) DEFAULT 'none'
      `;
    } catch (migrationError) {
      // Column might already exist, ignore error
      console.log('Migration check for defaultMeetingType:', migrationError.message);
    }

    // Update default meeting type
    const updatedUser = await sql`
      UPDATE "User" 
      SET 
        "defaultMeetingType" = ${defaultMeetingType},
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = ${session.user.id}
      RETURNING 
        id,
        "defaultMeetingType"
    `;

    if (updatedUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Default meeting type updated successfully',
      defaultMeetingType: updatedUser[0].defaultMeetingType
    });

  } catch (error) {
    console.error('Error updating default meeting type:', error);
    return NextResponse.json(
      { error: 'Failed to update default meeting type' },
      { status: 500 }
    );
  }
}
