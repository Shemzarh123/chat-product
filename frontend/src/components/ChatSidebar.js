import React, { useState } from 'react';

const ChatSidebar = ({ activeTab, onTabChange, onContactSelect, onStatusSelect, chats = [], onlineUsers }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const filteredChats = chats.filter(chat => 
    chat.lead_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.last_message?.toLowerCase().includes(searchQuery.toLowerCase())
  );

    { 
      id: 1, 
      name: 'Sarah Johnson', 
      avatar: 'SJ', 
      status: 'online', 
      lastMessage: 'Great! See you tomorrow 👋', 
      time: new Date(Date.now() - 300000), 
      unread: 2,
      statusStory: {
        id: 1,
        images: [
          { id: 1, url: 'https://picsum.photos/seed/status1/400/600', timestamp: new Date(Date.now() - 3600000) }
        ],
        expires: new Date(Date.now() + 72000000)
      }
    },
    { 
      id: 2, 
      name: 'Mike Chen', 
      avatar: 'MC', 
      status: 'lastseen', 
      lastSeen: new Date(Date.now() - 3600000), 
      lastMessage: 'The project is ready', 
      time: new Date(Date.now() - 3600000), 
      unread: 0,
      statusStory: {
        id: 2,
        images: [
          { id: 1, url: 'https://picsum.photos/seed/status2/400/600', timestamp: new Date(Date.now() - 7200000) },
          { id: 2, url: 'https://picsum.photos/seed/status3/400/600', timestamp: new Date(Date.now() - 3600000) }
        ],
        expires: new Date(Date.now() + 68400000)
      }
    },
    { 
      id: 3, 
      name: 'Emma Wilson', 
      avatar: 'EW', 
      status: 'online', 
      lastMessage: 'Thanks for the update!', 
      time: new Date(Date.now() - 7200000), 
      unread: 0,
      statusStory: null
    },
    { 
      id: 4, 
      name: 'David Brown', 
      avatar: 'DB', 
      status: 'lastseen', 
      lastSeen: new Date(Date.now() - 86400000), 
      lastMessage: 'Let me check and get back to you', 
      time: new Date(Date.now() - 86400000), 
      unread: 0,
      statusStory: {
        id: 4,
        images: [
          { id: 1, url: 'https://picsum.photos/seed/status4/400/600', timestamp: new Date(Date.now() - 10800000) }
        ],
        expires: new Date(Date.now() + 61200000)
      }
    },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const filteredChats = chats.filter(chat => 
    chat.lead_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.last_message?.toLowerCase().includes(searchQuery.toLowerCase())
  );



  const formatTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };



  return (
    <div className="chat-sidebar">
      {/* Search Bar */}
      {showSearch && (
        <div className="search-bar">
          <div className="search-input-container">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input 
              type="text" 
              placeholder="Search or start new chat"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            <button className="clear-search" onClick={() => {
              setSearchQuery('');
              setShowSearch(false);
            }}>
              ×
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="sidebar-tabs">
        <button 
          className={`tab-btn ${activeTab === 'chats' ? 'active' : ''}`}
          onClick={() => onTabChange('chats')}
        >
          <span>CHATS</span>
          {activeTab === 'chats' && <div className="tab-indicator"></div>}
        </button>
        <button 
          className={`tab-btn ${activeTab === 'status' ? 'active' : ''}`}
          onClick={() => onTabChange('status')}
        >
          <span>STATUS</span>
          {activeTab === 'status' && <div className="tab-indicator"></div>}
        </button>
        <button 
          className={`tab-btn ${activeTab === 'calls' ? 'active' : ''}`}
          onClick={() => onTabChange('calls')}
        >
          <span>CALLS</span>
          {activeTab === 'calls' && <div className="tab-indicator"></div>}
        </button>
      </div>

      {/* Content */}
      <div className="sidebar-content">
        {activeTab === 'chats' && (
          <>
            {/* New Chat Button */}
            {!showSearch && (
              <div className="new-chat-btn">
                <button onClick={() => setShowSearch(true)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.35-4.35"/>
                  </svg>
                  <span>Search or start new chat</span>
                </button>
              </div>
            )}

            {/* Contact List */}
            <div className="contact-list">
              {filteredChats.map(chat => {
                const avatar = chat.lead_name ? chat.lead_name.substring(0,2).toUpperCase() : 'UC';
                const isOnline = onlineUsers.has(chat.lead_id || chat.id);
                return (
                  <div 
                    key={chat.id} 
                    className={`contact-item ${chat.unread_count > 0 ? 'has-unread' : ''}`}
                    onClick={() => onContactSelect(chat)}
                  >
                    <div className="contact-avatar">
                      <div className="avatar-placeholder">
                        {avatar}
                      </div>
                      {isOnline && (
                        <div className="online-indicator"></div>
                      )}


                    {contact.statusStory && (
                      <div className="status-indicator">
                        <div className="status-ring"></div>
                      </div>
                    )}
                    {!contact.statusStory && contact.status === 'online' && (
                      <div className="online-indicator"></div>
                    )}
                  </div>
                  <div className="contact-info">
                    <div className="contact-header">
                      <h3 className="contact-name">{chat.lead_name}</h3>
                      <span className="contact-time">{formatTime(chat.last_message_time || chat.updated_at)}</span>
                    </div>
                    <div className="contact-footer">
                      <p className="last-message">{chat.last_message || 'No messages yet'}</p>
                      {chat.unread_count > 0 && (
                        <span className="unread-badge">{chat.unread_count}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
              })}

            </div>
          </>
        )}

        {activeTab === 'status' && (
          <div className="status-list">
            {/* My Status */}
            <div className="status-item my-status">
              <div className="contact-avatar">
                <div className="avatar-placeholder">👤</div>
                <div className="status-indicator">
                  <div className="status-ring"></div>
                </div>
              </div>
              <div className="status-info">
                <h3>My Status</h3>
                <p>Tap to add status update</p>
              </div>
              <button className="add-status-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
              </button>
            </div>

            {/* Recent Updates */}
            <div className="status-section">
              <h4>Recent Updates</h4>
{chats.filter(c => c.status_story).map(chat => (
</xai:function_call name="edit_file">
<parameter name="path">c:/Users/nompi/chat product/frontend/src/components/WhatsAppLayout.js
                <div 
                  key={contact.id} 
                  className="status-item"
                  onClick={() => onStatusSelect(contact.statusStory)}
                >
                  <div className="contact-avatar">
                    <div className="avatar-placeholder">{contact.avatar}</div>
                    <div className="status-indicator">
                      <div className="status-ring"></div>
                    </div>
                  </div>
                  <div className="status-info">
                    <h3>{contact.name}</h3>
                    <p>Today, {new Date(contact.statusStory.images[0].timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'calls' && (
          <div className="calls-list">
            <div className="call-item incoming">
              <div className="contact-avatar">
                <div className="avatar-placeholder">SJ</div>
              </div>
              <div className="call-info">
                <h3>Sarah Johnson</h3>
                <p>Today, 2:30 PM</p>
              </div>
              <div className="call-icon incoming">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              </div>
            </div>
            <div className="call-item outgoing">
              <div className="contact-avatar">
                <div className="avatar-placeholder">MC</div>
              </div>
              <div className="call-info">
                <h3>Mike Chen</h3>
                <p>Yesterday, 5:45 PM</p>
              </div>
              <div className="call-icon outgoing">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
