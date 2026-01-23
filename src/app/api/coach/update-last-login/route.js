import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/lib/authoption';
import { sql } from '@/app/lib/db/postgresql';

/**
 * POST /api/coach/update-last-login
 * Updates the lastLogin timestamp for a coach
 * Includes server-side throttling: only updates if lastLogin is NULL or older than 1 hour
 */
export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Verify user is a coach
        const userResult = await sql`
            SELECT id, role, "lastLogin"
            FROM "User"
            WHERE id = ${session.user.id}
        `;

        if (userResult.length === 0 || userResult[0].role !== 'coach') {
            return NextResponse.json(
                { error: 'Only coaches can update last login' },
                { status: 403 }
            );
        }

        const user = userResult[0];
        const now = new Date();

        // Server-side throttling: only update if:
        // 1. lastLogin is NULL (never updated), OR
        // 2. lastLogin is older than 1 hour
        const shouldUpdate = !user.lastLogin || 
            (new Date(user.lastLogin).getTime() < (now.getTime() - 60 * 60 * 1000));

        if (!shouldUpdate) {
            return NextResponse.json({
                success: true,
                updated: false,
                message: 'Last login updated recently, skipping update',
                lastLogin: user.lastLogin
            });
        }

        // Update lastLogin
        const updated = await sql`
            UPDATE "User"
            SET "lastLogin" = (NOW() AT TIME ZONE 'UTC'),
                "updatedAt" = (NOW() AT TIME ZONE 'UTC')
            WHERE id = ${session.user.id}
            RETURNING "lastLogin"
        `;

        return NextResponse.json({
            success: true,
            updated: true,
            message: 'Last login updated successfully',
            lastLogin: updated[0].lastLogin
        });

    } catch (error) {
        console.error('Error updating last login:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
