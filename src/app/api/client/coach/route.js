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

        if (session.user.role !== 'client') {
            return NextResponse.json(
                { error: 'Only clients can access this endpoint' },
                { status: 403 }
            );
        }

        // Get the client's coach through the Client table
        const coachData = await sql`
            SELECT 
                u.id,
                u.name,
                u.email,
                u.phone
            FROM "User" u
            JOIN "Client" c ON u.id = c."coachId"
            WHERE c."userId" = ${session.user.id}
            LIMIT 1
        `;

        if (coachData.length === 0) {
            return NextResponse.json(
                { error: 'No coach assigned to this client' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            coach: coachData[0]
        });
    } catch (error) {
        console.error('Error fetching client coach:', error);
        return NextResponse.json(
            { error: 'Failed to fetch coach information' },
            { status: 500 }
        );
    }
}
