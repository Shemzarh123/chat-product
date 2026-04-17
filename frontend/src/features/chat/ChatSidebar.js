import React, { useState } from 'react';

const ChatSidebar = ({ activeTab, onTabChange, onContactSelect, onStatusSelect, chats = [], onlineUsers }) => {
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
          <div className="contact-list">
            {filteredChats.map(chat => {
              const avatar = chat.lead_name ? chat.lead_name.substring(0,2).toUpperCase() : 'UC';
              const isOnline = onlineUsers?.has(chat.lead_id || chat.id);
              return (
                <div 
                  key={chat.id} 
                  className={`contact-item ${chat.unread_count > 0 ? 'has-unread' : ''}`}
                  onClick={() => onContactSelect(chat)}
                >
                  <div className="contact-avatar">
                    <div className="avatar-placeholder">{avatar}</div>
                    {isOnline && <div className="online-indicator"></div>}
                  </div>
                  <div className="contact-info">
                    <div className="contact-header">
                      <h3 className="contact-name">{chat.lead_name}</h3>
                      <span className="contact-time">{formatTime(chat.last_message_time || chat.updated_at)}</span>
                    </div>
                    <div className="contact-footer">
                      <p className="last-message">{chat.last_message || 'No messages yet'}</p>
                      {chat.unread_count > 0 && <span className="unread-badge">{chat.unread_count}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'status' && (
          <div className="status-list">
            <div className="status-item my-status">
              <div className="contact-avatar">
                <div className="avatar-placeholder">👤</div>
              </div>
              <div className="status-info">
                <h3>My Status</h3>
                <p>Tap to add status update</p>
              </div>
            </div>
            <div className="status-section">
              <h4>Recent Updates</h4>
              {chats.filter(c => c.status_story).map(chat => (
                <div 
                  key={chat.id} 
                  className="status-item"
                  onClick={() => onStatusSelect(chat.status_story)}
                >
                  <div className="contact-avatar">
                    <div className="avatar-placeholder">{chat.lead_name?.substring(0,2).toUpperCase()}</div>
                    <div className="status-indicator"><div className="status-ring"></div></div>
                  </div>
                  <div className="status-info">
                    <h3>{chat.lead_name}</h3>
                    <p>Today, {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'calls' && (
          <div className="calls-list">
            <p className="empty-msg">No recent calls</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;

