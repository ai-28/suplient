import { sql } from "@/app/lib/db/postgresql";
import { hashPasswordAsync } from "@/app/lib/auth/passwordUtils";
import { getServerSession } from "next-auth";
import authOptions from "@/app/lib/authoption";
import { sendClientRegistrationEmail } from "@/app/lib/email";

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
        const tempPassword = 'password123';
        // const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
        const { hashedPassword, salt } = await hashPasswordAsync(tempPassword);

        // Create the client user
        const [newUser] = await sql`
      INSERT INTO "User" (name, email, password, salt, phone, role, "createdAt", "isActive", "dateofBirth", address, "coachId")
      VALUES (${name}, ${email}, ${hashedPassword}, ${salt}, ${phone}, 'client', NOW(), true, ${dateOfBirth}, ${address}, ${session.user.id})
      RETURNING id, name, email, phone, role
    `;
        const [newClient] = await sql`
      INSERT INTO "Client" ("userId", "coachId","name","email","type","status","referralSource", "primaryConcerns", "createdAt", "updatedAt")
      VALUES (${newUser.id}, ${session.user.id}, ${name}, ${email}, ${'personal'}, ${'active'}, ${referralSource}, ${concerns}, NOW(), NOW())
      RETURNING id, name, email
    `;
        // Send welcome email for clients
        await sendClientRegistrationEmail({
            name: newUser.name,
            email: newUser.email,
            tempPassword: tempPassword
        });
        // Create signup activity
        try {
            const { activityHelpers } = await import('@/app/lib/db/activitySchema');
            await activityHelpers.createSignupActivity(newUser.id, newClient.id);
        } catch (activityError) {
            console.error('❌ Error creating signup activity:', activityError);
            // Don't fail the registration if activity creation fails
        }

        // Create signup notification for coach
        try {
            const { NotificationService } = require('@/app/lib/services/NotificationService');
            await NotificationService.notifyClientSignup(newClient.id, session.user.id, newUser.name);
        } catch (notificationError) {
            console.error('❌ Error creating signup notification:', notificationError);
            // Don't fail the registration if notification creation fails
        }

        // Notify all admins about new client signup
        try {
            // Get all admins
            const admins = await sql`
                SELECT id FROM "User" WHERE role = 'admin' AND "isActive" = true
            `;

            // Get coach name for the notification
            const coach = await sql`
                SELECT name FROM "User" WHERE id = ${session.user.id}
            `;
            const coachName = coach[0]?.name || 'Unknown Coach';

            // Create notifications for all admins
            for (const admin of admins) {
                await sql`
                    INSERT INTO "Notification" 
                    ("userId", type, title, message, "isRead", priority, data, "createdAt")
                    VALUES (
                        ${admin.id},
                        'client_signup',
                        'New Client Signup',
                        ${`${newUser.name} (${newUser.email}) was registered by coach ${coachName}.`},
                        false,
                        'normal',
                        ${JSON.stringify({
                    clientId: newClient.id,
                    clientName: newUser.name,
                    clientEmail: newUser.email,
                    coachId: session.user.id,
                    coachName: coachName
                })},
                        CURRENT_TIMESTAMP
                    )
                `;

                // Send real-time notification via socket
                try {
                    if (global.globalSocketIO) {
                        const notification = {
                            id: Math.random().toString(36).substr(2, 9),
                            userId: admin.id,
                            type: 'client_signup',
                            title: 'New Client Signup',
                            message: `${newUser.name} (${newUser.email}) was registered by coach ${coachName}.`,
                            isRead: false,
                            priority: 'normal',
                            data: {
                                clientId: newClient.id,
                                clientName: newUser.name,
                                clientEmail: newUser.email,
                                coachId: session.user.id,
                                coachName: coachName
                            },
                            createdAt: new Date().toISOString(),
                        };
                        global.globalSocketIO.to(`notifications_${admin.id}`).emit('new_notification', notification);
                        console.log(`✅ Admin notification sent to ${admin.id} for client signup`);
                    }
                } catch (socketError) {
                    console.warn(`⚠️ Socket emission failed for admin ${admin.id}:`, socketError.message);
                }
            }
            console.log(`📧 Notified ${admins.length} admin(s) about new client signup`);
        } catch (notificationError) {
            console.error('❌ Error creating admin notifications:', notificationError);
            // Don't fail registration if notification fails
        }

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
