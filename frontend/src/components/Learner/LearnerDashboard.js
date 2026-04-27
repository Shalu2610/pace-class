import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const LearnerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/sessions'),
      api.get('/engagement/learner/me'),
    ]).then(([sRes, pRes]) => {
      setSessions(sRes.data.data || []);
      setProgress(pRes.data.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const liveSessions = sessions.filter(s => s.status === 'live');
  const upcomingSessions = sessions.filter(s => s.status === 'upcoming');
  const completedSessions = sessions.filter(s => s.status === 'completed');

  const radarData = [
    { subject: 'Attendance', value: completedSessions.length * 20 },
    { subject: 'Quiz Score', value: progress.reduce((s, p) => s + (p.quiz_points || 0), 0) % 100 },
    { subject: 'Engagement', value: progress.reduce((s, p) => s + (p.score || 0), 0) % 100 },
    { subject: 'Participation', value: Math.min(100, sessions.length * 15) },
    { subject: 'Completion', value: completedSessions.length > 0 ? 80 : 20 },
  ];

  return (
    <div className="page-content">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.6rem', marginBottom: 4 }}>Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
        <p style={{ color: 'var(--text-muted)' }}>Track your training progress and join live sessions.</p>
      </div>

      {/* Live Alert */}
      {liveSessions.length > 0 && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '16px 20px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="live-dot" />
            <div>
              <div style={{ fontWeight: 700, color: '#991B1B' }}>Session is LIVE now!</div>
              <div style={{ fontSize: '0.85rem', color: '#B91C1C' }}>{liveSessions[0].title}</div>
            </div>
          </div>
          <button className="btn btn-danger" onClick={() => navigate(`/learner/session/${liveSessions[0].id}`)}>
            Join Now →
          </button>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-label">Enrolled Sessions</div><div className="stat-value">{sessions.length}</div></div>
        <div className="stat-card" style={{ borderTop: '3px solid var(--danger)' }}>
          <div className="stat-label">Live Now</div>
          <div className="stat-value" style={{ color: 'var(--danger)' }}>{liveSessions.length}</div>
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid var(--secondary)' }}>
          <div className="stat-label">Completed</div>
          <div className="stat-value" style={{ color: 'var(--secondary)' }}>{completedSessions.length}</div>
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid var(--accent)' }}>
          <div className="stat-label">Upcoming</div>
          <div className="stat-value" style={{ color: 'var(--accent)' }}>{upcomingSessions.length}</div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <h3 style={{ fontSize: '1rem', marginBottom: 16 }}>My Learning Radar</h3>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
              <Radar dataKey="value" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1rem', marginBottom: 16 }}>Recent Activity</h3>
          {progress.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: 40 }}>No activity yet. Join a session!</p>}
          {progress.slice(0, 5).map((p, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{p.title}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(p.scheduled_at).toLocaleDateString()}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--primary)' }}>{Math.round(p.score || 0)} pts</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.quizzes_taken || 0} quizzes</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 style={{ fontSize: '1rem' }}>My Sessions</h3>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/learner/explore')}>Explore More</button>
        </div>
        {loading ? <div className="loading">Loading...</div> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {sessions.map(s => (
              <div key={s.id} className="session-card" onClick={() => navigate(`/learner/session/${s.id}`)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span className={`badge ${s.status === 'live' ? 'badge-red' : s.status === 'upcoming' ? 'badge-blue' : 'badge-green'}`}>
                    {s.status === 'live' ? '🔴 LIVE' : s.status}
                  </span>
                </div>
                <h3>{s.title}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 6 }}>
                  By {s.trainer_name} · {new Date(s.scheduled_at).toLocaleDateString()}
                </p>
                {s.status === 'live' && (
                  <button className="btn btn-danger btn-sm" style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}>Join Now →</button>
                )}
              </div>
            ))}
            {sessions.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
                You're not enrolled in any sessions. <span style={{ color: 'var(--primary)', cursor: 'pointer' }} onClick={() => navigate('/learner/explore')}>Explore sessions →</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LearnerDashboard;
