import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import './PrototypeList.css'; // 必要に応じてスタイルを適用

interface Prototype {
  id: number;
  name: string;
  description: string;
  file_url: string;
  created_at: string;
  updated_at: string;
}

const PrototypeList = () => {
  const [prototypes, setPrototypes] = useState<Prototype[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrototypes = async () => {
      try {
        const response = await api.get('/prototypes/');
        setPrototypes(response.data);
        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching prototypes.');
        setLoading(false);
      }
    };

    fetchPrototypes();
  }, []);

  if (loading) {
    return <div>Loading prototypes...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="prototype-list-container">
      <h1>Prototypes</h1>
      <ul className="prototype-list">
        {prototypes.map((prototype) => (
          <li key={prototype.id} className="prototype-item">
            <Link to={`/prototypes/${prototype.id}`} className="prototype-link">
              <h2>{prototype.name}</h2>
              <p>{prototype.description}</p>
              {prototype.file_url && (
                <a href={prototype.file_url} target="_blank" rel="noopener noreferrer">
                  View Prototype
                </a>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PrototypeList;