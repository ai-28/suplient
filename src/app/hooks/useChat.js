import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useSocket } from '../components/providers/SocketProvider';

export function useChat(conversationId) {
  const { data: session } = useSession();
  const { socket, isConnected, globalOnlineUsers, joinConversation, leaveConversation, sendMessage, startTyping, stopTyping } = useSocket();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [sending, setSending] = useState(false);

  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const pageRef = useRef(0);
  const pageSize = 50;

  // Load messages from API
  const loadMessages = useCallback(async (page = 0, append = false) => {
    if (!conversationId || !session?.user) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/chat/conversations/${conversationId}/messages?limit=${pageSize}&offset=${page * pageSize}`);

      if (!response.ok) {
        throw new Error('Failed to load messages');
      }

      const data = await response.json();

      if (data.success) {
        const newMessages = (data.messages || []).map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp || msg.createdAt),
          // Keep readBy data from database for persistence
          readBy: msg.readBy || []
        }));

        if (append) {
          setMessages(prev => [...newMessages, ...prev]);
        } else {
          setMessages(newMessages);
        }

        setHasMore(newMessages.length === pageSize);
        pageRef.current = page;
      }
    } catch (err) {
      console.error('Error loading messages:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [conversationId, session?.user]);

  // Load more messages (pagination)
  const loadMoreMessages = useCallback(() => {
    if (hasMore && !loading) {
      loadMessages(pageRef.current + 1, true);
    }
  }, [hasMore, loading, loadMessages]);

  // Send message
  const sendChatMessage = useCallback(async (content, type = 'text', options = {}) => {
    if (!conversationId || !session?.user || sending) return;

    try {
      setSending(true);
      setError(null);

      // Optimistically add message to UI
      const tempMessage = {
        id: `temp-${Date.now()}`,
        content,
        type,
        senderId: session.user.id,
        senderName: session.user.name,
        senderRole: session.user.role,
        timestamp: new Date(),
        status: 'sending',
        ...options
      };

      setMessages(prev => [...prev, tempMessage]);

      // Send via socket for real-time delivery
      console.log('Sending socket message:', { conversationId, content, type, ...options }); // Debug log
      sendMessage(conversationId, {
        content,
        type,
        ...options
      });

      // Also send via API for persistence
      const response = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          type,
          ...options
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      console.log('API response:', data); // Debug log

      if (data.success) {
        // Replace temp message with real message, or add if not found
        setMessages(prev => {
          const tempIndex = prev.findIndex(msg => msg.id === tempMessage.id);
          if (tempIndex !== -1) {
            // Replace temp message with real message
            const newMessages = [...prev];
            newMessages[tempIndex] = {
              ...data.message,
              status: 'sent',
              timestamp: new Date(data.message.timestamp || data.message.createdAt || new Date()),
              // Ensure content is preserved from temp message if API response is missing it
              content: data.message.content || tempMessage.content,
              // Preserve readBy data if it exists
              readBy: data.message.readBy || tempMessage.readBy || []
            };
            return newMessages;
          } else {
            // Temp message not found (might have been replaced by socket message)
            // Check if we already have this message from socket
            const exists = prev.some(msg =>
              msg.content === data.message.content &&
              msg.senderId === data.message.senderId &&
              Math.abs(new Date(msg.timestamp) - new Date(data.message.timestamp || data.message.createdAt)) < 5000
            );

            if (!exists) {
              // Add the real message if it doesn't exist
              return [...prev, {
                ...data.message,
                status: 'sent',
                timestamp: new Date(data.message.timestamp || data.message.createdAt || new Date()),
                // Ensure content is preserved
                content: data.message.content || tempMessage.content,
                // Include readBy data
                readBy: data.message.readBy || []
              }];
            } else {
              // Update existing socket message with API response data
              return prev.map(msg => {
                if (msg.content === data.message.content &&
                  msg.senderId === data.message.senderId &&
                  Math.abs(new Date(msg.timestamp) - new Date(data.message.timestamp || data.message.createdAt)) < 5000) {
                  console.log('🔄 Replacing socket message with database message:', {
                    socketId: msg.id,
                    databaseId: data.message.id,
                    content: msg.content
                  });
                  return {
                    ...data.message, // Use database message as base
                    status: 'sent',
                    timestamp: new Date(data.message.timestamp || data.message.createdAt || new Date()),
                    content: data.message.content || msg.content,
                    readBy: data.message.readBy || []
                  };
                }
                return msg;
              });
            }
          }
        });
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err.message);

      // Update temp message to show error
      setMessages(prev => prev.map(msg =>
        msg.id === tempMessage.id
          ? { ...msg, status: 'error' }
          : msg
      ));
    } finally {
      setSending(false);
    }
  }, [conversationId, session?.user, sending, sendMessage]);

  // Handle typing
  const handleTyping = useCallback(() => {
    if (!conversationId) return;

    startTyping(conversationId);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(conversationId);
    }, 2000);
  }, [conversationId, startTyping, stopTyping]);


  // Socket event handlers
  useEffect(() => {
    if (!socket || !conversationId) return;

    // Join conversation when socket connects
    if (isConnected) {
      joinConversation(conversationId);
    }

    // Message events
    const handleNewMessage = (message) => {
      console.log('Received socket message:', message); // Debug log
      setMessages(prev => {
        // Check if message already exists (avoid duplicates)
        // Use multiple criteria to detect duplicates: id, content, senderId, and timestamp
        const exists = prev.some(msg => {
          // If both have IDs, compare by ID
          if (msg.id && message.id) {
            return msg.id === message.id;
          }
          // If no IDs or different ID formats, compare by content, sender, and timestamp
          const timeDiff = Math.abs(new Date(msg.timestamp) - new Date(message.timestamp));
          return msg.content === message.content &&
            msg.senderId === message.senderId &&
            timeDiff < 5000; // Within 5 seconds
        });

        if (exists) {
          console.log('Message already exists, skipping:', message); // Debug log
          return prev;
        }

        console.log('Adding new socket message:', message); // Debug log
        const newMessage = {
          ...message,
          status: message.senderId === session?.user?.id ? 'sent' : 'received',
          timestamp: new Date(message.timestamp || message.createdAt),
          // Ensure content is preserved
          content: message.content || message.text || '[Message received]'
        };
        console.log('Processed message:', newMessage); // Debug log
        return [...prev, newMessage];
      });
    };

    // Typing events
    const handleUserTyping = (data) => {
      if (data.conversationId === conversationId) {
        setTypingUsers(prev => {
          if (data.isTyping) {
            return [...prev.filter(user => user.userId !== data.userId), {
              userId: data.userId,
              userName: data.userName
            }];
          } else {
            return prev.filter(user => user.userId !== data.userId);
          }
        });
      }
    };

    // Online/offline events are now handled globally in useSocket hook

    // Global online/offline events are now handled in useSocket hook



    // Register event listeners
    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleUserTyping);

    // Test: Listen for any event to see if socket is working
    socket.onAny((eventName, ...args) => {
      console.log('Socket received event:', eventName, args); // Debug log
    });

    // Cleanup
    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleUserTyping);
      socket.offAny(); // Clean up the onAny listener

      if (isConnected) {
        leaveConversation(conversationId);
      }
    };
  }, [socket, conversationId, isConnected, joinConversation, leaveConversation]);

  // Load initial messages
  useEffect(() => {
    if (conversationId && session?.user) {
      loadMessages(0, false);
    }
  }, [conversationId, session?.user?.id]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    messages,
    loading,
    error,
    sending,
    typingUsers,
    onlineUsers: globalOnlineUsers,
    hasMore,
    isConnected,
    loadMoreMessages,
    sendMessage: sendChatMessage,
    handleTyping,
    messagesEndRef
  };
}

