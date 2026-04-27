import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import './index.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Shared/Sidebar';
import NotificationBell from './components/Shared/NotificationBell';
import Leaderboard from './components/Learner/Leaderboard';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';

// Trainer
import TrainerDashboard from './components/Trainer/TrainerDashboard';
import CreateSession from './components/Trainer/CreateSession';
import PremiumLiveSession from './components/Trainer/PremiumLiveSession';

// Learner
import LearnerDashboard from './components/Learner/LearnerDashboard';
import LearnerSession from './components/Learner/LearnerSession';

// Admin
import AdminDashboard from './components/Admin/AdminDashboard';

// Search Component
const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const nav = useNavigate();
  const api = require('./utils/api').default;
  const { user } = useAuth();

  const handleSearch = async (val) => {
    setQuery(val);
    if (val.length < 2) { setResults([]); setShowResults(false); return; }
    try {
      const res = await api.get(`/sessions/search?q=${encodeURIComponent(val)}`);
      setResults(res.data.data || []);
      setShowResults(true);
    } catch { setResults([]); }
  };

  return (
    <div className="search-container">
      <div className="search-input-wrap">
        <span className="search-icon">🔍</span>
        <input
          className="search-input"
          type="text"
          placeholder="Search sessions..."
          value={query}
          onChange={e => handleSearch(e.target.value)}
          onFocus={() => query.length >= 2 && setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
        />
      </div>
      {showResults && results.length > 0 && (
        <div className="search-results">
          {results.map(s => (
            <div key={s.id} className="search-result-item"
              onClick={() => { nav(`/${user.role}/session/${s.id}`); setShowResults(false); setQuery(''); }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{s.title}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {s.trainer_name} · {s.status}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Protected Layout
const ProtectedLayout = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading" style={{ height: '100vh' }}>Loading PACE...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to={`/${user.role}/dashboard`} replace />;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.2rem', color: 'var(--text)', letterSpacing: '-0.5px' }}>
              PACE<span style={{color:'var(--secondary)'}}>.</span>
            </div>
            <div className="topbar-divider" />
            <SearchBar />
          </div>
          <div className="topbar-right">
            <div className="status-indicator">
              <div className="live-dot" style={{ width: 6, height: 6 }} />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>SYSTEM LIVE</span>
            </div>
            <div className="topbar-actions">
              <NotificationBell />
              <div className="avatar-small">
                {user?.name?.[0]?.toUpperCase()}
              </div>
            </div>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
};

// Simple session list pages
const SessionList = ({ role }) => {
  const { useEffect, useState } = React;
  const [sessions, setSessions] = useState([]);
  const nav = require('react-router-dom').useNavigate();
  const api = require('./utils/api').default;

  useEffect(() => {
    api.get('/sessions').then(r => setSessions(r.data.data || []));
  }, [api]);

  return (
    <div className="page-content">
      <h1 style={{ marginBottom: 20 }}>Sessions</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: 16 }}>
        {sessions.map(s => (
          <div key={s.id} className="session-card" onClick={() => nav(`/${role}/session/${s.id}`)}>
            <span className={`badge ${s.status==='live'?'badge-red':s.status==='upcoming'?'badge-blue':'badge-green'}`} style={{marginBottom:8}}>
              {s.status==='live'?'🔴 LIVE':s.status}
            </span>
            <h3>{s.title}</h3>
            <p style={{fontSize:'0.8rem',color:'var(--text-muted)',marginTop:6}}>
              {new Date(s.scheduled_at).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

// Explore sessions for learners
const ExploreSessions = () => {
  const [sessions, setSessions] = React.useState([]);
  const api = require('./utils/api').default;
  const nav = require('react-router-dom').useNavigate();

  React.useEffect(() => {
    api.get('/sessions/all').then(r => setSessions(r.data.data || [])).catch(() => {});
  }, [api]);

  return (
    <div className="page-content">
      <h1 style={{ marginBottom: 8 }}>Explore Sessions</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Enroll in available training sessions.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
        {sessions.map(s => (
          <div key={s.id} className="session-card">
            <h3 style={{ marginBottom: 6 }}>{s.title}</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>By {s.trainer_name} · {new Date(s.scheduled_at).toLocaleDateString()}</p>
            <button className="btn btn-primary btn-sm" onClick={() => api.post(`/sessions/${s.id}/enroll`).then(() => nav(`/learner/session/${s.id}`))}>
              Enroll & Join
            </button>
          </div>
        ))}
        {sessions.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No sessions available to explore.</p>}
      </div>
    </div>
  );
};

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Home />} />

        {/* Shared protected */}
        <Route path="/profile" element={<ProtectedLayout><Profile /></ProtectedLayout>} />
        <Route path="/notifications" element={<ProtectedLayout><Notifications /></ProtectedLayout>} />

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<ProtectedLayout allowedRoles={['admin']}><AdminDashboard /></ProtectedLayout>} />
        <Route path="/admin/sessions" element={<ProtectedLayout allowedRoles={['admin']}><SessionList role="admin" /></ProtectedLayout>} />

        {/* Trainer Routes */}
        <Route path="/trainer/dashboard" element={<ProtectedLayout allowedRoles={['trainer']}><TrainerDashboard /></ProtectedLayout>} />
        <Route path="/trainer/sessions" element={<ProtectedLayout allowedRoles={['trainer']}><SessionList role="trainer" /></ProtectedLayout>} />
        <Route path="/trainer/create-session" element={<ProtectedLayout allowedRoles={['trainer']}><CreateSession /></ProtectedLayout>} />
        <Route path="/trainer/session/:id" element={<PremiumLiveSession />} />
        <Route path="/trainer/reports" element={<ProtectedLayout allowedRoles={['trainer']}><div className="page-content"><h1>Reports</h1><p style={{color:'var(--text-muted)'}}>Generate reports from session pages.</p></div></ProtectedLayout>} />

        {/* Learner Routes */}
        <Route path="/learner/dashboard" element={<ProtectedLayout allowedRoles={['learner']}><LearnerDashboard /></ProtectedLayout>} />
        <Route path="/learner/sessions" element={<ProtectedLayout allowedRoles={['learner']}><SessionList role="learner" /></ProtectedLayout>} />
        <Route path="/learner/session/:id" element={<ProtectedLayout allowedRoles={['learner']}><LearnerSession /></ProtectedLayout>} />
        <Route path="/learner/explore" element={<ProtectedLayout allowedRoles={['learner']}><ExploreSessions /></ProtectedLayout>} />
        <Route path="/learner/progress" element={<ProtectedLayout allowedRoles={['learner']}>
          <div className="page-content">
            <h1>My Progress</h1>
            <Leaderboard />
          </div>
        </ProtectedLayout>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);

export default App;
