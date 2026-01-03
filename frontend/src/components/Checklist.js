import React, { useState, useEffect } from 'react';
import { getChecklist, updateChecklist } from '../services/api';
import PropTypes from 'prop-types';

const Checklist = ({ meetingId }) => {
  const [checklist, setChecklist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchChecklist = async () => {
      try {
        const data = await getChecklist(meetingId);
        setChecklist(data);
      } catch (err) {
        setError(err.message || 'Failed to fetch checklist');
      } finally {
        setLoading(false);
      }
    };

    fetchChecklist();
  }, [meetingId]);

  const handleCheckboxChange = async (itemId, isChecked) => {
    const updatedChecklist = checklist.map(item =>
      item.id === itemId ? { ...item, completed: isChecked } : item
    );
    setChecklist(updatedChecklist);

    try {
      await updateChecklist(meetingId, itemId, isChecked);
    } catch (err) {
      setError(err.message || 'Failed to update checklist');
      // Revert the change on the frontend if the update fails
      setChecklist(
        checklist.map(item =>
          item.id === itemId ? { ...item, completed: !isChecked } : item
        )
      );
    }
  };

  if (loading) {
    return <div>Loading checklist...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h3>Checklist</h3>
      <ul>
        {checklist.map(item => (
          <li key={item.id}>
            <label>
              <input
                type="checkbox"
                checked={item.completed}
                onChange={(e) => handleCheckboxChange(item.id, e.target.checked)}
              />
              {item.task}
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
};

Checklist.propTypes = {
  meetingId: PropTypes.number.isRequired,
};

export default Checklist;