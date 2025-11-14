import { NextResponse } from 'next/server';
import { userRepo } from '@/app/lib/db/userRepo';
import { checkUser2FAStatus } from '@/app/lib/auth/twoFactor';
import { sql } from '@/app/lib/db/postgresql';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, twoFactorToken } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Authenticate user (verify password)
    const user = await userRepo.authenticate(normalizedEmail, password);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check 2FA status
    const twoFAStatus = await checkUser2FAStatus(user.id);

    // If platform 2FA is required but user hasn't set it up
    if (twoFAStatus.needsSetup) {
      return NextResponse.json({
        success: false,
        requires2FASetup: true,
        userId: user.id,
        message: '2FA setup required. Please set up two-factor authentication.'
      });
    }

    // If user has 2FA enabled, require verification
    if (twoFAStatus.has2FA) {
      if (!twoFactorToken) {
        return NextResponse.json({
          success: false,
          requires2FAVerification: true,
          userId: user.id,
          message: '2FA verification required'
        });
      }

      // Verify 2FA token
      const verifyResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/2fa/verify-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          token: twoFactorToken
        })
      });

      const verifyResult = await verifyResponse.json();

      if (!verifyResult.success || !verifyResult.verified) {
        return NextResponse.json(
          { error: 'Invalid 2FA code' },
          { status: 401 }
        );
      }
    }

    // All checks passed - return user data for session creation
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: error.message || 'Login failed' },
      { status: 500 }
    );
  }
}

