import { sql } from '../../lib/db/postgresql';

async function createChatTables() {
  try {
    await sql`
    CREATE TABLE IF NOT EXISTS "Notification" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL CHECK (type IN ('client_signup', 'task_completed', 'daily_checkin', 'new_message', 'session_reminder', 'goal_achieved', 'system', 'other')),
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      data JSONB, -- Store additional data like client info, message preview, etc.
      "isRead" BOOLEAN DEFAULT false,
      "readAt" TIMESTAMP WITH TIME ZONE,
      priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      
      -- Add constraints for data integrity
      CONSTRAINT chk_notification_type_length CHECK (LENGTH(type) >= 3),
      CONSTRAINT chk_notification_title_length CHECK (LENGTH(title) >= 1),
      CONSTRAINT chk_notification_message_length CHECK (LENGTH(message) >= 1)
    );
  `;

    // Create indexes for Notification table
    await sql`CREATE INDEX IF NOT EXISTS idx_notification_user ON "Notification"("userId")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_notification_type ON "Notification"(type)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_notification_created_at ON "Notification"("createdAt")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_notification_read ON "Notification"("isRead")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_notification_priority ON "Notification"(priority)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_notification_user_read ON "Notification"("userId", "isRead")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_notification_user_type ON "Notification"("userId", type)`;

  } catch (error) {
    console.error('Error creating chat tables:', error);
    throw error;
  }
}
export async function GET() {
  try {
    console.log('Starting database seeding...');
    await createChatTables();
    console.log('Database seeded successfully');

    return new Response(JSON.stringify({
      message: 'Database seeded successfully',
      details: 'User, Group, Task, Client  , and Note tables created with sample data'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Seeding error:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Database seeding failed',
      details: error.stack
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Also support POST method for manual seeding
export async function POST() {
  return GET();
}
