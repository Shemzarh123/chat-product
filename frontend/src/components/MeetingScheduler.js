import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useAuth } from '../context/AuthContext';

const locales = {
  'en-US': require('date-fns/locale/en-US'),
};
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const MeetingScheduler = ({ userId }) => {
  const { token } = useAuth();
  const [availability, setAvailability] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (userId) fetchAvailability();
  }, [userId]);

  const fetchAvailability = async () => {
    try {
      const res = await axios.get(`/api/availability/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAvailability(res.data.slots);
      // Convert to calendar events
      const calendarEvents = res.data.slots.map(slot => ({
        title: 'Available',
        start: new Date(slot.startTime),
        end: new Date(slot.endTime),
        slotId: slot._id,
        resource: { type: 'availability' }
      }));
      setEvents(calendarEvents);
    } catch (err) {
      console.error('Error fetching availability:', err);
    }
  };

  const bookSlot = async () => {
    if (!selectedSlot) return;
    setLoading(true);
    try {
      // Create meeting from slot
      const meetingData = {
        title: `Meeting with ${userId.substring(0,8)}...`,
        startTime: selectedSlot.start,
        endTime: selectedSlot.end,
        timezone: 'UTC'
      };
      const meetingRes = await axios.post('/api/meetings', meetingData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Book slot
      await axios.put(`/api/availability/${selectedSlot._id}/book`, { meetingId: meetingRes.data.meeting._id }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Send invite to host
      await axios.post('/api/invites', {
        meeting: meetingRes.data.meeting._id,
        invitee: userId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Meeting booked and invite sent!');
      fetchAvailability();
    } catch (err) {
      console.error('Booking error:', err);
      alert('Booking failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="meeting-scheduler">
      <h2>Schedule Meeting</h2>
      <div style={{ height: 500 }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          selectable
          onSelectEvent={(event) => setSelectedSlot({
            _id: event.slotId,
            start: event.start,
            end: event.end
          })}
          eventPropGetter={(event) => ({
            style: { backgroundColor: '#4CAF50', borderRadius: '8px' }
          })}
        />
      </div>
      {selectedSlot && (
        <div className="selected-slot">
          <h3>Selected Slot</h3>
          <p>{format(selectedSlot.start, 'PPP p')} - {format(selectedSlot.end, 'p')}</p>
          <button 
            className="btn-primary" 
            onClick={bookSlot}
            disabled={loading}
          >
            {loading ? 'Booking...' : 'Book Meeting & Send Invite'}
          </button>
        </div>
      )}
    </div>
  );
};

export default MeetingScheduler;

