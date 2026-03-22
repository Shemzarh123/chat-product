import React, { useState, useEffect } from 'react';

const StatusView = ({ onBack }) => {
  // Demo status story
  const [statusStory] = useState({
    id: 2,
    user: {
      name: 'Mike Chen',
      avatar: 'MC',
      phone: '+1 555 123 4567'
    },
    images: [
      { 
        id: 1, 
        url: 'https://picsum.photos/seed/status2/800/1200', 
        timestamp: new Date(Date.now() - 7200000),
        caption: 'Beautiful sunset today 🌅'
      },
      { 
        id: 2, 
        url: 'https://picsum.photos/seed/status3/800/1200', 
        timestamp: new Date(Date.now() - 3600000),
        caption: 'Coffee time ☕'
      }
    ],
    expires: new Date(Date.now() + 68400000)
  });

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const currentImage = statusStory.images[currentImageIndex];

  useEffect(() => {
    let progressInterval;
    if (isPlaying) {
      setProgress(0);
      progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            if (currentImageIndex < statusStory.images.length - 1) {
              setCurrentImageIndex(prev => prev + 1);
            } else {
              onBack();
            }
            return 0;
          }
          return prev + 0.5;
        });
      }, 30);
    }

    return () => clearInterval(progressInterval);
  }, [currentImageIndex, isPlaying, statusStory.images.length, onBack]);

  const handleNextImage = () => {
    if (currentImageIndex < statusStory.images.length - 1) {
      setCurrentImageIndex(prev => prev + 1);
    } else {
      onBack();
    }
  };

  const handlePreviousImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(prev => prev - 1);
    }
  };



  const getTimeAgo = (date) => {
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="status-view">
      {/* Status Header */}
      <div className="status-header">
        <button className="back-btn" onClick={onBack}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div className="status-info">
          <div className="contact-avatar">
            <div className="avatar-placeholder">{statusStory.user.avatar}</div>
          </div>
          <div className="user-details">
            <h3>{statusStory.user.name}</h3>
            <p>{getTimeAgo(currentImage.timestamp)}</p>
          </div>
        </div>
        <div className="status-actions">
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

      {/* Progress Bars */}
      <div className="status-progress">
        {statusStory.images.map((_, index) => (
          <div 
            key={index} 
            className={`progress-bar ${index === currentImageIndex ? 'active' : index < currentImageIndex ? 'completed' : ''}`}
          >
            <div 
              className="progress-fill"
              style={{ width: index === currentImageIndex ? `${progress}%` : '100%' }}
            ></div>
          </div>
        ))}
      </div>

      {/* Status Content */}
      <div 
        className="status-content"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const centerX = rect.width / 2;
          
          if (clickX < centerX - 50) {
            handlePreviousImage();
          } else if (clickX > centerX + 50) {
            handleNextImage();
          } else {
            setIsPlaying(!isPlaying);
          }
        }}
      >
        <div className="status-image-container">
          <img src={currentImage.url} alt="Status" />
          <div className="status-overlay">
            {!isPlaying && (
              <div className="play-button">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Caption */}
        {currentImage.caption && (
          <div className="status-caption">
            <p>{currentImage.caption}</p>
          </div>
        )}
      </div>

      {/* Status Footer */}
      <div className="status-footer">
        <div className="footer-actions">
          <button className="footer-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
            </svg>
          </button>
          
          <div className="comment-input-container">
            <div className="comment-input-wrapper">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              <input type="text" placeholder="Type a message" />
            </div>
          </div>

          <button className="footer-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatusView;
