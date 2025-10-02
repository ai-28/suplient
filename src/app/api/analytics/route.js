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
        const now = new Date();
        const endDate = new Date(now);
        const startDate = new Date(now);

        switch (period) {
            case 'today':
                startDate.setDate(endDate.getDate());
                break;
            case 'week':
                startDate.setDate(endDate.getDate() - 6);
                break;
            case 'month':
                startDate.setDate(endDate.getDate() - 29);
                break;
        }

        // PostgreSQL stores dates in UTC, so use UTC consistently
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];

        // Get check-ins for the specified period
        const checkInsResult = await sql`
            SELECT * FROM "CheckIn" 
            WHERE "clientId" = ${clientId} 
            AND date >= ${startDateStr} 
            AND date <= ${endDateStr}
            ORDER BY date DESC
        `;

        // Get the most recent check-in for current goal scores
        const latestCheckInResult = await sql`
            SELECT * FROM "CheckIn" 
            WHERE "clientId" = ${clientId} 
            ORDER BY date DESC
            LIMIT 1
        `;

        // Map database fields to goal analytics format
        const goalMapping = {
            sleepQuality: { name: "Sleep Quality", color: "#3b82f6", icon: "😴" },
            nutrition: { name: "Nutrition", color: "#10b981", icon: "🥗" },
            physicalActivity: { name: "Physical Activity", color: "#8b5cf6", icon: "💪" },
            learning: { name: "Learning", color: "#f59e0b", icon: "📚" },
            maintainingRelationships: { name: "Relationships", color: "#06b6d4", icon: "👥" }
        };

        // Get current goal distribution from latest check-in
        let goalDistribution = [];
        if (latestCheckInResult.length > 0) {
            const latestCheckIn = latestCheckInResult[0];
            goalDistribution = Object.entries(goalMapping).map(([field, config]) => ({
                id: field,
                name: config.name,
                value: latestCheckIn[field] || 0,
                color: config.color,
                icon: config.icon
            }));
        }

        // Transform historical data for line chart
        const historicalData = checkInsResult.map(entry => ({
            date: entry.date,
            goalScores: {
                sleepQuality: entry.sleepQuality,
                nutrition: entry.nutrition,
                physicalActivity: entry.physicalActivity,
                learning: entry.learning,
                maintainingRelationships: entry.maintainingRelationships
            }
        }));

        // Get user stats (pre-computed values)
        const userStats = await userStatsRepo.getUserStats(session.user.id);
        return NextResponse.json({
            goalDistribution,
            historicalData,
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
