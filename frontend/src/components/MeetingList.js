import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

interface Meeting {
  id: number;
  title: string;
  date: string;
  description: string;
}

const MeetingList: React.FC = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const response = await api.get('/meetings/');
        setMeetings(response.data);
        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch meetings.');
        setLoading(false);
        console.error(err);
      }
    };

    fetchMeetings();
  }, []);

  if (loading) {
    return <div>Loading meetings...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h2>Meetings</h2>
      <ul>
        {meetings.map((meeting) => (
          <li key={meeting.id}>
            <Link to={`/meetings/${meeting.id}`}>{meeting.title}</Link> - {meeting.date}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MeetingList;