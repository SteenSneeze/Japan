import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

const AVATAR_COLORS = ['#C0392B', '#185FA5', '#3B6D11', '#884FAB', '#BA7517', '#0F6E56', '#993556'];

function SeedDaysForm({ onMessage }) {
  const [start, setStart] = useState('2026-11-20');
  const [end, setEnd]     = useState('2026-12-09');
  const [busy, setBusy]   = useState(false);

  async function handleSeed(e) {
    e.preventDefault();
    setBusy(true);
    onMessage('');
    try {
      const { inserted } = await api.seedDays(start, end);
      onMessage(inserted.length === 0
        ? '✓ All days in that range already exist — nothing new added.'
        : `✓ Added ${inserted.length} day${inserted.length !== 1 ? 's' : ''} (${inserted[0]} → ${inserted[inserted.length - 1]})`
      );
    } catch (err) {
      onMessage(err.message || 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  const inp = { fontFamily: 'var(--font-body)', fontSize: '0.9rem', padding: '7px 12px', border: '1.5px solid var(--border-mid)', borderRadius: 'var(--radius)', background: 'white', color: 'var(--ink)', outline: 'none' };

  return (
    <form onSubmit={handleSeed} style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input type="date" style={inp} value={start} onChange={e => setStart(e.target.value)} required />
        <span style={{ color: 'var(--ink-light)', fontWeight: 300 }}>→</span>
        <input type="date" style={inp} value={end} onChange={e => setEnd(e.target.value)} required />
      </div>
      <button type="submit" disabled={busy} style={{ padding: '8px 20px', background: 'var(--grad-accent)', color: 'white', border: 'none', borderRadius: 'var(--radius)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', boxShadow: '0 2px 10px rgba(232,25,125,0.3)', whiteSpace: 'nowrap' }}>
        {busy ? 'Adding…' : 'Add days'}
      </button>
    </form>
  );
}

const ACTION_LABELS = {
  user_created:     { label: 'User created',      color: '#2e7d32', bg: '#e8f5e9' },
  login:            { label: 'Login',              color: '#1a56db', bg: '#e8f0fe' },
  password_changed: { label: 'Password changed',   color: '#856404', bg: '#fff8e1' },
};

function fmtTime(ts) {
  return new Date(ts).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

export default function AdminPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [form, setForm] = useState({ username: '', password: '', display_name: '', avatar_color: '#C0392B' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [seedMsg, setSeedMsg] = useState('');
  const [clearBusy, setClearBusy] = useState(false);

  useEffect(() => {
    api.users().then(setUsers).catch(() => {});
    if (user?.is_admin) {
      api.auditLog().then(setAuditLog).catch(() => {});
    }
  }, [user]);

  if (!user || !user.is_admin) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--ink-light)', marginBottom: '1rem' }}>You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

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
      api.auditLog().then(setAuditLog).catch(() => {});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const lbl = {
    display: 'block', fontSize: '0.72rem', fontWeight: 500, letterSpacing: '0.08em',
    textTransform: 'uppercase', color: 'var(--ink-mid)', marginBottom: '5px', marginTop: '14px'
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      <div style={{ background: 'var(--grad-hero)', padding: '3rem 2rem 2.5rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: 'var(--grad-accent)' }} />
        <div style={{ position: 'absolute', right: '2rem', top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--font-display)', fontSize: '8rem', color: 'rgba(255,255,255,0.06)', lineHeight: 1, userSelect: 'none' }}>管理</div>
        <h1 style={{ fontFamily: 'var(--font-display)', color: 'white', fontSize: '2.5rem', marginBottom: '0.4rem' }}>Admin</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>Manage user accounts for the trip group.</p>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>
        {/* Create user */}
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: 'var(--shadow-soft)' }}>
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
                  width: '28px', height: '28px', borderRadius: '50%', background: c,
                  border: form.avatar_color === c ? '3px solid var(--ink)' : '2px solid transparent',
                  cursor: 'pointer', transition: 'border 0.1s'
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
                <div key={u.id} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '12px 1rem', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: 'var(--shadow-soft)' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: u.avatar_color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 500, fontSize: '13px', color: 'white', flexShrink: 0 }}>
                    {u.display_name.slice(0,2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '0.9rem', color: 'var(--ink)' }}>{u.display_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--ink-light)' }}>@{u.username}</div>
                  </div>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', alignItems: 'center' }}>
                    {u.is_admin && <span style={{ fontSize: '0.7rem', color: '#856404', background: '#fff8e1', padding: '2px 8px', borderRadius: '2px', fontWeight: 600 }}>Admin</span>}
                    {user && u.id === user.id && <span style={{ fontSize: '0.7rem', color: 'var(--red)', background: 'var(--red-pale)', padding: '2px 8px', borderRadius: '2px', fontWeight: 500 }}>You</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Seed days */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 2rem 2rem' }}>
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: 'var(--shadow-soft)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', marginBottom: '0.25rem' }}>Bulk add days</h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--ink-light)', marginBottom: '1rem' }}>Insert every day in a date range into the trip itinerary. Skips dates that already exist.</p>
          <SeedDaysForm onMessage={setSeedMsg} />
          {seedMsg && <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: seedMsg.startsWith('✓') ? '#2e7d32' : 'var(--red)' }}>{seedMsg}</p>}
          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '1.25rem 0' }} />
          <p style={{ fontSize: '0.82rem', color: 'var(--ink-light)', marginBottom: '0.75rem' }}>Danger zone — removes all trip days and their itinerary items.</p>
          <button
            disabled={clearBusy}
            onClick={async () => {
              if (!window.confirm('Delete ALL trip days and itinerary items? This cannot be undone.')) return;
              setClearBusy(true);
              setSeedMsg('');
              try {
                const { deleted } = await api.clearAllDays();
                setSeedMsg(`✓ Deleted ${deleted} day${deleted !== 1 ? 's' : ''}.`);
              } catch (err) {
                setSeedMsg(err.message || 'Failed to delete days');
              } finally {
                setClearBusy(false);
              }
            }}
            style={{ padding: '8px 20px', background: 'var(--red)', color: 'white', border: 'none', borderRadius: 'var(--radius)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
          >
            {clearBusy ? 'Deleting…' : 'Clear all days'}
          </button>
        </div>
      </div>

      {/* Audit log */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 2rem 3rem' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', marginBottom: '1rem' }}>Audit Log</h2>
        {auditLog.length === 0 ? (
          <p style={{ color: 'var(--ink-light)', fontSize: '0.85rem' }}>No activity recorded yet.</p>
        ) : (
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-soft)', overflow: 'hidden' }}>
            {auditLog.map((entry, i) => {
              const meta = ACTION_LABELS[entry.action] || { label: entry.action, color: 'var(--ink-light)', bg: 'var(--paper-warm)' };
              return (
                <div key={entry.id} style={{
                  display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 1rem',
                  borderBottom: i < auditLog.length - 1 ? '1px solid var(--border)' : 'none'
                }}>
                  {entry.user_color ? (
                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: entry.user_color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 600, color: 'white', flexShrink: 0, marginTop: '1px' }}>
                      {(entry.user_name || '?').slice(0,2).toUpperCase()}
                    </div>
                  ) : (
                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--paper-dark)', flexShrink: 0, marginTop: '1px' }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--ink)' }}>
                        {entry.user_name || 'Unknown'}
                      </span>
                      <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '1px 7px', borderRadius: '2px', background: meta.bg, color: meta.color, letterSpacing: '0.04em' }}>
                        {meta.label}
                      </span>
                    </div>
                    {entry.details && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--ink-light)', marginTop: '2px' }}>{entry.details}</div>
                    )}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--ink-light)', flexShrink: 0, whiteSpace: 'nowrap' }}>
                    {fmtTime(entry.created_at)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
