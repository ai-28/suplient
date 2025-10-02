import { sql } from '../../lib/db/postgresql';

async function createChatTables() {
  try {
    // Create Conversations table
    await sql`
      CREATE TABLE IF NOT EXISTS "Conversation" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type VARCHAR(20) NOT NULL CHECK (type IN ('personal', 'group')),
        name VARCHAR(255),
        description TEXT,
        "createdBy" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        "groupId" UUID REFERENCES "Group"(id) ON DELETE CASCADE,
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create ConversationParticipants table
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

    // Create Messages table
    await sql`
      CREATE TABLE IF NOT EXISTS "Message" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "conversationId" UUID NOT NULL REFERENCES "Conversation"(id) ON DELETE CASCADE,
        "senderId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        type VARCHAR(20) DEFAULT 'text' CHECK (type IN ('text', 'image', 'file', 'voice', 'system')),
        "replyToId" UUID REFERENCES "Message"(id) ON DELETE SET NULL,
        "fileUrl" VARCHAR(500),
        "fileName" VARCHAR(255),
        "fileSize" INTEGER,
        "fileType" VARCHAR(100),
        "audioUrl" VARCHAR(500),
        "audioDuration" INTEGER,
        "waveformData" JSONB,
        metadata JSONB DEFAULT '{}',
        "isEdited" BOOLEAN DEFAULT false,
        "editedAt" TIMESTAMP,
        "isDeleted" BOOLEAN DEFAULT false,
        "deletedAt" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create MessageReactions table
    await sql`
      CREATE TABLE IF NOT EXISTS "MessageReaction" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "messageId" UUID NOT NULL REFERENCES "Message"(id) ON DELETE CASCADE,
        "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        emoji VARCHAR(10) NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("messageId", "userId", emoji)
      );
    `;

    // Create MessageReadStatus table
    await sql`
      CREATE TABLE IF NOT EXISTS "MessageReadStatus" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "messageId" UUID NOT NULL REFERENCES "Message"(id) ON DELETE CASCADE,
        "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        "readAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("messageId", "userId")
      );
    `;

    // Create TypingStatus table for real-time typing indicators
    await sql`
      CREATE TABLE IF NOT EXISTS "TypingStatus" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "conversationId" UUID NOT NULL REFERENCES "Conversation"(id) ON DELETE CASCADE,
        "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        "isTyping" BOOLEAN DEFAULT false,
        "lastTypingAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("conversationId", "userId")
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

    await sql`CREATE INDEX IF NOT EXISTS idx_reaction_message ON "MessageReaction"("messageId")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_reaction_user ON "MessageReaction"("userId")`;

    await sql`CREATE INDEX IF NOT EXISTS idx_read_status_message ON "MessageReadStatus"("messageId")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_read_status_user ON "MessageReadStatus"("userId")`;

    await sql`CREATE INDEX IF NOT EXISTS idx_typing_conversation ON "TypingStatus"("conversationId")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_typing_user ON "TypingStatus"("userId")`;

    console.log('Chat tables created successfully');
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
