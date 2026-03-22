// WhatsApp High-End Features Standalone Script
// Apply socket.io real-time, reactions, typing, media to chat-standalone.html

// Socket.io client (CDN loaded)
const socket = io.connect('http://localhost:3001', {
  auth: {
    token: localStorage.getItem('token') || 'demo-token'  // Fallback for demo
  }
});

  auth: {
    token: localStorage.getItem('token') || ''  // From login
  }
});

// Enhanced state
let enhancedState = {
  ...window.state,  // Original state
  currentChatId: null,
  messages: [],
  isTyping: false,
  typingUsers: new Set(),
  onlineUsers: new Set(),
  reactions: {},
  mediaFiles: []
};

// Socket events
socket.on('connect', () => {
  console.log('Connected to WhatsApp real-time server');
});

socket.on('messages', (newMessages) => {
  enhancedState.messages.push(...newMessages);
  renderMessages();
});

socket.on('typing', (data) => {
  if (data.isTyping) {
    enhancedState.typingUsers.add(data.userId);
  } else {
    enhancedState.typingUsers.delete(data.userId);
  }
  renderTypingIndicator();
});

socket.on('messageRead', (data) => {
  data.messageIds.forEach(id => {
    const msg = enhancedState.messages.find(m => m.id === id);
    if (msg) msg.status = 'read';
  });
  renderMessages();
});

socket.on('chatsUpdated', () => {
  // Refresh chats list if needed
});

// Send message with socket
function sendMessage(content, type = 'text') {
  const message = {
    conversation_id: enhancedState.currentChatId || 1,
    content,
    type
  };

  // Store locally first (optimistic UI)
  enhancedState.messages.push({
    id: Date.now(),
    sender: 'user',
    content,
    type,
    status: 'sent',
    timestamp: new Date()
  });
  
  renderMessages();
  
  // Send to API + socket
  fetch('/api/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify(message)
  }).then(res => res.json())
    .then(serverMsg => {
      // Update with server ID
      const localMsgIndex = enhancedState.messages.length - 1;
      enhancedState.messages[localMsgIndex] = serverMsg;
      renderMessages();
    });

  socket.emit('sendMessage', message);
}

// Typing indicator
let typingTimer;
function handleTyping() {
  clearTimeout(typingTimer);
  socket.emit('typing', { conversationId: enhancedState.currentChatId, isTyping: true });
  
  typingTimer = setTimeout(() => {
    socket.emit('typing', { conversationId: enhancedState.currentChatId, isTyping: false });
  }, 1000);
}

// Add reaction
function addReaction(messageId, emoji) {
  if (!enhancedState.reactions[messageId]) {
    enhancedState.reactions[messageId] = [];
  }
  
  const reaction = enhancedState.reactions[messageId].find(r => r.emoji === emoji && r.userId === socket.id);
  if (reaction) {
    // Remove reaction
    enhancedState.reactions[messageId] = enhancedState.reactions[messageId].filter(r => r.emoji !== emoji || r.userId !== socket.id);
  } else {
    enhancedState.reactions[messageId].push({
      emoji,
      userId: socket.id,
      timestamp: new Date()
    });
  }
  
  renderMessages();
  socket.emit('reaction', { messageId, emoji });
}

// Media upload (Cloudinary)
async function uploadMedia(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'whatsapp-chat');  // Cloudinary preset

  try {
    const response = await fetch('https://api.cloudinary.com/v1_1/your-cloud-name/image/upload', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Media upload failed', error);
    return null;
  }
}

// Enhanced render with reactions/media
function renderMessages() {
  const container = document.getElementById('chatMessages');
  container.innerHTML = enhancedState.messages.map(msg => {
    const reactions = enhancedState.reactions[msg.id] || [];
    const reactionHtml = reactions.length > 0 ? 
      `<div class="reactions">${reactions.map(r => r.emoji).join('')}</div>` : '';
    
    let content = msg.content;
    if (msg.type === 'image') {
      content = `<img src="${msg.content}" style="max-width: 200px; border-radius: 12px;" />`;
    }
    
    return `
      <div class="message ${msg.sender}" onclick="showReactions(${msg.id})">
        ${content}
        <div class="message-meta">
          <span class="time">${new Date(msg.timestamp).toLocaleTimeString()}</span>
          <span class="status">${msg.status}</span>
        </div>
        ${reactionHtml}
      </div>
    `;
  }).join('');
  
  container.scrollTop = container.scrollHeight;
}

// Add typing indicator
function renderTypingIndicator() {
  if (enhancedState.typingUsers.size > 0) {
    const indicator = document.getElementById('typingIndicator');
    if (!indicator) {
      const div = document.createElement('div');
      div.id = 'typingIndicator';
      div.className = 'typing-indicator';
      div.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div> Someone is typing...';
      document.getElementById('chatMessages').appendChild(div);
    }
  } else {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) indicator.remove();
  }
}

// Dark theme toggle
function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

// Initialize enhanced features
document.addEventListener('DOMContentLoaded', () => {
  // Load dark mode
  if (localStorage.getItem('darkMode') === 'true') {
    toggleDarkMode();
  }
  
  // Enhanced input with typing
  const input = document.querySelector('.form-input');
  if (input) {
    input.addEventListener('input', handleTyping);
  }
  
  // Media button
  const mediaBtn = document.getElementById('mediaBtn');
  if (mediaBtn) {
    mediaBtn.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*,video/*';
      input.onchange = e => {
        const file = e.target.files[0];
        uploadMedia(file).then(url => {
          sendMessage(url, file.type.startsWith('image') ? 'image' : 'video');
        });
      };
      input.click();
    });
  }
});

// Global shortcuts
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'k') {
    e.preventDefault();
    // Open search modal
    showGlobalSearch();
  }
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleNextStep();
  }
});

function showGlobalSearch() {
  // Implement global chat/message search
  console.log('Global search opened (Ctrl+K)');
}

// Export for HTML
window.enhancedChat = {
  sendMessage,
  addReaction,
  toggleDarkMode,
  socket  // Expose for debugging
};

// Fix ESLint issues - declare globals
/* global state, renderMessages, renderStepContent, handleInputChange, handleNextStep, addMessage, showStepQuestion, handleFinalStep */


