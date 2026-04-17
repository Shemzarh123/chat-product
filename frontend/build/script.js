/* eslint-env browser */
/**
 * WhatsApp High-End Features Standalone Script
 * Enhanced real-time chat with socket.io, reactions, typing indicators, media support
 */

(function() {
    'use strict';
    
    // Globals loaded from socket.io CDN and/or defined by the host HTML page
    /* global io, renderMessages, renderTypingIndicator, refreshChats, handleNextStep */
    
    // ============================================
    // SECTION 1: Socket Configuration
    // ============================================
    
    const SocketConfig = {
        serverUrl: 'http://localhost:3001',
        getToken: function() {
            return localStorage.getItem('token') || 'demo-token';
        },
        
        init: function() {
            return io.connect(this.serverUrl, {
                auth: {
                    token: this.getToken()
                },
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionAttempts: 5
            });
        }
    };

    // Initialize socket connection
    const socket = SocketConfig.init();

    // ============================================
    // SECTION 2: State Management
    // ============================================
    
    const ChatState = {
        currentChatId: null,
        messages: [],
        isTyping: false,
        typingUsers: new Set(),
        onlineUsers: new Set(),
        reactions: {},
        mediaFiles: [],
        
        // Merge with window.state if available
        init: function() {
            if (typeof window.state !== 'undefined') {
                Object.assign(this, window.state);
            }
            return this;
        },
        
        addMessage: function(message) {
            this.messages.push(message);
        },
        
        updateMessage: function(id, updates) {
            const index = this.messages.findIndex(m => m.id === id);
            if (index !== -1) {
                this.messages[index] = { ...this.messages[index], ...updates };
            }
        },
        
        getMessages: function() {
            return this.messages;
        }
    }.init();

    // ============================================
    // SECTION 3: Socket Event Handlers
    // ============================================
    
    const SocketEvents = {
        bind: function() {
            // Connection events
            socket.on('connect', this.onConnect.bind(this));
            socket.on('disconnect', this.onDisconnect.bind(this));
            socket.on('connect_error', this.onConnectError.bind(this));
            
            // Message events
            socket.on('messages', this.onMessages.bind(this));
            socket.on('newMessage', this.onNewMessage.bind(this));
            socket.on('messageRead', this.onMessageRead.bind(this));
            
            // Typing events
            socket.on('typing', this.onTyping.bind(this));
            
            // Chat events
            socket.on('chatsUpdated', this.onChatsUpdated.bind(this));
            
            // Reaction events
            socket.on('reaction', this.onReaction.bind(this));
            
            // User events
            socket.on('userOnline', this.onUserOnline.bind(this));
            socket.on('userOffline', this.onUserOffline.bind(this));
        },
        
        onConnect: function() {
            console.log('✅ Connected to WhatsApp real-time server');
            this.updateConnectionStatus(true);
        },
        
        onDisconnect: function(reason) {
            console.log('❌ Disconnected:', reason);
            this.updateConnectionStatus(false);
        },
        
        onConnectError: function(error) {
            console.error('🔴 Connection error:', error.message);
        },
        
        onMessages: function(newMessages) {
            ChatState.messages = [...ChatState.messages, ...newMessages];
            if (typeof renderMessages === 'function') {
                renderMessages();
            }
        },
        
        onNewMessage: function(message) {
            ChatState.addMessage(message);
            if (typeof renderMessages === 'function') {
                renderMessages();
            }
            this.playNotificationSound();
        },
        
        onMessageRead: function(data) {
            data.messageIds.forEach(function(id) {
                ChatState.updateMessage(id, { status: 'read' });
            });
            if (typeof renderMessages === 'function') {
                renderMessages();
            }
        },
        
        onTyping: function(data) {
            if (data.isTyping) {
                ChatState.typingUsers.add(data.userId);
            } else {
                ChatState.typingUsers.delete(data.userId);
            }
            if (typeof renderTypingIndicator === 'function') {
                renderTypingIndicator();
            }
        },
        
        onChatsUpdated: function() {
            console.log('Chats list updated');
            // Trigger refresh if needed
            if (typeof refreshChats === 'function') {
                refreshChats();
            }
        },
        
        onReaction: function(data) {
            this.handleReactionUpdate(data.messageId, data.emoji, data.userId, true);
        },
        
        handleReactionUpdate: function(messageId, emoji, userId, fromServer) {
            if (!ChatState.reactions[messageId]) {
                ChatState.reactions[messageId] = [];
            }
            
            const existingIndex = ChatState.reactions[messageId].findIndex(
                r => r.emoji === emoji && r.userId === userId
            );
            
            if (existingIndex !== -1) {
                // Remove reaction
                ChatState.reactions[messageId].splice(existingIndex, 1);
            } else {
                // Add reaction
                ChatState.reactions[messageId].push({
                    emoji: emoji,
                    userId: userId,
                    timestamp: new Date()
                });
            }
            
            if (typeof renderMessages === 'function') {
                renderMessages();
            }
        },
        
        onUserOnline: function(userId) {
            ChatState.onlineUsers.add(userId);
            this.updateUserStatus(userId, true);
        },
        
        onUserOffline: function(userId) {
            ChatState.onlineUsers.delete(userId);
            this.updateUserStatus(userId, false);
        },
        
        updateConnectionStatus: function(connected) {
            const statusEl = document.getElementById('connectionStatus');
            if (statusEl) {
                statusEl.className = 'connection-status ' + (connected ? 'connected' : 'disconnected');
                statusEl.textContent = connected ? 'Connected' : 'Disconnected';
            }
        },
        
        playNotificationSound: function() {
            // Optional: Play notification sound for new messages
            // const audio = new Audio('/sounds/notification.mp3');
            // audio.play().catch(() => {});
        },
        
        updateUserStatus: function(userId, isOnline) {
            const userEl = document.querySelector(`[data-user-id="${userId}"]`);
            if (userEl) {
                userEl.classList.toggle('online', isOnline);
            }
        }
    };

    // ============================================
    // SECTION 4: Message Functions
    // ============================================
    
    const MessageHandler = {
        send: function(content, type) {
            type = type || 'text';
            
            const message = {
                conversation_id: ChatState.currentChatId || 1,
                content: content,
                type: type
            };
            
            // Optimistic UI update
            const tempId = Date.now();
            ChatState.addMessage({
                id: tempId,
                sender: 'user',
                content: content,
                type: type,
                status: 'sending',
                timestamp: new Date()
            });
            
            if (typeof renderMessages === 'function') {
                renderMessages();
            }
            
            // Send to server via REST API
            fetch('/api/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                },
                body: JSON.stringify(message)
            })
            .then(function(res) { return res.json(); })
            .then(function(serverMsg) {
                // Update with server response
                const index = ChatState.messages.findIndex(m => m.id === tempId);
                if (index !== -1) {
                    ChatState.messages[index] = { ...serverMsg, status: 'sent' };
                }
                if (typeof renderMessages === 'function') {
                    renderMessages();
                }
            })
            .catch(function(err) {
                console.error('Message send failed:', err);
                // Mark as failed
                const index = ChatState.messages.findIndex(m => m.id === tempId);
                if (index !== -1) {
                    ChatState.messages[index].status = 'failed';
                }
            });
            
            // Also emit via socket
            socket.emit('sendMessage', message);
        },
        
        sendText: function(text) {
            if (text && text.trim()) {
                this.send(text.trim(), 'text');
            }
        },
        
        sendImage: function(imageUrl) {
            this.send(imageUrl, 'image');
        },
        
        sendVideo: function(videoUrl) {
            this.send(videoUrl, 'video');
        }
    };

    // ============================================
    // SECTION 5: Typing Indicator
    // ============================================
    
    const TypingHandler = {
        timer: null,
        timeout: 1000,
        
        start: function() {
            socket.emit('typing', {
                conversationId: ChatState.currentChatId,
                isTyping: true
            });
        },
        
        stop: function() {
            clearTimeout(this.timer);
            this.timer = setTimeout(function() {
                socket.emit('typing', {
                    conversationId: ChatState.currentChatId,
                    isTyping: false
                });
            }, this.timeout);
        },
        
        handleInput: function() {
            this.stop();
            this.start();
        }
    };

    // ============================================
    // SECTION 6: Reaction Handler
    // ============================================
    
    const ReactionHandler = {
        toggle: function(messageId, emoji) {
            if (!ChatState.reactions[messageId]) {
                ChatState.reactions[messageId] = [];
            }
            
            const reactions = ChatState.reactions[messageId];
            const userId = socket.id;
            const existingIndex = reactions.findIndex(
                r => r.emoji === emoji && r.userId === userId
            );
            
            if (existingIndex !== -1) {
                // Remove own reaction
                reactions.splice(existingIndex, 1);
            } else {
                // Add reaction
                reactions.push({
                    emoji: emoji,
                    userId: userId,
                    timestamp: new Date()
                });
            }
            
            // Emit to server
            socket.emit('reaction', { messageId: messageId, emoji: emoji });
            
            // Re-render
            if (typeof renderMessages === 'function') {
                renderMessages();
            }
        },
        
        getAvailable: function() {
            return ['👍', '❤️', '😂', '😮', '😢', '🙏'];
        },
        
        showPicker: function(messageId) {
            // Could implement a reaction picker UI
            console.log('Show reaction picker for message:', messageId);
        }
    };

    // ============================================
    // SECTION 7: Media Handler
    // ============================================
    
    const MediaHandler = {
        upload: function(file, callback) {
            var formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', 'whatsapp-chat');
            
            fetch('https://api.cloudinary.com/v1_1/your-cloud-name/image/upload', {
                method: 'POST',
                body: formData
            })
            .then(function(res) { return res.json(); })
            .then(function(data) {
                callback(null, data.secure_url);
            })
            .catch(function(err) {
                callback(err, null);
            });
        },
        
        handleFileSelect: function(file, onComplete) {
            var type = file.type.startsWith('image') ? 'image' : 'video';
            
            // First upload to server/cloud
            this.upload(file, function(err, url) {
                if (err) {
                    console.error('Media upload failed:', err);
                    return;
                }
                
                // Then send as message
                if (type === 'image') {
                    MessageHandler.sendImage(url);
                } else {
                    MessageHandler.sendVideo(url);
                }
                
                if (onComplete) onComplete();
            });
        },
        
        openFilePicker: function() {
            var input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*,video/*';
            input.onchange = function(e) {
                var file = e.target.files[0];
                if (file) {
                    MediaHandler.handleFileSelect(file);
                }
            };
            input.click();
        }
    };

    // ============================================
    // SECTION 8: UI Rendering Functions
    // ============================================
    
    const UIRenderer = {
        messages: function() {
            var container = document.getElementById('chatMessages');
            if (!container) return;
            
            var messagesHtml = ChatState.messages.map(function(msg) {
                var reactions = ChatState.reactions[msg.id] || [];
                var reactionHtml = '';
                
                if (reactions.length > 0) {
                    var emojis = reactions.map(function(r) { return r.emoji; });
                    reactionHtml = '<div class="reactions">' + emojis.join('') + '</div>';
                }
                
                var content = msg.content;
                if (msg.type === 'image') {
                    content = '<img src="' + msg.content + '" style="max-width: 200px; border-radius: 12px;" />';
                } else if (msg.type === 'video') {
                    content = '<video src="' + msg.content + '" style="max-width: 200px; border-radius: 12px;" controls></video>';
                }
                
                var statusIcon = msg.status === 'read' ? '✓✓' : (msg.status === 'sent' ? '✓' : '⏳');
                
                return '<div class="message ' + msg.sender + '" data-id="' + msg.id + '">' +
                    content +
                    '<div class="message-meta">' +
                    '<span class="time">' + new Date(msg.timestamp).toLocaleTimeString() + '</span>' +
                    '<span class="status">' + statusIcon + '</span>' +
                    '</div>' +
                    reactionHtml +
                    '</div>';
            }).join('');
            
            container.innerHTML = messagesHtml;
            container.scrollTop = container.scrollHeight;
        },
        
        typing: function() {
            var container = document.getElementById('chatMessages');
            var indicator = document.getElementById('typingIndicator');
            
            if (ChatState.typingUsers.size > 0) {
                if (!indicator) {
                    indicator = document.createElement('div');
                    indicator.id = 'typingIndicator';
                    indicator.className = 'typing-indicator';
                    indicator.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div> Someone is typing...';
                    container.appendChild(indicator);
                }
            } else {
                if (indicator) {
                    indicator.remove();
                }
            }
        }
    };

    // ============================================
    // SECTION 9: Theme & Settings
    // ============================================
    
    const ThemeManager = {
        toggle: function() {
            document.body.classList.toggle('dark-mode');
            var isDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('darkMode', isDark);
            
            // Update theme attribute
            document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
        },
        
        init: function() {
            if (localStorage.getItem('darkMode') === 'true') {
                document.body.classList.add('dark-mode');
                document.documentElement.setAttribute('data-theme', 'dark');
            }
        }
    };

    // ============================================
    // SECTION 10: Global Shortcuts
    // ============================================
    
    const KeyboardShortcuts = {
        bind: function() {
            document.addEventListener('keydown', this.handle.bind(this));
        },
        
        handle: function(e) {
            // Ctrl+K - Global search
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault();
                this.showGlobalSearch();
            }
            
            // Enter - Send message (when not shift)
            if (e.key === 'Enter' && !e.shiftKey) {
                var active = document.activeElement;
                if (active.classList.contains('form-input') || active.tagName === 'TEXTAREA') {
                    e.preventDefault();
                    if (typeof handleNextStep === 'function') {
                        handleNextStep();
                    }
                }
            }
            
            // Escape - Close modals
            if (e.key === 'Escape') {
                this.closeModals();
            }
        },
        
        showGlobalSearch: function() {
            console.log('Global search opened (Ctrl+K)');
            // Implementation would show a search modal
            var searchModal = document.getElementById('globalSearchModal');
            if (searchModal) {
                searchModal.classList.remove('hidden');
                searchModal.querySelector('input')?.focus();
            }
        },
        
        closeModals: function() {
            document.querySelectorAll('.modal, .overlay').forEach(function(el) {
                el.classList.add('hidden');
            });
        }
    };

    // ============================================
    // SECTION 11: Initialization
    // ============================================
    
    function initializeApp() {
        // Bind socket events
        SocketEvents.bind();
        
        // Initialize theme
        ThemeManager.init();
        
        // Bind keyboard shortcuts
        KeyboardShortcuts.bind();
        
        // Setup input handlers
        var input = document.querySelector('.form-input');
        if (input) {
            input.addEventListener('input', function() {
                TypingHandler.handleInput();
            });
        }
        
        // Setup media button
        var mediaBtn = document.getElementById('mediaBtn');
        if (mediaBtn) {
            mediaBtn.addEventListener('click', function() {
                MediaHandler.openFilePicker();
            });
        }
        
        // Expose functions globally for HTML integration
        window.enhancedChat = {
            sendMessage: function(content, type) {
                MessageHandler.send(content, type);
            },
            addReaction: function(messageId, emoji) {
                ReactionHandler.toggle(messageId, emoji);
            },
            toggleDarkMode: function() {
                ThemeManager.toggle();
            },
            uploadMedia: function(file, callback) {
                MediaHandler.handleFileSelect(file, callback);
            },
            socket: socket,
            state: ChatState
        };
        
        console.log('✅ Enhanced Chat initialized');
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeApp);
    } else {
        initializeApp();
    }

})();
