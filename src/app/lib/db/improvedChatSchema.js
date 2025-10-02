import { sql } from './postgresql';

// IMPROVED Chat Database Schema - Following Best Practices
export async function createImprovedChatTables() {
    try {
        // 1. Create Conversations table with better normalization
        await sql`
      CREATE TABLE IF NOT EXISTS "Conversation" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type VARCHAR(20) NOT NULL CHECK (type IN ('personal', 'group')),
        name VARCHAR(255),
        description TEXT,
        "createdBy" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        "groupId" UUID REFERENCES "Group"(id) ON DELETE CASCADE,
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        
        -- Add constraints for data integrity
        CONSTRAINT chk_personal_conversation CHECK (
          (type = 'personal' AND "groupId" IS NULL) OR 
          (type = 'group' AND "groupId" IS NOT NULL)
        )
      );
    `;

        // 2. Create ConversationParticipants table with better indexing
        await sql`
      CREATE TABLE IF NOT EXISTS "ConversationParticipant" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "conversationId" UUID NOT NULL REFERENCES "Conversation"(id) ON DELETE CASCADE,
        "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
        "joinedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "lastReadAt" TIMESTAMP WITH TIME ZONE,
        "isActive" BOOLEAN DEFAULT true,
        
        -- Composite unique constraint
        CONSTRAINT uk_conversation_user UNIQUE("conversationId", "userId")
      );
    `;

        // 3. Create Messages table with better structure
        await sql`
      CREATE TABLE IF NOT EXISTS "Message" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "conversationId" UUID NOT NULL REFERENCES "Conversation"(id) ON DELETE CASCADE,
        "senderId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        content TEXT NOT NULL CHECK (LENGTH(content) <= 10000), -- Limit message length
        type VARCHAR(20) DEFAULT 'text' CHECK (type IN ('text', 'image', 'file', 'voice', 'system')),
        "replyToId" UUID REFERENCES "Message"(id) ON DELETE SET NULL,
        
        -- File attachment fields (normalized)
        "attachmentId" UUID REFERENCES "MessageAttachment"(id) ON DELETE SET NULL,
        
        -- Message metadata
        metadata JSONB DEFAULT '{}' CHECK (jsonb_typeof(metadata) = 'object'),
        "isEdited" BOOLEAN DEFAULT false,
        "editedAt" TIMESTAMP WITH TIME ZONE,
        "isDeleted" BOOLEAN DEFAULT false,
        "deletedAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        
        -- Add constraint for edit tracking
        CONSTRAINT chk_edit_tracking CHECK (
          ("isEdited" = false AND "editedAt" IS NULL) OR 
          ("isEdited" = true AND "editedAt" IS NOT NULL)
        )
      );
    `;

        // 4. Separate table for file attachments (better normalization)
        await sql`
      CREATE TABLE IF NOT EXISTS "MessageAttachment" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "messageId" UUID NOT NULL REFERENCES "Message"(id) ON DELETE CASCADE,
        "fileName" VARCHAR(255) NOT NULL,
        "fileSize" BIGINT NOT NULL CHECK ("fileSize" > 0),
        "fileType" VARCHAR(100) NOT NULL,
        "fileUrl" VARCHAR(500) NOT NULL,
        "thumbnailUrl" VARCHAR(500), -- For images
        "audioDuration" INTEGER CHECK ("audioDuration" > 0), -- For voice messages
        "waveformData" JSONB, -- For voice messages
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        
        -- Add constraint for file types
        CONSTRAINT chk_file_type CHECK (
          ("fileType" LIKE 'image/%' AND "thumbnailUrl" IS NOT NULL) OR
          ("fileType" LIKE 'audio/%' AND "audioDuration" IS NOT NULL) OR
          ("fileType" NOT LIKE 'image/%' AND "fileType" NOT LIKE 'audio/%')
        )
      );
    `;

        // 5. Create MessageReactions table with better constraints
        await sql`
      CREATE TABLE IF NOT EXISTS "MessageReaction" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "messageId" UUID NOT NULL REFERENCES "Message"(id) ON DELETE CASCADE,
        "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        emoji VARCHAR(10) NOT NULL CHECK (LENGTH(emoji) BETWEEN 1 AND 10),
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        
        -- Composite unique constraint
        CONSTRAINT uk_message_user_emoji UNIQUE("messageId", "userId", emoji)
      );
    `;

        // 6. Create MessageReadStatus table with better indexing
        await sql`
      CREATE TABLE IF NOT EXISTS "MessageReadStatus" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "messageId" UUID NOT NULL REFERENCES "Message"(id) ON DELETE CASCADE,
        "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        "readAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        
        -- Composite unique constraint
        CONSTRAINT uk_message_user_read UNIQUE("messageId", "userId")
      );
    `;

        // 7. Create TypingStatus table (consider if this should be in-memory instead)
        await sql`
      CREATE TABLE IF NOT EXISTS "TypingStatus" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "conversationId" UUID NOT NULL REFERENCES "Conversation"(id) ON DELETE CASCADE,
        "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        "isTyping" BOOLEAN DEFAULT false,
        "lastTypingAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        
        -- Composite unique constraint
        CONSTRAINT uk_conversation_user_typing UNIQUE("conversationId", "userId")
      );
    `;

        // 8. Create MessageThread table for better reply handling
        await sql`
      CREATE TABLE IF NOT EXISTS "MessageThread" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "rootMessageId" UUID NOT NULL REFERENCES "Message"(id) ON DELETE CASCADE,
        "replyMessageId" UUID NOT NULL REFERENCES "Message"(id) ON DELETE CASCADE,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        
        -- Ensure no self-replies
        CONSTRAINT chk_no_self_reply CHECK ("rootMessageId" != "replyMessageId"),
        
        -- Composite unique constraint
        CONSTRAINT uk_root_reply UNIQUE("rootMessageId", "replyMessageId")
      );
    `;

        // 9. Create ConversationSettings table for per-conversation settings
        await sql`
      CREATE TABLE IF NOT EXISTS "ConversationSettings" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "conversationId" UUID NOT NULL REFERENCES "Conversation"(id) ON DELETE CASCADE,
        "allowReactions" BOOLEAN DEFAULT true,
        "allowReplies" BOOLEAN DEFAULT true,
        "allowFileUploads" BOOLEAN DEFAULT true,
        "allowVoiceMessages" BOOLEAN DEFAULT true,
        "maxMessageLength" INTEGER DEFAULT 10000,
        "maxFileSize" BIGINT DEFAULT 10485760, -- 10MB
        "allowedFileTypes" TEXT[] DEFAULT ARRAY['image/*', 'audio/*', 'video/*', 'application/pdf'],
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        
        -- One settings per conversation
        CONSTRAINT uk_conversation_settings UNIQUE("conversationId")
      );
    `;

        // 10. Create optimized indexes with better naming and coverage
        await sql`CREATE INDEX IF NOT EXISTS "idx_conversation_type_active" ON "Conversation"(type, "isActive")`;
        await sql`CREATE INDEX IF NOT EXISTS "idx_conversation_created_by_active" ON "Conversation"("createdBy", "isActive")`;
        await sql`CREATE INDEX IF NOT EXISTS "idx_conversation_group_id_active" ON "Conversation"("groupId", "isActive")`;
        await sql`CREATE INDEX IF NOT EXISTS "idx_conversation_updated_at" ON "Conversation"("updatedAt" DESC)`;

        await sql`CREATE INDEX IF NOT EXISTS "idx_participant_conversation_active" ON "ConversationParticipant"("conversationId", "isActive")`;
        await sql`CREATE INDEX IF NOT EXISTS "idx_participant_user_active" ON "ConversationParticipant"("userId", "isActive")`;
        await sql`CREATE INDEX IF NOT EXISTS "idx_participant_last_read" ON "ConversationParticipant"("lastReadAt" DESC)`;

        await sql`CREATE INDEX IF NOT EXISTS "idx_message_conversation_created" ON "Message"("conversationId", "createdAt" DESC)`;
        await sql`CREATE INDEX IF NOT EXISTS "idx_message_sender_created" ON "Message"("senderId", "createdAt" DESC)`;
        await sql`CREATE INDEX IF NOT EXISTS "idx_message_type_active" ON "Message"(type, "isDeleted")`;
        await sql`CREATE INDEX IF NOT EXISTS "idx_message_reply_to" ON "Message"("replyToId")`;

        await sql`CREATE INDEX IF NOT EXISTS "idx_attachment_message" ON "MessageAttachment"("messageId")`;
        await sql`CREATE INDEX IF NOT EXISTS "idx_attachment_type" ON "MessageAttachment"("fileType")`;

        await sql`CREATE INDEX IF NOT EXISTS "idx_reaction_message_emoji" ON "MessageReaction"("messageId", emoji)`;
        await sql`CREATE INDEX IF NOT EXISTS "idx_reaction_user_created" ON "MessageReaction"("userId", "createdAt" DESC)`;

        await sql`CREATE INDEX IF NOT EXISTS "idx_read_status_message" ON "MessageReadStatus"("messageId")`;
        await sql`CREATE INDEX IF NOT EXISTS "idx_read_status_user_read_at" ON "MessageReadStatus"("userId", "readAt" DESC)`;

        await sql`CREATE INDEX IF NOT EXISTS "idx_typing_conversation_active" ON "TypingStatus"("conversationId", "isTyping")`;
        await sql`CREATE INDEX IF NOT EXISTS "idx_typing_user_active" ON "TypingStatus"("userId", "isTyping")`;

        await sql`CREATE INDEX IF NOT EXISTS "idx_thread_root_message" ON "MessageThread"("rootMessageId")`;
        await sql`CREATE INDEX IF NOT EXISTS "idx_thread_reply_message" ON "MessageThread"("replyMessageId")`;

        // 11. Create triggers for automatic timestamp updates
        await sql`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW."updatedAt" = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `;

        await sql`
      CREATE TRIGGER update_conversation_updated_at 
        BEFORE UPDATE ON "Conversation" 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `;

        await sql`
      CREATE TRIGGER update_message_updated_at 
        BEFORE UPDATE ON "Message" 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `;

        await sql`
      CREATE TRIGGER update_typing_status_updated_at 
        BEFORE UPDATE ON "TypingStatus" 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `;

        await sql`
      CREATE TRIGGER update_conversation_settings_updated_at 
        BEFORE UPDATE ON "ConversationSettings" 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `;

        // 12. Create views for common queries
        await sql`
      CREATE OR REPLACE VIEW "ConversationWithParticipants" AS
      SELECT 
        c.*,
        COUNT(cp."userId") as "participantCount",
        ARRAY_AGG(
          JSON_BUILD_OBJECT(
            'id', cp."userId",
            'role', cp.role,
            'joinedAt', cp."joinedAt",
            'lastReadAt', cp."lastReadAt",
            'isActive', cp."isActive"
          )
        ) as participants
      FROM "Conversation" c
      LEFT JOIN "ConversationParticipant" cp ON c.id = cp."conversationId"
      WHERE c."isActive" = true
      GROUP BY c.id;
    `;

        await sql`
      CREATE OR REPLACE VIEW "MessageWithReactions" AS
      SELECT 
        m.*,
        COUNT(mr.id) as "reactionCount",
        ARRAY_AGG(
          JSON_BUILD_OBJECT(
            'emoji', mr.emoji,
            'userId', mr."userId",
            'createdAt', mr."createdAt"
          )
        ) as reactions
      FROM "Message" m
      LEFT JOIN "MessageReaction" mr ON m.id = mr."messageId"
      WHERE m."isDeleted" = false
      GROUP BY m.id;
    `;

        console.log('Improved chat tables created successfully');
    } catch (error) {
        console.error('Error creating improved chat tables:', error);
        throw error;
    }
}

