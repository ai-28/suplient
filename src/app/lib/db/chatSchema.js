import { sql } from './postgresql';

// Helper functions for chat operations
export const chatRepo = {
  // Create a personal conversation between coach and client
  async createPersonalConversation(coachId, clientId) {
    try {
      // First, validate that both users exist
      const users = await sql`
        SELECT id, role FROM "User" 
        WHERE id IN (${coachId}, ${clientId}) 
        AND "isActive" = true
      `;

      if (users.length !== 2) {
        const foundIds = users.map(u => u.id);
        const missingIds = [coachId, clientId].filter(id => !foundIds.includes(id));
        throw new Error(`Users not found: ${missingIds.join(', ')}`);
      }

      // Validate roles
      const coach = users.find(u => u.id === coachId);
      const client = users.find(u => u.id === clientId);

      if (!coach || coach.role !== 'coach') {
        throw new Error(`Invalid coach ID: ${coachId}`);
      }

      if (!client || client.role !== 'client') {
        throw new Error(`Invalid client ID: ${clientId}`);
      }

      // Check if conversation already exists
      const existing = await sql`
        SELECT c.id 
        FROM "Conversation" c
        JOIN "ConversationParticipant" cp1 ON c.id = cp1."conversationId"
        JOIN "ConversationParticipant" cp2 ON c.id = cp2."conversationId"
        WHERE c.type = 'personal'
        AND cp1."userId" = ${coachId}
        AND cp2."userId" = ${clientId}
        AND cp1."isActive" = true
        AND cp2."isActive" = true
      `;

      if (existing.length > 0) {
        return existing[0].id;
      }

      // Create new conversation
      const [conversation] = await sql`
        INSERT INTO "Conversation" (type, "createdBy")
        VALUES ('personal', ${coachId})
        RETURNING id
      `;

      // Add participants
      await sql`
        INSERT INTO "ConversationParticipant" ("conversationId", "userId", role)
        VALUES 
          (${conversation.id}, ${coachId}, 'admin'),
          (${conversation.id}, ${clientId}, 'member')
      `;

      return conversation.id;
    } catch (error) {
      console.error('Error creating personal conversation:', error);
      throw error;
    }
  },

  // Create an admin-coach conversation
  async createAdminCoachConversation(adminId, coachId) {
    try {
      // First, validate that both users exist
      const users = await sql`
        SELECT id, role FROM "User" 
        WHERE id IN (${adminId}, ${coachId}) 
        AND "isActive" = true
      `;

      if (users.length !== 2) {
        const foundIds = users.map(u => u.id);
        const missingIds = [adminId, coachId].filter(id => !foundIds.includes(id));
        throw new Error(`Users not found: ${missingIds.join(', ')}`);
      }

      // Validate roles
      const admin = users.find(u => u.id === adminId);
      const coach = users.find(u => u.id === coachId);

      if (!admin || admin.role !== 'admin') {
        throw new Error(`Invalid admin ID: ${adminId}`);
      }

      if (!coach || coach.role !== 'coach') {
        throw new Error(`Invalid coach ID: ${coachId}`);
      }

      // Check if conversation already exists
      const existing = await sql`
        SELECT c.id 
        FROM "Conversation" c
        JOIN "ConversationParticipant" cp1 ON c.id = cp1."conversationId"
        JOIN "ConversationParticipant" cp2 ON c.id = cp2."conversationId"
        WHERE c.type = 'admin_coach'
        AND cp1."userId" = ${adminId}
        AND cp2."userId" = ${coachId}
        AND cp1."isActive" = true
        AND cp2."isActive" = true
      `;

      if (existing.length > 0) {
        return existing[0].id;
      }

      // Create new conversation
      const [conversation] = await sql`
        INSERT INTO "Conversation" (type, "createdBy")
        VALUES ('admin_coach', ${adminId})
        RETURNING id
      `;

      // Add participants
      await sql`
        INSERT INTO "ConversationParticipant" ("conversationId", "userId", role)
        VALUES 
          (${conversation.id}, ${adminId}, 'admin'),
          (${conversation.id}, ${coachId}, 'member')
      `;

      return conversation.id;
    } catch (error) {
      console.error('Error creating admin-coach conversation:', error);
      throw error;
    }
  },

  // Get admin-coach conversation ID
  async getAdminCoachConversationId(adminId, coachId) {
    try {
      const [conversation] = await sql`
        SELECT c.id 
        FROM "Conversation" c
        JOIN "ConversationParticipant" cp1 ON c.id = cp1."conversationId"
        JOIN "ConversationParticipant" cp2 ON c.id = cp2."conversationId"
        WHERE c.type = 'admin_coach'
        AND cp1."userId" = ${adminId}
        AND cp2."userId" = ${coachId}
        AND cp1."isActive" = true
        AND cp2."isActive" = true
        LIMIT 1
      `;

      return conversation?.id || null;
    } catch (error) {
      console.error('Error getting admin-coach conversation ID:', error);
      throw error;
    }
  },

  // Create a group conversation
  async createGroupConversation(groupId, userId) {
    try {
      // Check if conversation already exists for this group
      const existing = await sql`
        SELECT id FROM "Conversation" 
        WHERE "groupId" = ${groupId} AND type = 'group'
      `;

      if (existing.length > 0) {
        const conversationId = existing[0].id;

        // Ensure user is a participant
        const userParticipant = await sql`
          SELECT id FROM "ConversationParticipant" 
          WHERE "conversationId" = ${conversationId} AND "userId" = ${userId}
        `;

        if (userParticipant.length === 0) {
          await sql`
            INSERT INTO "ConversationParticipant" ("conversationId", "userId", role)
            VALUES (${conversationId}, ${userId}, 'member')
          `;
        }

        return conversationId;
      }

      // Get group info
      const [group] = await sql`
        SELECT name FROM "Group" WHERE id = ${groupId}
      `;

      // Create conversation
      const [conversation] = await sql`
        INSERT INTO "Conversation" (type, name, "createdBy", "groupId")
        VALUES ('group', ${group.name}, ${userId}, ${groupId})
        RETURNING id
      `;

      // Add user as participant
      await sql`
        INSERT INTO "ConversationParticipant" ("conversationId", "userId", role)
        VALUES (${conversation.id}, ${userId}, 'member')
      `;

      // Add all group members
      const groupMembers = await sql`
        SELECT "userId" FROM "Client" WHERE id = ANY(
          SELECT unnest("selectedMembers") FROM "Group" WHERE id = ${groupId}
        )
      `;

      if (groupMembers.length > 0) {
        const memberInserts = groupMembers.map(member =>
          sql`INSERT INTO "ConversationParticipant" ("conversationId", "userId", role) VALUES (${conversation.id}, ${member.userId}, 'member')`
        );
        await Promise.all(memberInserts);
      }

      // Also ensure the current user (who might be a client) is added as a participant
      // This handles cases where clients are trying to access group chats
      const currentUserParticipant = await sql`
        SELECT id FROM "ConversationParticipant" 
        WHERE "conversationId" = ${conversation.id} AND "userId" = ${userId}
      `;

      if (currentUserParticipant.length === 0) {
        await sql`
          INSERT INTO "ConversationParticipant" ("conversationId", "userId", role)
          VALUES (${conversation.id}, ${userId}, 'member')
        `;
      }

      return conversation.id;
    } catch (error) {
      console.error('Error creating group conversation:', error);
      throw error;
    }
  },

  // Get group conversation ID by group ID
  async getGroupConversationId(groupId) {
    try {
      const [conversation] = await sql`
        SELECT id FROM "Conversation" 
        WHERE "groupId" = ${groupId} AND type = 'group' AND "isActive" = true
      `;

      return conversation?.id || null;
    } catch (error) {
      console.error('Error getting group conversation ID:', error);
      throw error;
    }
  },

  // Get user's conversations
  async getUserConversations(userId) {
    try {
      const conversations = await sql`
        SELECT 
          c.id,
          c.type,
          c.name,
          c.description,
          c."createdAt",
          c."updatedAt",
          cp."lastReadAt",
          cp."joinedAt",
          -- Get last message
          (
            SELECT json_build_object(
              'id', m.id,
              'content', m.content,
              'type', m.type,
              'createdAt', m."createdAt",
              'senderId', m."senderId",
              'senderName', u.name
            )
            FROM "Message" m
            JOIN "User" u ON m."senderId" = u.id
            WHERE m."conversationId" = c.id
            ORDER BY m."createdAt" DESC
            LIMIT 1
          ) as "lastMessage",
          -- Get unread count
          (
            SELECT COUNT(*)
            FROM "Message" m
            WHERE m."conversationId" = c.id
            AND m."createdAt" > COALESCE(cp."lastReadAt", cp."joinedAt")
            AND m."senderId" != ${userId}
          ) as "unreadCount"
        FROM "Conversation" c
        JOIN "ConversationParticipant" cp ON c.id = cp."conversationId"
        WHERE cp."userId" = ${userId}
        AND cp."isActive" = true
        AND c."isActive" = true
        ORDER BY c."updatedAt" DESC
      `;

      return conversations;
    } catch (error) {
      console.error('Error getting user conversations:', error);
      throw error;
    }
  },

  // Get conversation participants
  async getConversationParticipants(conversationId) {
    try {
      const participants = await sql`
        SELECT 
          u.id,
          u.name,
          u.email,
          u.role,
          cp.role as "conversationRole",
          cp."joinedAt",
          cp."lastReadAt"
        FROM "ConversationParticipant" cp
        JOIN "User" u ON cp."userId" = u.id
        WHERE cp."conversationId" = ${conversationId}
        AND cp."isActive" = true
        ORDER BY cp."joinedAt" ASC
      `;

      return participants;
    } catch (error) {
      console.error('Error getting conversation participants:', error);
      throw error;
    }
  },

  // Get conversation messages
  async getConversationMessages(conversationId, limit = 50, offset = 0) {
    try {
      const messages = await sql`
        SELECT 
          m.id,
          m.content,
          m.type,
          m."replyToId",
          m."audioUrl",
          m."audioDuration",
          m."waveformData",
          m."createdAt",
          m."updatedAt",
          u.id as "senderId",
          u.name as "senderName",
          u.avatar as "senderAvatar",
          u.role as "senderRole",
          -- Get reply message if exists
          (
            SELECT json_build_object(
              'id', rm.id,
              'content', rm.content,
              'senderName', ru.name,
              'type', rm.type
            )
            FROM "Message" rm
            JOIN "User" ru ON rm."senderId" = ru.id
            WHERE rm.id = m."replyToId"
          ) as "replyTo"
        FROM "Message" m
        JOIN "User" u ON m."senderId" = u.id
        WHERE m."conversationId" = ${conversationId}
        ORDER BY m."createdAt" DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;

      return messages.reverse(); // Return in chronological order
    } catch (error) {
      console.error('Error getting conversation messages:', error);
      throw error;
    }
  },

  // Send a message
  async sendMessage(conversationId, senderId, content, type = 'text', options = {}) {
    try {
      const [message] = await sql`
        INSERT INTO "Message" (
          "conversationId", 
          "senderId", 
          content, 
          type,
          "replyToId",
          "audioUrl",
          "audioDuration",
          "waveformData"
        )
        VALUES (
          ${conversationId},
          ${senderId},
          ${content},
          ${type},
          ${options.replyToId || null},
          ${options.audioUrl || null},
          ${options.audioDuration || null},
          ${options.waveformData ? JSON.stringify(options.waveformData) : null}
        )
        RETURNING id, "createdAt"
      `;

      // Update conversation's updatedAt
      await sql`
        UPDATE "Conversation" 
        SET "updatedAt" = CURRENT_TIMESTAMP 
        WHERE id = ${conversationId}
      `;

      // Update sender's lastReadAt to mark their own message as read
      await sql`
        UPDATE "ConversationParticipant" 
        SET "lastReadAt" = CURRENT_TIMESTAMP 
        WHERE "conversationId" = ${conversationId} 
        AND "userId" = ${senderId}
      `;

      return message;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  // Add a participant to a conversation
  async addParticipant(conversationId, userId, role = 'member') {
    try {
      // Check if participant already exists
      const existing = await sql`
        SELECT id FROM "ConversationParticipant"
        WHERE "conversationId" = ${conversationId} AND "userId" = ${userId}
      `;

      if (existing.length > 0) {
        return existing[0]; // Already a participant
      }

      // Add participant
      const [participant] = await sql`
        INSERT INTO "ConversationParticipant" ("conversationId", "userId", role)
        VALUES (${conversationId}, ${userId}, ${role})
        RETURNING *
      `;

      return participant;
    } catch (error) {
      console.error('Error adding participant:', error);
      throw error;
    }
  },

  // Mark messages as read for a user in a conversation
  async markMessagesAsRead(conversationId, userId) {
    try {
      await sql`
        UPDATE "ConversationParticipant" 
        SET "lastReadAt" = CURRENT_TIMESTAMP 
        WHERE "conversationId" = ${conversationId} 
        AND "userId" = ${userId}
      `;

      return { success: true };
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  },

  // Get conversation by ID
  async getConversationById(conversationId) {
    try {
      const [conversation] = await sql`
        SELECT 
          c.id,
          c.type,
          c.name,
          c.description,
          c."createdBy",
          c."groupId",
          c."createdAt",
          c."updatedAt",
          g.name as "groupName"
        FROM "Conversation" c
        LEFT JOIN "Group" g ON c."groupId" = g.id
        WHERE c.id = ${conversationId}
        AND c."isActive" = true
      `;

      return conversation;
    } catch (error) {
      console.error('Error getting conversation by ID:', error);
      throw error;
    }
  },

  // Verify message access
  async verifyMessageAccess(messageId, userId) {
    try {
      const [access] = await sql`
        SELECT 1
        FROM "Message" m
        JOIN "ConversationParticipant" cp ON m."conversationId" = cp."conversationId"
        WHERE m.id = ${messageId}
        AND cp."userId" = ${userId}
        AND cp."isActive" = true
      `;

      return !!access;
    } catch (error) {
      console.error('Error verifying message access:', error);
      throw error;
    }
  }
};
