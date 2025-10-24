import { NextResponse } from 'next/server';
import { userRepo } from '@/app/lib/db/userRepo';
import { sendCoachRegistrationEmail } from '@/app/lib/email';
import { sql } from '@/app/lib/db/postgresql';
export async function POST(request) {
    try {
        const body = await request.json();
        const { name, email, password, phone, role = 'coach' } = body;

        // Validate required fields
        if (!name || !email || !password || !phone) {
            return NextResponse.json(
                { error: 'All fields are required' },
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            );
        }

        // Validate password strength (minimum 8 characters)
        if (password.length < 8) {
            return NextResponse.json(
                { error: 'Password must be at least 8 characters long' },
                { status: 400 }
            );
        }

        // Check if email already exists
        const emailExists = await userRepo.checkEmailExists(email);
        if (emailExists) {
            return NextResponse.json(
                { error: 'Email already exists' },
                { status: 409 }
            );
        }

        // Register the user
        const newUser = await userRepo.register({
            name,
            email,
            password,
            phone,
            role
        });

        // Send welcome email for coaches
        if (role === 'coach') {
            console.log('Sending coach registration email');
            await sendCoachRegistrationEmail({
                name: newUser.name,
                email: newUser.email,
                tempPassword: password
            });

            // Notify all admins about new coach signup
            try {
                // Get all admins
                const admins = await sql`
                    SELECT id FROM "User" WHERE role = 'admin' AND "isActive" = true
                `;

                // Create notifications for all admins
                for (const admin of admins) {
                    await sql`
                        INSERT INTO "Notification" 
                        ("userId", type, title, message, "isRead", priority, data, "createdAt")
                        VALUES (
                            ${admin.id},
                            'system',
                            'New Coach Signup',
                            ${`${newUser.name} (${newUser.email}) has registered as a coach.`},
                            false,
                            'normal',
                            ${JSON.stringify({ coachId: newUser.id, coachName: newUser.name, coachEmail: newUser.email })},
                            CURRENT_TIMESTAMP
                        )
                    `;

                    // Send real-time notification via socket
                    try {
                        if (global.globalSocketIO) {
                            const notification = {
                                id: Math.random().toString(36).substr(2, 9),
                                userId: admin.id,
                                type: 'system',
                                title: 'New Coach Signup',
                                message: `${newUser.name} (${newUser.email}) has registered as a coach.`,
                                isRead: false,
                                priority: 'normal',
                                data: { coachId: newUser.id, coachName: newUser.name, coachEmail: newUser.email },
                                createdAt: new Date().toISOString(),
                            };
                            global.globalSocketIO.to(`notifications_${admin.id}`).emit('new_notification', notification);
                            console.log(`✅ Admin notification sent to ${admin.id} for coach signup`);
                        }
                    } catch (socketError) {
                        console.warn(`⚠️ Socket emission failed for admin ${admin.id}:`, socketError.message);
                    }
                }
                console.log(`📧 Notified ${admins.length} admin(s) about new coach signup`);
            } catch (notificationError) {
                console.error('❌ Error creating admin notifications:', notificationError);
                // Don't fail registration if notification fails
            }
        }

        return NextResponse.json({
            success: true,
            message: 'User registered successfully'
        }, { status: 201 });

    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
