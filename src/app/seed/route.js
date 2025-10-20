import { sql } from '../lib/db/postgresql';

const crypto = require('crypto');

function generateSalt() {
  return crypto.randomBytes(16).toString('base64');
}

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('base64');
}



async function seedUser() {
  // Create the enhanced User table for multi-role support
  await sql`
    CREATE TABLE IF NOT EXISTS "User" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        salt VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        role VARCHAR(20) NOT NULL DEFAULT 'client' CHECK (role IN ('admin', 'coach', 'client')),
        "isActive" BOOLEAN DEFAULT true,
        "dateofBirth" DATE,
        "address" VARCHAR(255),
        bio TEXT,
        "coachId" UUID REFERENCES "User"("id"),
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // Create indexes for better performance
  await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON "User"(email)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_users_role ON "User"(role)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_users_isActive ON "User"("isActive")`;

  // Insert a default admin user if it doesn't exist
  const existingAdmin = await sql`SELECT id FROM "User" WHERE email = 'admin@mentalcoach.com'`;

  if (existingAdmin.length === 0) {
    const salt = generateSalt();
    const hashedPassword = hashPassword("admin123", salt);

    await sql`
      INSERT INTO "User" (name, email, password, salt, role, phone, "isActive", "dateofBirth", "address", "coachId")
      VALUES ('Admin User', 'admin@mentalcoach.com', ${hashedPassword}, ${salt}, 'admin', '+1234567890', true, NULL, NULL, NULL)
    `;
  } else {
    console.log('Admin user already exists');
  }

}
// Create ProgramTemplate table if it doesn't exist
async function createProgramTemplateTable() {
  try {
    await sql`
    CREATE TABLE IF NOT EXISTS "ProgramTemplate" (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      description TEXT,
      duration INTEGER NOT NULL DEFAULT 4,
      "coachId" UUID NOT NULL REFERENCES "User"(id),
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

    // Create ProgramTemplateElement table for program template elements
    await sql`
    CREATE TABLE IF NOT EXISTS "ProgramTemplateElement" (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "programTemplateId" UUID NOT NULL REFERENCES "ProgramTemplate"(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL CHECK (type IN ('session', 'exercise', 'assessment', 'homework', 'content', 'task', 'message')),
      title VARCHAR(255) NOT NULL,
      week INTEGER NOT NULL,
      day INTEGER NOT NULL CHECK (day >= 1 AND day <= 7),
      "scheduledTime" TIME DEFAULT '09:00:00',
      "elementData" JSONB, -- For additional element-specific data
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_program_templates_coachId ON "ProgramTemplate"("coachId")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_program_template_elements_programTemplateId ON "ProgramTemplateElement"("programTemplateId")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_program_template_elements_type ON "ProgramTemplateElement"(type)`;

  } catch (error) {
    console.error('Error creating program template tables:', error);
    throw error;
  }
}

async function createProgramEnrollmentTable() {
  try {
    await sql`
    CREATE TABLE IF NOT EXISTS "ProgramEnrollment" (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "programTemplateId" UUID NOT NULL REFERENCES "ProgramTemplate"(id),
      "clientId" UUID NOT NULL REFERENCES "Client"(id),
      "coachId" UUID NOT NULL REFERENCES "User"(id),
      status VARCHAR(20) DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'active', 'paused', 'completed', 'cancelled')),
      "completedElements" UUID[] DEFAULT '{}',
      "startDate" TIMESTAMP DEFAULT NULL,
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

    await sql`CREATE INDEX IF NOT EXISTS idx_program_enrollment_clientId ON "ProgramEnrollment"("clientId")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_program_enrollment_templateId ON "ProgramEnrollment"("programTemplateId")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_program_enrollment_coachId ON "ProgramEnrollment"("coachId")`;

  } catch (error) {
    console.error('Error creating programEnrollment tables:', error);
    throw error;
  }
}

async function seedTask() {
  try {
    // Create Group table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS "Group" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        "memberCount" INTEGER DEFAULT 0,
        capacity INTEGER,
        "focusArea" VARCHAR(255),
        "selectedMembers" UUID[] DEFAULT '{}',
        stage VARCHAR(20) DEFAULT 'upcoming' CHECK (stage IN ('upcoming', 'ongoing', 'completed', 'inactive')),
        "coachId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
    CREATE TABLE IF NOT EXISTS "Client" (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
      "name" VARCHAR(255) NOT NULL,
      "email" VARCHAR(255) NOT NULL,
      type VARCHAR(255),
      status VARCHAR(50),
      mood VARCHAR(50),
      "lastActive" TIMESTAMP,
      "coachId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
      "groupId" UUID REFERENCES "Group"(id) ON DELETE CASCADE,
      "referralSource" VARCHAR(255),
      "primaryConcerns" TEXT,
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

    // Create Task table
    await sql`
      CREATE TABLE IF NOT EXISTS "Task" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        "dueDate" TIMESTAMP,
        "taskType" VARCHAR(20) NOT NULL CHECK ("taskType" IN ('personal', 'client', 'group')),
        "coachId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        "clientId" UUID REFERENCES "Client"(id) ON DELETE CASCADE,
        "groupId" UUID REFERENCES "Group"(id) ON DELETE CASCADE,
        "isRepetitive" BOOLEAN DEFAULT FALSE,
        "repetitiveFrequency" VARCHAR(20) CHECK ("repetitiveFrequency" IN ('daily', 'weekly', 'monthly')),
        "repetitiveCount" INTEGER CHECK ("repetitiveCount" > 0 AND "repetitiveCount" <= 50),
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create TaskCompletion table to track individual member completions for group tasks
    await sql`
      CREATE TABLE IF NOT EXISTS "TaskCompletion" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "taskId" UUID NOT NULL REFERENCES "Task"(id) ON DELETE CASCADE,
        "clientId" UUID NOT NULL REFERENCES "Client"(id) ON DELETE CASCADE,
        "completedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("taskId", "clientId")
      );
    `;

    // Create Session table
    await sql`
      CREATE TABLE IF NOT EXISTS "Session" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        "sessionDate" TIMESTAMP NOT NULL,
        "sessionTime" TIME NOT NULL,
        duration INTEGER DEFAULT 60 CHECK (duration > 0 AND duration <= 480),
        "sessionType" VARCHAR(20) NOT NULL CHECK ("sessionType" IN ('individual', 'group')),
        "coachId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        "clientId" UUID REFERENCES "Client"(id) ON DELETE CASCADE,
        "groupId" UUID REFERENCES "Group"(id) ON DELETE CASCADE,
        location VARCHAR(255),
        "meetingLink" VARCHAR(500),
        status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show')),
        mood VARCHAR(20) DEFAULT 'neutral' CHECK (mood IN ('excellent', 'good', 'neutral', 'poor', 'terrible')),
        notes TEXT,
        "integrationPlatform" VARCHAR(50) DEFAULT 'none' CHECK ("integrationPlatform" IN ('google_calendar', 'zoom', 'teams', 'none')),
        "integrationSettings" JSONB DEFAULT '{}',
        "autoCreateMeeting" BOOLEAN DEFAULT false,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_group_coach_id ON "Group"("coachId")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_client_user_id ON "Client"("userId")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_client_coach_id ON "Client"("coachId")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_client_group_id ON "Client"("groupId")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_task_coach_id ON "Task"("coachId")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_task_client_id ON "Task"("clientId")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_task_group_id ON "Task"("groupId")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_session_coach_id ON "Session"("coachId")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_session_client_id ON "Session"("clientId")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_session_group_id ON "Session"("groupId")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_session_date ON "Session"("sessionDate")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_task_type ON "Task"("taskType")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_task_status ON "Task"(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_task_due_date ON "Task"("dueDate")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_task_completion_task_id ON "TaskCompletion"("taskId")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_task_completion_client_id ON "TaskCompletion"("clientId")`;

    // Add constraints to ensure data integrity (only if they don't exist)
    try {
      await sql`
        ALTER TABLE "Task" ADD CONSTRAINT chk_task_type_client 
        CHECK (
          ("taskType" = 'personal' AND "clientId" IS NULL AND "groupId" IS NULL) OR
          ("taskType" = 'client' AND "clientId" IS NOT NULL AND "groupId" IS NULL) OR
          ("taskType" = 'group' AND "clientId" IS NULL AND "groupId" IS NOT NULL)
        );
      `;
    } catch (error) {
      // Constraint might already exist, ignore the error
      if (!error.message.includes('already exists')) {
        throw error;
      }
    }

    try {
      await sql`
        ALTER TABLE "Task" ADD CONSTRAINT chk_repetitive_task 
        CHECK (
          ("isRepetitive" = FALSE AND "repetitiveFrequency" IS NULL AND "repetitiveCount" IS NULL) OR
          ("isRepetitive" = TRUE AND "repetitiveFrequency" IS NOT NULL AND "repetitiveCount" IS NOT NULL)
        );
      `;
    } catch (error) {
      // Constraint might already exist, ignore the error
      if (!error.message.includes('already exists')) {
        throw error;
      }
    }

  } catch (error) {
    console.error('Error creating task tables:', error);
    throw error;
  }
}


// Create Resource table for all library items
async function createResourceTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS "Resource" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        "resourceType" VARCHAR(50) NOT NULL CHECK ("resourceType" IN ('video', 'image', 'article', 'sound')),
        url VARCHAR(500) NOT NULL,
        "fileName" VARCHAR(255) NOT NULL,
        "fileSize" BIGINT,
        "fileType" VARCHAR(100),
        author VARCHAR(255),
        "coachId" UUID REFERENCES "User"(id) ON DELETE CASCADE,
        "clientIds" UUID[] DEFAULT '{}',
        "groupIds" UUID[] DEFAULT '{}',
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_resource_type ON "Resource"("resourceType")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_resource_coach_id ON "Resource"("coachId")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_resource_client_ids ON "Resource" USING GIN("clientIds")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_resource_group_ids ON "Resource" USING GIN("groupIds")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_resource_created_at ON "Resource"("createdAt")`;

  } catch (error) {
    console.error('Error creating Resource table:', error);
    throw error;
  }
}

// Create ResourceCompletion table for tracking resource interactions
async function createResourceCompletionTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS "ResourceCompletion" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "resourceId" UUID NOT NULL REFERENCES "Resource"(id) ON DELETE CASCADE,
        "clientId" UUID NOT NULL REFERENCES "Client"(id) ON DELETE CASCADE,
        "completedAt" TIMESTAMP,
        "likedAt" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        -- Ensure only one completion record per resource per client
        UNIQUE("resourceId", "clientId")
      );
    `;

    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_resource_completion_resource_id ON "ResourceCompletion"("resourceId")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_resource_completion_client_id ON "ResourceCompletion"("clientId")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_resource_completion_completed_at ON "ResourceCompletion"("completedAt")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_resource_completion_liked_at ON "ResourceCompletion"("likedAt")`;

  } catch (error) {
    console.error('Error creating ResourceCompletion table:', error);
    throw error;
  }
}
async function seedNote() {
  try {
    // Create Note table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS "Note" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        "clientId" UUID REFERENCES "Client"(id) ON DELETE CASCADE,
        "groupId" UUID REFERENCES "Group"(id) ON DELETE CASCADE,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CHECK (("clientId" IS NOT NULL AND "groupId" IS NULL) OR ("clientId" IS NULL AND "groupId" IS NOT NULL))
      );
    `;

    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_note_client_id ON "Note"("clientId")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_note_group_id ON "Note"("groupId")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_note_created_at ON "Note"("createdAt")`;

  } catch (error) {
    console.error('Error creating Note table:', error);
    throw error;
  }
}

