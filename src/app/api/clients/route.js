import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "@/app/lib/authoption.js";
import { sql } from "@/app/lib/db/postgresql.js";

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        // Get the current user (coach) to filter clients
        const email = session.user.email;
        const userResult = await sql`
            SELECT id FROM "User" WHERE email = ${email}
        `;

        if (userResult.length === 0) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        const coachId = userResult[0].id;

        // Fetch clients with their scheduled sessions
        const clients = await sql`
            SELECT 
                c.id,
                c.name,
                c.email,
                c.type,
                c.status,
                c.mood,
                c."lastActive",
                c."createdAt",
                c."updatedAt",
                c."referralSource",
                c."primaryConcerns",
                -- Get the next scheduled session (combine sessionDate and sessionTime)
                (
                    SELECT (s."sessionDate" + s."sessionTime") as "scheduledDate"
                    FROM "Session" s
                    WHERE s."clientId" = c.id 
                    AND s.status = 'scheduled'
                    AND (s."sessionDate" + s."sessionTime") > NOW()
                    ORDER BY (s."sessionDate" + s."sessionTime") ASC
                    LIMIT 1
                ) as "scheduledSession",
                -- Get unread messages count (placeholder for now)
                0 as "unreadMessages",
                -- Get last message (placeholder for now)
                'No recent messages' as "lastMessage",
                -- Get last note (placeholder for now)
                'No recent notes' as "lastNote"
            FROM "Client" c
            WHERE c."coachId" = ${coachId}
            ORDER BY c."lastActive" DESC NULLS LAST, c."createdAt" DESC
        `;

        // Transform the data to match the expected format
        const formattedClients = clients.map(client => ({
            id: client.id,
            name: client.name,
            type: client.type || 'Personal',
            status: client.status || 'Active',
            lastActive: client.lastActive ? formatDate(client.lastActive) : 'Never',
            created: formatDate(client.createdAt),
            mood: client.mood || '😐',
            stage: determineStage(client.status, client.type),
            scheduledSession: client.scheduledSession ? formatDate(client.scheduledSession) : null,
            unreadMessages: client.unreadMessages,
            lastMessage: client.lastMessage,
            lastNote: client.lastNote
        }));

        return NextResponse.json({
            status: true,
            message: 'Clients fetched successfully',
            clients: formattedClients,
            count: formattedClients.length
        });

    } catch (error) {
        console.error('Error fetching clients:', error);
        return NextResponse.json(
            {
                status: false,
                message: 'Failed to fetch clients',
                error: error.message
            },
            { status: 500 }
        );
    }
}

// Helper function to format date
function formatDate(dateString) {
    if (!dateString) return 'Never';

    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${day}/${month} ${hours}:${minutes}`;
}

// Helper function to determine stage based on status and type
function determineStage(status, type) {
    if (status === 'Inactive') return 'inactive';
    if (status === 'Completed') return 'completed';
    if (type?.toLowerCase() === 'group') return 'group';
    if (type?.toLowerCase() === 'personal') return 'personal';
    return 'light';
}
