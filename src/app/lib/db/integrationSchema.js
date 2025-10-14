import { sql } from './postgresql';

export const integrationRepo = {
    // Get all integrations for a coach (using database)
    async getCoachIntegrations(coachId) {
        try {
            console.log('Getting integrations from database for coach:', coachId);

            const integrations = await sql`
                SELECT id, "coachId", platform, "accessToken", "refreshToken", 
                       "tokenExpiresAt", scope, "platformUserId", "platformEmail", 
                       "platformName", "isActive", settings, "createdAt", "updatedAt"
                FROM "CoachIntegration"
                WHERE "coachId" = ${coachId} AND "isActive" = true
                ORDER BY "createdAt" DESC
            `;

            console.log('Found integrations from database:', integrations.length);
            return integrations;
        } catch (error) {
            console.error('Error getting coach integrations:', error);
            throw error;
        }
    },

    // Get specific integration for a coach (using database)
    async getCoachIntegration(coachId, platform) {
        try {
            console.log('Getting specific integration from database for coach:', coachId, 'platform:', platform);

            const [integration] = await sql`
                SELECT id, "coachId", platform, "accessToken", "refreshToken", 
                       "tokenExpiresAt", scope, "platformUserId", "platformEmail", 
                       "platformName", "isActive", settings, "createdAt", "updatedAt"
                FROM "CoachIntegration"
                WHERE "coachId" = ${coachId} AND platform = ${platform} AND "isActive" = true
                LIMIT 1
            `;

            console.log('Found integration from database:', integration);
            return integration || null;
        } catch (error) {
            console.error('Error getting coach integration:', error);
            throw error;
        }
    },

    // Create or update integration (using database)
    async upsertCoachIntegration(integrationData) {
        try {
            console.log('Storing integration in database:', integrationData);

            const {
                coachId,
                platform,
                accessToken,
                refreshToken,
                tokenExpiresAt,
                scope,
                isActive = true,
                platformUserId,
                platformEmail,
                platformName,
                settings
            } = integrationData;

            // Use UPSERT to handle both insert and update cases
            const [integration] = await sql`
                INSERT INTO "CoachIntegration" (
                    "coachId", platform, "accessToken", "refreshToken", 
                    "tokenExpiresAt", scope, "platformUserId", "platformEmail", 
                    "platformName", "isActive", settings, "createdAt", "updatedAt"
                )
                VALUES (
                    ${coachId}, ${platform}, ${accessToken}, ${refreshToken}, 
                    ${tokenExpiresAt}, ${scope}, ${platformUserId}, ${platformEmail}, 
                    ${platformName}, ${isActive}, ${JSON.stringify(settings || {})}, 
                    NOW(), NOW()
                )
                ON CONFLICT ("coachId", platform) 
                DO UPDATE SET
                    "accessToken" = EXCLUDED."accessToken",
                    "refreshToken" = EXCLUDED."refreshToken",
                    "tokenExpiresAt" = EXCLUDED."tokenExpiresAt",
                    scope = EXCLUDED.scope,
                    "platformUserId" = EXCLUDED."platformUserId",
                    "platformEmail" = EXCLUDED."platformEmail",
                    "platformName" = EXCLUDED."platformName",
                    "isActive" = EXCLUDED."isActive",
                    settings = EXCLUDED.settings,
                    "updatedAt" = NOW()
                RETURNING id, "coachId", platform, "accessToken", "refreshToken", 
                          "tokenExpiresAt", scope, "platformUserId", "platformEmail", 
                          "platformName", "isActive", settings, "createdAt", "updatedAt"
            `;

            console.log('Integration stored in database:', integration);
            return integration;
        } catch (error) {
            console.error('Error upserting coach integration:', error);
            throw error;
        }
    },

    // Update integration token (using database)
    async updateIntegrationToken(integrationId, accessToken, tokenExpiresAt) {
        try {
            console.log('🔄 Updating integration token for:', integrationId);
            console.log('🔄 Token expires at:', tokenExpiresAt, 'Type:', typeof tokenExpiresAt);

            // Validate and format the expiration date
            let expiresAt;
            if (tokenExpiresAt instanceof Date) {
                expiresAt = tokenExpiresAt;
            } else if (typeof tokenExpiresAt === 'string') {
                expiresAt = new Date(tokenExpiresAt);
            } else if (typeof tokenExpiresAt === 'number') {
                expiresAt = new Date(tokenExpiresAt);
            } else {
                console.error('❌ Invalid tokenExpiresAt type:', typeof tokenExpiresAt, tokenExpiresAt);
                throw new Error(`Invalid tokenExpiresAt: ${tokenExpiresAt}`);
            }

            // Validate the date
            if (isNaN(expiresAt.getTime())) {
                console.error('❌ Invalid date:', tokenExpiresAt);
                throw new Error(`Invalid date: ${tokenExpiresAt}`);
            }

            console.log('🔄 Formatted expiration date:', expiresAt.toISOString());

            const [integration] = await sql`
                UPDATE "CoachIntegration"
                SET "accessToken" = ${accessToken},
                    "tokenExpiresAt" = ${expiresAt},
                    "updatedAt" = NOW()
                WHERE id = ${integrationId}
                RETURNING id, "coachId", platform, "accessToken", "refreshToken", 
                          "tokenExpiresAt", scope, "platformUserId", "platformEmail", 
                          "platformName", "isActive", settings, "createdAt", "updatedAt"
            `;

            if (!integration) {
                console.error('❌ Integration not found for token update:', integrationId);
                throw new Error(`Integration with ID ${integrationId} not found`);
            }

            console.log('✅ Integration token updated successfully');
            return integration;
        } catch (error) {
            console.error('❌ Error updating integration token:', error);
            throw error;
        }
    },

    // Update integration refresh token (using database)
    async updateIntegrationRefreshToken(integrationId, refreshToken) {
        try {
            console.log('🔄 Updating integration refresh token for:', integrationId);

            const [integration] = await sql`
                UPDATE "CoachIntegration"
                SET "refreshToken" = ${refreshToken},
                    "updatedAt" = NOW()
                WHERE id = ${integrationId}
                RETURNING id, "coachId", platform, "accessToken", "refreshToken", 
                          "tokenExpiresAt", scope, "platformUserId", "platformEmail", 
                          "platformName", "isActive", settings, "createdAt", "updatedAt"
            `;

            if (!integration) {
                console.error('❌ Integration not found for refresh token update:', integrationId);
                throw new Error(`Integration with ID ${integrationId} not found`);
            }

            console.log('✅ Integration refresh token updated successfully');
            return integration;
        } catch (error) {
            console.error('❌ Error updating integration refresh token:', error);
            throw error;
        }
    },

    // Deactivate integration (using database)
    async deactivateIntegration(coachId, platform) {
        try {
            console.log('Deactivating integration for coach:', coachId, 'platform:', platform);

            const [integration] = await sql`
                UPDATE "CoachIntegration"
                SET "isActive" = false,
                    "updatedAt" = NOW()
                WHERE "coachId" = ${coachId} AND platform = ${platform}
                RETURNING id, "coachId", platform, "accessToken", "refreshToken", 
                          "tokenExpiresAt", scope, "platformUserId", "platformEmail", 
                          "platformName", "isActive", settings, "createdAt", "updatedAt"
            `;

            if (!integration) {
                console.log('No integration found to deactivate');
                return null;
            }

            console.log('Integration deactivated successfully');
            return integration;
        } catch (error) {
            console.error('Error deactivating integration:', error);
            throw error;
        }
    },

};