async function createCheckInTable() {
  try {
    // Create CheckIn table for daily journal entries
    await sql`
      CREATE TABLE IF NOT EXISTS "CheckIn" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "clientId" UUID NOT NULL REFERENCES "Client"(id) ON DELETE CASCADE,
       
        -- Goal scores (0-5 scale)
        "sleepQuality" INTEGER NOT NULL DEFAULT 3 CHECK ("sleepQuality" >= 0 AND "sleepQuality" <= 5),
        nutrition INTEGER NOT NULL DEFAULT 3 CHECK (nutrition >= 0 AND nutrition <= 5),
        "physicalActivity" INTEGER NOT NULL DEFAULT 3 CHECK ("physicalActivity" >= 0 AND "physicalActivity" <= 5),
        learning INTEGER NOT NULL DEFAULT 3 CHECK (learning >= 0 AND learning <= 5),
        "maintainingRelationships" INTEGER NOT NULL DEFAULT 3 CHECK ("maintainingRelationships" >= 0 AND "maintainingRelationships" <= 5),
        
        -- Bad habit scores (0-5 scale)
        "excessiveSocialMedia" INTEGER NOT NULL DEFAULT 2 CHECK ("excessiveSocialMedia" >= 0 AND "excessiveSocialMedia" <= 5),
        procrastination INTEGER NOT NULL DEFAULT 2 CHECK (procrastination >= 0 AND procrastination <= 5),
        "negativeThinking" INTEGER NOT NULL DEFAULT 2 CHECK ("negativeThinking" >= 0 AND "negativeThinking" <= 5),
        
        -- Notes
        notes TEXT,
        
        -- Metadata
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        -- Ensure only one check-in per client per day
        UNIQUE("clientId", date)
      );
    `;

    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_checkin_client_id ON "CheckIn"("clientId")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_checkin_date ON "CheckIn"(date)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_checkin_created_at ON "CheckIn"("createdAt")`;

  } catch (error) {
    console.error('Error creating CheckIn table:', error);
    throw error;
  }
}

async function createUserStatsTable() {
  try {
    // Create user_stats table
    await sql`
          CREATE TABLE IF NOT EXISTS user_stats (
              user_id UUID PRIMARY KEY REFERENCES "User"(id) ON DELETE CASCADE,
              daily_streak INTEGER DEFAULT 0,
              total_points INTEGER DEFAULT 0,
              last_checkin_date DATE,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
      `;

    // Create index for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id)`;

  } catch (error) {
    console.error('Error creating user stats table:', error);
    throw error;
  }
}

async function createIntegrationTables() {
  try {
    // 1. Create CoachIntegration table to store OAuth tokens and settings
    await sql`
      CREATE TABLE IF NOT EXISTS "CoachIntegration" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "coachId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        platform VARCHAR(50) NOT NULL CHECK (platform IN ('google_calendar', 'zoom', 'teams')),
        "accessToken" TEXT NOT NULL,
        "refreshToken" TEXT,
        "tokenExpiresAt" TIMESTAMP WITH TIME ZONE,
        "scope" TEXT,
        "platformUserId" VARCHAR(255),
        "platformEmail" VARCHAR(255),
        "platformName" VARCHAR(255),
        "isActive" BOOLEAN DEFAULT true,
        "settings" JSONB DEFAULT '{}',
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uk_coach_platform UNIQUE("coachId", "platform")
      )
    `;

    // 2. Create IntegrationEvent table to track external calendar events
    await sql`
      CREATE TABLE IF NOT EXISTS "IntegrationEvent" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "sessionId" UUID NOT NULL REFERENCES "Session"(id) ON DELETE CASCADE,
        "integrationId" UUID NOT NULL REFERENCES "CoachIntegration"(id) ON DELETE CASCADE,
        "platformEventId" VARCHAR(255) NOT NULL,
        "platformMeetingId" VARCHAR(255),
        "meetingUrl" TEXT,
        "meetingPassword" VARCHAR(50),
        "calendarEventId" VARCHAR(255),
        "status" VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'updated')),
        "lastSyncAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uk_session_integration UNIQUE("sessionId", "integrationId")
      )
    `;


    // 3. Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_coach_integration_coach_id ON "CoachIntegration"("coachId")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_coach_integration_platform ON "CoachIntegration"("platform")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_integration_event_session_id ON "IntegrationEvent"("sessionId")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_integration_event_integration_id ON "IntegrationEvent"("integrationId")`;

  } catch (error) {
    console.error('Error creating integration tables:', error);
    throw error;
  }
}

async function createChatTables() {
  try {
    // Create Conversations table (simplified)
    await sql`
      CREATE TABLE IF NOT EXISTS "Conversation" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type VARCHAR(20) NOT NULL CHECK (type IN ('personal', 'group')),
        name VARCHAR(255),
        "createdBy" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        "groupId" UUID REFERENCES "Group"(id) ON DELETE CASCADE,
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create ConversationParticipants table (simplified)
    await sql`
      CREATE TABLE IF NOT EXISTS "ConversationParticipant" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "conversationId" UUID NOT NULL REFERENCES "Conversation"(id) ON DELETE CASCADE,
        "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
        "joinedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "lastReadAt" TIMESTAMP,
        "isActive" BOOLEAN DEFAULT true,
        UNIQUE("conversationId", "userId")
      );
    `;

    // Create Messages table (simplified - only text and voice)
    await sql`
      CREATE TABLE IF NOT EXISTS "Message" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "conversationId" UUID NOT NULL REFERENCES "Conversation"(id) ON DELETE CASCADE,
        "senderId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        type VARCHAR(20) DEFAULT 'text' CHECK (type IN ('text', 'voice')),
        "replyToId" UUID REFERENCES "Message"(id) ON DELETE SET NULL,
        "audioUrl" VARCHAR(500),
        "audioDuration" INTEGER,
        "waveformData" JSONB,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;


    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_conversation_type ON "Conversation"(type)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_conversation_created_by ON "Conversation"("createdBy")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_conversation_group_id ON "Conversation"("groupId")`;

    await sql`CREATE INDEX IF NOT EXISTS idx_participant_conversation ON "ConversationParticipant"("conversationId")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_participant_user ON "ConversationParticipant"("userId")`;

    await sql`CREATE INDEX IF NOT EXISTS idx_message_conversation ON "Message"("conversationId")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_message_sender ON "Message"("senderId")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_message_created_at ON "Message"("createdAt")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_message_type ON "Message"(type)`;

    // Create Activity table for tracking client activities
    await sql`
      CREATE TABLE IF NOT EXISTS "Activity" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        "clientId" UUID REFERENCES "Client"(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL CHECK (type IN ('signup', 'task_completed', 'daily_checkin', 'session_attended', 'goal_achieved', 'milestone_reached', 'other')),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        "activityData" JSONB, -- Store additional data like task details, check-in responses, etc.
        "pointsEarned" INTEGER DEFAULT 0,
        "isVisible" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        
        -- Add constraints for data integrity
        CONSTRAINT chk_activity_points CHECK ("pointsEarned" >= 0),
        CONSTRAINT chk_activity_type_length CHECK (LENGTH(type) >= 3)
      );
    `;

    // Create indexes for Activity table
    await sql`CREATE INDEX IF NOT EXISTS idx_activity_user ON "Activity"("userId")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_activity_client ON "Activity"("clientId")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_activity_type ON "Activity"(type)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_activity_created_at ON "Activity"("createdAt")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_activity_visible ON "Activity"("isVisible")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_activity_user_type ON "Activity"("userId", type)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_activity_client_type ON "Activity"("clientId", type)`;

    // Create Notification table for user notifications
    await sql`
      CREATE TABLE IF NOT EXISTS "Notification" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL CHECK (type IN ('client_signup', 'task_completed', 'daily_checkin', 'new_message', 'session_reminder', 'goal_achieved', 'system', 'group_join_request', 'other')),
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

    // Update existing Notification table constraint to include group_join_request
    try {
      await sql`ALTER TABLE "Notification" DROP CONSTRAINT IF EXISTS "Notification_type_check"`;
      await sql`ALTER TABLE "Notification" ADD CONSTRAINT "Notification_type_check" CHECK (type IN ('client_signup', 'task_completed', 'daily_checkin', 'new_message', 'session_reminder', 'goal_achieved', 'system', 'group_join_request', 'other'))`;
    } catch (error) {
      console.log('Note: Notification constraint update may have failed, but table creation will handle it');
    }

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

    await seedUser();
    await createProgramTemplateTable();
    await seedTask(); // Create Group, Client, Task, Session tables first
    await createProgramEnrollmentTable(); // Now Client table exists
    await createChatTables(); // Create Chat tables
    await createResourceTable(); // Create Resource table for library
    await seedNote();
    await createCheckInTable(); // Create CheckIn table for daily journal entries
    await createUserStatsTable(); // Create user stats table
    await createResourceCompletionTable(); // Create resource completion table
    await createIntegrationTables(); // Create integration tables
    console.log('Database seeded successfully');

    return new Response(JSON.stringify({
      message: 'Database seeded successfully',
      details: 'User, ProgramTemplate, Group, Task, Client, Resource, Note, CheckIn, and Integration tables created with sample data'
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
