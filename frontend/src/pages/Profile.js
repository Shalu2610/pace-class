import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const Profile = () => {
  const { user, logout } = useAuth();
  const [form, setForm] = useState({ name: '', department: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      setForm({ name: user.name || '', department: user.department || '' });
    }
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await api.put('/auth/profile', form);
      setMessage('Profile updated successfully!');
      // Update local storage
      const stored = JSON.parse(localStorage.getItem('pace_user') || '{}');
      localStorage.setItem('pace_user', JSON.stringify({ ...stored, ...form }));
    } catch (err) {
      setMessage(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-content" style={{ maxWidth: 600, margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.6rem', marginBottom: 4 }}>My Profile</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>Manage your account details</p>

      {/* Avatar */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
        <div style={{
          width: 80, height: 80, borderRadius: 20,
          background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
          color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Syne', sans-serif", fontSize: '2rem', fontWeight: 800,
          boxShadow: '0 8px 24px rgba(37,99,235,0.25)'
        }}>
          {user?.name?.[0]?.toUpperCase()}
        </div>
      </div>

      {/* Info Card */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: '1rem' }}>Account Information</h3>
          <span className={`badge ${user?.role === 'trainer' ? 'badge-green' : user?.role === 'admin' ? 'badge-red' : 'badge-blue'}`}>
            {user?.role}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20, padding: 16, background: 'var(--bg)', borderRadius: 12 }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Email</div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user?.email}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Role</div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', textTransform: 'capitalize' }}>{user?.role}</div>
          </div>
        </div>

        {message && (
          <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-error'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" type="text" value={form.name}
              onChange={e => setForm({...form, name: e.target.value})} required />
          </div>
          <div className="form-group">
            <label className="form-label">Department</label>
            <input className="form-input" type="text" value={form.department}
              placeholder="e.g. Computer Science, HR"
              onChange={e => setForm({...form, department: e.target.value})} />
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button className="btn btn-primary" type="submit" disabled={saving}
              style={{ flex: 1, justifyContent: 'center', padding: '12px' }}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="card" style={{ borderColor: 'var(--danger)', borderTop: '3px solid var(--danger)' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: 8 }}>Session</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>
          Sign out of your current session.
        </p>
        <button className="btn btn-danger" onClick={logout}>Sign Out</button>
      </div>
    </div>
  );
};

export default Profile;
