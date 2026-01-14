import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/lib/authoption';
import { sql } from '@/app/lib/db/postgresql';

export async function DELETE(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;

        // Get user role to handle role-specific deletions
        const user = await sql`
            SELECT role FROM "User" WHERE id = ${userId}
        `;

        if (user.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const userRole = user[0].role;

        // Start a transaction to delete all related data
        await sql.begin(async (sql) => {
            // Delete notifications
            await sql`DELETE FROM "Notification" WHERE "userId" = ${userId}`;

            // Delete activities
            await sql`DELETE FROM "Activity" WHERE "userId" = ${userId}`;

            // Delete conversation participants
            await sql`DELETE FROM "ConversationParticipant" WHERE "userId" = ${userId}`;

            // Delete messages sent by this user
            await sql`DELETE FROM "Message" WHERE "senderId" = ${userId}`;

            // Delete conversations created by this user
            await sql`DELETE FROM "Conversation" WHERE "createdBy" = ${userId}`;

            // Role-specific deletions
            if (userRole === 'client') {
                // Delete client subscriptions
                await sql`DELETE FROM "ClientSubscription" WHERE "clientId" = ${userId}`;
                
                // Delete client payments
                await sql`DELETE FROM "ClientPayment" WHERE "clientId" = ${userId}`;
                
                // Delete client from Client table
                await sql`DELETE FROM "Client" WHERE "userId" = ${userId}`;
            } else if (userRole === 'coach') {
                // Delete client relationships (if user is a coach)
                await sql`DELETE FROM "Client" WHERE "coachId" = ${userId}`;

                // Delete groups created by this user
                await sql`DELETE FROM "Group" WHERE "coachId" = ${userId}`;

                // Delete tasks assigned by this user
                await sql`DELETE FROM "Task" WHERE "coachId" = ${userId}`;

                // Delete sessions created by this user
                await sql`DELETE FROM "Session" WHERE "coachId" = ${userId}`;
                
                // Delete coach products
                await sql`DELETE FROM "CoachProduct" WHERE "coachId" = ${userId}`;
                
                // Delete coach subscriptions (coach to admin)
                await sql`DELETE FROM "Subscription" WHERE "userId" = ${userId}`;
            }

            // Finally, delete the user
            await sql`DELETE FROM "User" WHERE id = ${userId}`;
        });

        return NextResponse.json({
            success: true,
            message: 'Account deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting account:', error);
        return NextResponse.json(
            { error: 'Failed to delete account' },
            { status: 500 }
        );
    }
}
