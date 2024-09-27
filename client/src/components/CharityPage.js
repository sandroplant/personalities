// src/components/CharityPage.js
import React, { useState, useEffect } from 'react';

const CharityPage = () => {
  const [charityProjects, setCharityProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch charity projects from your API or server
    const fetchCharityProjects = async () => {
      try {
        const response = await fetch('/api/charity-projects');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setCharityProjects(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCharityProjects();
  }, []);

  if (loading) {
    return <p>Loading charity projects...</p>;
  }

  if (error) {
    return <p>Error loading charity projects: {error}</p>;
  }

  return (
    <div className="charity-page">
      <h1>Charity Projects</h1>
      {charityProjects.length === 0 ? (
        <p>No charity projects available at the moment.</p>
      ) : (
        <ul>
          {charityProjects.map((project) => (
            <li key={project.id}>
              <h2>{project.title}</h2>
              <p>{project.description}</p>
              <button onClick={() => window.open(project.url, '_blank')}>
                Learn More
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CharityPage;
