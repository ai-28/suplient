import { sql } from './postgresql';

export const userStatsRepo = {
    // Get user stats with caching
    async getUserStats(userId) {
        try {
            const result = await sql`
                SELECT 
                    daily_streak,
                    total_points,
                    last_checkin_date,
                    updated_at
                FROM user_stats 
                WHERE user_id = ${userId}
            `;

            return result[0] || {
                daily_streak: 0,
                total_points: 0,
                last_checkin_date: null,
                updated_at: null
            };
        } catch (error) {
            console.error('Error getting user stats:', error);
            throw error;
        }
    },

    // Update user stats incrementally
    async updateUserStats(userId, updates) {
        try {
            const result = await sql`
                INSERT INTO user_stats (user_id, daily_streak, total_points, last_checkin_date, updated_at)
                VALUES (${userId}, ${updates.daily_streak || 0}, ${updates.total_points || 0}, ${updates.last_checkin_date || null}, NOW())
                ON CONFLICT (user_id) 
                DO UPDATE SET
                    daily_streak = COALESCE(${updates.daily_streak}, user_stats.daily_streak),
                    total_points = COALESCE(${updates.total_points}, user_stats.total_points),
                    last_checkin_date = COALESCE(${updates.last_checkin_date}, user_stats.last_checkin_date),
                    updated_at = NOW()
                RETURNING *
            `;

            return result[0];
        } catch (error) {
            console.error('Error updating user stats:', error);
            throw error;
        }
    },

    // Add engagement activity
    async addEngagementActivity(userId, activityType, points = 1, date = null) {
        try {
            // Simply increment total points in user_stats
            await sql`
                INSERT INTO user_stats (user_id, daily_streak, total_points, last_checkin_date, updated_at)
                VALUES (${userId}, 0, ${points}, NULL, NOW())
                ON CONFLICT (user_id) 
                DO UPDATE SET
                    total_points = user_stats.total_points + ${points},
                    updated_at = NOW()
            `;

            return { userId, activityType, points, date: date || new Date().toISOString().split('T')[0] };
        } catch (error) {
            console.error('Error adding engagement activity:', error);
            throw error;
        }
    },

    // Update daily streak when check-in occurs
    async updateDailyStreak(userId, checkinDate) {
        try {
            const userStats = await this.getUserStats(userId);
            const lastCheckin = userStats.last_checkin_date;

            if (!lastCheckin) {
                // First check-in
                await this.updateUserStats(userId, {
                    daily_streak: 1,
                    last_checkin_date: checkinDate
                });
                return 1;
            }

            // Normalize dates to UTC to avoid timezone issues
            const lastCheckinDate = new Date(lastCheckin + 'T00:00:00Z');
            const currentCheckinDate = new Date(checkinDate + 'T00:00:00Z');
            const daysDiff = Math.floor((currentCheckinDate - lastCheckinDate) / (1000 * 60 * 60 * 24));

            let newStreak;
            if (daysDiff === 1) {
                // Consecutive day - increment streak
                newStreak = userStats.daily_streak + 1;
            } else if (daysDiff === 0) {
                // Same day - no change
                newStreak = userStats.daily_streak;
            } else {
                // Gap in streak - reset to 1
                newStreak = 1;
            }

            await this.updateUserStats(userId, {
                daily_streak: newStreak,
                last_checkin_date: checkinDate
            });

            return newStreak;
        } catch (error) {
            console.error('Error updating daily streak:', error);
            throw error;
        }
    },


};
