import { NextResponse } from 'next/server';
import { sql } from '@/app/lib/db/postgresql';
import { stripe, STRIPE_CONFIG } from '@/app/lib/stripe';
import { headers } from 'next/headers';

// POST /api/stripe/webhook - Handle Stripe webhooks
export async function POST(request) {
    try {
        const body = await request.text();
        const headersList = await headers();
        const signature = headersList.get('stripe-signature');
        console.log("request", request);
        if (!signature) {
            return NextResponse.json(
                { error: 'No signature provided' },
                { status: 400 }
            );
        }

        let event;
        try {
            // Verify webhook signature
            event = stripe.webhooks.constructEvent(
                body,
                signature,
                STRIPE_CONFIG.webhookSecret || process.env.STRIPE_WEBHOOK_SECRET
            );
        } catch (err) {
            console.error('Webhook signature verification failed:', err.message);
            return NextResponse.json(
                { error: `Webhook Error: ${err.message}` },
                { status: 400 }
            );
        }

        // Handle different event types
        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutCompleted(event.data.object);
                break;

            case 'customer.subscription.created':
                await handleSubscriptionCreated(event.data.object);
                break;

            case 'customer.subscription.updated':
                await handleSubscriptionUpdated(event.data.object);
                break;

            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(event.data.object);
                break;

            case 'invoice.payment_succeeded':
                await handleInvoicePaymentSucceeded(event.data.object);
                break;

            case 'invoice.payment_failed':
                await handleInvoicePaymentFailed(event.data.object);
                break;

            default:
                // Unhandled event type
                console.log(`Unhandled event type: ${event.type}`);
        }

        return NextResponse.json({ received: true });

    } catch (error) {
        console.error('Error processing webhook:', error);
        return NextResponse.json(
            { error: 'Webhook processing failed', details: error.message },
            { status: 500 }
        );
    }
}

// Handle checkout.session.completed event
async function handleCheckoutCompleted(session) {
    try {
        const userId = session.metadata?.userId;
        if (!userId) return;
        console.log("session", session);
        // Get the subscription from the checkout session
        const subscriptionId = session.subscription;
        if (!subscriptionId) return;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        // Update or create StripeAccount record
        await sql`
            INSERT INTO "StripeAccount" (
                "userId",
                "stripeCustomerId",
                "stripeSubscriptionId",
                "stripeSubscriptionStatus",
                "stripeSubscriptionCurrentPeriodStart",
                "stripeSubscriptionCurrentPeriodEnd",
                "onboardingComplete",
                "createdAt",
                "updatedAt"
            )
            VALUES (
                ${userId},
                ${subscription.customer},
                ${subscription.id},
                ${subscription.status},
                ${new Date(subscription.current_period_start * 1000).toISOString()},
                ${new Date(subscription.current_period_end * 1000).toISOString()},
                true,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            )
            ON CONFLICT ("userId") DO UPDATE SET
                "stripeCustomerId" = ${subscription.customer},
                "stripeSubscriptionId" = ${subscription.id},
                "stripeSubscriptionStatus" = ${subscription.status},
                "stripeSubscriptionCurrentPeriodStart" = ${new Date(subscription.current_period_start * 1000).toISOString()},
                "stripeSubscriptionCurrentPeriodEnd" = ${new Date(subscription.current_period_end * 1000).toISOString()},
                "onboardingComplete" = true,
                "updatedAt" = CURRENT_TIMESTAMP
        `;
    } catch (error) {
        console.error('Error handling checkout.completed:', error);
    }
}

// Handle customer.subscription.created event
async function handleSubscriptionCreated(subscription) {
    try {
        // Get customer to find userId
        const customer = await stripe.customers.retrieve(subscription.customer);
        const userId = customer.metadata?.userId;
        if (!userId) return;
        console.log("subscription", subscription);
        await sql`
            UPDATE "StripeAccount"
            SET 
                "stripeSubscriptionId" = ${subscription.id},
                "stripeSubscriptionStatus" = ${subscription.status},
                "stripeSubscriptionCurrentPeriodStart" = ${new Date(subscription.current_period_start * 1000).toISOString()},
                "stripeSubscriptionCurrentPeriodEnd" = ${new Date(subscription.current_period_end * 1000).toISOString()},
                "stripeSubscriptionCancelAtPeriodEnd" = ${subscription.cancel_at_period_end || false},
                "updatedAt" = CURRENT_TIMESTAMP
            WHERE "userId" = ${userId}
        `;
    } catch (error) {
        console.error('Error handling subscription.created:', error);
    }
}

// Handle customer.subscription.updated event
async function handleSubscriptionUpdated(subscription) {
    try {
        console.log("subscription", subscription);
        await sql`
            UPDATE "StripeAccount"
            SET 
                "stripeSubscriptionStatus" = ${subscription.status},
                "stripeSubscriptionCurrentPeriodStart" = ${new Date(subscription.current_period_start * 1000).toISOString()},
                "stripeSubscriptionCurrentPeriodEnd" = ${new Date(subscription.current_period_end * 1000).toISOString()},
                "stripeSubscriptionCancelAtPeriodEnd" = ${subscription.cancel_at_period_end || false},
                "updatedAt" = CURRENT_TIMESTAMP
            WHERE "stripeSubscriptionId" = ${subscription.id}
        `;
    } catch (error) {
        console.error('Error handling subscription.updated:', error);
    }
}

// Handle customer.subscription.deleted event
async function handleSubscriptionDeleted(subscription) {
    try {
        console.log("subscription", subscription);
        await sql`
            UPDATE "StripeAccount"
            SET 
                "stripeSubscriptionStatus" = 'canceled',
                "stripeSubscriptionId" = NULL,
                "updatedAt" = CURRENT_TIMESTAMP
            WHERE "stripeSubscriptionId" = ${subscription.id}
        `;
    } catch (error) {
        console.error('Error handling subscription.deleted:', error);
    }
}

// Handle invoice.payment_succeeded event
async function handleInvoicePaymentSucceeded(invoice) {
    try {
        const subscriptionId = invoice.subscription;
        if (!subscriptionId) return;

        // Get subscription to update status
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        console.log("invoice", invoice);
        await sql`
            UPDATE "StripeAccount"
            SET 
                "stripeSubscriptionStatus" = ${subscription.status},
                "updatedAt" = CURRENT_TIMESTAMP
            WHERE "stripeSubscriptionId" = ${subscriptionId}
        `;
    } catch (error) {
        console.error('Error handling invoice.payment_succeeded:', error);
    }
}

// Handle invoice.payment_failed event
async function handleInvoicePaymentFailed(invoice) {
    try {
        const subscriptionId = invoice.subscription;
        if (!subscriptionId) return;

        console.log("invoice", invoice);
        await sql`
            UPDATE "StripeAccount"
            SET 
                "stripeSubscriptionStatus" = 'past_due',
                "updatedAt" = CURRENT_TIMESTAMP
            WHERE "stripeSubscriptionId" = ${subscriptionId}
        `;
    } catch (error) {
        console.error('Error handling invoice.payment_failed:', error);
    }
}

