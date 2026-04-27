import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const TrainerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/sessions').then(res => {
      setSessions(res.data.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const stats = {
    total: sessions.length,
    live: sessions.filter(s => s.status === 'live').length,
    upcoming: sessions.filter(s => s.status === 'upcoming').length,
    completed: sessions.filter(s => s.status === 'completed').length,
  };

  const chartData = sessions.slice(0, 6).map(s => ({
    name: s.title.substring(0, 12) + '...',
    enrolled: s.enrolled_count || 0,
  }));

  const statusBadge = (status) => {
    const map = { live: 'badge-red', upcoming: 'badge-blue', completed: 'badge-green', cancelled: 'badge-gray' };
    return <span className={`badge ${map[status] || 'badge-gray'}`}>{status === 'live' ? '🔴 LIVE' : status}</span>;
  };

  return (
    <div className="page-content">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.6rem', marginBottom: 4 }}>Good morning, {user?.name?.split(' ')[0]} 👋</h1>
        <p style={{ color: 'var(--text-muted)' }}>Here's what's happening with your training sessions.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Sessions</div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-sub">All time</div>
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid var(--danger)' }}>
          <div className="stat-label">Live Now</div>
          <div className="stat-value" style={{ color: 'var(--danger)' }}>{stats.live}</div>
          <div className="stat-sub">{stats.live > 0 ? <><span className="live-dot" /> Active</>: 'None active'}</div>
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid var(--primary)' }}>
          <div className="stat-label">Upcoming</div>
          <div className="stat-value" style={{ color: 'var(--primary)' }}>{stats.upcoming}</div>
          <div className="stat-sub">Scheduled</div>
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid var(--secondary)' }}>
          <div className="stat-label">Completed</div>
          <div className="stat-value" style={{ color: 'var(--secondary)' }}>{stats.completed}</div>
          <div className="stat-sub">Successfully done</div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '1rem' }}>Learner Enrollment</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="enrolled" fill="var(--primary)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '1rem' }}>Quick Actions</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button className="btn btn-primary" onClick={() => navigate('/trainer/create-session')}>
              ➕ Create New Session
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/trainer/sessions')}>
              📅 View All Sessions
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/trainer/reports')}>
              📊 Download Reports
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 style={{ fontSize: '1rem' }}>Recent Sessions</h3>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/trainer/sessions')}>View All</button>
        </div>
        {loading ? <div className="loading">Loading...</div> : (
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Scheduled</th>
                <th>Enrolled</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {sessions.slice(0, 5).map(s => (
                <tr key={s.id}>
                  <td><strong>{s.title}</strong></td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {new Date(s.scheduled_at).toLocaleString()}
                  </td>
                  <td>{s.enrolled_count || 0} learners</td>
                  <td>{statusBadge(s.status)}</td>
                  <td>
                    <button className="btn btn-secondary btn-sm"
                      onClick={() => navigate(`/trainer/session/${s.id}`)}>
                      {s.status === 'live' ? '🔴 Manage' : 'View'}
                    </button>
                  </td>
                </tr>
              ))}
              {sessions.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>
                  No sessions yet. <span style={{color:'var(--primary)', cursor:'pointer'}} onClick={() => navigate('/trainer/create-session')}>Create one →</span>
                </td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default TrainerDashboard;
