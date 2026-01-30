import { NextResponse } from 'next/server';
import { getVapidKeys } from '@/app/lib/push/vapid';

/**
 * GET /api/push/vapid-public-key
 * Returns the VAPID public key for client-side push subscription
 */
export async function GET() {
    try {
        const { publicKey } = getVapidKeys();
        return NextResponse.json({ publicKey });
    } catch (error) {
        console.error('Error getting VAPID public key:', error);
        return NextResponse.json(
            { error: 'VAPID keys not configured' },
            { status: 500 }
        );
    }
}
