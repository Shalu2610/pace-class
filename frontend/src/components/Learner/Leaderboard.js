import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import './Leaderboard.css';

const Leaderboard = () => {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaders = async () => {
      try {
        const response = await api.get('/progress/leaderboard');
        setLeaders(response.data.data);
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
        // Fallback to mock data if API fails
        setLeaders([
          { name: 'Alice', total_points: 1200 },
          { name: 'Bob', total_points: 950 },
          { name: 'Charlie', total_points: 800 },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaders();
  }, []);

  if (loading) return <div className="leaderboard-loading">Loading Rankings...</div>;

  return (
    <div className="leaderboard-card">
      <h2>🏆 Top Learners</h2>
      <table className="leaderboard-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Name</th>
            <th>Points</th>
          </tr>
        </thead>
        <tbody>
          {leaders.map((learner, index) => (
            <tr key={index} className={index < 3 ? `top-${index + 1}` : ''}>
              <td>{index + 1}</td>
              <td>{learner.name}</td>
              <td>{learner.total_points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Leaderboard;
