import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const LearnerSession = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const socketRef = useRef(null);

  const [session, setSession] = useState(null);
  const [currentContent, setCurrentContent] = useState(null);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [chat, setChat] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [question, setQuestion] = useState('');
  const [activePoll, setActivePoll] = useState(null);
  const [pollSelected, setPollSelected] = useState(null);
  const [quizTimer, setQuizTimer] = useState(0);
  const chatEndRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    api.get(`/sessions/${id}`).then(res => {
      setSession(res.data.data);
      if (res.data.data.content?.length) setCurrentContent(res.data.data.content[0]);
    });

    socketRef.current = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5000');
    socketRef.current.emit('join_session', { sessionId: id, userId: user.id, role: 'learner', name: user.name });

    socketRef.current.on('content_changed', ({ contentId, contentTitle }) => {
      setSession(prev => {
        const c = prev?.content?.find(c => c.id === contentId);
        if (c) setCurrentContent(c);
        return prev;
      });
      // Log engagement
      api.post('/engagement/log', { session_id: id, event_type: 'content_view', event_data: { contentId } });
    });

    socketRef.current.on('quiz_started', async ({ quizId }) => {
      const res = await api.get(`/quizzes/${quizId}`);
      setActiveQuiz(res.data.data);
      setQuizAnswers({});
      setQuizSubmitted(false);
      setQuizResult(null);
      setQuizTimer(res.data.data.time_limit_seconds);
    });

    socketRef.current.on('poll_started', (poll) => {
      setActivePoll(poll);
      setPollSelected(null);
    });

    socketRef.current.on('new_chat', (msg) => setChat(prev => [...prev, msg]));

    return () => {
      socketRef.current?.disconnect();
      clearInterval(timerRef.current);
    };
  }, [id, user]);

  // Quiz timer
  useEffect(() => {
    if (activeQuiz && quizTimer > 0 && !quizSubmitted) {
      timerRef.current = setInterval(() => {
        setQuizTimer(t => {
          if (t <= 1) { clearInterval(timerRef.current); handleSubmitQuiz(); return 0; }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [activeQuiz, quizSubmitted]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chat]);

  const handleSubmitQuiz = async () => {
    if (quizSubmitted) return;
    setQuizSubmitted(true);
    clearInterval(timerRef.current);
    const answers = Object.entries(quizAnswers).map(([question_id, selected_option]) => ({
      question_id: parseInt(question_id), selected_option
    }));
    try {
      const res = await api.post(`/quizzes/${activeQuiz.id}/submit`, { answers });
      setQuizResult(res.data.data);
    } catch (err) { console.error(err); }
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    socketRef.current?.emit('chat_message', { sessionId: id, userId: user.id, name: user.name, message: chatInput });
    setChatInput('');
  };

  const askQuestion = () => {
    if (!question.trim()) return;
    socketRef.current?.emit('ask_question', { sessionId: id, userId: user.id, name: user.name, question });
    api.post('/engagement/log', { session_id: id, event_type: 'question_asked' });
    setQuestion('');
    alert('Question submitted to trainer!');
  };

  const submitPoll = (option) => {
    setPollSelected(option);
    socketRef.current?.emit('poll_response', { sessionId: id, pollId: activePoll.pollId, userId: user.id, option });
    api.post('/engagement/log', { session_id: id, event_type: 'poll_answer' });
  };

  return (
    <div className="page-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: '1.4rem' }}>{session?.title}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Trainer: {session?.trainer_name}</p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/learner/sessions')}>← Leave</button>
      </div>

      {/* Active Quiz Overlay */}
      {activeQuiz && !quizSubmitted && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 32, width: '90%', maxWidth: 600, maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.2rem' }}>📝 {activeQuiz.title}</h2>
              <div style={{ background: quizTimer < 10 ? 'var(--danger)' : 'var(--primary)', color: 'white', borderRadius: 8, padding: '4px 14px', fontWeight: 700, fontFamily: 'monospace' }}>
                {quizTimer}s
              </div>
            </div>
            {activeQuiz.questions.map((q, i) => (
              <div key={q.id} style={{ marginBottom: 20 }}>
                <p style={{ fontWeight: 600, marginBottom: 12 }}>Q{i + 1}. {q.question_text}</p>
                {['A','B','C','D'].map(opt => {
                  const val = q[`option_${opt.toLowerCase()}`];
                  if (!val) return null;
                  const selected = quizAnswers[q.id] === opt;
                  return (
                    <div key={opt} onClick={() => setQuizAnswers({...quizAnswers, [q.id]: opt})}
                      style={{ padding: '10px 16px', borderRadius: 8, border: `2px solid ${selected ? 'var(--primary)' : 'var(--border)'}`,
                        background: selected ? 'var(--primary-light)' : 'var(--bg)', cursor: 'pointer', marginBottom: 8, fontSize: '0.9rem' }}>
                      <strong>{opt}.</strong> {val}
                    </div>
                  );
                })}
              </div>
            ))}
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleSubmitQuiz}>
              Submit Answers
            </button>
          </div>
        </div>
      )}

      {/* Quiz Result */}
      {quizSubmitted && quizResult && (
        <div className="alert alert-success" style={{ marginBottom: 16 }}>
          ✅ Quiz submitted! Score: <strong>{quizResult.total_score}/{quizResult.max_score}</strong> ({quizResult.percentage}%)
          <button className="btn btn-secondary btn-sm" style={{ marginLeft: 12 }} onClick={() => setActiveQuiz(null)}>Close</button>
        </div>
      )}

      {/* Active Poll */}
      {activePoll && (
        <div className="card" style={{ marginBottom: 20, border: '2px solid var(--accent)' }}>
          <h3 style={{ marginBottom: 12, color: 'var(--accent)' }}>📊 Live Poll</h3>
          <p style={{ fontWeight: 600, marginBottom: 12 }}>{activePoll.question}</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {activePoll.options?.map((opt, i) => (
              <button key={i} className={`btn ${pollSelected === opt ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => submitPoll(opt)} disabled={!!pollSelected}>
                {opt}
              </button>
            ))}
          </div>
          {pollSelected && <p style={{ marginTop: 10, color: 'var(--secondary)', fontSize: '0.875rem' }}>✅ Response submitted!</p>}
        </div>
      )}

      <div className="grid-2">
        {/* Content Panel */}
        <div className="card">
          <h3 style={{ fontSize: '0.95rem', marginBottom: 16 }}>📖 Current Content</h3>
          {currentContent ? (
            <div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <span className="badge badge-blue">{currentContent.content_type}</span>
                <span className={`badge ${currentContent.difficulty === 'basic' ? 'badge-green' : currentContent.difficulty === 'intermediate' ? 'badge-yellow' : 'badge-red'}`}>
                  {currentContent.difficulty}
                </span>
              </div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: 12 }}>{currentContent.title}</h3>
              {currentContent.content_url && (
                <a href={currentContent.content_url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ marginBottom: 12 }}>
                  🔗 Open Link
                </a>
              )}
              <p style={{ fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--text-muted)' }}>{currentContent.content_text}</p>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>
              Waiting for trainer to start the session...
            </div>
          )}

          {/* Content Navigation */}
          {session?.content?.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 10 }}>ALL TOPICS</h4>
              {session.content.map((c, i) => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                  onClick={() => { setCurrentContent(c); api.post('/engagement/log', { session_id: id, event_type: 'content_view', event_data: { contentId: c.id } }); }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: currentContent?.id === c.id ? 'var(--primary)' : 'var(--border)', color: currentContent?.id === c.id ? 'white' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700 }}>{i+1}</div>
                  <span style={{ fontSize: '0.875rem', color: currentContent?.id === c.id ? 'var(--primary)' : 'var(--text)' }}>{c.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Panel: Chat & Q&A */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Chat */}
          <div className="card" style={{ flex: 1 }}>
            <h3 style={{ fontSize: '0.95rem', marginBottom: 12 }}>💬 Live Chat</h3>
            <div style={{ height: 200, overflowY: 'auto', marginBottom: 12 }}>
              {chat.map((msg, i) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: msg.userId === user.id ? 'var(--primary)' : 'var(--text)' }}>{msg.name}: </span>
                  <span style={{ fontSize: '0.875rem' }}>{msg.message}</span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="form-input" placeholder="Type a message..." value={chatInput}
                onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()}
                style={{ flex: 1 }} />
              <button className="btn btn-primary btn-sm" onClick={sendChat}>Send</button>
            </div>
          </div>

          {/* Ask Question */}
          <div className="card">
            <h3 style={{ fontSize: '0.95rem', marginBottom: 12 }}>❓ Ask Trainer</h3>
            <textarea className="form-input" rows={2} placeholder="Type your question for the trainer..."
              value={question} onChange={e => setQuestion(e.target.value)} style={{ marginBottom: 10 }} />
            <button className="btn btn-secondary" onClick={askQuestion} style={{ width: '100%', justifyContent: 'center' }}>
              Submit Question
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearnerSession;
