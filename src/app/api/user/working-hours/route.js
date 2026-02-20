import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/lib/authoption';
import { sql } from '@/app/lib/db/postgresql';
import { integrationRepo } from '@/app/lib/db/integrationSchema';

// GET - Fetch working hours
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only coaches can have working hours
    if (session.user.role !== 'coach') {
      return NextResponse.json({ error: 'Only coaches can have working hours' }, { status: 403 });
    }

    // Check if workingHours column exists, if not return default
    try {
      const user = await sql`
        SELECT "workingHours"
        FROM "User"
        WHERE id = ${session.user.id}
      `;

      if (user.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Return working hours or default structure
      let workingHoursData = user[0].workingHours;
      
      // Handle both old format (array) and new format (object with timezone)
      let workingHours, timezone;
      if (Array.isArray(workingHoursData)) {
        // Old format - just array of hours
        workingHours = workingHoursData;
        timezone = null; // Will need to get from integration
      } else if (workingHoursData && workingHoursData.hours) {
        // New format - object with hours and timezone
        workingHours = workingHoursData.hours;
        timezone = workingHoursData.timezone;
      } else {
        // No working hours set - return default
        workingHours = getDefaultWorkingHours();
        timezone = null;
      }

      // If no timezone in stored data, try to get from Google Calendar integration
      if (!timezone) {
        try {
          const integration = await integrationRepo.getCoachIntegration(session.user.id, 'google_calendar');
          if (integration?.settings?.timeZone) {
            timezone = integration.settings.timeZone;
          }
        } catch (error) {
          console.warn('Failed to get timezone from integration:', error);
        }
      }

      return NextResponse.json({
        success: true,
        workingHours: workingHours,
        timezone: timezone
      });
    } catch (error) {
      // If column doesn't exist, return default
      if (error.message?.includes('column "workingHours" does not exist')) {
        // Try to get timezone from integration
        let timezone = null;
        try {
          const integration = await integrationRepo.getCoachIntegration(session.user.id, 'google_calendar');
          if (integration?.settings?.timeZone) {
            timezone = integration.settings.timeZone;
          }
        } catch (err) {
          // Ignore
        }
        
        return NextResponse.json({
          success: true,
          workingHours: getDefaultWorkingHours(),
          timezone: timezone
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error fetching working hours:', error);
    return NextResponse.json(
      { error: 'Failed to fetch working hours' },
      { status: 500 }
    );
  }
}

// PUT - Update working hours
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only coaches can set working hours
    if (session.user.role !== 'coach') {
      return NextResponse.json({ error: 'Only coaches can set working hours' }, { status: 403 });
    }

    const body = await request.json();
    const { workingHours, timezone } = body;

    if (!workingHours || !Array.isArray(workingHours)) {
      return NextResponse.json(
        { error: 'Invalid working hours format' },
        { status: 400 }
      );
    }

    // Validate working hours structure
    const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    for (const day of workingHours) {
      if (!daysOfWeek.includes(day.day)) {
        return NextResponse.json(
          { error: `Invalid day: ${day.day}` },
          { status: 400 }
        );
      }
      if (day.enabled && (!day.startTime || !day.endTime)) {
        return NextResponse.json(
          { error: `Start and end time required for enabled day: ${day.day}` },
          { status: 400 }
        );
      }
    }

    // Get coach's timezone from Google Calendar integration if not provided
    let coachTimezone = timezone;
    if (!coachTimezone) {
      try {
        const integration = await integrationRepo.getCoachIntegration(session.user.id, 'google_calendar');
        if (integration?.settings?.timeZone) {
          coachTimezone = integration.settings.timeZone;
        } else {
          // Fallback to UTC if no timezone found
          coachTimezone = 'UTC';
        }
      } catch (error) {
        console.warn('Failed to get coach timezone from integration:', error);
        coachTimezone = 'UTC';
      }
    }

    // Ensure workingHours column exists
    try {
      await sql`
        ALTER TABLE "User" 
        ADD COLUMN IF NOT EXISTS "workingHours" JSONB DEFAULT '[]'::jsonb
      `;
    } catch (migrationError) {
      // Column might already exist, ignore error
      console.log('Migration check for workingHours:', migrationError.message);
    }

    // Store working hours with timezone info
    const workingHoursWithTimezone = {
      hours: workingHours,
      timezone: coachTimezone
    };

    // Update working hours
    const updatedUser = await sql`
      UPDATE "User" 
      SET 
        "workingHours" = ${JSON.stringify(workingHoursWithTimezone)}::jsonb,
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = ${session.user.id}
      RETURNING 
        id,
        "workingHours"
    `;

    if (updatedUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Working hours updated successfully',
      workingHours: updatedUser[0].workingHours
    });

  } catch (error) {
    console.error('Error updating working hours:', error);
    return NextResponse.json(
      { error: 'Failed to update working hours' },
      { status: 500 }
    );
  }
}

// Helper function to get default working hours
function getDefaultWorkingHours() {
  return [
    { day: 'monday', enabled: true, startTime: '09:00', endTime: '17:00' },
    { day: 'tuesday', enabled: true, startTime: '09:00', endTime: '17:00' },
    { day: 'wednesday', enabled: true, startTime: '09:00', endTime: '17:00' },
    { day: 'thursday', enabled: true, startTime: '09:00', endTime: '17:00' },
    { day: 'friday', enabled: true, startTime: '09:00', endTime: '17:00' },
    { day: 'saturday', enabled: false, startTime: '09:00', endTime: '17:00' },
    { day: 'sunday', enabled: false, startTime: '09:00', endTime: '17:00' }
  ];
}
