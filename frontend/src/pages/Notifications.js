import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const typeIcon = { session_reminder: '📅', quiz_result: '📝', report_ready: '📊', general: '🔔' };
const typeColor = { session_reminder: 'badge-blue', quiz_result: 'badge-green', report_ready: 'badge-yellow', general: 'badge-gray' };

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/notifications')
      .then(res => setNotifications(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const markRead = async (id) => {
    await api.put(`/notifications/${id}/read`);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
  };

  const markAllRead = async () => {
    await api.put('/notifications/read-all');
    setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="page-content" style={{ maxWidth: 700, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', marginBottom: 4 }}>Notifications</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-secondary btn-sm" onClick={markAllRead}>
            Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>🔔</div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: 8 }}>No notifications yet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            You'll receive updates about sessions, quizzes, and announcements here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notifications.map(n => (
            <div key={n.id} className="card" style={{
              padding: '16px 20px',
              borderLeft: `4px solid ${n.is_read ? 'var(--border)' : 'var(--primary)'}`,
              opacity: n.is_read ? 0.7 : 1,
              transition: 'all 0.2s',
              cursor: n.is_read ? 'default' : 'pointer'
            }} onClick={() => !n.is_read && markRead(n.id)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1.3rem' }}>{typeIcon[n.type] || '🔔'}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 4 }}>{n.title}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{n.message}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: 8 }}>
                      {new Date(n.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                  <span className={`badge ${typeColor[n.type] || 'badge-gray'}`}>{n.type?.replace('_', ' ')}</span>
                  {!n.is_read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)' }} />}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
