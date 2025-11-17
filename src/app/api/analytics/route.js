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

        // Calculate date range based on period
        let targetDate = dateParam ? new Date(dateParam) : new Date();
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

        // PostgreSQL stores dates in UTC, so use UTC consistently
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];
        const targetDateStr = targetDate.toISOString().split('T')[0];

        // Get check-ins for the specified period
        const checkInsResult = await sql`
            SELECT * FROM "CheckIn" 
            WHERE "clientId" = ${clientId} 
            AND date >= ${startDateStr} 
            AND date <= ${endDateStr}
            ORDER BY date DESC
        `;

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
            // For today, get the specific date's check-in
            // Compare dates at date level only (ignore time)
            const todayCheckIn = checkInsResult.find(ci => {
                // Convert database date to date string for comparison
                const checkInDate = ci.date instanceof Date
                    ? ci.date.toISOString().split('T')[0]
                    : new Date(ci.date).toISOString().split('T')[0];
                return checkInDate === targetDateStr;
            });
            if (todayCheckIn) {
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

        // Get user stats (pre-computed values)
        const userStats = await userStatsRepo.getUserStats(session.user.id);
        return NextResponse.json({
            goalDistribution,
            dailyStreak: userStats.daily_streak,
            totalEngagementPoints: userStats.total_points
        });

    } catch (error) {
        console.error('Error retrieving analytics data:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
