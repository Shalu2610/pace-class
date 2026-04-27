import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'learner', department: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const user = await register(form);
      navigate(`/${user.role}/dashboard`);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: '2rem', color: 'var(--primary)', marginBottom: 4 }}>PACE<span style={{color:'var(--secondary)'}}>.</span></h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Smart Classroom Platform</p>
        </div>
        <h2 style={{ fontSize: '1.3rem', marginBottom: 24 }}>Create your account</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" type="text" placeholder="John Smith"
              value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-input" type="email" placeholder="you@company.com"
              value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder="Min. 6 characters"
              value={form.password} onChange={e => setForm({...form, password: e.target.value})} required minLength={6} />
          </div>
          <div className="grid-2">
          <div className="form-group">
            <label className="form-label">I am registering as a...</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
              <div 
                className={`role-option ${form.role === 'learner' ? 'active' : ''}`}
                onClick={() => setForm({...form, role: 'learner'})}
                style={{
                  padding: '16px', borderRadius: '12px', border: '2px solid',
                  borderColor: form.role === 'learner' ? 'var(--primary)' : 'var(--border)',
                  background: form.role === 'learner' ? 'var(--primary-light)' : 'transparent',
                  cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s'
                }}
              >
                <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>🎓</div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Learner</div>
              </div>
              <div 
                className={`role-option ${form.role === 'trainer' ? 'active' : ''}`}
                onClick={() => setForm({...form, role: 'trainer'})}
                style={{
                  padding: '16px', borderRadius: '12px', border: '2px solid',
                  borderColor: form.role === 'trainer' ? 'var(--primary)' : 'var(--border)',
                  background: form.role === 'trainer' ? 'var(--primary-light)' : 'transparent',
                  cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s'
                }}
              >
                <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>👨‍🏫</div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Trainer</div>
              </div>
            </div>
          </div>
            <div className="form-group">
              <label className="form-label">Department</label>
              <input className="form-input" type="text" placeholder="e.g. HR, IT"
                value={form.department} onChange={e => setForm({...form, department: e.target.value})} />
            </div>
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: 8 }}>
            {loading ? 'Creating account...' : 'Create Account →'}
          </button>
        </form>
        <p style={{ textAlign:'center', marginTop:20, color:'var(--text-muted)', fontSize:'0.875rem' }}>
          Already have an account? <Link to="/login" style={{color:'var(--primary)', fontWeight:600}}>Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
