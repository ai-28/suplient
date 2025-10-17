import { NextResponse } from 'next/server';
import { sql } from '@/app/lib/db/postgresql';
import bcrypt from 'bcryptjs';

export async function POST(request) {
    try {
        const body = await request.json();
        const { name, email, phone, location, coachId, notes } = body;

        // Validate required fields
        if (!name || !email || !coachId) {
            return NextResponse.json(
                { error: 'Name, email, and coach assignment are required' },
                { status: 400 }
            );
        }

        // Check if email already exists
        const existingUser = await sql`
            SELECT id FROM "User" WHERE email = ${email}
        `;

        if (existingUser.length > 0) {
            return NextResponse.json(
                { error: 'Email already exists' },
                { status: 409 }
            );
        }

        // Verify coach exists
        const coach = await sql`
            SELECT id, name FROM "User" WHERE id = ${coachId} AND role = 'coach'
        `;

        if (coach.length === 0) {
            return NextResponse.json(
                { error: 'Selected coach not found' },
                { status: 404 }
            );
        }

        // Generate a temporary password and hash it
        const tempPassword = Math.random().toString(36).slice(-8);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(tempPassword, salt);

        // Insert new client into the User table
        const newUser = await sql`
            INSERT INTO "User" 
                (name, email, password, salt, phone, role, "coachId", "address", bio, "isActive")
            VALUES 
                (${name}, ${email}, ${hashedPassword}, ${salt}, ${phone || null}, 'client', ${coachId}, ${location || null}, ${notes || null}, true)
            RETURNING id, name, email, phone, "coachId", "address", bio, role, "isActive", "createdAt", "updatedAt"
        `;

        if (newUser.length === 0) {
            return NextResponse.json(
                { error: 'Failed to create user' },
                { status: 500 }
            );
        }

        const user = newUser[0];

        // Insert new client into the Client table
        const newClient = await sql`
            INSERT INTO "Client" 
                ("userId", name, email, "coachId", status, "primaryConcerns")
            VALUES 
                (${user.id}, ${name}, ${email}, ${coachId}, 'active', ${notes || null})
            RETURNING id, "userId", name, email, status, "coachId", "createdAt", "updatedAt"
        `;

        if (newClient.length === 0) {
            // If Client table insert fails, we should clean up the User record
            await sql`DELETE FROM "User" WHERE id = ${user.id}`;
            return NextResponse.json(
                { error: 'Failed to create client record' },
                { status: 500 }
            );
        }

        const client = newClient[0];

        // Return client data (without password)
        return NextResponse.json({
            success: true,
            client: {
                id: user.id, // Use User ID as primary identifier
                clientId: client.id, // Client table ID
                name: user.name,
                email: user.email,
                phone: user.phone,
                location: user.address,
                coachId: user.coachId,
                coachName: coach[0].name,
                notes: user.bio,
                status: client.status,
                joinDate: user.createdAt,
                sessionsCount: 0 // New clients start with 0 sessions
            }
        }, { status: 201 });

    } catch (error) {
        console.error('Error creating client:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET(request) {
    try {
        // Get all clients with their coach information from both User and Client tables
        const clients = await sql`
            SELECT 
                u.id, 
                u.name, 
                u.email, 
                u.phone, 
                u."address" as location,
                u."coachId",
                u.bio as notes,
                u."isActive",
                u."createdAt",
                u."updatedAt",
                c.id as client_id,
                c.status as client_status,
                coach.name as coach_name
            FROM "User" u
            LEFT JOIN "Client" c ON u.id = c."userId"
            LEFT JOIN "User" coach ON u."coachId" = coach.id
            WHERE u.role = 'client'
            ORDER BY u."createdAt" DESC
        `;

        // Transform data for frontend
        const clientsData = clients.map(client => ({
            id: client.id, // User ID as primary identifier
            clientId: client.client_id, // Client table ID
            name: client.name,
            email: client.email,
            phone: client.phone,
            location: client.location,
            coachId: client.coachId,
            coachName: client.coach_name || 'Unassigned',
            notes: client.notes,
            status: client.client_status || (client.isActive ? 'active' : 'inactive'),
            joinDate: client.createdAt,
            sessionsCount: 0 // TODO: Calculate actual session count from sessions table
        }));
        return NextResponse.json({
            success: true,
            clients: clientsData
        });

    } catch (error) {
        console.error('Error fetching clients:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function PUT(request) {
    try {
        const body = await request.json();
        const { id, name, email, phone, location, coachId, notes, status } = body;

        // Validate required fields
        if (!id) {
            return NextResponse.json(
                { error: 'ID is required' },
                { status: 400 }
            );
        }

        // If only status is being updated, handle it separately
        if (status && !name && !email) {
            // Update only status in User table
            const updatedUser = await sql`
                UPDATE "User" SET
                    "isActive" = ${status === 'active'},
                    "updatedAt" = CURRENT_TIMESTAMP
                WHERE id = ${id} AND role = 'client'
                RETURNING id, name, email, phone, "address", "coachId", bio, role, "isActive", "createdAt", "updatedAt"
            `;

            if (updatedUser.length === 0) {
                return NextResponse.json(
                    { error: 'Client not found or update failed' },
                    { status: 404 }
                );
            }

            const user = updatedUser[0];

            // Update status in Client table
            const updatedClient = await sql`
                UPDATE "Client" SET
                    status = ${status},
                    "updatedAt" = CURRENT_TIMESTAMP
                WHERE "userId" = ${id}
                RETURNING id, status, "updatedAt"
            `;

            return NextResponse.json({
                success: true,
                client: {
                    id: user.id,
                    clientId: updatedClient.length > 0 ? updatedClient[0].id : null,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    location: user.address,
                    coachId: user.coachId,
                    coachName: 'Unassigned', // Will be updated by frontend
                    notes: user.bio,
                    status: updatedClient.length > 0 ? updatedClient[0].status : (user.isActive ? 'active' : 'inactive'),
                    joinDate: user.createdAt,
                    sessionsCount: 0
                }
            });
        }

        // Validate required fields for full update
        if (!name || !email) {
            return NextResponse.json(
                { error: 'Name and email are required for full updates' },
                { status: 400 }
            );
        }

        // Check if email already exists for another client
        const existingUser = await sql`
            SELECT id FROM "User" WHERE email = ${email} AND id != ${id}
        `;

        if (existingUser.length > 0) {
            return NextResponse.json(
                { error: 'Email already exists for another user' },
                { status: 409 }
            );
        }

        // Verify coach exists if coachId is provided
        let coachName = null;
        if (coachId) {
            const coach = await sql`
                SELECT name FROM "User" WHERE id = ${coachId} AND role = 'coach'
            `;

            if (coach.length === 0) {
                return NextResponse.json(
                    { error: 'Selected coach not found' },
                    { status: 404 }
                );
            }
            coachName = coach[0].name;
        }

        // Update client in User table
        const updatedUser = await sql`
            UPDATE "User" SET
                name = ${name},
                email = ${email},
                phone = ${phone || null},
                "address" = ${location || null},
                "coachId" = ${coachId || null},
                bio = ${notes || null},
                "isActive" = ${status === 'active'},
                "updatedAt" = CURRENT_TIMESTAMP
            WHERE id = ${id} AND role = 'client'
            RETURNING id, name, email, phone, "address", "coachId", bio, role, "isActive", "createdAt", "updatedAt"
        `;

        if (updatedUser.length === 0) {
            return NextResponse.json(
                { error: 'Client not found or update failed' },
                { status: 404 }
            );
        }

        const user = updatedUser[0];

        // Update client in Client table
        const updatedClient = await sql`
            UPDATE "Client" SET
                name = ${name},
                email = ${email},
                "coachId" = ${coachId || null},
                "primaryConcerns" = ${notes || null},
                status = ${status || 'active'},
                "updatedAt" = CURRENT_TIMESTAMP
            WHERE "userId" = ${id}
            RETURNING id, status, "updatedAt"
        `;

        return NextResponse.json({
            success: true,
            client: {
                id: user.id,
                clientId: updatedClient.length > 0 ? updatedClient[0].id : null,
                name: user.name,
                email: user.email,
                phone: user.phone,
                location: user.address,
                coachId: user.coachId,
                coachName: coachName || 'Unassigned',
                notes: user.bio,
                status: updatedClient.length > 0 ? updatedClient[0].status : (user.isActive ? 'active' : 'inactive'),
                joinDate: user.createdAt,
                sessionsCount: 0 // TODO: Calculate actual session count
            }
        });

    } catch (error) {
        console.error('Error updating client:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'Client ID is required' },
                { status: 400 }
            );
        }

        // Get client info before deletion
        const clientInfo = await sql`
            SELECT id, name, email FROM "User" WHERE id = ${id} AND role = 'client'
        `;

        if (clientInfo.length === 0) {
            return NextResponse.json(
                { error: 'Client not found' },
                { status: 404 }
            );
        }

        const client = clientInfo[0];

        // Delete the client from User table
        // Note: Client table records will be automatically deleted due to CASCADE DELETE constraint
        await sql`
            DELETE FROM "User" 
            WHERE id = ${id} AND role = 'client'
        `;

        return NextResponse.json({
            success: true,
            message: `Client ${client.name} deleted successfully`
        });

    } catch (error) {
        console.error('Error deleting client:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}