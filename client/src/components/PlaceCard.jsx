import { useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

const CATEGORY_LABELS = {
  accommodation: 'Stay',
  food: 'Food',
  attraction: 'See',
  transport: 'Transit',
  other: 'Other'
};

const CATEGORY_COLORS = {
  accommodation: '#185FA5',
  food: '#639922',
  attraction: '#C0392B',
  transport: '#884FAB',
  other: '#888780'
};

const STATUS_LABELS = {
  considering: 'Considering',
  shortlisted: 'Shortlisted',
  booked: 'Booked',
  rejected: 'Rejected'
};

const STATUS_COLORS = {
  considering: '#888780',
  shortlisted: '#BA7517',
  booked: '#3B6D11',
  rejected: '#A32D2D'
};

export default function PlaceCard({ place, onUpdate, onDelete, cities }) {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [comments, setComments] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [score, setScore] = useState(parseInt(place.vote_score) || 0);
  const [myVote, setMyVote] = useState(place.my_vote ? parseInt(place.my_vote) : null);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: place.name, description: place.description || '',
    address: place.address || '', price_range: place.price_range || '',
    url: place.url || '', status: place.status, city_id: place.city_id
  });

  async function handleVote(v) {
    if (!user) return;
    try {
      if (myVote === v) {
        const r = await api.unvote(place.id);
        setScore(r.score); setMyVote(null);
      } else {
        const r = await api.vote(place.id, v);
        setScore(r.score); setMyVote(v);
      }
    } catch {}
  }

  async function toggleComments() {
    if (!expanded) {
      setExpanded(true);
      const data = await api.comments(place.id).catch(() => []);
      setComments(data);
    } else {
      setExpanded(false);
    }
  }

  async function submitComment(e) {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const c = await api.addComment(place.id, newComment);
      setComments(prev => [...(prev || []), c]);
      setNewComment('');
    } catch {}
  }

  async function handleSave() {
    try {
      const updated = await api.updatePlace(place.id, editData);
      onUpdate(updated);
      setEditing(false);
    } catch {}
  }

  async function handleDelete() {
    if (!confirm(`Remove "${place.name}"?`)) return;
    try {
      await api.deletePlace(place.id);
      onDelete(place.id);
    } catch {}
  }

  const catColor = CATEGORY_COLORS[place.category] || '#888';
  const statusColor = STATUS_COLORS[place.status] || '#888';

  return (
    <div style={{
      background: 'white', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', overflow: 'hidden',
      boxShadow: 'var(--shadow-soft)', transition: 'box-shadow 0.2s'
    }}>
      {editing ? (
        <div style={{ padding: '1rem' }}>
          <div style={{ display: 'grid', gap: '8px' }}>
            <input value={editData.name} onChange={e => setEditData(p => ({...p, name: e.target.value}))} placeholder="Name" />
            <textarea rows={2} value={editData.description} onChange={e => setEditData(p => ({...p, description: e.target.value}))} placeholder="Description" style={{ resize: 'vertical' }} />
            <input value={editData.address} onChange={e => setEditData(p => ({...p, address: e.target.value}))} placeholder="Address" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <input value={editData.price_range} onChange={e => setEditData(p => ({...p, price_range: e.target.value}))} placeholder="Price (¥¥¥)" />
              <input value={editData.url} onChange={e => setEditData(p => ({...p, url: e.target.value}))} placeholder="Link" />
            </div>
            <select value={editData.status} onChange={e => setEditData(p => ({...p, status: e.target.value}))}>
              {Object.entries(STATUS_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            {cities && (
              <select value={editData.city_id || ''} onChange={e => setEditData(p => ({...p, city_id: e.target.value}))}>
                <option value="">No city</option>
                {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '1rem' }}>
            <button onClick={handleSave} style={{ padding: '6px 16px', background: 'var(--ink)', color: 'var(--paper)', borderRadius: 'var(--radius)', fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Save</button>
            <button onClick={() => setEditing(false)} style={{ padding: '6px 12px', border: '1px solid var(--border-mid)', borderRadius: 'var(--radius)', fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ padding: '1rem 1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: catColor, background: catColor + '18', padding: '2px 7px', borderRadius: '2px' }}>
                  {CATEGORY_LABELS[place.category]}
                </span>
                <span style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: statusColor, background: statusColor + '18', padding: '2px 7px', borderRadius: '2px' }}>
                  {STATUS_LABELS[place.status]}
                </span>
              </div>
              {user && (
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button onClick={() => setEditing(true)} style={{ fontSize: '12px', color: 'var(--ink-light)', padding: '2px 6px', cursor: 'pointer' }}>Edit</button>
                  <button onClick={handleDelete} style={{ fontSize: '12px', color: 'var(--red)', padding: '2px 6px', cursor: 'pointer' }}>✕</button>
                </div>
              )}
            </div>

            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: '4px', fontWeight: 700 }}>{place.name}</h3>

            {place.description && <p style={{ fontSize: '0.85rem', color: 'var(--ink-light)', lineHeight: 1.5, marginBottom: '8px' }}>{place.description}</p>}

            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.78rem', color: 'var(--ink-light)', flexWrap: 'wrap' }}>
              {place.address && <span>📍 {place.address}</span>}
              {place.price_range && <span style={{ color: 'var(--gold)' }}>{place.price_range}</span>}
              {place.url && <a href={place.url} target="_blank" rel="noreferrer" style={{ color: 'var(--red)', fontSize: '0.78rem' }}>View →</a>}
            </div>

            {place.added_by_name && (
              <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: place.added_by_color || 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: 'white', fontWeight: 500 }}>
                  {place.added_by_name.slice(0,1)}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--ink-light)' }}>added by {place.added_by_name}</span>
              </div>
            )}
          </div>

          <div style={{ borderTop: '1px solid var(--border)', padding: '8px 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--paper)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                onClick={() => handleVote(1)}
                style={{ fontSize: '16px', lineHeight: 1, padding: '2px 4px', cursor: user ? 'pointer' : 'default', opacity: myVote === 1 ? 1 : 0.4, transition: 'opacity 0.15s' }}
                title={user ? 'Vote up' : 'Sign in to vote'}
              >▲</button>
              <span style={{ fontSize: '0.9rem', fontWeight: 500, minWidth: '20px', textAlign: 'center', color: score > 0 ? '#3B6D11' : score < 0 ? 'var(--red)' : 'var(--ink-light)' }}>{score}</span>
              <button
                onClick={() => handleVote(-1)}
                style={{ fontSize: '16px', lineHeight: 1, padding: '2px 4px', cursor: user ? 'pointer' : 'default', opacity: myVote === -1 ? 1 : 0.4, transition: 'opacity 0.15s' }}
                title={user ? 'Vote down' : 'Sign in to vote'}
              >▼</button>
            </div>
            <button onClick={toggleComments} style={{ fontSize: '0.78rem', color: 'var(--ink-light)', cursor: 'pointer', letterSpacing: '0.04em' }}>
              {expanded ? 'Hide comments' : `Comments${place.comment_count > 0 ? ` (${place.comment_count})` : ''}`}
            </button>
          </div>

          {expanded && (
            <div style={{ borderTop: '1px solid var(--border)', padding: '1rem 1.25rem', background: 'var(--paper-warm)' }}>
              {comments === null && <p style={{ fontSize: '0.82rem', color: 'var(--ink-light)' }}>Loading...</p>}
              {comments?.length === 0 && <p style={{ fontSize: '0.82rem', color: 'var(--ink-light)' }}>No comments yet.</p>}
              {comments?.map(c => (
                <div key={c.id} style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: c.avatar_color || 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: 'white', fontWeight: 500 }}>{c.display_name.slice(0,1)}</div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--ink-mid)' }}>{c.display_name}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--ink-light)' }}>{new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', paddingLeft: '24px', color: 'var(--ink)' }}>{c.content}</p>
                </div>
              ))}
              {user && (
                <form onSubmit={submitComment} style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                  <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Add a comment..." style={{ flex: 1 }} />
                  <button type="submit" style={{ padding: '8px 14px', background: 'var(--ink)', color: 'var(--paper)', borderRadius: 'var(--radius)', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>Post</button>
                </form>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
