import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/lib/authoption';
import { sql } from '@/app/lib/db/postgresql';
import { userRepo } from "@/app/lib/db/userRepo";

export async function GET() {
    const session = await getServerSession();
    if (!session?.user?.email) {
        return Response.json({ success: false, message: "User not found" });
    }
    try {
        // Get user data with client and coach information
        const userData = await sql`
            SELECT 
                u.id,
                u.name,
                u.email,
                u.phone,
                u."dateofBirth",
                u.bio,
                u.role,
                u."isActive",
                u.avatar,
                u."createdAt",
                u."updatedAt",
                c.id as "clientId",
                c.type as "clientType",
                c.status as "clientStatus",
                c.mood,
                c."lastActive",
                c."coachId",
                c."groupId",
                coach.name as "coachName",
                coach.email as "coachEmail",
                coach.phone as "coachPhone"
            FROM "User" u
            LEFT JOIN "Client" c ON u.id = c."userId"
            LEFT JOIN "User" coach ON c."coachId" = coach.id
            WHERE u.email = ${session.user.email}
        `;

        if (userData.length === 0) {
            return Response.json({ success: false, message: "User not found" });
        }

        return Response.json({ success: true, user: userData[0] });
    } catch (error) {
        console.error(error);
        return Response.json({ success: false, message: "User fetch failed" });
    }
}

export async function PUT(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, email, phone, birthdate, bio } = body;

        // Validate required fields
        if (!name || !email) {
            return NextResponse.json(
                { error: 'Name and email are required' },
                { status: 400 }
            );
        }

        // Check if email is already taken by another user
        const existingUser = await sql`
            SELECT id FROM "User" 
            WHERE email = ${email} AND id != ${session.user.id}
        `;

        if (existingUser.length > 0) {
            return NextResponse.json(
                { error: 'Email is already taken by another user' },
                { status: 400 }
            );
        }

        // Update user profile
        const updatedUser = await sql`
            UPDATE "User" 
            SET 
                name = ${name},
                email = ${email},
                phone = ${phone || null},
                "dateofBirth" = ${birthdate || null},
                bio = ${bio || null},
                "updatedAt" = CURRENT_TIMESTAMP
            WHERE id = ${session.user.id}
            RETURNING 
                id,
                name,
                email,
                phone,
                "dateofBirth",
                bio,
                avatar,
                role,
                "isActive",
                "createdAt",
                "updatedAt"
        `;

        if (updatedUser.length === 0) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Also update the Client table to keep it in sync
        await sql`
            UPDATE "Client" 
            SET 
                name = ${name},
                email = ${email},
                "updatedAt" = CURRENT_TIMESTAMP
            WHERE "userId" = ${session.user.id}
        `;

        return NextResponse.json({
            success: true,
            message: 'Profile updated successfully',
            user: updatedUser[0]
        });

    } catch (error) {
        console.error('Error updating user profile:', error);
        return NextResponse.json(
            { error: 'Failed to update profile' },
            { status: 500 }
        );
    }
}