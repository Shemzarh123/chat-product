import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import VideoCall from './VideoCall';

const MeetingList = () => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMeetingId, setActiveMeetingId] = useState(null);
  const { token } = useAuth();

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      const res = await axios.get('/api/meetings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMeetings(res.data.meetings || []);
    } catch (err) {
      console.error('Error fetching meetings:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading meetings...</div>;

  return (
    <div className="meeting-list">
      <h2>Your Meetings</h2>
      <div className="meetings-grid">
        {meetings.map(meeting => (
          <div key={meeting._id} className={`meeting-card status-${meeting.status}`}>
            <h3>{meeting.title}</h3>
            <p>{new Date(meeting.startTime).toLocaleString()}</p>
            <p>Host: {meeting.host?.name}</p>
            <div className="meeting-actions">
              <Link to={`/call/${meeting._id}`} className="btn-primary">
                {meeting.status === 'active' ? 'Join Call' : 'View Details'}
              </Link>
              {meeting.status === 'scheduled' && (
                <button className="btn-secondary" onClick={() => cancelMeeting(meeting._id)}>
                  Cancel
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      {meetings.length === 0 && (
        <div className="empty-state">
          <p>No meetings yet</p>
          <Link to="/schedule" className="btn-primary">Schedule New Meeting</Link>
        </div>
      )}
    </div>
  );
};

const cancelMeeting = async (meetingId) => {
  // API call to cancel
  alert('Meeting cancelled');
};

export default MeetingList;

