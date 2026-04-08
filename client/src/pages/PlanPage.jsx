import { useState, useEffect, useRef } from 'react';
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

const COLUMNS = [
  { value: 'considering', label: 'Considering', color: 'var(--ink-light)' },
  { value: 'shortlisted', label: 'Shortlisted', color: 'var(--gold)' },
  { value: 'booked',      label: 'Booked',      color: '#3B6D11' },
  { value: 'rejected',    label: 'Rejected',    color: 'var(--red)' }
];

export default function PlanPage() {
  const { user } = useAuth();
  const [cities, setCities] = useState([]);
  const [places, setPlaces] = useState([]);
  const [activeCity, setActiveCity] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dragId, setDragId] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const dragCounter = useRef({});

  useEffect(() => {
    api.cities().then(setCities).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (activeCity) params.city_id = activeCity;
    if (activeCategory) params.category = activeCategory;
    api.places(params)
      .then(setPlaces)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeCity, activeCategory]);

  function handleAdd(place) {
    setPlaces(prev => [{ ...place, vote_score: 0, vote_count: 0, my_vote: null }, ...prev]);
  }

  function handleUpdate(updated) {
    setPlaces(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p));
  }

  function handleDelete(id) {
    setPlaces(prev => prev.filter(p => p.id !== id));
  }

  function onDragStart(e, id) {
    setDragId(id);
    e.dataTransfer.effectAllowed = 'move';
  }

  function onDragEnter(e, status) {
    e.preventDefault();
    dragCounter.current[status] = (dragCounter.current[status] || 0) + 1;
    setDragOver(status);
  }

  function onDragLeave(e, status) {
    dragCounter.current[status] = (dragCounter.current[status] || 1) - 1;
    if (dragCounter.current[status] === 0) setDragOver(null);
  }

  function onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  async function onDrop(e, status) {
    e.preventDefault();
    dragCounter.current = {};
    setDragOver(null);
    if (!dragId) return;
    const place = places.find(p => p.id === dragId);
    if (!place || place.status === status) { setDragId(null); return; }
    setPlaces(prev => prev.map(p => p.id === dragId ? { ...p, status } : p));
    setDragId(null);
    try {
      await api.updatePlace(dragId, { status });
    } catch {
      setPlaces(prev => prev.map(p => p.id === dragId ? { ...p, status: place.status } : p));
    }
  }

  const cityName = cities.find(c => String(c.id) === String(activeCity))?.name;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: 'var(--grad-hero)', padding: '3rem 2rem 2.5rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: '2rem', top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--font-display)', fontSize: '8rem', color: 'rgba(255,255,255,0.06)', lineHeight: 1, userSelect: 'none' }}>計画</div>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: 'var(--grad-accent)' }} />
        <h1 style={{ fontFamily: 'var(--font-display)', color: 'white', fontSize: '2.5rem', marginBottom: '0.5rem' }}>Planning</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', maxWidth: '500px' }}>
          Add places, vote on options, and shortlist the best spots before locking in the itinerary.
        </p>
      </div>

      {/* City tabs */}
      <div style={{ background: 'var(--paper-warm)', borderBottom: '1px solid var(--border)', padding: '0 2rem', display: 'flex', gap: 0, overflowX: 'auto' }}>
        {[{ id: '', name: 'All cities' }, ...cities].map(c => (
          <button key={c.id} onClick={() => setActiveCity(c.id)} style={{
            padding: '14px 20px', fontSize: '0.85rem', fontWeight: activeCity === c.id ? 500 : 400,
            color: activeCity === c.id ? 'var(--red)' : 'var(--ink-light)',
            borderBottom: activeCity === c.id ? '2px solid var(--red)' : '2px solid transparent',
            whiteSpace: 'nowrap', cursor: 'pointer', background: 'none',
            fontFamily: 'var(--font-body)', transition: 'color 0.15s', letterSpacing: '0.04em'
          }}>{c.name}</button>
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
              cursor: 'pointer', fontFamily: 'var(--font-body)', letterSpacing: '0.04em', transition: 'all 0.15s'
            }}>{c.label}</button>
          ))}
        </div>
        {user && (
          <button onClick={() => setShowAdd(true)} style={{
            padding: '8px 18px', background: 'var(--red)', color: 'white',
            borderRadius: 'var(--radius)', fontSize: '0.85rem', fontWeight: 500,
            cursor: 'pointer', fontFamily: 'var(--font-body)', letterSpacing: '0.04em',
            border: 'none', whiteSpace: 'nowrap'
          }}>+ Add place</button>
        )}
      </div>

      {/* Board */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--ink-light)', fontSize: '0.9rem' }}>Loading...</div>
      ) : (
        <div style={{ flex: 1, overflowX: 'auto', padding: '1.5rem 2rem', background: 'var(--paper-warm)' }}>
          {cityName && (
            <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem' }}>{cityName}</h2>
              <div style={{ height: '1px', flex: 1, background: 'var(--border)' }} />
            </div>
          )}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', minWidth: 'fit-content' }}>
            {COLUMNS.map(col => {
              const colPlaces = places.filter(p => p.status === col.value);
              const isOver = dragOver === col.value;
              return (
                <div
                  key={col.value}
                  onDragEnter={e => onDragEnter(e, col.value)}
                  onDragLeave={e => onDragLeave(e, col.value)}
                  onDragOver={onDragOver}
                  onDrop={e => onDrop(e, col.value)}
                  style={{
                    width: '300px', flexShrink: 0,
                    background: isOver ? 'var(--paper-dark)' : 'var(--paper)',
                    borderRadius: 'var(--radius-lg)',
                    border: isOver ? '2px dashed var(--border-mid)' : '2px solid transparent',
                    transition: 'background 0.15s, border 0.15s',
                    display: 'flex', flexDirection: 'column'
                  }}
                >
                  {/* Column header */}
                  <div style={{ padding: '1rem 1rem 0.75rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: col.color, flexShrink: 0 }} />
                    <span style={{ fontWeight: 500, fontSize: '0.85rem', letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--ink-mid)' }}>{col.label}</span>
                    <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--ink-light)', background: 'var(--paper-warm)', borderRadius: '10px', padding: '1px 8px' }}>{colPlaces.length}</span>
                  </div>

                  {/* Cards */}
                  <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: '120px' }}>
                    {colPlaces.length === 0 && !isOver && (
                      <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--ink-light)', fontSize: '0.8rem' }}>
                        Drop cards here
                      </div>
                    )}
                    {colPlaces.map(p => (
                      <div
                        key={p.id}
                        draggable={!!user}
                        onDragStart={e => onDragStart(e, p.id)}
                        onDragEnd={() => setDragId(null)}
                        style={{ opacity: dragId === p.id ? 0.4 : 1, cursor: user ? 'grab' : 'default', transition: 'opacity 0.15s' }}
                      >
                        <PlaceCard place={p} onUpdate={handleUpdate} onDelete={handleDelete} cities={cities} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
