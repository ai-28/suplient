import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/lib/authoption';
import { groupRepo } from '@/app/lib/db/groupRepo';

// POST /api/groups - Create a new group
export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            name,
            description,
            capacity,
            frequency,
            duration,
            location,
            focusArea,
            selectedMembers
        } = body;

        // Validate required fields
        if (!name) {
            return NextResponse.json(
                { error: 'Group name is required' },
                { status: 400 }
            );
        }

        const coachId = session.user.id;

        // Create group
        const groupData = {
            name,
            description: description || null,
            capacity: capacity ? parseInt(capacity) : null,
            frequency: frequency || null,
            duration: duration || null,
            location: location || null,
            focusArea: focusArea || null,
            stage: 'upcoming', // Always set new groups to upcoming
            coachId,
            selectedMembers: selectedMembers || []
        };

        const group = await groupRepo.createGroup(groupData);

        return NextResponse.json({
            message: 'Group created successfully',
            group: group
        });
    } catch (error) {
        console.error('Create group error:', error);
        return NextResponse.json(
            { error: 'Failed to create group' },
            { status: 500 }
        );
    }
}

// GET /api/groups - Get groups by coach
export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const coachId = session.user.id;
        const groups = await groupRepo.getGroupsByCoach(coachId);

        return NextResponse.json({
            message: 'Groups fetched successfully',
            groups: groups
        });
    } catch (error) {
        console.error('Get groups error:', error);
        return NextResponse.json(
            { error: 'Failed to get groups' },
            { status: 500 }
        );
    }
}
