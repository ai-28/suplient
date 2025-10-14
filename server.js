const http = require('node:http');
const next = require('next');
const { Server } = require('socket.io');
const emailjs = require('@emailjs/nodejs');
require('dotenv').config();

// Import database connection
const { sql } = require('./src/app/lib/db/postgresql');

// Helper function to get conversation participants
async function getConversationParticipants(conversationId) {
  try {
    const participants = await sql`
      SELECT u.id, u.name, u.email
      FROM "ConversationParticipant" cp
      JOIN "User" u ON cp."userId" = u.id
      WHERE cp."conversationId" = ${conversationId}
    `;
    return participants;
  } catch (error) {
    console.error('Error getting conversation participants:', error);
    return [];
  }
}

const dev = process.env.NODE_ENV !== "production";
const hostname = dev ? "localhost" : (process.env.NEXTAUTH_URL ? new URL(process.env.NEXTAUTH_URL).hostname : "localhost");
const port = process.env.PORT || 3000;

const emailUserId = {
  publicKey: process.env.EMAIL_PUBLIC_KEY,
  privateKey: process.env.EMAIL_PRIVATE_KEY,
};

// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = http.createServer(handler);

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Set global socket for notifications
  console.log('🔧 Setting up global socket for notifications...');

  // Set global socket directly
  global.globalSocketIO = io;
  console.log('✅ Global socket set directly:', !!global.globalSocketIO);

  let onlineUsers = [];
  const pendingNotifications = new Map();

  io.on("connection", (socket) => {
    console.log('Client connected:', socket.id);

    // Handle authentication
    socket.on('authenticate', (authData) => {
      const { userId, userEmail, userName } = authData;
      socket.userId = userId;
      socket.userEmail = userEmail;
      socket.userName = userName;

      // Add to online users
      const exists = onlineUsers.find(user => user.email === userEmail);
      if (!exists) {
        onlineUsers.push({
          email: userEmail,
          userId: userId,
          userName: userName,
          socketId: socket.id
        });
      } else {
        exists.socketId = socket.id;
        exists.userId = userId;
        exists.userName = userName;
      }

      socket.emit('online_users', onlineUsers);
      socket.broadcast.emit('online_users', onlineUsers);
      console.log('User authenticated:', userName, userEmail);

      // Also broadcast globally so any interface can update the user's status
      console.log('About to emit user_online_global for:', userName); // Debug log
      io.emit('user_online_global', {
        userId: userId,
        userName: userName
      });
      console.log('Emitted user_online_global for:', userName); // Debug log

      // Test event to verify client is receiving events
      io.emit('test_event', { message: 'Server is working', userName: userName });

      // Join notification room for real-time notifications
      socket.join(`notifications_${userId}`);

    });

    // Handle join_notifications event
    socket.on('join_notifications', (userId) => {
      if (socket.userId && socket.userId === userId) {
        socket.join(`notifications_${userId}`);
      }
    });

    // Legacy support for old events
    socket.on('user_login', async (email) => {
      const exists = onlineUsers.find(user => user.email === email);
      if (!exists) {
        onlineUsers.push({ email, socketId: socket.id });
      } else {
        exists.socketId = socket.id;
      }
      socket.broadcast.emit('online_users', onlineUsers);
    });

    socket.on("get_user_list", () => {
      socket.emit("online_users", onlineUsers);
    });

    // Modern chat events
    socket.on('join_conversation', (data) => {
      const { conversationId } = data;
      socket.join(`conversation_${conversationId}`);
      console.log(`🔗 User ${socket.userName || socket.id} joined conversation ${conversationId}`);
      console.log(`🔗 Socket rooms after join:`, Array.from(socket.rooms));

      // Emit user_online event for chat interface compatibility
      socket.to(`conversation_${conversationId}`).emit('user_online', {
        userId: socket.userId,
        userName: socket.userName,
        conversationId
      });

      // Also emit global online event so any interface can update the user's status
      // Only emit if user is authenticated
      if (socket.userId && socket.userName) {
        io.emit('user_online_global', {
          userId: socket.userId,
          userName: socket.userName
        });
        console.log('Emitted user_online_global on join_conversation for:', socket.userName); // Debug log
      } else {
        console.log('Skipping user_online_global - user not authenticated:', socket.userName); // Debug log
      }
    });

    socket.on('leave_conversation', (data) => {
      const { conversationId } = data;
      socket.leave(`conversation_${conversationId}`);
      // Only log if it's a deliberate leave (not a disconnect/reconnect)
      if (socket.connected) {
        console.log(`User ${socket.userName || socket.id} deliberately left conversation ${conversationId}`);
      }
    });

    socket.on('send_message', async (data) => {
      const { conversationId, ...messageData } = data;

      // Generate a unique ID for the socket message
      const socketMessageId = `socket-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const socketMessage = {
        ...messageData,
        id: socketMessageId,
        senderId: socket.userId,
        senderName: socket.userName,
        senderEmail: socket.userEmail,
        timestamp: new Date(),
        createdAt: new Date()
      };

      // Broadcast to all users in the conversation (including sender for confirmation)
      io.to(`conversation_${conversationId}`).emit('new_message', socketMessage);

      // Also emit unread count update to all participants via their notification rooms
      console.log('📨 Emitting unread count update for conversation:', conversationId);

      try {
        // Get all participants and emit to their individual notification rooms
        const participants = await getConversationParticipants(conversationId);
        for (const participant of participants) {
          io.to(`notifications_${participant.id}`).emit('update_unread_count', {
            conversationId,
            participantId: participant.id,
            messageId: socketMessage.id
          });
        }
      } catch (error) {
        console.error('Error emitting unread count updates:', error);
      }

      console.log(`📨 Message sent in conversation ${conversationId} by ${socket.userName}`);
    });

    socket.on('typing_start', (data) => {
      const { conversationId } = data;
      socket.to(`conversation_${conversationId}`).emit('user_typing', {
        userId: socket.userId,
        userName: socket.userName,
        conversationId,
        isTyping: true
      });
    });

    socket.on('typing_stop', (data) => {
      const { conversationId } = data;
      socket.to(`conversation_${conversationId}`).emit('user_typing', {
        userId: socket.userId,
        userName: socket.userName,
        conversationId,
        isTyping: false
      });
    });


    socket.on('send-message', (data) => {
      const notificationTimeout = setTimeout(async () => {
        await sendEmailNotification(data);
        pendingNotifications.delete(data.id);
      }, 900000);

      pendingNotifications.set(data.id, notificationTimeout);
      const receiver = onlineUsers.find(user => user.email === data.to)
      if (receiver) {
        socket.to(receiver.socketId).emit("msg-recieve", data);
      }
      socket.emit('message-status', { messageId: data.id, status: 'sent' })
    });

    socket.on("message_delivered", ({ messageId, from }) => {
      if (pendingNotifications.has(messageId)) {
        clearTimeout(pendingNotifications.get(messageId));
        pendingNotifications.delete(messageId);
      } const receiver = onlineUsers.find(user => user.email === from)
      socket.to(receiver.socketId).emit("message-status", { messageId, status: "delivered" })
    })

    socket.on('messages_viewed', async (updatedMessages) => {
      try {
        updatedMessages.forEach(msg => {
          if (pendingNotifications.has(msg.id)) {
            clearTimeout(pendingNotifications.get(msg.id));
            pendingNotifications.delete(msg.id);
          }
          const receiver = onlineUsers.find(user => user.email === msg.sender);
          if (receiver) {
            socket.to(receiver.socketId).emit('message-status', {
              messageId: msg.id,
              status: 'delivered',
            });
          }
        });
      } catch (error) {
        console.error('Error updating message status:', error);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`User ${socket.userName || socket.id} disconnected: ${reason}`);

      // Leave notification room
      if (socket.userId) {
        socket.leave(`notifications_${socket.userId}`);
        console.log(`User ${socket.userName} left notifications room for user ${socket.userId}`);
      }

      // Remove user from onlineUsers
      onlineUsers = onlineUsers.filter(user => user.socketId !== socket.id);

      // Broadcast updated user list to all remaining users
      io.emit('online_users', onlineUsers);

      // Also emit user_offline events for chat interface compatibility
      // Find all conversations this user was in and notify them
      const userRooms = Array.from(socket.rooms).filter(room => room.startsWith('conversation_'));
      userRooms.forEach(room => {
        const conversationId = room.replace('conversation_', '');
        socket.to(room).emit('user_offline', {
          userId: socket.userId,
          userName: socket.userName,
          conversationId
        });
      });

      // Also broadcast globally so any interface can update the user's status
      // Only emit if user is authenticated
      if (socket.userId && socket.userName) {
        io.emit('user_offline_global', {
          userId: socket.userId,
          userName: socket.userName
        });
        console.log('Emitted user_offline_global for:', socket.userName); // Debug log
      } else {
        console.log('Skipping user_offline_global - user not authenticated:', socket.userName); // Debug log
      }
    });
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, "0.0.0.0", () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});

async function sendEmailNotification(message) {
  try {
    const templateParams = {
      name: message.from,
      time: formatDate(new Date()),
      email: message.to,
    };

    await emailjs.send(
      process.env.EMAIL_SERVICE_ID,
      process.env.EMAIL_NEW_MESSAGE_TEMPLATE_ID,
      templateParams,
      emailUserId
    );
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "long", // e.g. "April"
    day: "numeric", // e.g. 21
    hour: "numeric", // e.g. 10 PM
    minute: "2-digit", // e.g. 15
    hour12: true, // 12-hour clock with AM/PM
  }).format(date);
};
