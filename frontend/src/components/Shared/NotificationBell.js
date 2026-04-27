import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import './NotificationBell.css';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/notifications')
      .then(res => setNotifications((res.data.data || []).slice(0, 5)))
      .catch(() => {});
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch {}
  };

  return (
    <div className="notification-bell-container">
      <div className="bell-icon" onClick={() => setShowDropdown(!showDropdown)}>
        <span role="img" aria-label="bell">🔔</span>
        {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
      </div>
      
      {showDropdown && (
        <div className="notification-dropdown">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>Notifications</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}
              onClick={() => { setShowDropdown(false); navigate('/notifications'); }}>
              View All →
            </span>
          </div>
          {notifications.length === 0 ? (
            <p className="no-notifications">No new notifications</p>
          ) : (
            <ul>
              {notifications.map(n => (
                <li key={n.id} className={n.is_read ? 'read' : 'unread'} onClick={() => !n.is_read && markRead(n.id)}>
                  <strong>{n.title}</strong>
                  <p>{n.message}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
