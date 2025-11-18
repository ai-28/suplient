import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/lib/authoption';
import { sql } from '@/app/lib/db/postgresql';

// GET /api/coach/clients/[id]/checkin - Get client check-in data for a specific date
export async function GET(request, { params }) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify user is a coach
        if (session.user.role !== 'coach') {
            return NextResponse.json({ error: 'Unauthorized. Coach access required.' }, { status: 403 });
        }

        const { id: clientId } = await params;
        const { searchParams } = new URL(request.url);
        const dateParam = searchParams.get('date');

        if (!clientId) {
            return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
        }

        if (!dateParam) {
            return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 });
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

        // Get check-in data for the specified date
        const checkInResult = await sql`
            SELECT 
                date,
                "sleepQuality",
                nutrition,
                "physicalActivity",
                learning,
                "maintainingRelationships",
                "excessiveSocialMedia",
                procrastination,
                "negativeThinking",
                notes
            FROM "CheckIn"
            WHERE "clientId" = ${clientId}
            AND date = ${dateParam}
            LIMIT 1
        `;

        if (checkInResult.length === 0) {
            return NextResponse.json({
                checkIn: null,
                goalDistribution: [],
                badHabits: [],
                notes: null
            });
        }

        const checkIn = checkInResult[0];

        // Map goal fields
        const goalMapping = {
            sleepQuality: { name: "Sleep Quality", color: "#3b82f6", icon: "😴" },
            nutrition: { name: "Nutrition", color: "#10b981", icon: "🥗" },
            physicalActivity: { name: "Physical Activity", color: "#8b5cf6", icon: "💪" },
            learning: { name: "Learning", color: "#f59e0b", icon: "📚" },
            maintainingRelationships: { name: "Relationships", color: "#06b6d4", icon: "👥" }
        };

        // Map bad habit fields
        const badHabitMapping = {
            excessiveSocialMedia: { name: "Excessive Social Media", color: "#ef4444", icon: "📱" },
            procrastination: { name: "Procrastination", color: "#f97316", icon: "⏰" },
            negativeThinking: { name: "Negative Thinking", color: "#dc2626", icon: "☁️" }
        };

        // Build goal distribution
        const goalDistribution = Object.entries(goalMapping).map(([field, config]) => ({
            id: field,
            name: config.name,
            value: checkIn[field] || 0,
            color: config.color,
            icon: config.icon
        }));

        // Build bad habits distribution
        const badHabits = Object.entries(badHabitMapping).map(([field, config]) => ({
            id: field,
            name: config.name,
            value: checkIn[field] || 0,
            color: config.color,
            icon: config.icon
        }));

        return NextResponse.json({
            checkIn: {
                date: checkIn.date,
                ...checkIn
            },
            goalDistribution,
            badHabits,
            notes: checkIn.notes
        });

    } catch (error) {
        console.error('Error fetching client check-in:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}

