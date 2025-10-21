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

        // Get client ID from user ID
        const clientResult = await sql`
            SELECT id FROM "Client" WHERE "userId" = ${session.user.id}
        `;

        if (clientResult.length === 0) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        const clientId = clientResult[0].id;

        // Get the latest check-in data for goals
        const latestCheckIn = await sql`
            SELECT 
                "sleepQuality",
                nutrition,
                "physicalActivity",
                learning,
                "maintainingRelationships",
                "excessiveSocialMedia",
                procrastination,
                "negativeThinking",
                date
            FROM "CheckIn"
            WHERE "clientId" = ${clientId}
            ORDER BY date DESC
            LIMIT 1
        `;

        // Get average scores for the last 30 days
        const averageScores = await sql`
            SELECT 
                AVG("sleepQuality") as "avgSleepQuality",
                AVG(nutrition) as "avgNutrition",
                AVG("physicalActivity") as "avgPhysicalActivity",
                AVG(learning) as "avgLearning",
                AVG("maintainingRelationships") as "avgMaintainingRelationships",
                AVG("excessiveSocialMedia") as "avgExcessiveSocialMedia",
                AVG(procrastination) as "avgProcrastination",
                AVG("negativeThinking") as "avgNegativeThinking"
            FROM "CheckIn"
            WHERE "clientId" = ${clientId}
            AND date >= CURRENT_DATE - INTERVAL '30 days'
        `;

        // Get total check-ins count
        const checkInCount = await sql`
            SELECT COUNT(*) as total_checkins
            FROM "CheckIn"
            WHERE "clientId" = ${clientId}
        `;

        const goals = {
            // Good goals
            sleepQuality: {
                id: 1,
                name: "Sleep Quality",
                description: "Track your sleep quality and rest patterns",
                icon: "😴",
                color: "#3B82F6",
                category: "health",
                isActive: true,
                currentScore: latestCheckIn.length > 0 ? latestCheckIn[0].sleepQuality : 3,
                averageScore: averageScores.length > 0 ? Math.round(averageScores[0].avgSleepQuality * 10) / 10 : 3
            },
            nutrition: {
                id: 2,
                name: "Nutrition",
                description: "Monitor your eating habits and nutrition intake",
                icon: "🥗",
                color: "#10B981",
                category: "health",
                isActive: true,
                currentScore: latestCheckIn.length > 0 ? latestCheckIn[0].nutrition : 3,
                averageScore: averageScores.length > 0 ? Math.round(averageScores[0].avgNutrition * 10) / 10 : 3
            },
            physicalActivity: {
                id: 3,
                name: "Physical Activity",
                description: "Track your exercise and physical movement",
                icon: "🏃‍♂️",
                color: "#F59E0B",
                category: "health",
                isActive: true,
                currentScore: latestCheckIn.length > 0 ? latestCheckIn[0].physicalActivity : 3,
                averageScore: averageScores.length > 0 ? Math.round(averageScores[0].avgPhysicalActivity * 10) / 10 : 3
            },
            learning: {
                id: 4,
                name: "Learning & Growth",
                description: "Focus on personal development and learning",
                icon: "📚",
                color: "#8B5CF6",
                category: "personal",
                isActive: true,
                currentScore: latestCheckIn.length > 0 ? latestCheckIn[0].learning : 3,
                averageScore: averageScores.length > 0 ? Math.round(averageScores[0].avgLearning * 10) / 10 : 3
            },
            maintainingRelationships: {
                id: 5,
                name: "Relationships",
                description: "Nurture your social connections and relationships",
                icon: "👥",
                color: "#EC4899",
                category: "social",
                isActive: true,
                currentScore: latestCheckIn.length > 0 ? latestCheckIn[0].maintainingRelationships : 3,
                averageScore: averageScores.length > 0 ? Math.round(averageScores[0].avgMaintainingRelationships * 10) / 10 : 3
            }
        };

        const badHabits = {
            excessiveSocialMedia: {
                id: 1,
                name: "Excessive Social Media",
                description: "Reduce time spent on social media platforms",
                icon: "📱",
                color: "#EF4444",
                category: "digital",
                isActive: true,
                currentScore: latestCheckIn.length > 0 ? latestCheckIn[0].excessiveSocialMedia : 2,
                averageScore: averageScores.length > 0 ? Math.round(averageScores[0].avgExcessiveSocialMedia * 10) / 10 : 2
            },
            procrastination: {
                id: 2,
                name: "Procrastination",
                description: "Work on reducing procrastination habits",
                icon: "⏰",
                color: "#F97316",
                category: "productivity",
                isActive: true,
                currentScore: latestCheckIn.length > 0 ? latestCheckIn[0].procrastination : 2,
                averageScore: averageScores.length > 0 ? Math.round(averageScores[0].avgProcrastination * 10) / 10 : 2
            },
            negativeThinking: {
                id: 3,
                name: "Negative Thinking",
                description: "Develop more positive thought patterns",
                icon: "🧠",
                color: "#6B7280",
                category: "mental",
                isActive: true,
                currentScore: latestCheckIn.length > 0 ? latestCheckIn[0].negativeThinking : 2,
                averageScore: averageScores.length > 0 ? Math.round(averageScores[0].avgNegativeThinking * 10) / 10 : 2
            }
        };

        return NextResponse.json({
            success: true,
            goals: Object.values(goals),
            badHabits: Object.values(badHabits),
            totalCheckIns: checkInCount[0]?.total_checkins || 0,
            lastCheckInDate: latestCheckIn.length > 0 ? latestCheckIn[0].date : null
        });

    } catch (error) {
        console.error('Error fetching client goals:', error);
        return NextResponse.json(
            { error: 'Failed to fetch goals data' },
            { status: 500 }
        );
    }
}
