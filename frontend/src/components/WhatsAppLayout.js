import React, { useState, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import ChatSidebar from './ChatSidebar';
import ChatWindow from './ChatWindow';
import StatusView from './StatusView';

const WhatsAppLayout = () => {
  const { loadChats, chats, currentChat, setCurrentChat, joinChat, onlineUsers } = useChat();

  const [activeTab, setActiveTab] = useState('chats');
  const [showNewContact, setShowNewContact] = useState(false);
  const [showStatusView, setShowStatusView] = useState(false);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  const handleContactSelect = (chat) => {
    setCurrentChat(chat);
    joinChat(chat.id);
  };

  const handleStatusSelect = (status) => {
    setShowStatusView(true);
  };

  return (

    <div className="whatsapp-layout">
      {/* Header */}
      <div className="whatsapp-header">
        <div className="header-left">
          <div className="user-avatar">
            <div className="avatar-placeholder">👤</div>
          </div>
        </div>
        <div className="header-right">
          <button className="icon-btn" onClick={() => setShowNewContact(true)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
          </button>
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
        </div>
      </div>

      {/* Main Content */}
      <div className="whatsapp-content">
        {/* Sidebar */}
<ChatSidebar 
          activeTab={activeTab}
          chats={chats}
          onlineUsers={onlineUsers}
          onTabChange={setActiveTab}
          onContactSelect={handleContactSelect}
          onStatusSelect={handleStatusSelect}
        />


        {/* Chat Window */}
{currentChat && activeTab === 'chats' && (
          <ChatWindow chat={currentChat} />
        )}


        {/* Status View */}
        {showStatusView && (
          <StatusView onBack={() => setShowStatusView(false)} />
        )}

        {/* No Contact Selected */}
        {!currentChat && activeTab === 'chats' && !showStatusView && (
          <div className="no-chat-selected">

            <div className="no-chat-content">
              <div className="whatsapp-logo-large">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
              <h2>WhatsApp Clone</h2>
              <p>Select a chat to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* New Contact Modal */}
      {showNewContact && (
        <div className="modal-overlay" onClick={() => setShowNewContact(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>New Contact</h3>
              <button className="close-btn" onClick={() => setShowNewContact(false)}>×</button>
            </div>
            <div className="modal-body">
              <form className="contact-form">
                <div className="form-group">
                  <label>Name</label>
                  <input type="text" placeholder="Enter name" required />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input type="tel" placeholder="Enter phone number" required />
                </div>
                <div className="form-group">
                  <label>Email (optional)</label>
                  <input type="email" placeholder="Enter email" />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <input type="text" placeholder="Enter status" />
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowNewContact(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppLayout;
