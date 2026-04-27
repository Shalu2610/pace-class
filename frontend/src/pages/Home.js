import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

/* ── Animated Counter Hook ─────────────────────── */
const useCounter = (end, duration = 2000, startOnView = true) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    if (!startOnView) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          let start = 0;
          const step = Math.ceil(end / (duration / 16));
          const timer = setInterval(() => {
            start += step;
            if (start >= end) { setCount(end); clearInterval(timer); }
            else setCount(start);
          }, 16);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration, startOnView]);

  return [count, ref];
};

/* ── Stat Counter Component ────────────────────── */
const StatCounter = ({ value, label, suffix = '+' }) => {
  const [count, ref] = useCounter(value);
  return (
    <div className="hero-stat" ref={ref}>
      <span className="hero-stat-value">{count}{suffix}</span>
      <span className="hero-stat-label">{label}</span>
    </div>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleCTA = () => {
    if (user) navigate(`/${user.role}/dashboard`);
    else navigate('/register');
  };

  return (
    <div className="home-container">
      {/* ── Navigation ── */}
      <nav className="home-nav">
        <div className="logo">
          PACE<span className="dot">.</span>
        </div>
        <div className="nav-links">
          <a href="#features" className="nav-link">Features</a>
          <a href="#how-it-works" className="nav-link">How it Works</a>
          <a href="#benefits" className="nav-link">Benefits</a>
          <a href="#testimonials" className="nav-link">Testimonials</a>
        </div>
        <div className="nav-actions">
          <button className="btn btn-ghost" onClick={() => navigate('/login')}>Login</button>
          <button className="btn btn-primary" onClick={() => navigate('/register')}>Register</button>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <header className="hero">
        <div className="hero-bg-mesh" />
        <div className="hero-content">
          <div className="hero-badge">🚀 The Future of Smart Education</div>
          <h1>PACE in the <span className="gradient-text">Classroom</span></h1>
          <p className="hero-subtitle">
            An interactive platform connecting learners and trainers with real-time engagement, 
            adaptive content, and predictive analytics — all in one place.
          </p>
          <div className="hero-btns">
            <button className="btn btn-primary btn-lg btn-glow" onClick={handleCTA}>
              {user ? 'Go to Dashboard' : 'Start Learning Free'} →
            </button>
            <button className="btn btn-outline btn-lg" onClick={() => { const el = document.getElementById('features'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }}>
              Explore Features ↓
            </button>
          </div>
          <div className="hero-stats-row">
            <StatCounter value={500} label="Active Learners" />
            <div className="hero-stat-divider" />
            <StatCounter value={120} label="Training Sessions" />
            <div className="hero-stat-divider" />
            <StatCounter value={98} label="Satisfaction Rate" suffix="%" />
          </div>
        </div>
        <div className="hero-visual">
          <div className="visual-card">
            <div className="visual-header">
              <span className="wdot red"></span>
              <span className="wdot yellow"></span>
              <span className="wdot green"></span>
              <span className="visual-title">Live Session Dashboard</span>
            </div>
            <div className="visual-body">
              <div className="visual-metric">
                <span className="vm-label">Engagement Score</span>
                <div className="vm-bar"><div className="vm-fill" style={{ width: '84%' }}></div></div>
                <span className="vm-value">84%</span>
              </div>
              <div className="visual-metric">
                <span className="vm-label">Attention Level</span>
                <div className="vm-bar"><div className="vm-fill accent" style={{ width: '91%' }}></div></div>
                <span className="vm-value">91%</span>
              </div>
              <div className="visual-metric">
                <span className="vm-label">Quiz Accuracy</span>
                <div className="vm-bar"><div className="vm-fill success" style={{ width: '76%' }}></div></div>
                <span className="vm-value">76%</span>
              </div>
              <div className="visual-participants">
                <div className="vp-avatars">
                  {['A','B','C','D','E'].map((l, i) => (
                    <div key={l} className="vp-avatar" style={{ zIndex: 5 - i, marginLeft: i > 0 ? -10 : 0 }}>{l}</div>
                  ))}
                </div>
                <span className="vp-text">+42 learners online</span>
              </div>
            </div>
          </div>
          <div className="floating-card fc-1">
            <span className="fc-icon">📊</span>
            <span>Real-time Analytics</span>
          </div>
          <div className="floating-card fc-2">
            <span className="fc-icon">🎯</span>
            <span>Adaptive Learning</span>
          </div>
        </div>
      </header>

      {/* ── Features Section ── */}
      <section className="features-section" id="features">
        <div className="section-header">
          <span className="section-badge">Features</span>
          <h2>Everything You Need to <span className="gradient-text">Teach & Learn</span></h2>
          <p>Powerful tools designed for modern education experiences</p>
        </div>
        <div className="features-grid">
          {[
            { icon: '🎥', title: 'Live Sessions', desc: 'Real-time interactive sessions with instant content sync, polls, and Q&A' },
            { icon: '📝', title: 'Smart Quizzes', desc: 'Auto-graded quizzes with detailed analytics and performance tracking' },
            { icon: '📊', title: 'Progress Tracking', desc: 'Visual dashboards with radar charts and engagement scores' },
            { icon: '🔔', title: 'Notifications', desc: 'Stay updated with session reminders, quiz results, and announcements' },
            { icon: '📚', title: 'Resource Library', desc: 'Centralized access to slides, videos, documents, and links' },
            { icon: '🏆', title: 'Leaderboards', desc: 'Gamified learning with points, rankings, and achievement badges' },
          ].map((f, i) => (
            <div className="feature-card" key={i} style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it Works ── */}
      <section className="how-section" id="how-it-works">
        <div className="section-header">
          <span className="section-badge">How it Works</span>
          <h2>Get Started in <span className="gradient-text">3 Simple Steps</span></h2>
        </div>
        <div className="steps-container">
          {[
            { num: '01', title: 'Create Account', desc: 'Register as a Learner or Trainer in seconds', icon: '👤' },
            { num: '02', title: 'Join or Create Sessions', desc: 'Trainers create sessions, Learners explore and enroll', icon: '🚀' },
            { num: '03', title: 'Learn & Grow', desc: 'Engage in live sessions, take quizzes, track your progress', icon: '📈' },
          ].map((s, i) => (
            <React.Fragment key={i}>
              <div className="step-card">
                <div className="step-num">{s.num}</div>
                <div className="step-icon">{s.icon}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
              {i < 2 && <div className="step-connector"><div className="step-arrow">→</div></div>}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* ── Benefits Section ── */}
      <section className="benefits" id="benefits">
        <div className="benefit-group">
          <div className="benefit-header">
            <div className="benefit-icon-wrap learner">🎓</div>
            <div>
              <h2>For Learners</h2>
              <p className="benefit-subtitle">Personalized learning experiences powered by data</p>
            </div>
          </div>
          <div className="benefit-grid">
            {[
              { title: 'Real-time Interaction', desc: 'Join live sessions with instant content updates, polls, and Q&A.', icon: '💬' },
              { title: 'Progress Tracking', desc: 'Visualize your learning journey with intuitive charts and scores.', icon: '📈' },
              { title: 'Resource Library', desc: 'Access all study materials, videos, and documents in one place.', icon: '📚' },
            ].map((b, i) => (
              <div className="benefit-card" key={i}>
                <div className="bc-icon">{b.icon}</div>
                <h3>{b.title}</h3>
                <p>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="benefit-group">
          <div className="benefit-header">
            <div className="benefit-icon-wrap trainer">👨‍🏫</div>
            <div>
              <h2>For Trainers</h2>
              <p className="benefit-subtitle">Comprehensive tools to manage and monitor your classroom</p>
            </div>
          </div>
          <div className="benefit-grid">
            {[
              { title: 'Advanced Monitoring', desc: 'Monitor student performance and engagement in real-time.', icon: '👁️' },
              { title: 'Adaptive Content', desc: 'Use our adaptive engine to adjust content based on class speed.', icon: '🧠' },
              { title: 'Automated Grading', desc: 'Launch quizzes and get instant results and analytics.', icon: '✅' },
            ].map((b, i) => (
              <div className="benefit-card" key={i}>
                <div className="bc-icon">{b.icon}</div>
                <h3>{b.title}</h3>
                <p>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="testimonials-section" id="testimonials">
        <div className="section-header">
          <span className="section-badge">Testimonials</span>
          <h2>Loved by <span className="gradient-text">Educators & Students</span></h2>
        </div>
        <div className="testimonials-grid">
          {[
            { name: 'Dr. Sarah Mitchell', role: 'Trainer, CS Department', quote: 'PACE transformed how I deliver lectures. The real-time engagement metrics help me adjust my teaching pace instantly.', avatar: 'S' },
            { name: 'Alex Chen', role: 'Learner, Data Science', quote: 'The interactive quizzes and progress tracking keep me motivated. I can see exactly where I need to improve.', avatar: 'A' },
            { name: 'Prof. James Wilson', role: 'Trainer, Mathematics', quote: 'The automated grading saves me hours every week. The analytics help me identify struggling students early.', avatar: 'J' },
          ].map((t, i) => (
            <div className="testimonial-card" key={i}>
              <div className="tc-quote">"</div>
              <p className="tc-text">{t.quote}</p>
              <div className="tc-author">
                <div className="tc-avatar">{t.avatar}</div>
                <div>
                  <div className="tc-name">{t.name}</div>
                  <div className="tc-role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Transform Your <span className="gradient-text">Classroom?</span></h2>
          <p>Join thousands of educators and learners already using PACE to enhance their teaching and learning experience.</p>
          <div className="hero-btns" style={{ justifyContent: 'center' }}>
            <button className="btn btn-primary btn-lg btn-glow" onClick={() => navigate('/register')}>
              Get Started Free →
            </button>
            <button className="btn btn-outline btn-lg" onClick={() => navigate('/login')}>
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-main">
            <div className="footer-brand">
              <div className="footer-logo">PACE<span>.</span></div>
              <p className="footer-desc">Connecting learners and trainers through intelligent, interactive classroom experiences.</p>
            </div>
            <div className="footer-links-group">
              <div className="footer-col">
                <h4>Platform</h4>
                <a href="#features">Features</a>
                <a href="#how-it-works">How it Works</a>
                <a href="#benefits">Benefits</a>
              </div>
              <div className="footer-col">
                <h4>Roles</h4>
                <a href="#benefits">For Learners</a>
                <a href="#benefits">For Trainers</a>
              </div>
              <div className="footer-col">
                <h4>Account</h4>
                <span className="footer-link" onClick={() => navigate('/login')}>Login</span>
                <span className="footer-link" onClick={() => navigate('/register')}>Register</span>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2026 PACE Classroom Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
