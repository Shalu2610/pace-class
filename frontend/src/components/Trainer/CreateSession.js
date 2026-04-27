import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const CreateSession = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', description: '', scheduled_at: '', duration_minutes: 60, max_learners: 50
  });
  const [content, setContent] = useState([{ title: '', content_type: 'slide', content_text: '', difficulty: 'basic' }]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [createdSessionId, setCreatedSessionId] = useState(null);

  const addContent = () => setContent([...content, { title: '', content_type: 'slide', content_text: '', difficulty: 'basic' }]);
  const removeContent = (i) => setContent(content.filter((_, idx) => idx !== i));
  const updateContent = (i, field, val) => setContent(content.map((c, idx) => idx === i ? { ...c, [field]: val } : c));

  const addQuiz = () => setQuizzes([...quizzes, {
    title: '', time_limit_seconds: 60,
    questions: [{ question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A', points: 10 }]
  }]);
  const updateQuiz = (qi, field, val) => setQuizzes(quizzes.map((q, i) => i === qi ? { ...q, [field]: val } : q));
  const addQuestion = (qi) => setQuizzes(quizzes.map((q, i) => i === qi ? {
    ...q, questions: [...q.questions, { question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A', points: 10 }]
  } : q));
  const updateQuestion = (qi, qsi, field, val) => setQuizzes(quizzes.map((q, i) => i === qi ? {
    ...q, questions: q.questions.map((qs, j) => j === qsi ? { ...qs, [field]: val } : qs)
  } : q));

  const handleSubmitSession = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await api.post('/sessions', form);
      const sessionId = res.data.data.id;
      setCreatedSessionId(sessionId);

      // Add content
      for (let i = 0; i < content.length; i++) {
        if (content[i].title) {
          await api.post('/sessions/content', { ...content[i], session_id: sessionId, order_index: i });
        }
      }

      // Add quizzes
      for (const quiz of quizzes) {
        if (quiz.title) {
          await api.post('/quizzes', { ...quiz, session_id: sessionId });
        }
      }

      navigate('/trainer/sessions');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-content" style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.6rem', marginBottom: 4 }}>Create New Session</h1>
        <p style={{ color: 'var(--text-muted)' }}>Set up your training session with content and quizzes.</p>
      </div>

      {/* Step Indicator */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
        {['Session Details', 'Content', 'Quizzes'].map((label, i) => (
          <div key={i} style={{ flex: 1 }}>
            <div style={{
              padding: '8px 16px', borderRadius: 8, textAlign: 'center', fontSize: '0.85rem', fontWeight: 600,
              background: step === i + 1 ? 'var(--primary)' : step > i + 1 ? 'var(--secondary)' : 'var(--border)',
              color: step >= i + 1 ? 'white' : 'var(--text-muted)',
              cursor: 'pointer'
            }} onClick={() => setStep(i + 1)}>
              {step > i + 1 ? '✓ ' : `${i + 1}. `}{label}
            </div>
          </div>
        ))}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmitSession}>
        {/* Step 1: Session Details */}
        {step === 1 && (
          <div className="card">
            <h3 style={{ marginBottom: 20 }}>Session Details</h3>
            <div className="form-group">
              <label className="form-label">Session Title *</label>
              <input className="form-input" placeholder="e.g. Advanced Excel for Finance Teams"
                value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-input" rows={3} placeholder="What will learners gain from this session?"
                value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Scheduled Date & Time *</label>
                <input className="form-input" type="datetime-local"
                  value={form.scheduled_at} onChange={e => setForm({...form, scheduled_at: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Duration (minutes)</label>
                <input className="form-input" type="number" min={15} max={480}
                  value={form.duration_minutes} onChange={e => setForm({...form, duration_minutes: e.target.value})} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Max Learners</label>
              <input className="form-input" type="number" min={1} max={500}
                value={form.max_learners} onChange={e => setForm({...form, max_learners: e.target.value})} />
            </div>
            <button type="button" className="btn btn-primary" onClick={() => setStep(2)}>
              Next: Add Content →
            </button>
          </div>
        )}

        {/* Step 2: Content */}
        {step === 2 && (
          <div>
            {content.map((c, i) => (
              <div className="card" key={i} style={{ marginBottom: 16 }}>
                <div className="card-header">
                  <h4>Content {i + 1}</h4>
                  {content.length > 1 && (
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => removeContent(i)}>Remove</button>
                  )}
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Title</label>
                    <input className="form-input" placeholder="Content title"
                      value={c.title} onChange={e => updateContent(i, 'title', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Type</label>
                    <select className="form-input" value={c.content_type} onChange={e => updateContent(i, 'content_type', e.target.value)}>
                      <option value="slide">Slide</option>
                      <option value="video">Video</option>
                      <option value="document">Document</option>
                      <option value="link">Link</option>
                    </select>
                  </div>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Difficulty</label>
                    <select className="form-input" value={c.difficulty} onChange={e => updateContent(i, 'difficulty', e.target.value)}>
                      <option value="basic">Basic</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">URL (optional)</label>
                    <input className="form-input" placeholder="https://..."
                      value={c.content_url || ''} onChange={e => updateContent(i, 'content_url', e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Content Text</label>
                  <textarea className="form-input" rows={4} placeholder="Paste your content or notes here..."
                    value={c.content_text} onChange={e => updateContent(i, 'content_text', e.target.value)} />
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <button type="button" className="btn btn-secondary" onClick={addContent}>+ Add Content</button>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>← Back</button>
              <button type="button" className="btn btn-primary" onClick={() => setStep(3)}>Next: Add Quizzes →</button>
            </div>
          </div>
        )}

        {/* Step 3: Quizzes */}
        {step === 3 && (
          <div>
            {quizzes.map((quiz, qi) => (
              <div className="card" key={qi} style={{ marginBottom: 20 }}>
                <h4 style={{ marginBottom: 16 }}>Quiz {qi + 1}</h4>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Quiz Title</label>
                    <input className="form-input" value={quiz.title} placeholder="e.g. Module 1 Check"
                      onChange={e => updateQuiz(qi, 'title', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Time Limit (seconds)</label>
                    <input className="form-input" type="number" value={quiz.time_limit_seconds}
                      onChange={e => updateQuiz(qi, 'time_limit_seconds', parseInt(e.target.value))} />
                  </div>
                </div>
                {quiz.questions.map((q, qsi) => (
                  <div key={qsi} style={{ background: 'var(--bg)', borderRadius: 8, padding: 16, marginBottom: 12 }}>
                    <div className="form-group">
                      <label className="form-label">Question {qsi + 1}</label>
                      <input className="form-input" placeholder="Enter your question"
                        value={q.question_text} onChange={e => updateQuestion(qi, qsi, 'question_text', e.target.value)} />
                    </div>
                    <div className="grid-2">
                      {['a','b','c','d'].map(opt => (
                        <div className="form-group" key={opt}>
                          <label className="form-label">Option {opt.toUpperCase()}</label>
                          <input className="form-input" placeholder={`Option ${opt.toUpperCase()}`}
                            value={q[`option_${opt}`]} onChange={e => updateQuestion(qi, qsi, `option_${opt}`, e.target.value)} />
                        </div>
                      ))}
                    </div>
                    <div className="grid-2">
                      <div className="form-group">
                        <label className="form-label">Correct Answer</label>
                        <select className="form-input" value={q.correct_option}
                          onChange={e => updateQuestion(qi, qsi, 'correct_option', e.target.value)}>
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                          <option value="D">D</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Points</label>
                        <input className="form-input" type="number" value={q.points}
                          onChange={e => updateQuestion(qi, qsi, 'points', parseInt(e.target.value))} />
                      </div>
                    </div>
                  </div>
                ))}
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => addQuestion(qi)}>+ Add Question</button>
              </div>
            ))}

            <button type="button" className="btn btn-secondary" style={{ marginBottom: 16 }} onClick={addQuiz}>+ Add Quiz</button>

            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setStep(2)}>← Back</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Creating...' : '✅ Create Session'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default CreateSession;
