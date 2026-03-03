import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

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
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return msgDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Get time-based greeting
const getTimeBasedGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

// Check if within business hours (9 AM - 6 PM)
const isWithinBusinessHours = () => {
  const hour = new Date().getHours();
  const day = new Date().getDay();
  return day >= 1 && day <= 5 && hour >= 9 && hour < 18;
};

// Smart keyword-based responses
const getSmartResponse = (message, formData) => {
  const lowerMessage = message.toLowerCase();
  
  // Emergency/urgent keywords
  if (lowerMessage.match(/emergency|urgent|pain|bleeding|broken|accident/)) {
    return {
      response: "I understand this is urgent. Our team prioritizes emergency cases. We'll contact you within 15 minutes. In the meantime, please visit our emergency page for immediate guidance.",
      isUrgent: true
    };
  }
  
  // Price/cost related
  if (lowerMessage.match(/price|cost|how much|expensive|cheap|budget/)) {
    return {
      response: `For ${formData.service || 'our services'}, pricing varies based on your specific needs. Our ${formData.budget ? `budget range of $${formData.budget} ` : ''}helps us recommend the best options. Would you like a detailed quote?`
    };
  }
  
  // Appointment/scheduling
  if (lowerMessage.match(/appointment|book|schedule|when|available/)) {
    return {
      response: isWithinBusinessHours() 
        ? "Great news! We have availability this week. Would you prefer a morning or afternoon appointment?"
        : "Our office is currently closed. Would you like us to schedule an appointment for when we reopen?"
    };
  }
  
  // Insurance related
  if (lowerMessage.match(/insurance|covered|insurance/)) {
    return {
      response: "We accept most major insurance plans. Our team can verify your coverage before your appointment. Would you like us to check your benefits?"
    };
  }
  
  // Location related
  if (lowerMessage.match(/location|address|where|near/)) {
    return {
      response: "We're conveniently located in the heart of the city with easy parking access. Would you like directions to our office?"
    };
  }
  
  // Thank you responses
  if (lowerMessage.match(/thank|thanks|appreciate/)) {
    return {
      response: "You're welcome! We're here to help. Is there anything else you'd like to know?"
    };
  }
  
  // Default qualified response
  return {
    response: `Thank you for your interest in ${formData.service || 'our services'}. Our team will personalized contact you shortly with a custom quote based on your needs.`
  };
};

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    service: '',
    budget: '',
    urgency: ''
  });
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [messageStatus, setMessageStatus] = useState({});
  const [lastSeen, setLastSeen] = useState(new Date());
  const [responseTime, setResponseTime] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize with time-based greeting
  useEffect(() => {
    const now = new Date();
    const initialMessage = {
      id: 1,
      sender: 'system',
      content: `${getTimeBasedGreeting()}! 👋 Welcome to RecoverFlow. How can we assist you today?`,
      timestamp: now,
      status: 'delivered'
    };
    setMessages([initialMessage]);
    setLastSeen(now);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Focus input when step changes
  useEffect(() => {
    if (isOpen && step < 6) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [step, isOpen]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Update last seen
    setLastSeen(new Date());
  };

  // Simulate typing indicator with realistic delay
  const simulateTyping = (callback, delay = 1000) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      callback();
    }, delay + Math.random() * 500); // Add some randomness
  };

  const addMessage = (sender, content, status = 'sent') => {
    const newMessage = {
      id: messages.length + 1,
      sender,
      content,
      timestamp: new Date(),
      status
    };
    setMessages(prev => [...prev, newMessage]);
    
    // Update message status
    if (sender === 'user') {
      setMessageStatus(prev => ({ ...prev, [newMessage.id]: 'sent' }));
      
      // Simulate delivered status after a delay
      setTimeout(() => {
        setMessageStatus(prev => ({ ...prev, [newMessage.id]: 'delivered' }));
      }, 500);
    }
    
    return newMessage;
  };

  const handleNextStep = async () => {
    // Validate current step
    if (step === 1 && !formData.name.trim()) {
      addMessage('system', 'Please enter your name to get started.');
      return;
    }
    
    if (step === 2 && !formData.phone.trim()) {
      addMessage('system', 'Please enter your phone number so we can contact you.');
      return;
    }
    
    if (step === 3 && !formData.service) {
      addMessage('system', 'Please select the service you\'re interested in.');
      return;
    }
    
    if (step === 4 && !formData.budget) {
      addMessage('system', 'Please select your budget range.');
      return;
    }
    
    if (step === 5 && !formData.urgency) {
      addMessage('system', 'Please let us know how urgent your request is.');
      return;
    }
    
    // Add user confirmation
    const userConfirmation = getUserConfirmation();
    addMessage('user', userConfirmation);
    
    if (step === 5) {
      // Show estimated response time
      const estimatedTime = isWithinBusinessHours() ? '15-30 minutes' : 'first thing tomorrow morning';
      setResponseTime(estimatedTime);
      
      // Show typing indicator while processing
      simulateTyping(async () => {
        try {
          const response = await axios.post('/api/website-chat', {
            businessId: '1',
            ...formData
          });
          
          // Get smart response
          const smartResponse = getSmartResponse('', formData);
          
          addMessage('system', smartResponse.response);
          setStep(6);
        } catch (error) {
          console.error('Error:', error);
          addMessage('system', 'Thank you for your information! Our team will contact you shortly.');
          setStep(6);
        }
      }, 1500);
    } else {
      // Show typing indicator between steps
      simulateTyping(() => {
        showStepQuestion(step + 1);
        setStep(step + 1);
      }, 800);
    }
  };

  const getUserConfirmation = () => {
    switch(step) {
      case 1:
        return `My name is ${formData.name}`;
      case 2:
        return `My phone number is ${formData.phone}`;
      case 3:
        return `I'm interested in ${formData.service.replace(/_/g, ' ')}`;
      case 4:
        return `My budget is ${formData.budget === '500' ? 'Under $500' : 
          formData.budget === '1000' ? '$500 - $1,000' : 
          formData.budget === '2000' ? '$1,000 - $2,000' : 
          formData.budget === '3000' ? '$2,000 - $3,000' : '$3,000+'}`;
      case 5:
        return `My request is ${formData.urgency}`;
      default:
        return '';
    }
  };

  const showStepQuestion = (stepNum) => {
    let question;
    switch(stepNum) {
      case 2:
        question = "Great! What's the best phone number to reach you at?";
        break;
      case 3:
        question = 'What service are you interested in?';
        break;
      case 4:
        question = 'What is your budget range for this service?';
        break;
      case 5:
        question = 'How urgent is your request?';
        break;
      default:
        question = '';
    }
    
    if (question) {
      addMessage('system', question);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleNextStep();
    }
  };

  const renderStepContent = () => {
    switch(step) {
      case 1:
        return (
          <div className="step-content">
            <input
              ref={inputRef}
              type="text"
              name="name"
              placeholder="Enter your name"
              value={formData.name}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              className="form-input"
              autoComplete="name"
            />
          </div>
        );
      
      case 2:
        return (
          <div className="step-content">
            <input
              ref={inputRef}
              type="tel"
              name="phone"
              placeholder="Your phone number"
              value={formData.phone}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              className="form-input"
              autoComplete="tel"
            />
          </div>
        );
      
      case 3:
        return (
          <div className="step-content">
            <select
              ref={inputRef}
              name="service"
              value={formData.service}
              onChange={handleInputChange}
              className="form-input"
            >
              <option value="">Select a service</option>
              <option value="dental_implants">Dental Implants</option>
              <option value="teeth_whitening">Teeth Whitening</option>
              <option value="cosmetic_dentistry">Cosmetic Dentistry</option>
              <option value="general_checkup">General Checkup</option>
              <option value="emergency">Emergency Care</option>
              <option value="consultation">Free Consultation</option>
            </select>
          </div>
        );
      
      case 4:
        return (
          <div className="step-content">
            <select
              ref={inputRef}
              name="budget"
              value={formData.budget}
              onChange={handleInputChange}
              className="form-input"
            >
              <option value="">Select budget range</option>
              <option value="500">Under $500</option>
              <option value="1000">$500 - $1,000</option>
              <option value="2000">$1,000 - $2,000</option>
              <option value="3000">$2,000 - $3,000</option>
              <option value="5000">$3,000+</option>
            </select>
          </div>
        );
      
      case 5:
        return (
          <div className="step-content">
            <select
              ref={inputRef}
              name="urgency"
              value={formData.urgency}
              onChange={handleInputChange}
              className="form-input"
            >
              <option value="">Select urgency level</option>
              <option value="urgent">🔴 Urgent - Need immediate help</option>
              <option value="normal">🟡 Normal - Within this week</option>
              <option value="flexible">🟢 Flexible - Anytime works</option>
            </select>
          </div>
        );
      
      case 6:
        return (
          <div className="step-content completion-content">
            <div className="success-icon">✓</div>
            <h4>Thank You!</h4>
            <p>We've received your information.</p>
            {responseTime && (
              <div className="response-time">
                <span className="label">Estimated response:</span>
                <span className="time">{responseTime}</span>
              </div>
            )}
            <p className="business-hours">
              {isWithinBusinessHours() 
                ? "We're currently open and will contact you soon!"
                : "We'll reach out first thing when we open!"}
            </p>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="chat-widget">
      <div 
        className={`chat-button ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
          </svg>
        )}
      </div>
      
      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <div className="header-info">
              <div className="avatar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <div className="header-text">
                <h3>RecoverFlow</h3>
                <span className="status-indicator">
                  <span className="dot"></span>
                  {isWithinBusinessHours() ? 'Online' : 'Away'}
                </span>
              </div>
            </div>
            <button 
              className="close-button"
              onClick={() => setIsOpen(false)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          <div className="chat-messages">
            {messages.map((message, index) => (
              <div key={message.id} className={`message-wrapper ${message.sender}`}>
                {message.sender === 'system' && index > 0 && (
                  <div className="timestamp-separator">
                    <span>{formatDate(message.timestamp)}</span>
                  </div>
                )}
                <div className={`message ${message.sender}`}>
                  <div className="message-content">{message.content}</div>
                  <div className="message-meta">
                    <span className="time">{formatTime(message.timestamp)}</span>
                    {message.sender === 'user' && messageStatus[message.id] && (
                      <span className="status">
                        {messageStatus[message.id] === 'sent' ? '✓' : '✓✓'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="message-wrapper system">
                <div className="message system typing">
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
          
          {step < 6 && (
            <div className="chat-input">
              {renderStepContent()}
              <button 
                onClick={handleNextStep} 
                className="btn btn-primary"
                disabled={isTyping}
              >
                {step === 5 ? 'Submit' : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatWidget;

