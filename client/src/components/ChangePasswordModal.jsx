import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

const overlay = {
  position: 'fixed', inset: 0, background: 'rgba(26,18,8,0.85)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
};
const modal = {
  background: 'var(--paper)', borderRadius: 'var(--radius-lg)',
  padding: '2.5rem', width: '360px', maxWidth: '90vw',
  border: '1px solid var(--border-mid)',
  boxShadow: '0 20px 60px rgba(26,18,8,0.3)'
};
const lbl = {
  display: 'block', fontSize: '0.75rem', fontWeight: 500,
  letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-mid)',
  marginBottom: '6px', marginTop: '1rem'
};
const btn = {
  width: '100%', padding: '10px', marginTop: '1.5rem',
  background: 'var(--ink)', color: 'var(--paper)',
  border: 'none', borderRadius: 'var(--radius)', fontSize: '0.85rem',
  fontWeight: 500, letterSpacing: '0.06em', cursor: 'pointer',
  fontFamily: 'var(--font-body)'
};

export default function ChangePasswordModal() {
  const { changePassword } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (next !== confirm) { setError('Passwords do not match'); return; }
    if (next.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await changePassword(current, next);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={overlay}>
      <div style={modal}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', marginBottom: '0.25rem', color: 'var(--ink)' }}>
          Change your password
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--ink-light)', marginBottom: '0.5rem' }}>
          You need to set a new password before continuing.
        </p>
        <form onSubmit={handleSubmit}>
          <label style={lbl}>Current password</label>
          <input type="password" value={current} onChange={e => setCurrent(e.target.value)} placeholder="••••••••" autoFocus />
          <label style={lbl}>New password</label>
          <input type="password" value={next} onChange={e => setNext(e.target.value)} placeholder="••••••••" />
          <label style={lbl}>Confirm new password</label>
          <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" />
          {error && <p style={{ color: 'var(--red)', fontSize: '0.82rem', marginTop: '0.75rem' }}>{error}</p>}
          <button type="submit" style={btn} disabled={loading}>
            {loading ? 'Saving...' : 'Set new password'}
          </button>
        </form>
      </div>
    </div>
  );
}
