import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/lib/authoption';
import { verifyToken, generateBackupCodes, hashBackupCode } from '@/app/lib/auth/twoFactor';
import { sql } from '@/app/lib/db/postgresql';

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { secret, token } = body;

        if (!secret || !token) {
            return NextResponse.json(
                { error: 'Secret and token are required' },
                { status: 400 }
            );
        }

        // Verify the token
        const isValid = verifyToken(secret, token);

        if (!isValid) {
            return NextResponse.json(
                { error: 'Invalid verification code. Please try again.' },
                { status: 400 }
            );
        }

        const userId = session.user.id;

        // Generate backup codes
        const backupCodes = generateBackupCodes(10);
        const hashedBackupCodes = backupCodes.map(code => hashBackupCode(code));

        // Save 2FA to database
        await sql`
      UPDATE "User"
      SET 
        "twoFactorSecret" = ${secret},
        "twoFactorEnabled" = true,
        "twoFactorBackupCodes" = ${hashedBackupCodes},
        "twoFactorSetupDate" = CURRENT_TIMESTAMP,
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = ${userId}
    `;

        // Return backup codes (only shown once)
        return NextResponse.json({
            success: true,
            message: '2FA enabled successfully',
            backupCodes // Send plain codes - user must save these
        });
    } catch (error) {
        console.error('Error verifying 2FA setup:', error);
        return NextResponse.json(
            { error: 'Failed to enable 2FA' },
            { status: 500 }
        );
    }
}

