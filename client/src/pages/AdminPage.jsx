import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

const AVATAR_COLORS = ['#C0392B', '#185FA5', '#3B6D11', '#884FAB', '#BA7517', '#0F6E56', '#993556'];

export default function AdminPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ username: '', password: '', display_name: '', avatar_color: '#C0392B' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.users().then(setUsers).catch(() => {});
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.username || !form.password || !form.display_name) {
      setError('All fields required'); return;
    }
    setLoading(true);
    try {
      const newUser = await api.register(form);
      setUsers(prev => [...prev, newUser]);
      setForm({ username: '', password: '', display_name: '', avatar_color: '#C0392B' });
      setSuccess(`Created account for ${newUser.display_name}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const lbl = { display: 'block', fontSize: '0.72rem', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-mid)', marginBottom: '5px', marginTop: '14px' };

  return (
    <div style={{ minHeight: '100vh' }}>
      <div style={{ background: 'var(--ink)', padding: '3rem 2rem 2.5rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--paper)', fontSize: '2.5rem' }}>Admin</h1>
        <p style={{ color: 'var(--paper-dark)', fontSize: '0.9rem' }}>Manage user accounts for the trip group.</p>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>
        {/* Create user */}
        <div style={{ background: 'var(--paper-warm)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: 'var(--shadow-soft)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', marginBottom: '0.25rem' }}>Create account</h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--ink-light)', marginBottom: '0.5rem' }}>Add a friend to the trip group.</p>
          <form onSubmit={handleCreate}>
            <label style={lbl}>Display name</label>
            <input value={form.display_name} onChange={e => setForm(p => ({...p, display_name: e.target.value}))} placeholder="Barney" />
            <label style={lbl}>Username</label>
            <input value={form.username} onChange={e => setForm(p => ({...p, username: e.target.value}))} placeholder="barney" />
            <label style={lbl}>Password</label>
            <input type="password" value={form.password} onChange={e => setForm(p => ({...p, password: e.target.value}))} placeholder="Choose a password" />
            <label style={lbl}>Avatar colour</label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
              {AVATAR_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setForm(p => ({...p, avatar_color: c}))} style={{
                  width: '28px', height: '28px', borderRadius: '50%', background: c, border: form.avatar_color === c ? '3px solid var(--ink)' : '2px solid transparent', cursor: 'pointer', transition: 'border 0.1s'
                }} />
              ))}
            </div>
            {error && <p style={{ color: 'var(--red)', fontSize: '0.82rem', marginTop: '10px' }}>{error}</p>}
            {success && <p style={{ color: '#3B6D11', fontSize: '0.82rem', marginTop: '10px' }}>{success}</p>}
            <button type="submit" disabled={loading} style={{ marginTop: '1.25rem', width: '100%', padding: '10px', background: 'var(--ink)', color: 'var(--paper)', border: 'none', borderRadius: 'var(--radius)', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
              {loading ? 'Creating...' : 'Create account'}
            </button>
          </form>
        </div>

        {/* User list */}
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', marginBottom: '1rem' }}>Accounts ({users.length})</h2>
          {users.length === 0 ? (
            <p style={{ color: 'var(--ink-light)', fontSize: '0.85rem' }}>No accounts yet.</p>
          ) : (
            <div style={{ display: 'grid', gap: '8px' }}>
              {users.map(u => (
                <div key={u.id} style={{ background: 'var(--paper-warm)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '12px 1rem', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: 'var(--shadow-soft)' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: u.avatar_color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 500, fontSize: '13px', color: 'white', flexShrink: 0 }}>
                    {u.display_name.slice(0,2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '0.9rem', color: 'var(--ink)' }}>{u.display_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--ink-light)' }}>@{u.username}</div>
                  </div>
                  {user && u.id === user.id && <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--red)', background: 'var(--red-pale)', padding: '2px 8px', borderRadius: '2px', fontWeight: 500 }}>You</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
