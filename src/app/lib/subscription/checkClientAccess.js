import { sql } from '@/app/lib/db/postgresql';
import { checkCoachSubscriptionStatus } from './checkSubscription';

/**
 * Check if a client has access based on their coach's subscription status
 * @param {string} userId - The client's user ID
 * @returns {Promise<Object>} Access status object
 */
export async function checkClientAccess(userId) {
  try {
    // Get client's coach
    const client = await sql`
      SELECT "coachId" FROM "User"
      WHERE id = ${userId} AND role = 'client'
      LIMIT 1
    `;

    if (client.length === 0 || !client[0].coachId) {
      // Client has no coach - allow access (or handle as needed)
      return { hasAccess: true, reason: null, message: null };
    }

    // Check coach's subscription
    const coachSubscription = await checkCoachSubscriptionStatus(client[0].coachId);

    if (!coachSubscription.hasActiveSubscription) {
      return {
        hasAccess: false,
        reason: 'coach_subscription_inactive',
        message: `Your coach's subscription is inactive. Access is temporarily unavailable. Please contact your coach or support for assistance.`,
        coachSubscriptionReason: coachSubscription.reason
      };
    }

    return { hasAccess: true, reason: null, message: null };

  } catch (error) {
    console.error('Error checking client access:', error);
    // On error, allow access (fail open)
    return { hasAccess: true, reason: null, message: null };
  }
}

