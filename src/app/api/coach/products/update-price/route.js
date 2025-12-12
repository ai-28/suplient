import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/lib/authoption';
import { sql } from '@/app/lib/db/postgresql';
import { stripe } from '@/app/lib/stripe';

// PUT /api/coach/products/update-price
export async function PUT(request) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session?.user?.id || session.user.role !== 'coach') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { productType, amount } = await request.json(); // amount in øre

        if (!productType || !amount || amount <= 0) {
            return NextResponse.json({ error: 'Invalid product type or amount' }, { status: 400 });
        }

        if (!['one_to_one', 'program', 'group'].includes(productType)) {
            return NextResponse.json({ error: 'Invalid product type' }, { status: 400 });
        }

        const coachId = session.user.id;

        // Get coach's Connect account and product
        const productData = await sql`
            SELECT 
                cp."stripeProductId",
                cp."stripePriceId",
                sa."stripeConnectAccountId"
            FROM "CoachProduct" cp
            JOIN "StripeAccount" sa ON sa."userId" = cp."coachId"
            WHERE cp."coachId" = ${coachId}
            AND cp."productType" = ${productType}
        `;

        if (productData.length === 0) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        const { stripeProductId, stripePriceId, stripeConnectAccountId } = productData[0];

        if (!stripeConnectAccountId) {
            return NextResponse.json({ error: 'Connect account not set up' }, { status: 400 });
        }

        // Determine if recurring
        const isRecurring = productType === 'program' || productType === 'group';
        
        // Create new price (Stripe doesn't allow updating prices, create new one)
        const priceData = {
            product: stripeProductId,
            currency: 'dkk',
            unit_amount: amount,
        };

        if (isRecurring) {
            priceData.recurring = { interval: 'month' };
        }

        const newPrice = await stripe.prices.create(priceData, {
            stripeAccount: stripeConnectAccountId,
        });

        // Update database
        await sql`
            UPDATE "CoachProduct"
            SET 
                "stripePriceId" = ${newPrice.id},
                "amount" = ${amount},
                "updatedAt" = CURRENT_TIMESTAMP
            WHERE "coachId" = ${coachId}
            AND "productType" = ${productType}
        `;

        return NextResponse.json({
            success: true,
            productType,
            newPriceId: newPrice.id,
            amount
        });

    } catch (error) {
        console.error('Error updating product price:', error);
        return NextResponse.json(
            { error: 'Failed to update price', details: error.message },
            { status: 500 }
        );
    }
}

