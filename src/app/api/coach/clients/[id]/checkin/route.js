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
        const period = searchParams.get('period') || 'today';

        if (!clientId) {
            return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
        }

        if (!dateParam) {
            return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 });
        }

        // Helper function to format date in local timezone (YYYY-MM-DD)
        const formatDateLocal = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        // Calculate date range based on period
        const targetDate = new Date(dateParam + 'T12:00:00'); // Use noon to avoid timezone issues
        const endDate = new Date(targetDate);
        const startDate = new Date(targetDate);

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

        const startDateStr = formatDateLocal(startDate);
        const endDateStr = formatDateLocal(endDate);

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

        // Get check-in data based on period
        let checkInResult;
        let checkIn = null;
        
        if (period === 'today') {
            // For today, query the specific date directly
            checkInResult = await sql`
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

            if (checkInResult.length > 0) {
                checkIn = checkInResult[0];
            }
        } else {
            // For week/month, get all check-ins in the date range
            checkInResult = await sql`
                SELECT 
                    date,
                    "goalScores",
                    "habitScores",
                    notes
                FROM "CheckIn"
                WHERE "clientId" = ${clientId}
                AND date >= ${startDateStr}
                AND date <= ${endDateStr}
                ORDER BY date DESC
            `;
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

        // Build goal distribution and bad habits based on period
        let goalDistribution = [];
        let badHabits = [];
        let notes = null;

        if (period === 'today') {
            // For today, use single check-in data
            if (!checkIn) {
                goalDistribution = goalsData.map(goal => ({
                    id: goal.id,
                    name: goal.name,
                    value: 0,
                    color: goal.color || '#3b82f6',
                    icon: goal.icon || '🎯'
                }));
                badHabits = habitsData.map(habit => ({
                    id: habit.id,
                    name: habit.name,
                    value: 0,
                    color: habit.color || '#ef4444',
                    icon: habit.icon || '📱'
                }));
            } else {
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

                // Build goal distribution from JSONB data
                goalDistribution = goalsData.map(goal => {
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
                badHabits = habitsData.map(habit => {
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

                notes = checkIn.notes;
            }
        } else {
            // For week/month, calculate averages from multiple check-ins
            if (checkInResult.length === 0) {
                goalDistribution = goalsData.map(goal => ({
                    id: goal.id,
                    name: goal.name,
                    value: 0,
                    color: goal.color || '#3b82f6',
                    icon: goal.icon || '🎯'
                }));
                badHabits = habitsData.map(habit => ({
                    id: habit.id,
                    name: habit.name,
                    value: 0,
                    color: habit.color || '#ef4444',
                    icon: habit.icon || '📱'
                }));
            } else {
                // Calculate sum and count for each goal and habit
                const goalSums = {};
                const goalCounts = {};
                const habitSums = {};
                const habitCounts = {};

                checkInResult.forEach(checkInEntry => {
                    let goalScores = checkInEntry.goalScores || {};
                    let habitScores = checkInEntry.habitScores || {};

                    // Parse JSONB if it's a string
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

                    // Aggregate goal scores
                    Object.keys(goalScores).forEach(goalIdKey => {
                        const normalizedKey = String(goalIdKey).toLowerCase();
                        if (!goalSums[normalizedKey]) {
                            goalSums[normalizedKey] = 0;
                            goalCounts[normalizedKey] = 0;
                        }
                        goalSums[normalizedKey] += goalScores[goalIdKey];
                        goalCounts[normalizedKey]++;
                    });

                    // Aggregate habit scores
                    Object.keys(habitScores).forEach(habitIdKey => {
                        const normalizedKey = String(habitIdKey).toLowerCase();
                        if (!habitSums[normalizedKey]) {
                            habitSums[normalizedKey] = 0;
                            habitCounts[normalizedKey] = 0;
                        }
                        habitSums[normalizedKey] += habitScores[habitIdKey];
                        habitCounts[normalizedKey]++;
                    });
                });

                // Map goals with their average scores
                goalDistribution = goalsData.map(goal => {
                    const goalIdStr = String(goal.id);
                    const goalIdLower = goalIdStr.toLowerCase();
                    
                    // Try to find matching key
                    const matchingKey = Object.keys(goalSums).find(key => 
                        String(key).toLowerCase() === goalIdLower
                    );
                    
                    let avgScore = 0;
                    if (matchingKey && goalCounts[matchingKey] > 0) {
                        avgScore = Math.round((goalSums[matchingKey] / goalCounts[matchingKey]) * 10) / 10;
                    }
                    
                    return {
                        id: goal.id,
                        name: goal.name,
                        value: avgScore,
                        color: goal.color || '#3b82f6',
                        icon: goal.icon || '🎯'
                    };
                });

                // Map habits with their average scores
                badHabits = habitsData.map(habit => {
                    const habitIdStr = String(habit.id);
                    const habitIdLower = habitIdStr.toLowerCase();
                    
                    // Try to find matching key
                    const matchingKey = Object.keys(habitSums).find(key => 
                        String(key).toLowerCase() === habitIdLower
                    );
                    
                    let avgScore = 0;
                    if (matchingKey && habitCounts[matchingKey] > 0) {
                        avgScore = Math.round((habitSums[matchingKey] / habitCounts[matchingKey]) * 10) / 10;
                    }
                    
                    return {
                        id: habit.id,
                        name: habit.name,
                        value: avgScore,
                        color: habit.color || '#ef4444',
                        icon: habit.icon || '📱'
                    };
                });
            }
        }

        return NextResponse.json({
            checkIn: checkIn ? {
                date: checkIn.date,
                goalScores: checkIn.goalScores,
                habitScores: checkIn.habitScores,
                notes: checkIn.notes
            } : null,
            goalDistribution,
            badHabits,
            notes: notes,
            period: period
        });

    } catch (error) {
        console.error('Error fetching client check-in:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}

