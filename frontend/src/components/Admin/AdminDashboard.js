import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../../utils/api';

const COLORS = ['#2563EB','#10B981','#F59E0B','#EF4444'];

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/users'),
      api.get('/sessions'),
    ]).then(([uRes, sRes]) => {
      setUsers(uRes.data.data || []);
      setSessions(sRes.data.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const roleCount = ['admin','trainer','learner'].map(role => ({
    name: role, value: users.filter(u => u.role === role).length
  }));

  const sessionStatus = ['upcoming','live','completed','cancelled'].map(s => ({
    name: s, count: sessions.filter(x => x.status === s).length
  }));

  return (
    <div className="page-content">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.6rem', marginBottom: 4 }}>Admin Dashboard</h1>
        <p style={{ color: 'var(--text-muted)' }}>Organization-wide training overview.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-label">Total Users</div><div className="stat-value">{users.length}</div></div>
        <div className="stat-card"><div className="stat-label">Trainers</div><div className="stat-value">{users.filter(u=>u.role==='trainer').length}</div></div>
        <div className="stat-card"><div className="stat-label">Learners</div><div className="stat-value">{users.filter(u=>u.role==='learner').length}</div></div>
        <div className="stat-card"><div className="stat-label">Total Sessions</div><div className="stat-value">{sessions.length}</div></div>
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <h3 style={{ fontSize: '1rem', marginBottom: 16 }}>Sessions by Status</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={sessionStatus}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="var(--primary)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1rem', marginBottom: 16 }}>User Roles</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={roleCount} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {roleCount.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 style={{ fontSize: '1rem' }}>All Users</h3>
        </div>
        {loading ? <div className="loading">Loading...</div> : (
          <table className="table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Status</th></tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td><div style={{display:'flex',alignItems:'center',gap:8}}><div className="avatar">{u.name?.[0]}</div><strong>{u.name}</strong></div></td>
                  <td style={{color:'var(--text-muted)'}}>{u.email}</td>
                  <td><span className={`badge ${u.role==='admin'?'badge-red':u.role==='trainer'?'badge-blue':'badge-green'}`}>{u.role}</span></td>
                  <td>{u.department || '—'}</td>
                  <td><span className={`badge ${u.is_active?'badge-green':'badge-gray'}`}>{u.is_active?'Active':'Inactive'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
