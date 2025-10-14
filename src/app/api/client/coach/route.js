import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/lib/authoption';
import { sql } from '@/app/lib/db/postgresql';

export async function GET(request) {
    try {
        console.log('🔍 Client coach API called');

        const session = await getServerSession(authOptions);
        console.log('🔍 Session:', session?.user?.id, session?.user?.role);

        if (!session?.user?.id) {
            console.log('❌ No session found');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (session.user.role !== 'client') {
            console.log('❌ User is not a client');
            return NextResponse.json({ error: 'Only clients can access this endpoint' }, { status: 403 });
        }

        // Get the client's coach information
        console.log('🔍 Looking up client and coach...');
        const result = await sql`
            SELECT 
                u.id as "clientUserId",
                u."coachId",
                u_coach.id as "coachUserId",
                u_coach.name as "coachName",
                u_coach.email as "coachEmail",
                u_coach.phone as "coachPhone"
            FROM "User" u
            JOIN "User" u_coach ON u."coachId" = u_coach.id
            WHERE u.id = ${session.user.id}
            AND u.role = 'client'
            LIMIT 1
        `;
        console.log('🔍 Client-coach lookup result:', result);

        if (result.length === 0) {
            console.log('❌ Client not found or no coach assigned');
            console.log('🔍 Debug: Checking if client exists without coach...');

            // Check if client exists but has no coach
            const clientCheck = await sql`
                SELECT id, "coachId", name, email, role
                FROM "User" 
                WHERE id = ${session.user.id}
                AND role = 'client'
            `;

            console.log('🔍 Client check result:', clientCheck);

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
        console.log('🔍 Client-coach data:', clientCoachData);

        const coach = {
            id: clientCoachData.coachUserId,
            name: clientCoachData.coachName,
            email: clientCoachData.coachEmail,
            phone: clientCoachData.coachPhone
        };

        console.log('✅ Coach found:', coach);
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