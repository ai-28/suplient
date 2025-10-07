"use client";

import { createContext, useContext, useEffect, useRef, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export default function SocketProvider({ children }) {
  const { data: session } = useSession();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [globalOnlineUsers, setGlobalOnlineUsers] = useState([]);
  const socketInitialized = useRef(false);

  // Memoize user data
  const userData = useMemo(() => {
    if (!session?.user) return null;
    return {
      userId: session.user.id,
      userEmail: session.user.email,
      userName: session.user.name
    };
  }, [session?.user?.id, session?.user?.email, session?.user?.name]);

  useEffect(() => {
    if (!userData) {
      if (socket) {
        console.log('🔥 Disconnecting socket - no user data');
        socket.removeAllListeners();
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
        socketInitialized.current = false;
      }
      return;
    }

    // Prevent multiple socket initializations
    if (socketInitialized.current) {
      console.log('🔥 Socket already initialized, skipping');
      return;
    }

    console.log('🔥 Creating global socket connection for:', userData.userName);
    socketInitialized.current = true;

    const newSocket = io({
      auth: userData,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      timeout: 30000,
    });

    // Global event handlers
    const handleGlobalUserOnline = (data) => {
      console.log('🔥 Global user online event received:', data);
      setGlobalOnlineUsers(prev => {
        const exists = prev.some(user => user.userId === data.userId);
        if (!exists) {
          const newList = [...prev, {
            userId: data.userId,
            userName: data.userName
          }];
          console.log('🔥 Updated global online users list:', newList);
          return newList;
        }
        return prev;
      });
    };

    const handleGlobalUserOffline = (data) => {
      console.log('🔥 Global user offline event received:', data);
      setGlobalOnlineUsers(prev => {
        const newList = prev.filter(user => user.userId !== data.userId);
        console.log('🔥 Updated global online users list after offline:', newList);
        return newList;
      });
    };

    // Connection handlers
    newSocket.on('connect', () => {
      console.log('🔥 Global socket connected:', newSocket.id);
      setIsConnected(true);
      setConnectionError(null);
      newSocket.emit('authenticate', userData);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔥 Global socket disconnected:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('🔥 Global socket connection error:', error);
      setConnectionError(error.message);
      setIsConnected(false);
    });

    // Register global event listeners
    newSocket.on('user_online_global', handleGlobalUserOnline);
    newSocket.on('user_offline_global', handleGlobalUserOffline);
    newSocket.on('test_event', (data) => {
      console.log('🔥 TEST EVENT RECEIVED:', data);
    });

    setSocket(newSocket);

    // Cleanup
    return () => {
      console.log('🔥 Cleaning up global socket connection');
      newSocket.off('user_online_global', handleGlobalUserOnline);
      newSocket.off('user_offline_global', handleGlobalUserOffline);
      newSocket.off('test_event');
      newSocket.removeAllListeners();
      newSocket.disconnect();
      socketInitialized.current = false;
    };
  }, [userData]);

  const value = {
    socket,
    isConnected,
    connectionError,
    globalOnlineUsers,
    joinConversation: (conversationId) => {
      if (socket && isConnected) {
        socket.emit('join_conversation', { conversationId });
      }
    },
    leaveConversation: (conversationId) => {
      if (socket) {
        socket.emit('leave_conversation', { conversationId });
      }
    },
    sendMessage: (content, type = 'text', additionalData = {}) => {
      if (socket && isConnected) {
        const messageData = {
          content,
          type,
          timestamp: new Date(),
          ...additionalData
        };
        socket.emit('send_message', messageData);
      }
    },
    startTyping: (conversationId) => {
      if (socket && isConnected) {
        socket.emit('typing_start', {
          conversationId,
          userId: userData?.userId,
          userName: userData?.userName
        });
      }
    },
    stopTyping: (conversationId) => {
      if (socket && isConnected) {
        socket.emit('typing_stop', {
          conversationId,
          userId: userData?.userId,
          userName: userData?.userName
        });
      }
    }
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}