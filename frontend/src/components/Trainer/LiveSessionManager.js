import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const LiveSessionManager = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const socketRef = useRef(null);

  const [session, setSession] = useState(null);
  const [learners, setLearners] = useState([]);
  const [engagement, setEngagement] = useState({});
  const [questions, setQuestions] = useState([]);
  const [chat, setChat] = useState([]);
  const [activeTab, setTab] = useState('learners');
  const [loading, setLoading] = useState(true);
  const chatEndRef = useRef(null);

  useEffect(() => {
    api.get(`/sessions/${id}`).then(res => {
      setSession(res.data.data);
      setLoading(false);
    });
    api.get(`/sessions/${id}/learners`).then(res => setLearners(res.data.data || []));
    api.get(`/engagement/session/${id}`).then(res => {
      const map = {};
      (res.data.data || []).forEach(e => { map[e.id] = e; });
      setEngagement(map);
    });

    // Socket connection
    socketRef.current = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5000');
    socketRef.current.emit('join_session', { sessionId: id, userId: user.id, role: 'trainer', name: user.name });

    socketRef.current.on('learner_joined', ({ userId, name }) => {
      setLearners(prev => prev.find(l => l.id === userId) ? prev : [...prev, { id: userId, name, total_engagement: 0 }]);
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

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chat]);

  const goLive = async () => {
    await api.put(`/sessions/${id}/status`, { status: 'live' });
    socketRef.current?.emit('content_update', { sessionId: id, contentId: 0, contentTitle: 'Session Started' });
    setSession(prev => ({ ...prev, status: 'live' }));
  };

  const endSession = async () => {
    if (!window.confirm('End this session?')) return;
    await api.put(`/sessions/${id}/status`, { status: 'completed' });
    setSession(prev => ({ ...prev, status: 'completed' }));
  };

  const launchQuiz = (quiz) => {
    socketRef.current?.emit('launch_quiz', { sessionId: id, quizId: quiz.id, quizTitle: quiz.title });
    alert(`Quiz "${quiz.title}" launched to all learners!`);
  };

  const generateReport = async () => {
    const res = await api.post(`/reports/generate/${id}`);
    alert(`Report generated: ${res.data.filename}`);
  };

  const getEngScore = (learnerId) => {
    const e = engagement[learnerId];
    return e ? Math.min(100, Math.max(0, e.total_score || 0)) : 0;
  };

  if (loading) return <div className="loading">Loading session...</div>;

  return (
    <div className="page-content">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 style={{ fontSize: '1.4rem' }}>{session?.title}</h1>
            {session?.status === 'live' && <><span className="live-dot" /><span style={{ fontSize: '0.8rem', color: 'var(--danger)', fontWeight: 600 }}>LIVE</span></>}
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Code: <strong>{session?.session_code}</strong> · {learners.length} enrolled</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {session?.status === 'upcoming' && <button className="btn btn-success" onClick={goLive}>🚀 Go Live</button>}
          {session?.status === 'live' && <button className="btn btn-danger" onClick={endSession}>⏹ End Session</button>}
          <button className="btn btn-secondary" onClick={generateReport}>📄 Report</button>
          <button className="btn btn-secondary" onClick={() => navigate('/trainer/sessions')}>← Back</button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card"><div className="stat-label">Learners</div><div className="stat-value">{learners.length}</div></div>
        <div className="stat-card"><div className="stat-label">Avg Engagement</div>
          <div className="stat-value">{learners.length ? Math.round(learners.reduce((s, l) => s + getEngScore(l.id), 0) / learners.length) : 0}%</div>
        </div>
        <div className="stat-card"><div className="stat-label">Questions Asked</div><div className="stat-value">{questions.length}</div></div>
        <div className="stat-card"><div className="stat-label">Quizzes</div><div className="stat-value">{session?.quizzes?.length || 0}</div></div>
      </div>

      <div className="grid-2">
        {/* Left Panel */}
        <div>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
            {['learners', 'questions', 'chat', 'quizzes'].map(tab => (
              <button key={tab} className={`btn btn-sm ${activeTab === tab ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setTab(tab)} style={{ textTransform: 'capitalize' }}>{tab}</button>
            ))}
          </div>

          <div className="card" style={{ minHeight: 400 }}>
            {/* Learners Tab */}
            {activeTab === 'learners' && (
              <div>
                <h3 style={{ fontSize: '0.95rem', marginBottom: 16 }}>Live Engagement</h3>
                {learners.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: 40 }}>Waiting for learners to join...</p>}
                {learners.map(l => {
                  const score = getEngScore(l.id);
                  return (
                    <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                      <div className="avatar">{l.name?.[0]?.toUpperCase()}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{l.name}</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{score}%</span>
                        </div>
                        <div className="engagement-bar">
                          <div className="engagement-fill" style={{ width: `${score}%`, background: score > 60 ? 'var(--secondary)' : score > 30 ? 'var(--accent)' : 'var(--danger)' }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Questions Tab */}
            {activeTab === 'questions' && (
              <div>
                <h3 style={{ fontSize: '0.95rem', marginBottom: 16 }}>Live Q&A ({questions.length})</h3>
                {questions.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: 40 }}>No questions yet.</p>}
                {questions.map((q, i) => (
                  <div key={i} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <div className="avatar" style={{ width: 28, height: 28, fontSize: '0.75rem' }}>{q.name?.[0]}</div>
                      <div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{q.name}</span>
                        <p style={{ fontSize: '0.875rem', marginTop: 2 }}>{q.question}</p>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(q.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Chat Tab */}
            {activeTab === 'chat' && (
              <div style={{ display: 'flex', flexDirection: 'column', height: 360 }}>
                <h3 style={{ fontSize: '0.95rem', marginBottom: 12 }}>Live Chat</h3>
                <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
                  {chat.map((msg, i) => (
                    <div key={i} style={{ marginBottom: 10 }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)' }}>{msg.name}: </span>
                      <span style={{ fontSize: '0.875rem' }}>{msg.message}</span>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              </div>
            )}

            {/* Quizzes Tab */}
            {activeTab === 'quizzes' && (
              <div>
                <h3 style={{ fontSize: '0.95rem', marginBottom: 16 }}>Launch Quizzes</h3>
                {(!session?.quizzes || session.quizzes.length === 0) && (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: 40 }}>No quizzes added to this session.</p>
                )}
                {session?.quizzes?.map(quiz => (
                  <div key={quiz.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{quiz.title}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Time limit: {quiz.time_limit_seconds}s</div>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => launchQuiz(quiz)}>🚀 Launch</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Content Viewer */}
        <div className="card">
          <h3 style={{ fontSize: '0.95rem', marginBottom: 16 }}>Session Content</h3>
          {(!session?.content || session.content.length === 0) && (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: 40 }}>No content added.</p>
          )}
          {session?.content?.map((c, i) => (
            <div key={c.id} style={{ padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{i + 1}. {c.title}</span>
                  <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                    <span className={`badge badge-blue`}>{c.content_type}</span>
                    <span className={`badge ${c.difficulty === 'basic' ? 'badge-green' : c.difficulty === 'intermediate' ? 'badge-yellow' : 'badge-red'}`}>{c.difficulty}</span>
                  </div>
                </div>
                <button className="btn btn-secondary btn-sm"
                  onClick={() => socketRef.current?.emit('content_update', { sessionId: id, contentId: c.id, contentTitle: c.title })}>
                  ▶ Show
                </button>
              </div>
              {c.content_text && (
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.5 }}>
                  {c.content_text.substring(0, 120)}...
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LiveSessionManager;
