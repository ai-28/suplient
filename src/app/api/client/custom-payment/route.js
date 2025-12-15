import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/lib/authoption';
import { sql } from '@/app/lib/db/postgresql';
import { stripe } from '@/app/lib/stripe';

// POST /api/client/custom-payment
// Create custom payment for client's coach
export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session?.user?.id || session.user.role !== 'client') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { amount, description } = await request.json();
        const clientId = session.user.id;

        if (!amount || amount <= 0) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }

        // Get client's coach
        const clientData = await sql`
            SELECT "coachId" FROM "User"
            WHERE id = ${clientId} AND role = 'client'
            LIMIT 1
        `;

        if (clientData.length === 0 || !clientData[0].coachId) {
            return NextResponse.json({ error: 'No coach assigned' }, { status: 400 });
        }

        const coachId = clientData[0].coachId;

        // Get coach's Connect account
        const accountData = await sql`
            SELECT "stripeConnectAccountId"
            FROM "StripeAccount"
            WHERE "userId" = ${coachId}
        `;

        if (accountData.length === 0 || !accountData[0].stripeConnectAccountId) {
            return NextResponse.json({ error: 'Coach has not set up payment account' }, { status: 400 });
        }

        const stripeConnectAccountId = accountData[0].stripeConnectAccountId;

        // Get or create Stripe customer for client on coach's Connect account
        let customerId = null;
        const customerData = await sql`
            SELECT "stripeCustomerId" FROM "ClientPaymentMethod"
            WHERE "clientId" = ${clientId}
            AND "stripeCustomerId" IS NOT NULL
            LIMIT 1
        `;

        if (customerData.length > 0 && customerData[0].stripeCustomerId) {
            try {
                await stripe.customers.retrieve(customerData[0].stripeCustomerId, {
                    stripeAccount: stripeConnectAccountId,
                });
                customerId = customerData[0].stripeCustomerId;
            } catch (error) {
                customerId = null;
            }
        }

        if (!customerId) {
            const clientInfo = await sql`
                SELECT email, name FROM "User"
                WHERE id = ${clientId}
            `;

            if (clientInfo.length > 0) {
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

                // Update any existing payment method records for this client with the customer ID
                await sql`
                    UPDATE "ClientPaymentMethod"
                    SET "stripeCustomerId" = ${customerId},
                        "updatedAt" = CURRENT_TIMESTAMP
                    WHERE "clientId" = ${clientId}
                    AND ("stripeCustomerId" IS NULL OR "stripeCustomerId" != ${customerId})
                `;
            }
        }

        // Create Checkout Session for one-time payment
        const checkoutSession = await stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'dkk',
                        product_data: {
                            name: description || 'Custom Payment',
                        },
                        unit_amount: amount, // in øre
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/client/profile?tab=billing&success=payment_succeeded`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/client/custom-payment?canceled=true`,
            metadata: {
                clientId: clientId,
                coachId: coachId,
                productType: 'custom',
                description: description || '',
            },
            payment_intent_data: {
                metadata: {
                    clientId: clientId,
                    coachId: coachId,
                    productType: 'custom',
                    description: description || '',
                },
            },
        }, {
            stripeAccount: stripeConnectAccountId,
        });

        // Payment will be saved via webhook when checkout is completed
        // We don't save it here because payment_intent is not available until checkout completes

        return NextResponse.json({
            checkoutUrl: checkoutSession.url,
            sessionId: checkoutSession.id
        });

    } catch (error) {
        console.error('Error creating custom payment:', error);
        return NextResponse.json(
            { error: 'Failed to create custom payment', details: error.message },
            { status: 500 }
        );
    }
}

