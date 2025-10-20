import { NextResponse } from 'next/server';
import { userRepo } from '@/app/lib/db/userRepo';
import { sendCoachRegistrationEmail } from '@/app/lib/email';
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
