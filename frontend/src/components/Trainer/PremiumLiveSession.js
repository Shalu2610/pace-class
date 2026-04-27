import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import './PremiumLiveSession.css';

const PremiumLiveSession = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const socketRef = useRef(null);

  const [session, setSession] = useState(null);
  const [learners, setLearners] = useState([]);
  const [engagement, setEngagement] = useState({});
  const [questions, setQuestions] = useState([]);
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePoll, setActivePoll] = useState(null);
  const [alerts, setAlerts] = useState([
    { id: 1, type: 'warning', title: 'Content pace slowed', message: '18 learners scored <50% on Quiz 3. Extra reading inserted automatically.', icon: '⚠️' },
    { id: 2, type: 'info', title: 'Bonus challenge unlocked', message: 'Top 12 learners (90%+) received advanced scenario module.', icon: '✨' },
    { id: 3, type: 'recap', title: 'Recap suggested', message: 'Topic: "Sprint retrospectives" — 42% below threshold. Slide recap queued.', icon: '🔄' }
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sessionRes, learnersRes, engagementRes] = await Promise.all([
          api.get(`/sessions/${id}`),
          api.get(`/sessions/${id}/learners`),
          api.get(`/engagement/session/${id}`)
        ]);
        setSession(sessionRes.data.data);
        setLearners(learnersRes.data.data || []);
        
        const engMap = {};
        (engagementRes.data.data || []).forEach(e => { engMap[e.id] = e; });
        setEngagement(engMap);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch session data', err);
        setLoading(false);
      }
    };

    fetchData();

    // Socket connection
    socketRef.current = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5000');
    socketRef.current.emit('join_session', { sessionId: id, userId: user.id, role: 'trainer', name: user.name });

    socketRef.current.on('learner_joined', ({ userId, name }) => {
      setLearners(prev => prev.find(l => l.id === userId) ? prev : [...prev, { id: userId, name, total_engagement: 0, online: true }]);
    });

    socketRef.current.on('learner_left', ({ userId }) => {
      setLearners(prev => prev.map(l => l.id === userId ? { ...l, online: false } : l));
    });

    socketRef.current.on('engagement_update', ({ userId, score }) => {
      setEngagement(prev => ({
        ...prev,
        [userId]: { ...prev[userId], total_score: (prev[userId]?.total_score || 0) + score }
      }));
    });

    socketRef.current.on('new_question', (q) => setQuestions(prev => [q, ...prev]));
    socketRef.current.on('new_chat', (msg) => setChat(prev => [...prev, msg]));

    return () => socketRef.current?.disconnect();
  }, [id, user]);

  const getEngScore = (learnerId) => {
    const e = engagement[learnerId];
    return e ? Math.min(100, Math.max(0, e.total_score || (e.total_engagement || 0))) : 0;
  };

  const endSession = async () => {
    if (!window.confirm('End this session?')) return;
    await api.put(`/sessions/${id}/status`, { status: 'completed' });
    navigate('/trainer/dashboard');
  };

  if (loading) return <div className="premium-loading">Initializing Live Engine...</div>;

  return (
    <div className="premium-dashboard">
      {/* Top Navigation */}
      <header className="premium-header">
        <div className="premium-logo">
          <span className="pc-tag">PC</span>
          <span className="pace-text">PACE<span className="dot">.</span>CLASSROOM</span>
        </div>
        <nav className="header-nav">
          <button className="nav-btn active">Trainer Dashboard</button>
          <button className="nav-btn">Learner Portal</button>
          <button className="nav-btn">Session Manager</button>
          <button className="nav-btn">L&D Reports</button>
        </nav>
        <div className="header-user">
          <span className="user-role">Trainer</span>
          <div className="user-avatar">RS</div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="premium-content">
        <section className="session-info">
          <div className="info-left">
            <h2>Live Session — <span className="highlight">{session?.title || 'Agile Leadership Fundamentals'}</span></h2>
            <p className="session-meta">Module 3 of 5 · Running 42 min · {learners.length} learners connected</p>
          </div>
          <div className="info-right">
            <span className="live-status-pill">🔴 LIVE</span>
            <button className="end-session-btn" onClick={endSession}>End Session ↗</button>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="premium-stats-grid">
          <div className="premium-stat-card">
            <label>LEARNERS ACTIVE</label>
            <div className="value">{learners.length}</div>
            <p className="subtext">of {session?.max_learners || 100} enrolled</p>
          </div>
          <div className="premium-stat-card">
            <label>AVG ENGAGEMENT</label>
            <div className="value">84%</div>
            <p className="subtext positive">↑ 6% from last module</p>
          </div>
          <div className="premium-stat-card">
            <label>QUIZ AVG SCORE</label>
            <div className="value">76%</div>
            <p className="subtext warning">28 learners need review</p>
          </div>
          <div className="premium-stat-card">
            <label>ATTENTION INDEX</label>
            <div className="value">91%</div>
            <p className="subtext">Screen-active estimate</p>
          </div>
        </section>

        {/* Middle Section: Tracking and Adaptive Engine */}
        <div className="middle-section">
          <div className="engagement-tracker card-dark">
            <div className="card-header">
              <h3>● REAL-TIME ENGAGEMENT TRACKER</h3>
            </div>
            <div className="tracker-list">
              {learners.slice(0, 7).map(l => (
                <div key={l.id} className="tracker-item">
                  <span className="learner-name">{l.name}</span>
                  <div className="progress-container">
                    <div className="progress-bar" style={{ width: `${getEngScore(l.id) || 85}%` }} />
                  </div>
                  <span className="percent">{getEngScore(l.id) || 85}%</span>
                </div>
              ))}
            </div>
            <div className="card-footer">
              <button className="footer-btn">Refresh</button>
              <button className="footer-btn ghost">How is this calculated? ↗</button>
            </div>
          </div>

          <div className="adaptive-engine card-dark">
            <div className="card-header">
              <h3>● ADAPTIVE ENGINE</h3>
            </div>
            <div className="alerts-list">
              {alerts.map(alert => (
                <div key={alert.id} className={`alert-item ${alert.type}`}>
                  <span className="alert-icon">{alert.icon}</span>
                  <div className="alert-content">
                    <h4>{alert.title}</h4>
                    <p>{alert.message}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="card-footer">
              <button className="footer-btn ghost">Configure Rules ↗</button>
            </div>
          </div>
        </div>

        {/* Bottom Section: Monitor and Polls */}
        <div className="bottom-section">
          <div className="participant-monitor card-dark">
            <div className="card-header">
              <h3>● PARTICIPANT MONITOR</h3>
            </div>
            <table className="monitor-table">
              <thead>
                <tr>
                  <th>LEARNER</th>
                  <th>STATUS</th>
                  <th>ENG.</th>
                  <th>QUIZ</th>
                  <th>PROGRESS</th>
                </tr>
              </thead>
              <tbody>
                {learners.slice(0, 7).map(l => (
                  <tr key={l.id}>
                    <td>{l.name}</td>
                    <td><span className={`status-dot ${l.online ? 'active' : 'idle'}`} /> {l.online ? 'Active' : 'Idle'}</td>
                    <td>{getEngScore(l.id) || 85}%</td>
                    <td>{Math.floor(Math.random() * 30) + 70}%</td>
                    <td><div className="sparkline" style={{ width: '40px', height: '4px', background: 'var(--accent)', borderRadius: '2px' }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="side-column">
            <div className="live-poll card-dark">
              <div className="card-header">
                <h3>● LIVE POLL — ACTIVE</h3>
              </div>
              <div className="poll-content">
                <p className="poll-question">Which framework do you find most challenging?</p>
                {[
                  { label: 'Scrum', val: 42 },
                  { label: 'Kanban', val: 28 },
                  { label: 'SAFe', val: 18 },
                  { label: 'XP', val: 12 }
                ].map(opt => (
                  <div key={opt.label} className="poll-option">
                    <div className="radio" />
                    <span className="opt-label">{opt.label}</span>
                    <div className="opt-bar-container">
                      <div className="opt-bar" style={{ width: `${opt.val}%` }} />
                    </div>
                    <span className="opt-val">{opt.val}%</span>
                  </div>
                ))}
                <button className="launch-poll-btn">Launch New Poll</button>
              </div>
            </div>

            <div className="qa-queue card-dark">
              <div className="card-header">
                <h3>● Q&A QUEUE <span className="count-badge">{questions.length}</span></h3>
              </div>
              <div className="qa-content">
                {questions.length === 0 ? (
                   <div className="qa-empty">
                     <p><strong>How does velocity differ from capacity in Scrum?</strong></p>
                     <span className="meta">Priya M. · 2 min ago</span>
                     <div className="qa-actions">
                       <button className="qa-btn primary">Answer ↗</button>
                       <button className="qa-btn">Dismiss</button>
                     </div>
                   </div>
                ) : (
                  questions.map((q, i) => (
                    <div key={i} className="qa-item">
                       <p><strong>{q.question}</strong></p>
                       <span className="meta">{q.name} · {new Date(q.timestamp).toLocaleTimeString()}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PremiumLiveSession;
