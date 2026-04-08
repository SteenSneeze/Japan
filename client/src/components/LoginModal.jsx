import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

const overlay = {
  position: 'fixed', inset: 0, background: 'rgba(15,14,42,0.72)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
};
const modal = {
  background: 'var(--paper)', borderRadius: 'var(--radius-lg)',
  padding: '2.5rem', width: '360px', maxWidth: '90vw',
  border: '1px solid var(--border-mid)',
  boxShadow: '0 20px 60px rgba(15,14,42,0.28)'
};
const title = {
  fontFamily: 'var(--font-display)', fontSize: '1.6rem',
  marginBottom: '0.25rem', color: 'var(--ink)'
};
const sub = { fontSize: '0.85rem', color: 'var(--ink-light)', marginBottom: '1.75rem' };
const label = { display: 'block', fontSize: '0.75rem', fontWeight: 500,
  letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-mid)',
  marginBottom: '6px', marginTop: '1rem' };
const btn = {
  width: '100%', padding: '10px', marginTop: '1.5rem',
  background: 'var(--ink)', color: 'var(--paper)',
  border: 'none', borderRadius: 'var(--radius)', fontSize: '0.85rem',
  fontWeight: 500, letterSpacing: '0.06em', cursor: 'pointer',
  fontFamily: 'var(--font-body)', transition: 'background 0.15s'
};
const err = { color: 'var(--red)', fontSize: '0.82rem', marginTop: '0.75rem' };
const closeBtn = {
  position: 'absolute', top: '1rem', right: '1rem', background: 'none',
  border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--ink-light)'
};

export default function LoginModal({ onClose }) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(username, password);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ ...modal, position: 'relative' }}>
        <button style={closeBtn} onClick={onClose}>✕</button>
        <h2 style={title}>Sign in</h2>
        <p style={sub}>Sign in to add places, vote, and plan the trip.</p>
        <form onSubmit={handleSubmit}>
          <label style={label}>Username</label>
          <input value={username} onChange={e => setUsername(e.target.value)} placeholder="e.g. barney" autoFocus />
          <label style={label}>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
          {error && <p style={err}>{error}</p>}
          <button type="submit" style={btn} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
