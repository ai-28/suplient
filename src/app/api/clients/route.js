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

        // Fetch clients with their scheduled sessions (robust query)
        const clients = await sql`
            SELECT 
                c.id,
                u.name,
                u.email,
                c.type,
                c.status,
                c.mood,
                c."lastActive",
                c."createdAt",
                c."updatedAt",
                c."referralSource",
                c."primaryConcerns",
                c."stageId",
                COALESCE(
                    (
                        SELECT (s."sessionDate" + s."sessionTime") as "scheduledDate"
                        FROM "Session" s
                        WHERE s."clientId" = c.id 
                        AND s.status = 'scheduled'
                        AND (s."sessionDate" + s."sessionTime") > NOW()
                        ORDER BY (s."sessionDate" + s."sessionTime") ASC
                        LIMIT 1
                    ), 
                    NULL
                ) as "scheduledSession",
                COALESCE(
                    (
                        SELECT COUNT(*)
                        FROM "Message" m
                        JOIN "Conversation" conv ON conv.id = m."conversationId"
                        JOIN "ConversationParticipant" cp_coach ON cp_coach."conversationId" = conv.id AND cp_coach."userId" = ${coachId}
                        WHERE conv.type = 'personal'
                        AND conv."createdBy" = ${coachId}
                        AND m."senderId" = c."userId"
                        AND m."createdAt" > COALESCE(cp_coach."lastReadAt", cp_coach."joinedAt", '1970-01-01'::timestamp)
                    ), 
                    0
                ) as "unreadMessages",
                COALESCE(
                    (
                        SELECT m.content
                        FROM "Message" m
                        JOIN "Conversation" conv ON conv.id = m."conversationId"
                        JOIN "ConversationParticipant" cp_coach ON cp_coach."conversationId" = conv.id AND cp_coach."userId" = ${coachId}
                        WHERE conv.type = 'personal'
                        AND conv."createdBy" = ${coachId}
                        AND (m."senderId" = c."userId" OR m."senderId" = ${coachId})
                        ORDER BY m."createdAt" DESC
                        LIMIT 1
                    ), 
                    'No recent messages'
                ) as "lastMessage",
                COALESCE(
                    (
                        SELECT n.description
                        FROM "Note" n
                        WHERE n."clientId" = c.id
                        ORDER BY n."createdAt" DESC
                        LIMIT 1
                    ), 
                    'No recent notes'
                ) as "lastNote"
            FROM "Client" c
            JOIN "User" u ON c."userId" = u.id
            WHERE c."coachId" = ${coachId}
            ORDER BY c."lastActive" DESC NULLS LAST, c."createdAt" DESC
        `;


        // Transform the data to match the expected format
        const formattedClients = clients.map(client => {
            return {
                id: client.id,
                name: client.name,
                email: client.email, // Include email field
                type: client.type || 'Personal',
                status: client.status ? client.status.charAt(0).toUpperCase() + client.status.slice(1).toLowerCase() : 'Active',
                lastActive: client.lastActive ? formatDate(client.lastActive) : 'Never',
                created: formatDate(client.createdAt),
                mood: client.mood || '😐',
                stage: client.stageId || determineStage(client.status, client.type),
                scheduledSession: client.scheduledSession ? formatDate(client.scheduledSession) : null,
                unreadMessages: client.unreadMessages,
                lastMessage: client.lastMessage,
                lastNote: client.lastNote
            };
        });

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
