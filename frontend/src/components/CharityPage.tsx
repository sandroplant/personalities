import React, { useState, useEffect } from 'react';

// Define the type for a charity project
interface CharityProject {
  id: string;
  title: string;
  description: string;
  url: string;
}

const CharityPage: React.FC = () => {
  const [charityProjects, setCharityProjects] = useState<CharityProject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch charity projects from your API or server
    const fetchCharityProjects = async () => {
      try {
        const response = await fetch('/api/charity-projects');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data: CharityProject[] = await response.json();
        setCharityProjects(data);
      } catch (error: unknown) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError(String(error));
        }
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
