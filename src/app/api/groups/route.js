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

        // Get groups based on user role
        let groups;

        if (session.user.role === 'coach') {
            // Coach sees all groups they manage
            groups = await sql`
        SELECT 
          g.id,
          g.name,
          g.description,
          g."memberCount",
          g.capacity,
          g."focusArea",
          g.stage,
          g."coachId",
          g."createdAt",
          g."selectedMembers",
          array_length(g."selectedMembers", 1) as "actualMemberCount"
        FROM "Group" g
        WHERE g."coachId" = ${session.user.id}
        ORDER BY g."createdAt" DESC
      `;
        } else if (session.user.role === 'client') {
            // Client sees all available groups (both joined and available to join)
            console.log('🔍 Fetching all groups for client:', session.user.id);

            // Get the client record for this user to get the clientId
            const clientRecord = await sql`SELECT id as "clientId", "userId" FROM "Client" WHERE "userId" = ${session.user.id}`;
            console.log('🔍 Client record for user:', clientRecord);

            const clientId = clientRecord.length > 0 ? clientRecord[0].clientId : null;
            console.log('🔍 Using clientId:', clientId);

            if (clientId) {
                // Check if current client is in any groups
                const clientInGroups = await sql`SELECT id, name, "selectedMembers" FROM "Group" WHERE ${clientId} = ANY("selectedMembers")`;
                console.log('🔍 Groups client is member of:', clientInGroups);
            }

            groups = await sql`
        SELECT 
          g.id,
          g.name,
          g.description,
          g."memberCount",
          g.capacity,
          g."focusArea",
          g.stage,
          g."coachId",
          g."createdAt",
          g."selectedMembers",
          array_length(g."selectedMembers", 1) as "actualMemberCount",
          CASE 
            WHEN ${clientId} = ANY(g."selectedMembers") THEN true 
            ELSE false 
          END as "isJoined"
        FROM "Group" g
        ORDER BY g."createdAt" DESC
      `;
            console.log('🔍 All groups found:', groups);
        } else {
            // Admin sees all groups
            groups = await sql`
        SELECT 
          g.id,
          g.name,
          g.description,
          g."memberCount",
          g.capacity,
          g."focusArea",
          g.stage,
          g."coachId",
          g."createdAt",
          g."selectedMembers",
          array_length(g."selectedMembers", 1) as "actualMemberCount"
        FROM "Group" g
        ORDER BY g."createdAt" DESC
      `;
        }

        // Format the response
        const formattedGroups = groups.map(group => ({
            id: group.id,
            name: group.name,
            description: group.description,
            members: group.actualMemberCount || 0,
            maxMembers: group.capacity,
            focusArea: group.focusArea,
            stage: group.stage,
            coachId: group.coachId,
            createdAt: group.createdAt,
            isJoined: group.isJoined || false,
            unreadMessages: 0,
            groupType: 'open',
            frequency: 'weekly',
            duration: '60',
            location: 'Online',
            avatars: [],
            lastComment: null // TODO: Implement last comment fetching
        }));

        return NextResponse.json({
            success: true,
            groups: formattedGroups
        });
    } catch (error) {
        console.error('Error fetching groups:', error);
        return NextResponse.json(
            { error: 'Failed to fetch groups' },
            { status: 500 }
        );
    }
}