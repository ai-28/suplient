import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/lib/authoption';
import { sql } from '@/app/lib/db/postgresql';

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { resourceId, clientIds, groupIds, message } = body;

        if (!resourceId) {
            return NextResponse.json({ error: 'Resource ID is required' }, { status: 400 });
        }

        if ((!clientIds || clientIds.length === 0) && (!groupIds || groupIds.length === 0)) {
            return NextResponse.json({ error: 'At least one client or group must be selected' }, { status: 400 });
        }

        // Verify the resource exists and belongs to the current coach
        const resourceCheck = await sql`
            SELECT r.id, r.title, r."coachId"
            FROM "Resource" r
            WHERE r.id = ${resourceId} AND r."coachId" = ${session.user.id}
        `;

        if (resourceCheck.length === 0) {
            return NextResponse.json({ error: 'Resource not found or access denied' }, { status: 404 });
        }

        const resource = resourceCheck[0];

        // Update the resource with client and group assignments as arrays
        const updatedResource = await sql`
            UPDATE "Resource"
            SET 
                "clientIds" = ${clientIds || []},
                "groupIds" = ${groupIds || []},
                "updatedAt" = NOW()
            WHERE id = ${resourceId}
            RETURNING *
        `;

        // Log the sharing activity (optional)
        console.log(`Resource "${resource.title}" shared:`, {
            resourceId,
            clientIds: clientIds || [],
            groupIds: groupIds || [],
            message: message || '',
            sharedBy: session.user.id,
            sharedAt: new Date().toISOString()
        });

        return NextResponse.json({
            message: 'Resource shared successfully',
            resource: updatedResource[0],
            sharedWith: {
                clients: clientIds || [],
                groups: groupIds || []
            }
        });

    } catch (error) {
        console.error('Share resource error:', error);
        return NextResponse.json(
            { error: 'Failed to share resource' },
            { status: 500 }
        );
    }
}
