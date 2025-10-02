import { useEffect, useRef, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { io } from 'socket.io-client';

export function useSocket() {
  const { data: session } = useSession();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const joinedConversations = useRef(new Set()); // Track joined conversations

  // Memoize user data to prevent unnecessary re-renders
  // Use a more stable approach that doesn't change on session refreshes
  const userData = useMemo(() => {
    if (!session?.user) return null;
    return {
      userId: session.user.id,
      userEmail: session.user.email,
      userName: session.user.name
    };
  }, [session?.user?.id, session?.user?.email, session?.user?.name]); // Include all user fields but memoize properly

  useEffect(() => {
    if (!userData) {
      if (socket) {
        console.log('Disconnecting socket - no user data');
        socket.removeAllListeners();
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Only create socket if it doesn't exist or is disconnected
    if (socket && socket.connected) {
      console.log('Socket already connected, skipping creation');
      return;
    }

    if (socket && !socket.connected) {
      console.log('Reconnecting existing socket');
      socket.connect();
      return;
    }

    // Additional check: if we have a socket but it's in a weird state, clean it up first
    if (socket && socket.disconnected) {
      console.log('Cleaning up disconnected socket before creating new one');
      socket.removeAllListeners();
      setSocket(null);
    }

    console.log('Creating new socket for user:', userData.userName);

    // Create socket connection
    const newSocket = io({
      auth: userData,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      timeout: 30000,
      forceNew: false, // Don't force new connections unnecessarily
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      setIsConnected(true);
      setConnectionError(null);
      reconnectAttempts.current = 0;

      // Send authentication immediately after connection
      newSocket.emit('authenticate', userData);

      // Rejoin all previously joined conversations
      const conversationsToRejoin = Array.from(joinedConversations.current);
      conversationsToRejoin.forEach(conversationId => {
        console.log('Rejoining conversation after reconnect:', conversationId);
        newSocket.emit('join_conversation', { conversationId });
      });

      // Clear any pending reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);

      // Don't clear joined conversations immediately - we'll rejoin on reconnect
      // This prevents the "left conversation" message from appearing

      // Handle different disconnect reasons
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, try to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            newSocket.connect();
          }, 2000 * reconnectAttempts.current);
        } else {
          setConnectionError('Unable to reconnect to chat server');
        }
      } else if (reason === 'io client disconnect') {
        // Client initiated disconnect (page refresh, navigation, etc.)
        // Don't try to reconnect automatically, let the component handle it
        console.log('Client disconnected, will reconnect on next mount');
        // Clear joined conversations only on client disconnect
        joinedConversations.current.clear();
      } else {
        // Other disconnect reasons (network issues, etc.)
        // Try to reconnect after a delay
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            newSocket.connect();
          }, 3000 * reconnectAttempts.current);
        } else {
          setConnectionError('Connection lost. Please refresh the page.');
        }
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setConnectionError(error.message);
      setIsConnected(false);
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
      setConnectionError(error.message);
    });

    setSocket(newSocket);

    // Cleanup on unmount or dependency change
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      // Clear joined conversations on cleanup
      joinedConversations.current.clear();

      // Only disconnect if this is a real unmount (not just dependency change)
      // We'll let the next useEffect handle reconnection
      if (newSocket && newSocket.connected) {
        console.log('Cleaning up socket connection');
        newSocket.removeAllListeners(); // Remove listeners to prevent memory leaks
        newSocket.disconnect();
      }
    };
  }, [userData?.userId, userData?.userEmail, userData?.userName]); // Depend on all user fields but prevent unnecessary recreations

  // Handle browser visibility changes to prevent unnecessary socket recreation
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('Browser hidden - keeping socket connection');
      } else {
        console.log('Browser visible - checking socket connection');
        // Don't recreate socket, just ensure it's still connected
        if (socket && !socket.connected) {
          console.log('Reconnecting socket after visibility change');
          socket.connect();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [socket]);

  // Helper functions for common socket operations
  const joinConversation = (conversationId) => {
    if (socket && isConnected && conversationId) {
      // Only join if not already joined
      if (!joinedConversations.current.has(conversationId)) {
        console.log('Joining conversation:', conversationId);
        socket.emit('join_conversation', { conversationId });
        joinedConversations.current.add(conversationId);
      } else {
        console.log('Already joined conversation:', conversationId);
      }
    }
  };

  const leaveConversation = (conversationId) => {
    if (socket && isConnected && conversationId) {
      // Only leave if actually joined
      if (joinedConversations.current.has(conversationId)) {
        console.log('Leaving conversation:', conversationId);
        socket.emit('leave_conversation', { conversationId });
        joinedConversations.current.delete(conversationId);
      } else {
        console.log('Not joined to conversation:', conversationId);
      }
    }
  };

  const sendMessage = (conversationId, messageData) => {
    if (socket && isConnected) {
      socket.emit('send_message', {
        conversationId,
        ...messageData
      });
    }
  };

  const startTyping = (conversationId) => {
    if (socket && isConnected) {
      socket.emit('typing_start', { conversationId });
    }
  };

  const stopTyping = (conversationId) => {
    if (socket && isConnected) {
      socket.emit('typing_stop', { conversationId });
    }
  };

  const addReaction = (messageId, emoji) => {
    if (socket && isConnected) {
      socket.emit('add_reaction', { messageId, emoji });
    }
  };

  const removeReaction = (messageId, emoji) => {
    if (socket && isConnected) {
      socket.emit('remove_reaction', { messageId, emoji });
    }
  };

  const markMessagesAsRead = (conversationId, messageIds) => {
    if (socket && isConnected) {
      socket.emit('mark_messages_read', { conversationId, messageIds });
    }
  };

  return {
    socket,
    isConnected,
    connectionError,
    joinConversation,
    leaveConversation,
    sendMessage,
    startTyping,
    stopTyping,
    addReaction,
    removeReaction,
    markMessagesAsRead
  };
}