import React, { useState, useEffect, useRef } from 'react';



// Utility function to format time
const formatTime = (date) => {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

// Utility function to format date
const formatDate = (date) => {
  const now = new Date();
  const msgDate = new Date(date);
  const diffDays = Math.floor((now - msgDate) / (1000 * 60 * 60 * 24));
  
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return days[msgDate.getDay()];
  return `${months[msgDate.getMonth()]} ${msgDate.getDate()}`;
};

// Get time-based greeting
const getTimeBasedGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

// Get last seen text
const getLastSeen = (date) => {
  if (!date) return 'online';
  const now = new Date();
  const seen = new Date(date);
  const diffMs = now - seen;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  
  if (diffMins < 1) return 'online';
  if (diffMins < 60) return `last seen ${diffMins} minutes ago`;
  if (diffHours < 24) return `last seen ${diffHours} hours ago`;
  return `last seen ${formatDate(seen)}`;
};

// Emoji reactions
const REACTIONS = ['❤️', '😂', '🔥', '👍', '😮', '😢', '🎉', '😊'];

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messageStatus, setMessageStatus] = useState({});
  const [isOnline, setIsOnline] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(null);
  const [showReply, setShowReply] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showContactList, setShowContactList] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recordingInterval = useRef(null);

  // Demo contacts for WhatsApp-style
  const [contacts] = useState([
    { id: 1, name: 'Sarah Johnson', avatar: 'SJ', status: 'online', lastMessage: 'Great! See you tomorrow 👋', time: new Date(Date.now() - 300000), unread: 2 },
    { id: 2, name: 'Mike Chen', avatar: 'MC', status: 'lastseen', lastSeen: new Date(Date.now() - 3600000), lastMessage: 'The project is ready', time: new Date(Date.now() - 3600000), unread: 0 },
    { id: 3, name: 'Emma Wilson', avatar: 'EW', status: 'online', lastMessage: 'Thanks for the update!', time: new Date(Date.now() - 7200000), unread: 0 },
    { id: 4, name: 'David Brown', avatar: 'DB', status: 'lastseen', lastSeen: new Date(Date.now() - 86400000), lastMessage: 'Let me check and get back to you', time: new Date(Date.now() - 86400000), unread: 0 },
  ]);

  const [selectedContact, setSelectedContact] = useState(contacts[0]);

  // Handle contact selection
  const handleContactSelect = (contact) => {
    setSelectedContact(contact);
    setShowContactList(false);
    // Clear messages when switching contacts (or you could load contact-specific messages)
    const now = new Date();
    const welcomeMessage = {
      id: 1,
      sender: 'system',
      content: `${getTimeBasedGreeting()}! 👋 Welcome to RecoverFlow. How can I help you today?`,
      timestamp: now,
      status: 'read'
    };
    setMessages([welcomeMessage]);
  };

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const welcomeMessage = {
        id: 1,
        sender: 'system',
        content: `${getTimeBasedGreeting()}! 👋 Welcome to RecoverFlow. How can I help you today?`,
        timestamp: now,
        status: 'read'
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Simulate online status
  useEffect(() => {
    const interval = setInterval(() => {
      const hour = new Date().getHours();
      setIsOnline(hour >= 8 && hour < 22);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const addMessage = (sender, content, status = 'sent', replyTo = null) => {
    const newMessage = {
      id: messages.length + 1,
      sender,
      content,
      timestamp: new Date(),
      status,
      replyTo,
      reactions: []
    };
    setMessages(prev => [...prev, newMessage]);
    
    // Update message status
    if (sender === 'user') {
      setMessageStatus(prev => ({ ...prev, [newMessage.id]: 'sent' }));
      
      // Simulate delivered
      setTimeout(() => {
        setMessageStatus(prev => ({ ...prev, [newMessage.id]: 'delivered' }));
      }, 500);
      
      // Simulate read
      setTimeout(() => {
        setMessageStatus(prev => ({ ...prev, [newMessage.id]: 'read' }));
      }, 1500);
    }
    
    return newMessage;
  };

  // Simulate typing indicator
  const simulateTyping = (callback, delay = 1000) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      callback();
    }, delay + Math.random() * 1000);
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    
    // Add user message
    addMessage('user', inputText, 'sent', showReply);
    setInputText('');
    
    if (showReply) setShowReply(null);
    
    // Simulate typing and response
    simulateTyping(() => {
      const responses = [
        "Thanks for your message! I'll get back to you shortly.",
        "Got it! Let me check that for you.",
        "Perfect! I'll assist you with that right away.",
        "Thanks for reaching out! How can I help you further?",
        "I understand. Let me look into this for you."
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      addMessage('system', randomResponse, 'read');
    }, 1500);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleReaction = (messageId, emoji) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const hasReaction = msg.reactions.includes(emoji);
        return {
          ...msg,
          reactions: hasReaction 
            ? msg.reactions.filter(r => r !== emoji)
            : [...msg.reactions, emoji]
        };
      }
      return msg;
    }));
    setShowEmojiPicker(null);
  };

  const handleReply = (message) => {
    setShowReply(message);
    inputRef.current?.focus();
  };

  const startRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    recordingInterval.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    clearInterval(recordingInterval.current);
    setIsRecording(false);
    if (recordingTime > 1) {
      addMessage('user', '🎤 Voice message', 'sent', showReply);
    }
    setRecordingTime(0);
    if (showReply) setShowReply(null);
  };

  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderMessageStatus = (message) => {
    if (message.sender !== 'user') return null;
    
    const status = messageStatus[message.id] || message.status;
    
    return (
      <span className={`message-status ${status}`}>
        {status === 'sent' && '✓'}
        {status === 'delivered' && '✓✓'}
        {status === 'read' && <span className="blue-ticks">✓✓</span>}
      </span>
    );
  };

  return (
    <div className="chat-widget whatsapp-widget">
      {/* Floating Button */}
      <div 
        className={`chat-button whatsapp-btn ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
          {isOpen ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          ) : (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        )}
      </div>
      
      {isOpen && (
        <div className="chat-window whatsapp-window">
          {/* WhatsApp Header */}
          <div className="chat-header whatsapp-header">
            <div className="header-info">
              <button 
                className="contact-list-toggle"
                onClick={() => setShowContactList(!showContactList)}
                title="Contacts"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              </button>
              <div className="avatar whatsapp-avatar">
                {selectedContact.avatar}
              </div>
              <div className="header-text">
                <h3>RecoverFlow Chat - {selectedContact.name}</h3>
                <span className="status-indicator">
                  {isOnline ? (
                    <span className="online-status">online</span>
                  ) : (
                    <span className="last-seen">{getLastSeen(selectedContact.lastSeen)}</span>
                  )}
                </span>
              </div>
            </div>
            <div className="header-actions">
              <button className="header-action-btn" title="Voice call">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              </button>
              <button className="header-action-btn" title="Video call">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="23 7 16 12 23 17 23 7"/>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                </svg>
              </button>
              <button className="header-action-btn" title="More options">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="1"/>
                  <circle cx="19" cy="12" r="1"/>
                  <circle cx="5" cy="12" r="1"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Contact List Panel */}
          {showContactList && (
            <div className="contact-list-panel">
              <div className="contact-list-header">
                <h3>Contacts</h3>
                <button 
                  className="close-contact-list"
                  onClick={() => setShowContactList(false)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              <div className="contact-list">
                {contacts.map(contact => (
                  <div 
                    key={contact.id} 
                    className={`contact-item ${selectedContact.id === contact.id ? 'active' : ''}`}
                    onClick={() => handleContactSelect(contact)}
                  >
                    <div className="contact-avatar">
                      {contact.avatar}
                    </div>
                    <div className="contact-info">
                      <div className="contact-name">{contact.name}</div>
                      <div className="contact-last-message">{contact.lastMessage}</div>
                    </div>
                    <div className="contact-meta">
                      <div className="contact-time">{formatTime(contact.time)}</div>
                      {contact.unread > 0 && (
                        <div className="unread-badge">{contact.unread}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Chat Messages */}
          <div className="chat-messages whatsapp-messages">
            {/* Background pattern */}
            <div className="whatsapp-bg-pattern"></div>
            
            {messages.map((message, index) => (
              <div key={message.id} className={`message-wrapper ${message.sender}`}>
                {message.sender === 'system' && index > 0 && (
                  <div className="timestamp-separator">
                    <span>{formatDate(message.timestamp)}</span>
                  </div>
                )}
                
                <div className={`message whatsapp-message ${message.sender}`}>
                  {message.replyTo && (
                    <div className="reply-preview">
                      <span className="reply-name">{message.replyTo.sender === 'user' ? 'You' : selectedContact.name}</span>
                      <span className="reply-text">{message.replyTo.content.substring(0, 50)}...</span>
                    </div>
                  )}
                  <div className="message-content">{message.content}</div>
                  
                  {/* Message reactions */}
                  {message.reactions.length > 0 && (
                    <div className="message-reactions">
                      {message.reactions.map((emoji, idx) => (
                        <span key={idx} className="reaction">{emoji}</span>
                      ))}
                    </div>
                  )}
                  
                  <div className="message-meta">
                    <span className="time">{formatTime(message.timestamp)}</span>
                    {renderMessageStatus(message)}
                  </div>
                  
                  {/* Message actions */}
                  <div className="message-actions">
                    <button 
                      className="msg-action-btn"
                      onClick={() => setShowEmojiPicker(showEmojiPicker === message.id ? null : message.id)}
                      title="React"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                        <line x1="9" y1="9" x2="9.01" y2="9"/>
                        <line x1="15" y1="9" x2="15.01" y2="9"/>
                      </svg>
                    </button>
                    <button 
                      className="msg-action-btn"
                      onClick={() => handleReply(message)}
                      title="Reply"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9 17 4 12 9 7"/>
                        <path d="M20 18v-2a4 4 0 0 0-4-4H4"/>
                      </svg>
                    </button>
                    <button className="msg-action-btn" title="Forward">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="17 1 21 5 17 9"/>
                        <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                        <polyline points="7 23 3 19 7 15"/>
                        <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                      </svg>
                    </button>
                    <button className="msg-action-btn" title="More">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="1"/>
                        <circle cx="19" cy="12" r="1"/>
                        <circle cx="5" cy="12" r="1"/>
                      </svg>
                    </button>
                  </div>
                  
                  {/* Emoji picker */}
                  {showEmojiPicker === message.id && (
                    <div className="emoji-picker">
                      {REACTIONS.map((emoji, idx) => (
                        <button 
                          key={idx} 
                          className="emoji-btn"
                          onClick={() => handleReaction(message.id, emoji)}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="message-wrapper system">
                <div className="message system typing whatsapp-typing">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* Reply preview */}
          {showReply && (
            <div className="reply-bar">
              <div className="reply-content">
                <span className="reply-label">Replying to {showReply.sender === 'user' ? 'yourself' : selectedContact.name}</span>
                <span className="reply-text">{showReply.content}</span>
              </div>
              <button className="close-reply" onClick={() => setShowReply(null)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          )}
          
          {/* Chat Input */}
          <div className="chat-input whatsapp-input">
            <button 
              className="input-action-btn"
              onClick={() => setShowEmojiPicker(null)}
              title="Emoji"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                <line x1="9" y1="9" x2="9.01" y2="9"/>
                <line x1="15" y1="9" x2="15.01" y2="9"/>
              </svg>
            </button>
            
            <button className="input-action-btn" title="Attach file">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
              </svg>
            </button>
            
            {isRecording ? (
              <div className="recording-area">
                <span className="recording-indicator">
                  <span className="rec-dot"></span>
                  Recording
                </span>
                <span className="recording-time">{formatRecordingTime(recordingTime)}</span>
                <button className="send-voice-btn" onClick={stopRecording}>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                  </svg>
                </button>
              </div>
            ) : (
              <>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Type a message"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="whatsapp-input-field"
                />
                
                <button 
                  className="input-action-btn mic-btn"
                  onMouseDown={startRecording}
                  onMouseUp={stopRecording}
                  onMouseLeave={() => isRecording && stopRecording()}
                  title="Hold to record"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                    <line x1="12" y1="19" x2="12" y2="23"/>
                    <line x1="8" y1="23" x2="16" y2="23"/>
                  </svg>
                </button>
              </>
            )}
            
            <button 
              className="send-btn whatsapp-send"
              onClick={handleSendMessage}
              disabled={!inputText.trim()}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;

