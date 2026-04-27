import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navConfig = {
  admin: [
    { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/admin/users', label: 'Users', icon: '👥' },
    { path: '/admin/sessions', label: 'Sessions', icon: '📅' },
    { path: '/admin/reports', label: 'Reports', icon: '📈' },
  ],
  trainer: [
    { path: '/trainer/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/trainer/sessions', label: 'My Sessions', icon: '📅' },
    { path: '/trainer/create-session', label: 'New Session', icon: '➕' },
    { path: '/trainer/reports', label: 'Reports', icon: '📈' },
  ],
  learner: [
    { path: '/learner/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/learner/sessions', label: 'My Sessions', icon: '📅' },
    { path: '/learner/explore', label: 'Explore', icon: '🔍' },
    { path: '/learner/progress', label: 'My Progress', icon: '📈' },
  ],
};

// Common items for all roles
const commonItems = [
  { path: '/notifications', label: 'Notifications', icon: '🔔' },
  { path: '/profile', label: 'Profile', icon: '👤' },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const items = navConfig[user?.role] || [];

  return (
    <>
      {/* Mobile overlay */}
      <div className={`sidebar-overlay ${collapsed ? '' : 'hidden'}`} onClick={() => setCollapsed(false)} />

      <div className={`sidebar ${collapsed ? 'sidebar-mobile-open' : ''}`}>
        <div className="sidebar-logo">
          <h2>PACE<span style={{color:'var(--secondary)'}}>.</span></h2>
          <span>Smart Classroom</span>
        </div>

        <nav className="sidebar-nav">
          <div style={{ fontSize: '0.7rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '8px 16px', fontWeight: 600 }}>
            Main Menu
          </div>
          {items.map(item => (
            <div
              key={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => { navigate(item.path); setCollapsed(false); }}
            >
              <span className="icon">{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}

          <div style={{ height: 1, background: 'var(--border)', margin: '12px 16px' }} />
          <div style={{ fontSize: '0.7rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '8px 16px', fontWeight: 600 }}>
            Account
          </div>
          {commonItems.map(item => (
            <div
              key={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => { navigate(item.path); setCollapsed(false); }}
            >
              <span className="icon">{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="nav-item" style={{marginBottom:8}}>
            <div className="avatar">{user?.name?.[0]?.toUpperCase()}</div>
            <div>
              <div style={{fontSize:'0.85rem', fontWeight:600}}>{user?.name}</div>
              <div style={{fontSize:'0.75rem', color:'var(--text-muted)', textTransform:'capitalize'}}>{user?.role}</div>
            </div>
          </div>
          <div className="nav-item" onClick={logout} style={{color:'var(--danger)'}}>
            <span className="icon">🚪</span>
            <span>Logout</span>
          </div>
        </div>
      </div>

      {/* Mobile hamburger button */}
      <button className="mobile-menu-btn" onClick={() => setCollapsed(!collapsed)}>
        ☰
      </button>
    </>
  );
};

export default Sidebar;
