import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import './MeetingDetail.css'; // Optional: For styling

const MeetingDetail = () => {
  const { id } = useParams();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        const response = await api.get(`/meetings/${id}/`);
        setMeeting(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.message || 'Failed to fetch meeting');
        setLoading(false);
      }
    };

    fetchMeeting();
  }, [id]);

  if (loading) {
    return <div>Loading meeting details...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!meeting) {
    return <div>Meeting not found.</div>;
  }

  return (
    <div className="meeting-detail-container">
      <h2>Meeting Details</h2>
      <div className="meeting-detail">
        <p><strong>Title:</strong> {meeting.title}</p>
        <p><strong>Date:</strong> {meeting.date}</p>
        <p><strong>Time:</strong> {meeting.time}</p>
        <p><strong>Description:</strong> {meeting.description}</p>
        {meeting.attendees && meeting.attendees.length > 0 && (
          <div>
            <strong>Attendees:</strong>
            <ul>
              {meeting.attendees.map((attendee) => (
                <li key={attendee.id}>{attendee.username}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <Link to="/meetings" className="back-link">Back to Meetings</Link>
    </div>
  );
};

export default MeetingDetail;