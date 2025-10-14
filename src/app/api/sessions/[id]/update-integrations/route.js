import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/lib/authoption';
import { integrationRepo } from '@/app/lib/db/integrationSchema';
import { getIntegrationService } from '@/app/lib/services/IntegrationService';
import { sql } from '@/app/lib/db/postgresql';

export async function PUT(request, { params }) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const { sessionData, attendees } = await request.json();

        if (!sessionData || !attendees || !Array.isArray(attendees)) {
            return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
        }

        const coachId = session.user.id;
        let notificationsSent = 0;

        // Get the current session to check for existing integrations
        const currentSession = await sql`
            SELECT id, "meetingLink", "integrationPlatform", "integrationSettings"
            FROM "Session"
            WHERE id = ${id}
        `;

        if (currentSession.length === 0) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        const sessionRecord = currentSession[0];

        // Get coach's active integrations
        const integrations = await integrationRepo.getCoachIntegrations(coachId);

        const results = {};
        let updatedMeetingLink = sessionRecord.meetingLink;
        let updatedIntegrationPlatform = sessionRecord.integrationPlatform;

        // Update integrations for each platform
        console.log('🔄 Processing integrations for session:', {
            sessionId: id,
            currentIntegrationPlatform: sessionRecord.integrationPlatform,
            currentMeetingLink: sessionRecord.meetingLink,
            activeIntegrations: integrations.map(i => ({ platform: i.platform, isActive: i.isActive }))
        });

        for (const integration of integrations) {
            if (!integration.isActive) {
                continue;
            }

            const platform = integration.platform;

            // Check if we have a meeting link to update for this platform
            if (!sessionRecord.meetingLink) {
                console.log(`⚠️ No existing meeting link found for ${platform}, skipping update`);
                results[platform] = { success: false, error: 'No existing meeting link to update' };
                continue;
            }

            // Skip platforms that don't match the meeting link type
            const isGoogleCalendarLink = sessionRecord.meetingLink.includes('google.com/calendar/event');
            const isZoomLink = sessionRecord.meetingLink.includes('zoom.us');
            const isTeamsLink = sessionRecord.meetingLink.includes('teams.microsoft.com');

            if (platform === 'google_calendar' && !isGoogleCalendarLink) {
                console.log(`🔄 Skipping ${platform} integration - meeting link is not Google Calendar`);
                continue;
            }
            if (platform === 'zoom' && !isZoomLink) {
                console.log(`🔄 Skipping ${platform} integration - meeting link is not Zoom`);
                continue;
            }
            if (platform === 'teams' && !isTeamsLink) {
                console.log(`🔄 Skipping ${platform} integration - meeting link is not Teams`);
                continue;
            }

            console.log(`🔄 Processing ${platform} integration for session with platform: ${sessionRecord.integrationPlatform}`);

            try {
                const integrationService = getIntegrationService(platform, integration);

                // Prepare session data for integration update
                const integrationData = {
                    ...sessionData,
                    coachId: coachId,
                    attendees: attendees,
                    meetingLink: sessionRecord.meetingLink,
                    integrationSettings: sessionRecord.integrationSettings ? JSON.parse(sessionRecord.integrationSettings) : {}
                };

                let updateResult;

                if (platform === 'google_calendar') {
                    // For Google Calendar, update the event
                    console.log(`🔄 Calling Google Calendar updateEvent for session with platform: ${sessionRecord.integrationPlatform}`);
                    updateResult = await integrationService.updateEvent(integrationData, sessionRecord.meetingLink);
                } else if (platform === 'zoom') {
                    // For Zoom, update the meeting
                    console.log(`🔄 Calling Zoom updateMeeting for session with platform: ${sessionRecord.integrationPlatform}`);
                    updateResult = await integrationService.updateMeeting(integrationData, sessionRecord.meetingLink);
                } else if (platform === 'teams') {
                    // For Teams, update the meeting
                    console.log(`🔄 Calling Teams updateMeeting for session with platform: ${sessionRecord.integrationPlatform}`);
                    updateResult = await integrationService.updateMeeting(integrationData, sessionRecord.meetingLink);
                } else {
                    console.log(`⚠️ Unsupported platform: ${platform}`);
                    results[platform] = { success: false, error: 'Unsupported platform for update' };
                    continue;
                }

                if (updateResult && updateResult.success) {
                    // Update meeting link if provided
                    if (updateResult.meetingLink) {
                        updatedMeetingLink = updateResult.meetingLink;
                        updatedIntegrationPlatform = platform;
                    }

                    results[platform] = {
                        success: true,
                        meetingId: updateResult.meetingId,
                        meetingLink: updateResult.meetingLink,
                        data: updateResult
                    };
                    console.log(`✅ ${platform} integration updated successfully`);
                } else {
                    results[platform] = {
                        success: false,
                        error: updateResult?.error || 'Failed to update integration'
                    };
                    console.error(`❌ ${platform} integration update failed:`, updateResult);
                }

            } catch (platformError) {
                console.error(`❌ Error updating ${platform} integration:`, platformError);
                results[platform] = {
                    success: false,
                    error: platformError.message
                };
            }
        }

        // Update the session with any new meeting link or integration data
        if (updatedMeetingLink !== sessionRecord.meetingLink || updatedIntegrationPlatform !== sessionRecord.integrationPlatform) {
            try {
                await sql`
                    UPDATE "Session"
                    SET "meetingLink" = ${updatedMeetingLink},
                        "integrationPlatform" = ${updatedIntegrationPlatform},
                        "integrationSettings" = ${JSON.stringify(sessionData.integrationSettings || {})},
                        "updatedAt" = NOW()
                    WHERE id = ${id}
                `;
                console.log('✅ Session updated with new integration data');
            } catch (updateError) {
                console.error('❌ Error updating session with integration data:', updateError);
            }
        }

        // Send in-app notifications to all attendees
        try {
            for (const attendeeEmail of attendees) {
                try {
                    // Get user ID from email
                    const userResult = await sql`
                        SELECT id FROM "User" WHERE email = ${attendeeEmail}
                    `;

                    if (userResult.length > 0) {
                        const userId = userResult[0].id;

                        // Create notification
                        await sql`
                            INSERT INTO "Notification" (
                                "userId", "type", "title", "message", "isRead", "priority"
                            ) VALUES (
                                ${userId},
                                'session_reminder',
                                'Session Updated',
                                ${`Your session "${sessionData.title}" has been updated. Please check the new details.`},
                                false,
                                'normal'
                            )
                        `;

                        notificationsSent++;
                    }
                } catch (notificationError) {
                    console.error(`❌ Failed to send notification to ${attendeeEmail}:`, notificationError);
                }
            }
        } catch (notificationError) {
            console.error('❌ Error sending notifications:', notificationError);
        }

        return NextResponse.json({
            success: true,
            results,
            notificationsSent,
            message: `Session updated successfully. ${notificationsSent} notification(s) sent.`
        });

    } catch (error) {
        console.error('❌ Error in update-integrations API:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
