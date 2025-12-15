import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext.jsx';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', role: 'user', business_name: '' });
  const [message, setMessage] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async () => {
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const { data } = await axios.post(endpoint, form);
      login(data);
      navigate('/');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Auth failed');
    }
  };

  return (
    <div className="stack narrow">
      <div className="card">
        <div className="section-header">
          <h1>{mode === 'login' ? 'Login' : 'Create account'}</h1>
          <button className="ghost" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? 'Need an account?' : 'Have an account?'}
          </button>
        </div>
        {message && <div className="alert">{message}</div>}
        <div className="stack">
          <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          {mode === 'register' && (
            <>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="user">User</option>
                <option value="business">Business / Host</option>
              </select>
              {form.role === 'business' && (
                <input placeholder="Business name" value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} />
              )}
            </>
          )}
          <button className="btn" onClick={submit}>{mode === 'login' ? 'Login' : 'Register'}</button>
        </div>
      </div>
    </div>
  );
}
