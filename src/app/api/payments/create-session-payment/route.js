import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/lib/authoption';
import { sql } from '@/app/lib/db/postgresql';
import { stripe } from '@/app/lib/stripe';

// POST /api/payments/create-session-payment
// Create payment intent for 1-to-1 session
export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session?.user?.id || session.user.role !== 'client') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { coachId } = await request.json();
        const clientId = session.user.id;

        if (!coachId) {
            return NextResponse.json({ error: 'Coach ID is required' }, { status: 400 });
        }

        // Verify client-coach relationship
        const relationship = await sql`
            SELECT "coachId" FROM "User"
            WHERE id = ${clientId} AND "coachId" = ${coachId}
        `;

        if (relationship.length === 0) {
            return NextResponse.json({ error: 'Invalid coach-client relationship' }, { status: 403 });
        }

        // Get coach's product and Connect account
        const productData = await sql`
            SELECT 
                cp."stripePriceId",
                cp."amount",
                sa."stripeConnectAccountId"
            FROM "CoachProduct" cp
            JOIN "StripeAccount" sa ON sa."userId" = cp."coachId"
            WHERE cp."coachId" = ${coachId}
            AND cp."productType" = 'one_to_one'
            AND cp."isActive" = true
        `;

        if (productData.length === 0) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        const { stripePriceId, amount, stripeConnectAccountId } = productData[0];

        if (!stripeConnectAccountId) {
            return NextResponse.json({ error: 'Coach has not set up payment account' }, { status: 400 });
        }

        // Get or create Stripe customer for client on coach's Connect account
        let customerId;
        const customerData = await sql`
            SELECT "stripeCustomerId" FROM "ClientPaymentMethod"
            WHERE "clientId" = ${clientId}
            AND "stripeCustomerId" IS NOT NULL
            LIMIT 1
        `;

        if (customerData.length > 0 && customerData[0].stripeCustomerId) {
            // Verify customer exists on the Connect account
            try {
                await stripe.customers.retrieve(customerData[0].stripeCustomerId, {
                    stripeAccount: stripeConnectAccountId,
                });
                customerId = customerData[0].stripeCustomerId;
            } catch (error) {
                // Customer doesn't exist, create new one
                customerId = null;
            }
        }

        if (!customerId) {
            // Get client info
            const clientInfo = await sql`
                SELECT email, name FROM "User"
                WHERE id = ${clientId}
            `;

            if (clientInfo.length === 0) {
                return NextResponse.json({ error: 'Client not found' }, { status: 404 });
            }

            // Create customer on coach's Connect account
            const customer = await stripe.customers.create({
                email: clientInfo[0].email,
                name: clientInfo[0].name,
                metadata: {
                    clientId: clientId,
                    coachId: coachId,
                },
            }, {
                stripeAccount: stripeConnectAccountId,
            });

            customerId = customer.id;

            // Save customer ID
            await sql`
                INSERT INTO "ClientPaymentMethod" (
                    "clientId",
                    "stripeCustomerId",
                    "createdAt",
                    "updatedAt"
                )
                VALUES (
                    ${clientId},
                    ${customerId},
                    CURRENT_TIMESTAMP,
                    CURRENT_TIMESTAMP
                )
                ON CONFLICT ("stripeCustomerId") DO UPDATE SET
                    "clientId" = ${clientId},
                    "updatedAt" = CURRENT_TIMESTAMP
            `;
        }

        // Create Payment Intent on coach's Connect account
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: 'dkk',
            customer: customerId,
            payment_method_types: ['card'],
            setup_future_usage: 'off_session', // Save payment method
            metadata: {
                clientId: clientId,
                coachId: coachId,
                productType: 'one_to_one',
            },
            application_fee_amount: 0, // No platform fee
            transfer_data: {
                destination: stripeConnectAccountId,
            },
        }, {
            stripeAccount: stripeConnectAccountId,
        });

        // Save payment intent to database
        await sql`
            INSERT INTO "ClientPayment" (
                "clientId",
                "coachId",
                "productType",
                "stripePaymentIntentId",
                "amount",
                "currency",
                "status",
                "createdAt",
                "updatedAt"
            )
            VALUES (
                ${clientId},
                ${coachId},
                'one_to_one',
                ${paymentIntent.id},
                ${amount},
                'dkk',
                ${paymentIntent.status},
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            )
            ON CONFLICT ("stripePaymentIntentId") DO UPDATE SET
                "status" = ${paymentIntent.status},
                "updatedAt" = CURRENT_TIMESTAMP
        `;

        return NextResponse.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
        });

    } catch (error) {
        console.error('Error creating session payment:', error);
        return NextResponse.json(
            { error: 'Failed to create payment', details: error.message },
            { status: 500 }
        );
    }
}

