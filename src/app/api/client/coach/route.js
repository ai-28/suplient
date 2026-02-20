import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/lib/authoption';
import { sql } from '@/app/lib/db/postgresql';

export async function GET(request) {
    try {

        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (session.user.role !== 'client') {
            return NextResponse.json({ error: 'Only clients can access this endpoint' }, { status: 403 });
        }

        // Get the client's coach information
        const result = await sql`
            SELECT 
                u.id as "clientUserId",
                u."coachId",
                u_coach.id as "coachUserId",
                u_coach.name as "coachName",
                u_coach.email as "coachEmail",
                u_coach.phone as "coachPhone",
                u_coach.avatar as "coachAvatar"
            FROM "User" u
            JOIN "User" u_coach ON u."coachId" = u_coach.id
            WHERE u.id = ${session.user.id}
            AND u.role = 'client'
            LIMIT 1
        `;
        
        // Get coach's timezone and default meeting type
        let coachTimezone = 'UTC';
        let defaultMeetingType = 'none';
        if (result.length > 0) {
            try {
                const { integrationRepo } = await import('@/app/lib/db/integrationSchema');
                
                // Get all coach integrations
                const integrations = await integrationRepo.getCoachIntegrations(result[0].coachUserId);
                
                // Get timezone from Google Calendar integration
                const googleIntegration = integrations.find(i => i.platform === 'google_calendar');
                if (googleIntegration?.settings?.timeZone) {
                    coachTimezone = googleIntegration.settings.timeZone;
                }
                
                // Get default meeting type from database
                try {
                    const userData = await sql`
                        SELECT "defaultMeetingType"
                        FROM "User"
                        WHERE id = ${result[0].coachUserId}
                    `;
                    if (userData.length > 0 && userData[0].defaultMeetingType) {
                        defaultMeetingType = userData[0].defaultMeetingType;
                    }
                } catch (dbError) {
                    // If column doesn't exist, fallback to determining from integrations
                    if (dbError.message?.includes('column "defaultMeetingType" does not exist')) {
                        // Determine default meeting type based on connected integrations
                        // Priority: Google Meet > Zoom > Teams
                        const connectedIntegrations = integrations.filter(i => i.isActive);
                        if (connectedIntegrations.some(i => i.platform === 'google_calendar')) {
                            defaultMeetingType = 'google_meet';
                        } else if (connectedIntegrations.some(i => i.platform === 'zoom')) {
                            defaultMeetingType = 'zoom';
                        } else if (connectedIntegrations.some(i => i.platform === 'teams')) {
                            defaultMeetingType = 'teams';
                        }
                    } else {
                        console.warn('Failed to get default meeting type from database:', dbError);
                    }
                }
            } catch (error) {
                console.warn('Failed to get coach integrations:', error);
            }
        }

        if (result.length === 0) {

            // Check if client exists but has no coach
            const clientCheck = await sql`
                SELECT id, "coachId", name, email, role
                FROM "User" 
                WHERE id = ${session.user.id}
                AND role = 'client'
            `;


            if (clientCheck.length === 0) {
                return NextResponse.json({
                    success: false,
                    error: 'Client not found'
                }, { status: 404 });
            } else if (!clientCheck[0].coachId) {
                return NextResponse.json({
                    success: false,
                    error: 'No coach assigned to this client'
                }, { status: 404 });
            } else {
                return NextResponse.json({
                    success: false,
                    error: 'Coach not found in database'
                }, { status: 404 });
            }
        }

        const clientCoachData = result[0];

        const coach = {
            id: clientCoachData.coachUserId,
            name: clientCoachData.coachName,
            email: clientCoachData.coachEmail,
            phone: clientCoachData.coachPhone,
            avatar: clientCoachData.coachAvatar,
            timezone: coachTimezone,
            defaultMeetingType: defaultMeetingType
        };

        return NextResponse.json({
            success: true,
            coach: coach
        });

    } catch (error) {
        console.error('❌ Error in client coach API:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch coach information',
                details: error.message
            },
            { status: 500 }
        );
    }
}