// Additional best practices for the chat system:

// 1. Connection pooling configuration
export const dbConfig = {
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

// 2. Query optimization helpers
export const queryHelpers = {
    // Pagination helper
    async getPaginatedMessages(conversationId, page = 1, limit = 50) {
        const offset = (page - 1) * limit;
        return await sql`
      SELECT * FROM "MessageWithReactions"
      WHERE "conversationId" = ${conversationId}
      ORDER BY "createdAt" DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    },

    // Search messages helper
    async searchMessages(conversationId, searchTerm, limit = 20) {
        return await sql`
      SELECT * FROM "MessageWithReactions"
      WHERE "conversationId" = ${conversationId}
      AND content ILIKE ${'%' + searchTerm + '%'}
      AND "isDeleted" = false
      ORDER BY "createdAt" DESC
      LIMIT ${limit}
    `;
    },

    // Get conversation summary
    async getConversationSummary(conversationId) {
        return await sql`
      SELECT 
        c.*,
        COUNT(m.id) as "messageCount",
        MAX(m."createdAt") as "lastMessageAt",
        COUNT(DISTINCT cp."userId") as "participantCount"
      FROM "Conversation" c
      LEFT JOIN "Message" m ON c.id = m."conversationId" AND m."isDeleted" = false
      LEFT JOIN "ConversationParticipant" cp ON c.id = cp."conversationId" AND cp."isActive" = true
      WHERE c.id = ${conversationId}
      GROUP BY c.id
    `;
    }
};

// 3. Data validation helpers
export const validationHelpers = {
    validateMessageContent(content) {
        if (!content || typeof content !== 'string') {
            throw new Error('Message content is required and must be a string');
        }
        if (content.length > 10000) {
            throw new Error('Message content cannot exceed 10,000 characters');
        }
        return true;
    },

    validateFileUpload(file) {
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = ['image/', 'audio/', 'video/', 'application/pdf'];

        if (file.size > maxSize) {
            throw new Error('File size cannot exceed 10MB');
        }

        if (!allowedTypes.some(type => file.type.startsWith(type))) {
            throw new Error('File type not allowed');
        }

        return true;
    }
};

// 4. Performance monitoring
export const performanceHelpers = {
    async getSlowQueries() {
        return await sql`
      SELECT 
        query,
        calls,
        total_time,
        mean_time,
        rows
      FROM pg_stat_statements
      WHERE mean_time > 1000 -- Queries taking more than 1 second
      ORDER BY mean_time DESC
      LIMIT 10
    `;
    },

    async getTableSizes() {
        return await sql`
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    `;
    }
};


