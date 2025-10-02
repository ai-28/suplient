const http = require('node:http');
const next = require('next');
const { Server } = require('socket.io');
const emailjs = require('@emailjs/nodejs');
require('dotenv').config();

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
      console.log(`User ${socket.userName || socket.id} joined conversation ${conversationId}`);
    });

    socket.on('leave_conversation', (data) => {
      const { conversationId } = data;
      socket.leave(`conversation_${conversationId}`);
      // Only log if it's a deliberate leave (not a disconnect/reconnect)
      if (socket.connected) {
        console.log(`User ${socket.userName || socket.id} deliberately left conversation ${conversationId}`);
      }
    });

    socket.on('send_message', (data) => {
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

      console.log('Broadcasting socket message:', socketMessage); // Debug log

      // Broadcast to all users in the conversation
      socket.to(`conversation_${conversationId}`).emit('new_message', socketMessage);

      console.log(`Message sent in conversation ${conversationId} by ${socket.userName}`);
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

    socket.on('mark_messages_read', (data) => {
      const { conversationId, messageIds } = data;
      console.log(`📖 User ${socket.userName} marked messages as read:`, messageIds);

      // Get all participants in the conversation to verify broadcasting
      const room = io.sockets.adapter.rooms.get(`conversation_${conversationId}`);
      const participantCount = room ? room.size : 0;
      console.log(`📡 Broadcasting read receipt to ${participantCount} participants in conversation_${conversationId}`);

      // Broadcast to all participants in the conversation (including sender)
      io.to(`conversation_${conversationId}`).emit('messages_read', {
        userId: socket.userId,
        userName: socket.userName,
        conversationId,
        messageIds,
        readAt: new Date()
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

      // Remove user from onlineUsers
      onlineUsers = onlineUsers.filter(user => user.socketId !== socket.id);

      // Broadcast updated user list to all remaining users
      io.emit('online_users', onlineUsers);
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
