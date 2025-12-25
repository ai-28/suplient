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
                "goalScores",
                "habitScores",
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
        
        // Parse JSONB fields if needed
        let goalScores = checkIn.goalScores || {};
        let habitScores = checkIn.habitScores || {};
        
        if (typeof goalScores === 'string') {
            try {
                goalScores = JSON.parse(goalScores);
            } catch (e) {
                console.error('Error parsing goalScores:', e);
                goalScores = {};
            }
        }
        
        if (typeof habitScores === 'string') {
            try {
                habitScores = JSON.parse(habitScores);
            } catch (e) {
                console.error('Error parsing habitScores:', e);
                habitScores = {};
            }
        }

        // Fetch goals and habits from database to get actual data
        const goalsData = await sql`
            SELECT 
                id,
                name,
                icon,
                color,
                "isActive"
            FROM "Goal"
            WHERE "clientId" = ${clientId}
            AND "isActive" = true
            ORDER BY "order" ASC, "createdAt" ASC
        `;

        const habitsData = await sql`
            SELECT 
                id,
                name,
                icon,
                color,
                "isActive"
            FROM "Habit"
            WHERE "clientId" = ${clientId}
            AND "isActive" = true
            ORDER BY "order" ASC, "createdAt" ASC
        `;

        // Build goal distribution from JSONB data
        const goalDistribution = goalsData.map(goal => {
            // Try multiple ID formats for matching
            const goalIdStr = String(goal.id);
            const goalIdLower = goalIdStr.toLowerCase();
            
            let score = goalScores[goal.id];
            if (score === undefined) score = goalScores[goalIdStr];
            if (score === undefined) score = goalScores[goalIdLower];
            const goalKeys = Object.keys(goalScores);
            const matchingKey = goalKeys.find(key => 
                String(key).toLowerCase() === goalIdLower
            );
            if (score === undefined && matchingKey) {
                score = goalScores[matchingKey];
            }
            
            return {
                id: goal.id,
                name: goal.name,
                value: score !== undefined ? score : 0,
                color: goal.color || '#3b82f6',
                icon: goal.icon || '🎯'
            };
        });

        // Build bad habits distribution from JSONB data
        const badHabits = habitsData.map(habit => {
            // Try multiple ID formats for matching
            const habitIdStr = String(habit.id);
            const habitIdLower = habitIdStr.toLowerCase();
            
            let score = habitScores[habit.id];
            if (score === undefined) score = habitScores[habitIdStr];
            if (score === undefined) score = habitScores[habitIdLower];
            const habitKeys = Object.keys(habitScores);
            const matchingKey = habitKeys.find(key => 
                String(key).toLowerCase() === habitIdLower
            );
            if (score === undefined && matchingKey) {
                score = habitScores[matchingKey];
            }
            
            return {
                id: habit.id,
                name: habit.name,
                value: score !== undefined ? score : 0,
                color: habit.color || '#ef4444',
                icon: habit.icon || '📱'
            };
        });

        return NextResponse.json({
            checkIn: {
                date: checkIn.date,
                goalScores,
                habitScores,
                notes: checkIn.notes
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

