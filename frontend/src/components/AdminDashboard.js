import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// Utility function to format time
const formatTime = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

// Utility function to format relative time
const formatRelativeTime = (date) => {
  if (!date) return '';
  const now = new Date();
  const msgDate = new Date(date);
  const diffMs = now - msgDate;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return msgDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Format date for display
const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

// Get status color class
const getStatusClass = (status) => {
  const statusMap = {
    'new': 'status-new',
    'in_progress': 'status-progress',
    'qualified': 'status-qualified',
    'converted': 'status-converted',
    'lost': 'status-lost'
  };
  return statusMap[status] || 'status-new';
};

// Get channel icon
const getChannelIcon = (channel) => {
  const icons = {
    'sms': '💬',
    'website': '🌐',
    'phone': '📞',
    'whatsapp': '📱',
    'email': '✉️'
  };
  return icons[channel] || '💬';
};

const AdminDashboard = () => {
  const [businessId, setBusinessId] = useState('1');
  const [conversations, setConversations] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const sidebarRef = useRef(null);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      // Simulate online status based on business hours
      const hour = new Date().getHours();
      const day = new Date().getDay();
      setIsOnline(day >= 1 && day <= 5 && hour >= 9 && hour < 18);
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchData();
  }, [businessId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [conversationsRes, analyticsRes] = await Promise.all([
        axios.get(`/api/business/${businessId}/conversations`),
        axios.get(`/api/business/${businessId}/analytics`)
      ]);
      
      setConversations(conversationsRes.data);
      setAnalytics(analyticsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const handleConversationClick = (conversation) => {
    setSelectedConversation(conversation);
  };

  const closeConversation = () => {
    setSelectedConversation(null);
  };

  // Calculate recovery metrics with more detail
  const getRecoveryMetrics = () => {
    if (!analytics) return { rate: 0, trend: 'neutral', avgResponse: '0 min' };
    
    const rate = analytics.recoveryRate || 0;
    let trend = 'neutral';
    if (rate > 50) trend = 'up';
    else if (rate < 30) trend = 'down';
    
    return {
      rate,
      trend,
      avgResponse: '12 min',
      totalValue: analytics.totalLeads * 250
    };
  };

  const metrics = getRecoveryMetrics();

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading-screen">
          <div className="loader"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <aside className="sidebar" ref={sidebarRef}>
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">RF</span>
            <span className="logo-text">RecoverFlow</span>
          </div>
        </div>
        
        <div className="sidebar-user">
          <div className="user-avatar">JD</div>
          <div className="user-info">
            <span className="user-name">John Doe</span>
            <span className="user-role">Admin</span>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <a 
            href="#dashboard" 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            <span>Dashboard</span>
          </a>
          <a 
            href="#conversations" 
            className={`nav-item ${activeTab === 'conversations' ? 'active' : ''}`}
            onClick={() => setActiveTab('conversations')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <span>Conversations</span>
            <span className="badge">{conversations.length}</span>
          </a>
          <a 
            href="#leads" 
            className={`nav-item ${activeTab === 'leads' ? 'active' : ''}`}
            onClick={() => setActiveTab('leads')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <span>Leads</span>
          </a>
          <a 
            href="#analytics" 
            className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
            <span>Analytics</span>
          </a>
          <a href="#settings" className="nav-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            <span>Settings</span>
          </a>
        </nav>
        
        <div className="sidebar-footer">
          <div className="business-status">
            <span className={`status-dot ${isOnline ? 'online' : 'offline'}`}></span>
            <span>{isOnline ? 'Business Open' : 'Business Closed'}</span>
          </div>
        </div>
      </aside>
      
      <main className="main-content">
        <header className="content-header">
          <div className="header-left">
            <h1>{getGreeting()}</h1>
            <p className="header-subtitle">{formatDate(currentTime)}</p>
          </div>
          <div className="header-right">
            <div className="search-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input type="text" placeholder="Search conversations..." />
            </div>
            <button className="icon-button notification-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              <span className="notification-badge">3</span>
            </button>
          </div>
        </header>
        
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon leads">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-label">Total Leads</span>
              <span className="stat-value">{analytics?.totalLeads || 0}</span>
              <span className="stat-change positive">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                  <polyline points="17 6 23 6 23 12"></polyline>
                </svg>
                +12% this week
              </span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon recovered">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-label">Recovered</span>
              <span className="stat-value">{analytics?.recoveredLeads || 0}</span>
              <span className="stat-change positive">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                  <polyline points="17 6 23 6 23 12"></polyline>
                </svg>
                +8% this week
              </span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon rate">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="20" x2="12" y2="10"></line>
                <line x1="18" y1="20" x2="18" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="16"></line>
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-label">Recovery Rate</span>
              <span className="stat-value">{metrics.rate}%</span>
              <span className={`stat-change ${metrics.trend === 'up' ? 'positive' : metrics.trend === 'down' ? 'negative' : ''}`}>
                {metrics.trend === 'up' ? '↑' : metrics.trend === 'down' ? '↓' : '→'} vs last month
              </span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon response">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-label">Avg Response</span>
              <span className="stat-value">{metrics.avgResponse}</span>
              <span className="stat-change positive">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                  <polyline points="17 6 23 6 23 12"></polyline>
                </svg>
                Faster than avg
              </span>
            </div>
          </div>
        </div>
        
        <section className="conversations-section">
          <div className="section-header">
            <h2>Recent Conversations</h2>
            <div className="section-actions">
              <select className="filter-select">
                <option>All Channels</option>
                <option>SMS</option>
                <option>Website</option>
                <option>Phone</option>
              </select>
              <select className="filter-select">
                <option>All Status</option>
                <option>New</option>
                <option>In Progress</option>
                <option>Qualified</option>
                <option>Converted</option>
              </select>
            </div>
          </div>
          
          <div className="conversations-table">
            <div className="table-header">
              <div className="col-lead">Lead</div>
              <div className="col-channel">Channel</div>
              <div className="col-status">Status</div>
              <div className="col-updated">Last Activity</div>
              <div className="col-actions">Actions</div>
            </div>
            
            <div className="table-body">
              {conversations.length === 0 ? (
                <div className="empty-state">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                  <p>No conversations yet</p>
                  <span>New leads will appear here</span>
                </div>
              ) : (
                conversations.map((conversation) => (
                  <div 
                    key={conversation.id} 
                    className={`table-row ${selectedConversation?.id === conversation.id ? 'selected' : ''}`}
                    onClick={() => handleConversationClick(conversation)}
                  >
                    <div className="col-lead">
                      <div className="lead-avatar">
                        {conversation.lead_name?.charAt(0) || '?'}
                      </div>
                      <div className="lead-info">
                        <span className="lead-name">{conversation.lead_name || 'Unknown'}</span>
                        <span className="lead-phone">{conversation.phone_number || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="col-channel">
                      <span className="channel-badge">
                        {getChannelIcon(conversation.channel)} {conversation.channel}
                      </span>
                    </div>
                    <div className="col-status">
                      <span className={`status-badge ${getStatusClass(conversation.status)}`}>
                        {conversation.status || 'new'}
                      </span>
                    </div>
                    <div className="col-updated">
                      <span className="time-ago">{formatRelativeTime(conversation.updated_at)}</span>
                      <span className="exact-time">{formatTime(conversation.updated_at)}</span>
                    </div>
                    <div className="col-actions">
                      <button className="action-btn" title="View">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      </button>
                      <button className="action-btn" title="Reply">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                        </svg>
                      </button>
                      <button className="action-btn" title="More">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="1"></circle>
                          <circle cx="19" cy="12" r="1"></circle>
                          <circle cx="5" cy="12" r="1"></circle>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
        
        <div className="actions-bar">
          <button className="btn btn-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Export Data
          </button>
          <button className="btn btn-secondary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            New Campaign
          </button>
        </div>
      </main>
      
      {/* Conversation Detail Panel */}
      {selectedConversation && (
        <div className="conversation-panel">
          <div className="panel-header">
            <div className="panel-title">
              <h3>{selectedConversation.lead_name}</h3>
              <span className="panel-subtitle">{selectedConversation.phone_number}</span>
            </div>
            <button className="close-panel" onClick={closeConversation}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          <div className="panel-content">
            <div className="info-section">
              <h4>Contact Information</h4>
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">Phone</span>
                  <span className="value">{selectedConversation.phone_number}</span>
                </div>
                <div className="info-item">
                  <span className="label">Channel</span>
                  <span className="value">{getChannelIcon(selectedConversation.channel)} {selectedConversation.channel}</span>
                </div>
                <div className="info-item">
                  <span className="label">Status</span>
                  <span className={`status-badge ${getStatusClass(selectedConversation.status)}`}>
                    {selectedConversation.status}
                  </span>
                </div>
                <div className="info-item">
                  <span className="label">Created</span>
                  <span className="value">{formatDate(selectedConversation.created_at)}</span>
                </div>
              </div>
            </div>
            
            <div className="actions-section">
              <button className="btn btn-primary btn-full">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                Send Message
              </button>
              <button className="btn btn-secondary btn-full">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                Schedule Appointment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

