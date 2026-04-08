import { useState } from 'react';
import { api } from '../lib/api';

const overlay = { position: 'fixed', inset: 0, background: 'rgba(15,14,42,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modal = { background: 'var(--paper)', borderRadius: 'var(--radius-lg)', padding: '2rem', width: '480px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--border-mid)', boxShadow: '0 20px 60px rgba(15,14,42,0.28)', position: 'relative' };
const lbl = { display: 'block', fontSize: '0.72rem', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-mid)', marginBottom: '5px', marginTop: '14px' };

const CATEGORIES = [
  { value: 'accommodation', label: 'Accommodation' },
  { value: 'food', label: 'Food & Drink' },
  { value: 'attraction', label: 'Attraction' },
  { value: 'transport', label: 'Transport' },
  { value: 'other', label: 'Other' }
];

export default function AddPlaceModal({ onClose, onAdd, cities, defaultCity }) {
  const [data, setData] = useState({
    name: '', category: 'attraction', description: '', address: '',
    price_range: '', url: '', city_id: defaultCity || (cities[0]?.id ?? '')
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setData(p => ({ ...p, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!data.name.trim()) { setError('Name is required'); return; }
    setLoading(true);
    try {
      const place = await api.createPlace(data);
      onAdd(place);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={modal}>
        <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--ink-light)' }}>✕</button>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '0.25rem' }}>Add a place</h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--ink-light)', marginBottom: '0.5rem' }}>Suggest somewhere for the group to vote on.</p>
        <form onSubmit={handleSubmit}>
          <label style={lbl}>Category</label>
          <select value={data.category} onChange={e => set('category', e.target.value)}>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>

          <label style={lbl}>City</label>
          <select value={data.city_id} onChange={e => set('city_id', e.target.value)}>
            <option value="">No specific city</option>
            {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <label style={lbl}>Name *</label>
          <input value={data.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Dotonbori Ramen" autoFocus />

          <label style={lbl}>Description</label>
          <textarea rows={2} value={data.description} onChange={e => set('description', e.target.value)} placeholder="Why should we go here?" style={{ resize: 'vertical' }} />

          <label style={lbl}>Address</label>
          <input value={data.address} onChange={e => set('address', e.target.value)} placeholder="Street, area or district" />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={lbl}>Price</label>
              <input value={data.price_range} onChange={e => set('price_range', e.target.value)} placeholder="¥ / ¥¥ / ¥¥¥" />
            </div>
            <div>
              <label style={lbl}>Link</label>
              <input value={data.url} onChange={e => set('url', e.target.value)} placeholder="https://..." />
            </div>
          </div>

          {error && <p style={{ color: 'var(--red)', fontSize: '0.82rem', marginTop: '10px' }}>{error}</p>}

          <button type="submit" disabled={loading} style={{ marginTop: '1.5rem', width: '100%', padding: '10px', background: 'var(--ink)', color: 'var(--paper)', border: 'none', borderRadius: 'var(--radius)', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)', letterSpacing: '0.04em' }}>
            {loading ? 'Adding...' : 'Add place'}
          </button>
        </form>
      </div>
    </div>
  );
}
