import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const ChatWindow = ({ contact }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messageStatus, setMessageStatus] = useState({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(null);
  const [showReply, setShowReply] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDescription, setPaymentDescription] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recordingInterval = useRef(null);

  // Demo messages
  useEffect(() => {
    const demoMessages = [
      {
        id: 1,
        sender: 'contact',
        content: 'Hey! How are you doing?',
        timestamp: new Date(Date.now() - 3600000),
        status: 'read'
      },
      {
        id: 2,
        sender: 'user',
        content: "I'm doing great! Thanks for asking. How about you?",
        timestamp: new Date(Date.now() - 3540000),
        status: 'read'
      },
      {
        id: 3,
        sender: 'contact',
        content: "I'm doing well too. Did you see the project update?",
        timestamp: new Date(Date.now() - 3480000),
        status: 'read'
      },
      {
        id: 4,
        sender: 'user',
        content: 'Yes! It looks fantastic. Great job 👍',
        timestamp: new Date(Date.now() - 3420000),
        status: 'read'
      }
    ];
    setMessages(demoMessages);
  }, [contact]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };



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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMessage = {
      id: messages.length + 1,
      sender: 'user',
      content: inputText,
      timestamp: new Date(),
      status: 'sent'
    };

    setMessages([...messages, newMessage]);
    setMessageStatus(prev => ({ ...prev, [newMessage.id]: 'sent' }));
    setInputText('');
    setShowReply(null);

    // Simulate delivery and read receipt
    setTimeout(() => {
      setMessageStatus(prev => ({ ...prev, [newMessage.id]: 'delivered' }));
    }, 1000);

    setTimeout(() => {
      setMessageStatus(prev => ({ ...prev, [newMessage.id]: 'read' }));
    }, 2000);

      // Get AI response
      setIsTyping(true);
      try {
        const aiResponse = await axios.post('/api/ai-assistant', {
          message: inputText
        });

        setIsTyping(false);
        
        if (aiResponse.data.success) {
          const aiReply = {
            id: messages.length + 2,
            sender: 'contact',
            content: aiResponse.data.response,
            timestamp: new Date(),
            status: 'read',
            isAI: true,
            actions: aiResponse.data.actions || []
          };

          setMessages(prev => [...prev, aiReply]);
        }
      } catch (error) {
        console.error('Error getting AI response:', error);
        setIsTyping(false);
        
        // Fallback to random reply if AI fails
        const replyMessages = [
          "Thank you for your message! Our team will get back to you soon.",
          "That sounds great!",
          "I'll check that out.",
          "Thanks for letting me know!",
          "Perfect! I'll get back to you soon.",
          "👍",
          "😊"
        ];
        const randomReply = replyMessages[Math.floor(Math.random() * replyMessages.length)];
        
        const contactReply = {
          id: messages.length + 2,
          sender: 'contact',
          content: randomReply,
          timestamp: new Date(),
          status: 'read'
        };

        setMessages(prev => [...prev, contactReply]);
      }
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    recordingInterval.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const handleAction = (action) => {
    switch (action.type) {
      case 'view_catalog':
        // Navigate to product catalog
        alert('Product catalog would open here');
        break;
      case 'book_appointment':
        // Open appointment booking
        alert('Appointment booking would open here');
        break;
      case 'payment_request':
        // Open payment request modal
        setShowPaymentModal(true);
        break;
      case 'product':
        // Show product details or add to cart
        alert(`Product: ${action.name}\nPrice: $${action.price}`);
        break;
      default:
        console.warn('Unknown action type:', action.type);
    }
  };

  const handleSendPaymentRequest = async () => {
    if (!paymentAmount || paymentAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      const res = await axios.post('/api/create-payment-request', {
        amount: parseFloat(paymentAmount),
        description: paymentDescription || 'Payment Request',
        leadId: null // In a real app, this would be the customer's lead ID
      });

      if (res.data.success) {
        // Add payment request message to chat
        const paymentMessage = {
          id: messages.length + 1,
          sender: 'user',
          content: `Payment Request: $${paymentAmount}${paymentDescription ? ` - ${paymentDescription}` : ''}`,
          timestamp: new Date(),
          status: 'sent',
          type: 'payment',
          paymentId: res.data.paymentId,
          paymentUrl: res.data.url
        };
        
        setMessages([...messages, paymentMessage]);
        setMessageStatus(prev => ({ ...prev, [paymentMessage.id]: 'sent' }));
        
        // Close modal
        setShowPaymentModal(false);
        setPaymentAmount('');
        setPaymentDescription('');
      }
    } catch (error) {
      console.error('Error creating payment request:', error);
      alert('Failed to create payment request');
    }
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    if (recordingInterval.current) {
      clearInterval(recordingInterval.current);
      recordingInterval.current = null;
    }
    
    // Simulate sending voice message
    if (recordingTime > 0) {
      const newMessage = {
        id: messages.length + 1,
        sender: 'user',
        content: `Voice message (${formatRecordingTime(recordingTime)})`,
        timestamp: new Date(),
        status: 'sent',
        type: 'voice'
      };
      setMessages([...messages, newMessage]);
      setMessageStatus(prev => ({ ...prev, [newMessage.id]: 'sent' }));
    }
  };

  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEmojiSelect = (emoji) => {
    setInputText(prev => prev + emoji);
    setShowEmojiPicker(null);
    inputRef.current?.focus();
  };



  const REACTIONS = ['❤️', '😂', '🔥', '👍', '😮', '😢', '🎉', '😊'];

  return (
    <div className="chat-window">
      {/* Chat Header */}
      <div className="chat-header">
        <div className="chat-header-left">
          <button className="back-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <div className="contact-avatar">
            <div className="avatar-placeholder">{contact.avatar}</div>
            {contact.status === 'online' && (
              <div className="online-indicator"></div>
            )}
          </div>
          <div className="chat-info">
            <h3 className="chat-name">{contact.name}</h3>
            <p className="chat-status">
              {contact.status === 'online' ? 'online' : `last seen ${getLastSeen(contact.lastSeen)}`}
            </p>
          </div>
        </div>
        <div className="chat-header-right">
          <button className="icon-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="1"/>
              <circle cx="19" cy="12" r="1"/>
              <circle cx="5" cy="12" r="1"/>
            </svg>
          </button>
          <button className="icon-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
          <button className="icon-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div className="messages-container">
        {/* Date Divider */}
        <div className="date-divider">
          <span>Today</span>
        </div>

         {/* Messages */}
          {messages.map(message => (
            <div 
              key={message.id} 
              className={`message ${message.sender}`}
            >
              <div className="message-content">
                {message.isAI && (
                  <span className="ai-indicator">🤖 AI</span>
                )}
                {message.type === 'payment' ? (
                  <div className="payment-request">
                    <div className="payment-request-content">
                      <div className="payment-amount">${paymentAmount}</div>
                      {message.paymentDescription && (
                        <div className="payment-description">{message.paymentDescription}</div>
                      )}
                    </div>
                    <button 
                      className="pay-button"
                      onClick={() => window.location.href = message.paymentUrl}
                    >
                      Pay Now
                    </button>
                  </div>
                ) : message.type === 'voice' ? (
                  <div className="voice-message">
                    <div className="voice-wave"></div>
                    <span>{message.content}</span>
                  </div>
                ) : (
                  <div>
                    <div className="message-text">{message.content}</div>
                    {message.actions && message.actions.length > 0 && (
                      <div className="message-actions">
                        {message.actions.map((action, index) => (
                          <button 
                            key={index} 
                            className="action-button"
                            onClick={() => handleAction(action)}
                          >
                            {action.type === 'view_catalog' && '📦 View Catalog'}
                            {action.type === 'book_appointment' && '📅 Book Appointment'}
                            {action.type === 'payment_request' && '💳 Payment Request'}
                            {action.type === 'product' && `📋 ${action.name} - $${action.price}`}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <div className="message-meta">
                  <span className="message-time">{formatTime(message.timestamp)}</span>
                  {message.sender === 'user' && (
                    <span className={`message-status ${messageStatus[message.id]}`}>
                      {messageStatus[message.id] === 'sent' && (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                      {messageStatus[message.id] === 'delivered' && (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12"/>
                          <polyline points="20 12 16 16 12 12"/>
                        </svg>
                      )}
                      {messageStatus[message.id] === 'read' && (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12"/>
                          <polyline points="20 12 16 16 12 12"/>
                        </svg>
                      )}
                    </span>
                  )}
                </div>
              </div>
            {showEmojiPicker === message.id && (
              <div className="emoji-picker">
                {REACTIONS.map(emoji => (
                  <button 
                    key={emoji} 
                    className="emoji-btn"
                    onClick={() => handleEmojiSelect(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="message contact">
            <div className="typing-indicator">
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Container */}
      <div className="input-container">
        {showReply && (
          <div className="reply-indicator">
            <span>Replying to {showReply.sender === 'user' ? 'you' : contact.name}</span>
            <p>{showReply.content}</p>
            <button className="cancel-reply" onClick={() => setShowReply(null)}>×</button>
          </div>
        )}

        <div className="input-toolbar">
          <button className="input-icon-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5"/>
            </svg>
          </button>

          <div className="input-wrapper">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(e)}
              placeholder={showReply ? 'Message' : 'Type a message'}
              disabled={isRecording}
            />
            {!inputText.trim() && (
              <button 
                className="emoji-btn"
                onClick={() => setShowEmojiPicker(showEmojiPicker ? null : 'input')}
              >
                😊
              </button>
            )}
          </div>

          {!inputText.trim() ? (
            <>
              <button 
                className="input-icon-btn"
                onMouseDown={handleStartRecording}
                onMouseUp={handleStopRecording}
                onMouseLeave={handleStopRecording}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 16v-4M12 8h.01"/>
                </svg>
              </button>
              <button className="input-icon-btn" onClick={() => setShowPaymentModal(true)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </button>
              <button className="input-icon-btn">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </button>
            </>
          ) : (
            <button 
              className="send-btn"
              onClick={handleSendMessage}
              disabled={!inputText.trim()}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          )}
        </div>

        {/* Payment Request Modal */}
        {showPaymentModal && (
          <div className="payment-modal-overlay">
            <div className="payment-modal">
              <div className="payment-modal-header">
                <h3>Send Payment Request</h3>
                <button className="close-btn" onClick={() => setShowPaymentModal(false)}>
                  ✕
                </button>
              </div>
              
              <div className="payment-modal-body">
                <div className="form-group">
                  <label>Amount ($)</label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="Enter amount"
                    step="0.01"
                    min="0.01"
                  />
                </div>
                
                <div className="form-group">
                  <label>Description</label>
                  <input
                    type="text"
                    value={paymentDescription}
                    onChange={(e) => setPaymentDescription(e.target.value)}
                    placeholder="Enter payment description"
                  />
                </div>
              </div>
              
              <div className="payment-modal-footer">
                <button className="btn-secondary" onClick={() => setShowPaymentModal(false)}>
                  Cancel
                </button>
                <button className="btn-primary" onClick={handleSendPaymentRequest}>
                  Send Request
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Recording Indicator */}
        {isRecording && (
          <div className="recording-indicator">
            <div className="recording-dot"></div>
            <span>Recording... {formatRecordingTime(recordingTime)}</span>
            <button className="stop-recording" onClick={handleStopRecording}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12"/>
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatWindow;
