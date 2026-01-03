import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const PrototypeDetail = () => {
  const { id } = useParams();
  const [prototype, setPrototype] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrototype = async () => {
      try {
        const response = await axios.get(`/api/prototypes/${id}/`); // Adjust API endpoint as needed
        setPrototype(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.message || 'Failed to fetch prototype.');
        setLoading(false);
      }
    };

    fetchPrototype();
  }, [id]);

  if (loading) {
    return <div>Loading prototype details...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!prototype) {
    return <div>Prototype not found.</div>;
  }

  return (
    <div>
      <h2>Prototype Details</h2>
      <h3>{prototype.title}</h3>
      <p>Description: {prototype.description}</p>
      {prototype.file_url && (
        <a href={prototype.file_url} target="_blank" rel="noopener noreferrer">
          View Prototype File
        </a>
      )}
      <Link to="/prototypes">Back to Prototype List</Link>
    </div>
  );
};

export default PrototypeDetail;