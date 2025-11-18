import { NextResponse } from 'next/server';
import { sql } from '@/app/lib/db/postgresql';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/lib/authoption';
import { userStatsRepo } from '@/app/lib/db/userStatsRepo';

// GET /api/analytics - Get analytics data for dashboard
export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period') || 'today';
        const dateParam = searchParams.get('date'); // Optional date parameter for specific date

        // Get the client ID
        const clientResult = await sql`
            SELECT id FROM "Client" 
            WHERE "userId" = ${session.user.id}
            LIMIT 1
        `;

        if (clientResult.length === 0) {
            return NextResponse.json(
                { error: 'Client record not found' },
                { status: 404 }
            );
        }

        const clientId = clientResult[0].id;

        // Helper function to format date in local timezone (YYYY-MM-DD)
        // PostgreSQL DATE type stores just the date part, no timezone conversion needed
        const formatDateLocal = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        // Calculate date range based on period
        // If dateParam is provided, use it directly (it's already in YYYY-MM-DD format from client)
        // Otherwise, use today's date in server's local timezone
        let targetDateStr;
        if (dateParam) {
            // Use the date string directly - it's already in local timezone format from client
            targetDateStr = dateParam;
        } else {
            // Get today's date in server's local timezone
            const today = new Date();
            targetDateStr = formatDateLocal(today);
        }

        // Parse the target date to calculate ranges
        const targetDate = new Date(targetDateStr + 'T12:00:00'); // Use noon to avoid timezone issues
        const endDate = new Date(targetDate);
        const startDate = new Date(targetDate);

        switch (period) {
            case 'today':
                // Use the specific date if provided, otherwise use today
                startDate.setDate(endDate.getDate());
                break;
            case 'week':
                // For week, calculate 7 days ending on targetDate
                startDate.setDate(endDate.getDate() - 6);
                break;
            case 'month':
                // For month, calculate 30 days ending on targetDate
                startDate.setDate(endDate.getDate() - 29);
                break;
        }

        // Format dates in local timezone (no UTC conversion)
        const startDateStr = formatDateLocal(startDate);
        const endDateStr = formatDateLocal(endDate);

        // Map database fields to goal analytics format
        const goalMapping = {
            sleepQuality: { name: "Sleep Quality", color: "#3b82f6", icon: "😴" },
            nutrition: { name: "Nutrition", color: "#10b981", icon: "🥗" },
            physicalActivity: { name: "Physical Activity", color: "#8b5cf6", icon: "💪" },
            learning: { name: "Learning", color: "#f59e0b", icon: "📚" },
            maintainingRelationships: { name: "Relationships", color: "#06b6d4", icon: "👥" }
        };

        // Calculate goal distribution based on period
        let goalDistribution = [];

        if (period === 'today') {
            // For today, query the specific date directly
            const todayCheckInResult = await sql`
                SELECT * FROM "CheckIn" 
                WHERE "clientId" = ${clientId} 
                AND date = ${targetDateStr}
                LIMIT 1
            `;

            if (todayCheckInResult.length > 0) {
                const todayCheckIn = todayCheckInResult[0];
                goalDistribution = Object.entries(goalMapping).map(([field, config]) => ({
                    id: field,
                    name: config.name,
                    value: todayCheckIn[field] || 0,
                    color: config.color,
                    icon: config.icon
                }));
            } else {
                // No check-in for this date, return zeros
                goalDistribution = Object.entries(goalMapping).map(([field, config]) => ({
                    id: field,
                    name: config.name,
                    value: 0,
                    color: config.color,
                    icon: config.icon
                }));
            }
        } else if (period === 'week' || period === 'month') {
            // Get check-ins for the specified period
            const checkInsResult = await sql`
                SELECT * FROM "CheckIn" 
                WHERE "clientId" = ${clientId} 
                AND date >= ${startDateStr} 
                AND date <= ${endDateStr}
                ORDER BY date DESC
            `;
            // For week/month, calculate averages
            if (checkInsResult.length > 0) {
                const goalFields = Object.keys(goalMapping);
                goalDistribution = Object.entries(goalMapping).map(([field, config]) => {
                    const sum = checkInsResult.reduce((acc, checkIn) => acc + (checkIn[field] || 0), 0);
                    const average = Math.round((sum / checkInsResult.length) * 10) / 10; // Round to 1 decimal
                    return {
                        id: field,
                        name: config.name,
                        value: average,
                        color: config.color,
                        icon: config.icon
                    };
                });
            } else {
                // No check-ins in period, return zeros
                goalDistribution = Object.entries(goalMapping).map(([field, config]) => ({
                    id: field,
                    name: config.name,
                    value: 0,
                    color: config.color,
                    icon: config.icon
                }));
            }
        }

        // Transform historical data for line chart
        // const historicalData = checkInsResult.map(entry => ({
        //     date: entry.date,
        //     goalScores: {
        //         sleepQuality: entry.sleepQuality,
        //         nutrition: entry.nutrition,
        //         physicalActivity: entry.physicalActivity,
        //         learning: entry.learning,
        //         maintainingRelationships: entry.maintainingRelationships
        //     }
        // }));

        // Get check-in notes for the current date (regardless of period)
        const currentDateCheckIn = await sql`
            SELECT notes FROM "CheckIn" 
            WHERE "clientId" = ${clientId} 
            AND date = ${targetDateStr}
            LIMIT 1
        `;

        const currentDateNotes = currentDateCheckIn.length > 0 ? currentDateCheckIn[0].notes : null;
        // Get user stats (pre-computed values)
        const userStats = await userStatsRepo.getUserStats(session.user.id);
        return NextResponse.json({
            goalDistribution,
            dailyStreak: userStats.daily_streak,
            totalEngagementPoints: userStats.total_points,
            currentDateNotes: currentDateNotes
        });

    } catch (error) {
        console.error('Error retrieving analytics data:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
