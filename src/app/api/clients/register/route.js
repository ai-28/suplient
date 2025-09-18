import { sql } from "@/app/lib/db/postgresql";
import { hashPasswordAsync } from "@/app/lib/auth/passwordUtils";
import { getServerSession } from "next-auth";
import authOptions from "@/app/lib/authoption";

export async function POST(request) {
    try {
        // Get the current session to verify the coach
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'coach') {
            return Response.json({
                success: false,
                error: 'Unauthorized. Only coaches can create clients.'
            }, { status: 401 });
        }

        const body = await request.json();
        const {
            name,
            email,
            phone,
            dateOfBirth,
            address,
            referralSource,
            concerns
        } = body;

        // Validate required fields
        if (!name || !email || !phone) {
            return Response.json({
                success: false,
                error: 'Name, email, and phone are required'
            }, { status: 400 });
        }

        // Check if email already exists
        const existingUser = await sql`SELECT id FROM "User" WHERE email = ${email}`;
        if (existingUser.length > 0) {
            return Response.json({
                success: false,
                error: 'Email already registered'
            }, { status: 400 });
        }

        // Generate a temporary password for the client
        const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
        const { hashedPassword, salt } = await hashPasswordAsync(tempPassword);

        // Create the client user
        const [newUser] = await sql`
      INSERT INTO "User" (name, email, password, salt, phone, role, "createdAt", "isActive", "dateofBirth", address, "coachId")
      VALUES (${name}, ${email}, ${hashedPassword}, ${salt}, ${phone}, 'client', NOW(), true, ${dateOfBirth}, ${address}, ${session.user.id})
      RETURNING id, name, email, phone, role
    `;
        const [newClient] = await sql`
      INSERT INTO "Client" ("userId", "coachId","name","email","type","referralSource", "primaryConcerns", "createdAt", "updatedAt")
      VALUES (${newUser.id}, ${session.user.id}, ${name}, ${email}, ${'personal'}, ${referralSource}, ${concerns}, NOW(), NOW())
      RETURNING id, name, email
    `;

        return Response.json({
            success: true,
            message: 'Client created successfully',
            client: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                phone: newUser.phone,
                role: newUser.role,
                tempPassword: tempPassword // Include temp password for coach to share with client
            }
        });

    } catch (error) {
        console.error('Client registration error:', error);
        return Response.json({
            success: false,
            error: 'Failed to create client'
        }, { status: 500 });
    }
}
