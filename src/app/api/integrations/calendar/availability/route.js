import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/lib/authoption';
import { integrationRepo } from '@/app/lib/db/integrationSchema';
import { GoogleCalendarService } from '@/app/lib/services/IntegrationService';
import { sql } from '@/app/lib/db/postgresql';

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date'); // YYYY-MM-DD format
        
        if (!date) {
            return NextResponse.json(
                { error: 'Date parameter is required' },
                { status: 400 }
            );
        }
        
        const coachId = session.user.id;
        
        // Get Google Calendar integration
        const integration = await integrationRepo.getCoachIntegration(
            coachId, 
            'google_calendar'
        );
        
        if (!integration || !integration.isActive) {
            // No Google Calendar connected - return empty events
            return NextResponse.json({
                success: true,
                events: [],
                connected: false
            });
        }
        
        // Fetch events from Google Calendar
        const googleService = new GoogleCalendarService(integration);
        const result = await googleService.getEventsForDate(date);
        
        // Get coach's working hours and timezone
        let workingHours = null;
        let coachTimezone = null;
        try {
            const coachData = await sql`
                SELECT "workingHours"
                FROM "User"
                WHERE id = ${coachId} AND role = 'coach'
                LIMIT 1
            `;
            if (coachData.length > 0 && coachData[0].workingHours) {
                const whData = coachData[0].workingHours;
                // Handle both old format (array) and new format (object with timezone)
                if (Array.isArray(whData)) {
                    workingHours = whData;
                } else if (whData.hours) {
                    workingHours = whData.hours;
                    coachTimezone = whData.timezone;
                } else {
                    workingHours = whData;
                }
            }
            
            // If no timezone in working hours, get from Google Calendar integration
            if (!coachTimezone && integration?.settings?.timeZone) {
                coachTimezone = integration.settings.timeZone;
            }
        } catch (error) {
            // If workingHours column doesn't exist, ignore
            console.log('Working hours not available:', error.message);
        }
        
        if (result.success) {
            return NextResponse.json({
                success: true,
                events: result.events,
                connected: true,
                workingHours: workingHours,
                coachTimezone: coachTimezone
            });
        } else {
            // If fetch fails, return empty but indicate connection exists
            return NextResponse.json({
                success: false,
                events: [],
                connected: true,
                error: result.error,
                workingHours: workingHours,
                coachTimezone: coachTimezone
            });
        }
    } catch (error) {
        console.error('Error fetching calendar availability:', error);
        return NextResponse.json(
            { error: 'Failed to fetch calendar availability' },
            { status: 500 }
        );
    }
}

