import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/lib/authoption';
import { sql } from '@/app/lib/db/postgresql';

// GET /api/clients/[id]/progress - Get real client progress data
export async function GET(request, { params }) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: clientId } = await params;

        if (!clientId) {
            return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
        }

        // Verify coach has access to this client
        const clientResult = await sql`
            SELECT c.id, c."userId", c.name, c.status
            FROM "Client" c
            WHERE c.id = ${clientId} AND c."coachId" = ${session.user.id}
            LIMIT 1
        `;

        if (clientResult.length === 0) {
            return NextResponse.json({ error: 'Client not found or access denied' }, { status: 404 });
        }

        const client = clientResult[0];

        // Get real data for the last 8 weeks
        const eightWeeksAgo = new Date();
        eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56); // 8 weeks ago

        // 1. Get daily check-ins for wellbeing calculation
        const checkInsResult = await sql`
            SELECT 
                date,
                "sleepQuality",
                nutrition,
                "physicalActivity",
                learning,
                "maintainingRelationships",
                "excessiveSocialMedia",
                procrastination,
                "negativeThinking"
            FROM "CheckIn"
            WHERE "clientId" = ${clientId}
            AND date >= ${eightWeeksAgo.toISOString().split('T')[0]}
            ORDER BY date ASC
        `;

        // 2. Get task completions for performance calculation
        const taskCompletionsResult = await sql`
            SELECT 
                tc."completedAt",
                t.title,
                t."taskType"
            FROM "TaskCompletion" tc
            JOIN "Task" t ON tc."taskId" = t.id
            WHERE tc."clientId" = ${clientId}
            AND tc."completedAt" >= ${eightWeeksAgo}
            ORDER BY tc."completedAt" ASC
        `;

        // 3. Get session attendance for performance calculation
        const sessionAttendanceResult = await sql`
            SELECT 
                s."sessionDate",
                s.status,
                s."sessionType"
            FROM "Session" s
            WHERE (s."clientId" = ${clientId} OR ${clientId} = ANY(
                SELECT unnest(g."selectedMembers")
                FROM "Group" g
                WHERE g.id = s."groupId"
            ))
            AND s."sessionDate" >= ${eightWeeksAgo}
            ORDER BY s."sessionDate" ASC
        `;

        // 4. Get resource views for engagement tracking (using ResourceCompletion)
        const resourceViewsResult = await sql`
            SELECT 
                rc."completedAt" as date,
                rc."resourceId",
                r.title
            FROM "ResourceCompletion" rc
            JOIN "Resource" r ON rc."resourceId" = r.id
            WHERE rc."clientId" = ${clientId}
            AND rc."completedAt" >= ${eightWeeksAgo}
            ORDER BY rc."completedAt" ASC
        `;

        // Process data into weekly format
        const weeklyData = [];
        const weeks = ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6", "Week 7", "Week 8"];

        for (let i = 0; i < 8; i++) {
            const weekStart = new Date(eightWeeksAgo);
            weekStart.setDate(weekStart.getDate() + (i * 7));
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);

            // Calculate wellbeing score from check-ins
            const weekCheckIns = checkInsResult.filter(checkin => {
                const checkinDate = new Date(checkin.date);
                return checkinDate >= weekStart && checkinDate <= weekEnd;
            });

            let wellbeingScore = 0; // No data = 0 score
            if (weekCheckIns.length > 0) {
                const avgSleep = weekCheckIns.reduce((sum, c) => sum + c.sleepQuality, 0) / weekCheckIns.length;
                const avgNutrition = weekCheckIns.reduce((sum, c) => sum + c.nutrition, 0) / weekCheckIns.length;
                const avgPhysical = weekCheckIns.reduce((sum, c) => sum + c.physicalActivity, 0) / weekCheckIns.length;
                const avgLearning = weekCheckIns.reduce((sum, c) => sum + c.learning, 0) / weekCheckIns.length;
                const avgRelationships = weekCheckIns.reduce((sum, c) => sum + c.maintainingRelationships, 0) / weekCheckIns.length;

                // Reduce negative habits
                const avgSocialMedia = weekCheckIns.reduce((sum, c) => sum + c.excessiveSocialMedia, 0) / weekCheckIns.length;
                const avgProcrastination = weekCheckIns.reduce((sum, c) => sum + c.procrastination, 0) / weekCheckIns.length;
                const avgNegativeThinking = weekCheckIns.reduce((sum, c) => sum + c.negativeThinking, 0) / weekCheckIns.length;

                // Calculate wellbeing: positive factors - negative factors, normalized to 1-10
                const positiveScore = (avgSleep + avgNutrition + avgPhysical + avgLearning + avgRelationships) / 5;
                const negativeScore = (avgSocialMedia + avgProcrastination + avgNegativeThinking) / 3;
                wellbeingScore = Math.max(1, Math.min(10, positiveScore - (negativeScore - 2.5) * 0.5));
            }

            // Calculate performance score using completion rates
            const weekTasks = taskCompletionsResult.filter(task => {
                const taskDate = new Date(task.completedAt);
                return taskDate >= weekStart && taskDate <= weekEnd;
            });

            const weekSessions = sessionAttendanceResult.filter(session => {
                const sessionDate = new Date(session.sessionDate);
                return sessionDate >= weekStart && sessionDate <= weekEnd;
            });

            const weekResources = resourceViewsResult.filter(resource => {
                const resourceDate = new Date(resource.date);
                return resourceDate >= weekStart && resourceDate <= weekEnd;
            });

            // Get total available tasks for this week (due during this week)
            const weekAvailableTasks = await sql`
                SELECT COUNT(*) as total
                FROM "Task" t
                WHERE t."clientId" = ${clientId}
                AND t."dueDate" >= ${weekStart.toISOString().split('T')[0]}
                AND t."dueDate" <= ${weekEnd.toISOString().split('T')[0]}
            `;

            // Get total available resources for this client (all assigned resources)
            const totalAvailableResources = await sql`
                SELECT COUNT(*) as total
                FROM "Resource" r
                WHERE ${clientId} = ANY(r."clientIds")
                OR EXISTS (
                    SELECT 1 FROM "Group" g 
                    WHERE g.id = ANY(r."groupIds") 
                    AND ${clientId} = ANY(g."selectedMembers")
                )
            `;

            // Performance calculation using completion rates (0-10 scale)
            // If no data available, set to 0 instead of default values
            const attendanceRate = weekSessions.length > 0 ?
                (weekSessions.filter(s => s.status === 'completed').length / weekSessions.length) * 10 : 0;

            const taskCompletionRate = weekAvailableTasks[0]?.total > 0 ?
                (weekTasks.length / weekAvailableTasks[0].total) * 10 : 0;

            const resourceCompletionRate = totalAvailableResources[0]?.total > 0 ?
                (weekResources.length / totalAvailableResources[0].total) * 10 : 0;

            // Check-in consistency: assume 7 days per week is ideal
            const checkInConsistency = Math.min((weekCheckIns.length / 7) * 10, 10);

            const performanceScore = (
                attendanceRate * 0.3 +           // Session attendance (30%)
                taskCompletionRate * 0.25 +       // Task completion (25%)
                resourceCompletionRate * 0.25 +  // Resource engagement (25%)
                checkInConsistency * 0.2         // Daily check-in consistency (20%)
            );

            weeklyData.push({
                week: weeks[i],
                performance: Math.round(performanceScore * 10) / 10,
                wellbeing: Math.round(wellbeingScore * 10) / 10,
                checkIns: weekCheckIns.length,
                tasksCompleted: weekTasks.length,
                sessionsAttended: weekSessions.filter(s => s.status === 'completed').length,
                resourcesViewed: weekResources.length
            });
        }

        // Calculate current metrics (latest week)
        const currentMetrics = weeklyData[weeklyData.length - 1] || { performance: 0, wellbeing: 0 };

        // Calculate additional stats
        const totalCheckIns = checkInsResult.length;
        const totalTasksCompleted = taskCompletionsResult.length;
        const totalSessionsAttended = sessionAttendanceResult.filter(s => s.status === 'completed').length;
        const totalSessionsScheduled = sessionAttendanceResult.length;

        // Calculate journal completion rate based on recent activity (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentCheckIns = checkInsResult.filter(checkin =>
            new Date(checkin.date) >= sevenDaysAgo
        ).length;

        const journalCompletionRate = Math.round((recentCheckIns / 7) * 100);

        const sessionAttendanceRate = totalSessionsScheduled > 0 ?
            Math.round((totalSessionsAttended / totalSessionsScheduled) * 100) : 0;

        return NextResponse.json({
            clientId: client.id,
            clientName: client.name,
            currentMetrics: {
                performance: currentMetrics.performance,
                wellbeing: currentMetrics.wellbeing
            },
            weeklyData,
            stats: {
                journalCompletionRate,
                sessionAttendanceRate,
                totalCheckIns,
                totalTasksCompleted,
                totalSessionsAttended,
                totalSessionsScheduled
            }
        });

    } catch (error) {
        console.error('Get client progress error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
