import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import axios from 'axios';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const socketRef = useRef(null);

  // Initialize socket
  useEffect(() => {
    if (!user || !token) return;

    const socket = io('http://localhost:3001', {
      auth: { token }
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      socket.emit('userOnline', user.id);
    });

    socket.on('chatsUpdated', (updatedChats) => {
      setChats(updatedChats);
    });

    socket.on('messages', (newMessages) => {
      if (currentChat &amp;&amp; newMessages[0].conversation_id === currentChat.id) {
        setMessages((prev) => [...prev, ...newMessages]);
      }
    });

    socket.on('messageRead', ({ conversationId, messageIds }) => {
      if (conversationId === currentChat?.id) {
        setMessages((prev) =>
          prev.map((msg) =>
            messageIds.includes(msg.id)
              ? { ...msg, read: true }
              : msg
          )
        );
      }
    });

    socket.on('typing', ({ conversationId, userId, isTyping }) => {
      if (conversationId === currentChat?.id) {
        if (isTyping) {
          setTypingUsers((prev) => new Set(prev).add(userId));
        } else {
          setTypingUsers((prev) => {
            const newSet = new Set(prev);
            newSet.delete(userId);
            return newSet;
          });
        }
      }
    });

    socket.on('onlineUsers', (users) => {
      setOnlineUsers(new Set(users));
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    return () => {
      socket.disconnect();
    };
  }, [user, token, currentChat?.id]);

  const loadChats = useCallback(async () => {
    if (!user) return;
    try {
      const response = await axios.get('/api/chats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChats(response.data.chats);
    } catch (error) {
      console.error('Error loading chats:', error);
    }
  }, [user, token]);

  const loadMessages = useCallback(async (chatId, page = 1) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/messages/${chatId}?page=${page}&limit=50`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data.messages);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const sendMessage = useCallback(async (conversationId, content, type = 'text') => {
    const messageData = {
      conversation_id: conversationId,
      content,
      type,
      sender: 'user'
    };

    try {
      // Optimistic update
      const tempId = Date.now();
      const tempMessage = {
        ...messageData,
        id: tempId,
        status: 'sending',
        created_at: new Date().toISOString()
      };
      setMessages((prev) => [...prev, tempMessage]);

      // API + Socket
      const response = await axios.post('/api/messages', messageData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update with real data
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempId ? { ...response.data, status: 'sent' } : msg
        )
      );

      // Socket broadcast
      socketRef.current.emit('sendMessage', response.data);

    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempId ? { ...msg, status: 'failed' } : msg
        )
      );
    }
  }, [token]);

  const startTyping = useCallback((conversationId) => {
    socketRef.current.emit('typing', { conversationId, isTyping: true });
  }, []);

  const stopTyping = useCallback((conversationId) => {
    socketRef.current.emit('typing', { conversationId, isTyping: false });
  }, []);

  const markMessagesRead = useCallback((conversationId, messageIds) => {
    socketRef.current.emit('messageRead', { conversationId, messageIds });
  }, []);

  const joinChat = useCallback((conversationId) => {
    socketRef.current.emit('joinChat', conversationId);
    setCurrentChat(chats.find((c) => c.id === conversationId));
  }, [chats]);

  const value = {
    chats,
    currentChat,
    messages,
    onlineUsers,
    typingUsers,
    loading,
    loadChats,
    loadMessages,
    sendMessage,
    startTyping,
    stopTyping,
    markMessagesRead,
    joinChat,
    setCurrentChat
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

