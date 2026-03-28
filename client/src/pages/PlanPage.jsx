import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import PlaceCard from '../components/PlaceCard';
import AddPlaceModal from '../components/AddPlaceModal';

const CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'accommodation', label: 'Stays' },
  { value: 'food', label: 'Food' },
  { value: 'attraction', label: 'Attractions' },
  { value: 'transport', label: 'Transport' },
  { value: 'other', label: 'Other' }
];

const STATUSES = [
  { value: '', label: 'All statuses' },
  { value: 'considering', label: 'Considering' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'booked', label: 'Booked' },
  { value: 'rejected', label: 'Rejected' }
];

export default function PlanPage() {
  const { user } = useAuth();
  const [cities, setCities] = useState([]);
  const [places, setPlaces] = useState([]);
  const [activeCity, setActiveCity] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [activeStatus, setActiveStatus] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.cities().then(setCities).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (activeCity) params.city_id = activeCity;
    if (activeCategory) params.category = activeCategory;
    if (activeStatus) params.status = activeStatus;
    api.places(params)
      .then(setPlaces)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeCity, activeCategory, activeStatus]);

  function handleAdd(place) {
    setPlaces(prev => [{ ...place, vote_score: 0, vote_count: 0, my_vote: null }, ...prev]);
  }

  function handleUpdate(updated) {
    setPlaces(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p));
  }

  function handleDelete(id) {
    setPlaces(prev => prev.filter(p => p.id !== id));
  }

  const cityName = cities.find(c => String(c.id) === String(activeCity))?.name;

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: 'var(--ink)', padding: '3rem 2rem 2.5rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: '2rem', top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--font-display)', fontSize: '8rem', color: 'rgba(255,255,255,0.04)', lineHeight: 1, userSelect: 'none' }}>計画</div>
        <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--paper)', fontSize: '2.5rem', marginBottom: '0.5rem' }}>
          Planning
        </h1>
        <p style={{ color: 'var(--paper-dark)', fontSize: '0.9rem', maxWidth: '500px' }}>
          Add places, vote on options, and shortlist the best spots before locking in the itinerary.
        </p>
      </div>

      {/* City tabs */}
      <div style={{ background: 'var(--paper-warm)', borderBottom: '1px solid var(--border)', padding: '0 2rem', display: 'flex', gap: '0', overflowX: 'auto' }}>
        {[{ id: '', name: 'All cities' }, ...cities].map(c => (
          <button
            key={c.id}
            onClick={() => setActiveCity(c.id)}
            style={{
              padding: '14px 20px', fontSize: '0.85rem', fontWeight: activeCity === c.id ? 500 : 400,
              color: activeCity === c.id ? 'var(--red)' : 'var(--ink-light)',
              borderBottom: activeCity === c.id ? '2px solid var(--red)' : '2px solid transparent',
              whiteSpace: 'nowrap', cursor: 'pointer', background: 'none',
              fontFamily: 'var(--font-body)', transition: 'color 0.15s',
              letterSpacing: '0.04em'
            }}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Filters + actions */}
      <div style={{ padding: '1.25rem 2rem', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', borderBottom: '1px solid var(--border)', background: 'white' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', flex: 1 }}>
          {CATEGORIES.map(c => (
            <button key={c.value} onClick={() => setActiveCategory(c.value)} style={{
              padding: '5px 14px', fontSize: '0.78rem', borderRadius: '20px',
              border: '1px solid ' + (activeCategory === c.value ? 'var(--ink)' : 'var(--border-mid)'),
              background: activeCategory === c.value ? 'var(--ink)' : 'transparent',
              color: activeCategory === c.value ? 'var(--paper)' : 'var(--ink-mid)',
              cursor: 'pointer', fontFamily: 'var(--font-body)', letterSpacing: '0.04em',
              transition: 'all 0.15s'
            }}>
              {c.label}
            </button>
          ))}
          <select value={activeStatus} onChange={e => setActiveStatus(e.target.value)} style={{ padding: '5px 10px', fontSize: '0.78rem', width: 'auto', borderRadius: '20px' }}>
            {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        {user && (
          <button onClick={() => setShowAdd(true)} style={{
            padding: '8px 18px', background: 'var(--red)', color: 'white',
            borderRadius: 'var(--radius)', fontSize: '0.85rem', fontWeight: 500,
            cursor: 'pointer', fontFamily: 'var(--font-body)', letterSpacing: '0.04em',
            border: 'none', whiteSpace: 'nowrap'
          }}>
            + Add place
          </button>
        )}
      </div>

      {/* Main content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        {cityName && (
          <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem' }}>{cityName}</h2>
            <div style={{ height: '1px', flex: 1, background: 'var(--border)' }} />
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--ink-light)', fontSize: '0.9rem' }}>Loading places...</div>
        ) : places.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', color: 'var(--paper-dark)', marginBottom: '1rem' }}>何もない</div>
            <p style={{ color: 'var(--ink-light)', fontSize: '0.9rem' }}>No places yet.{user ? ' Add the first one!' : ' Sign in to add places.'}</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {places.map(p => (
              <PlaceCard key={p.id} place={p} onUpdate={handleUpdate} onDelete={handleDelete} cities={cities} />
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <AddPlaceModal
          onClose={() => setShowAdd(false)}
          onAdd={handleAdd}
          cities={cities}
          defaultCity={activeCity}
        />
      )}
    </div>
  );
}
