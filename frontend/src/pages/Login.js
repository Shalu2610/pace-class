import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(`/${user.role}/dashboard`);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
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

        <h2 style={{ fontSize: '1.3rem', marginBottom: 24 }}>Sign in to your account</h2>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-input" type="email" placeholder="you@company.com"
              value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder="••••••••"
              value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: 8 }}>
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>
        </form>

        <p style={{ textAlign:'center', marginTop:20, color:'var(--text-muted)', fontSize:'0.875rem' }}>
          Don't have an account? <Link to="/register" style={{color:'var(--primary)', fontWeight:600}}>Register</Link>
        </p>

        <div style={{marginTop:24, padding:16, background:'var(--bg)', borderRadius:8, fontSize:'0.8rem', color:'var(--text-muted)'}}>
          <strong>Demo Accounts:</strong><br/>
          admin@pace.com / admin123<br/>
          trainer@pace.com / trainer123<br/>
          learner@pace.com / learner123
        </div>
      </div>
    </div>
  );
};

export default Login;
