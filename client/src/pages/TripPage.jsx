import { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

const CATEGORY_ICONS = {
  accommodation: '🏨', food: '🍜', attraction: '⛩', transport: '🚅', other: '📌'
};

function AddDayModal({ onClose, onAdd, cities }) {
  const [date, setDate] = useState('');
  const [cityId, setCityId] = useState(cities[0]?.id || '');
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!date) return;
    setLoading(true);
    try {
      const day = await api.createDay({ date, city_id: cityId || null, label });
      onAdd(day);
      onClose();
    } catch {}
    finally { setLoading(false); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,14,42,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'var(--paper)', borderRadius: 'var(--radius-lg)', padding: '2rem', width: '380px', maxWidth: '95vw', position: 'relative', boxShadow: '0 20px 60px rgba(15,14,42,0.28)' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: 'var(--ink-light)' }}>✕</button>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', marginBottom: '1.5rem' }}>Add a day</h2>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-mid)', marginBottom: '5px' }}>Date *</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-mid)', marginBottom: '5px' }}>City</label>
            <select value={cityId} onChange={e => setCityId(e.target.value)}>
              <option value="">No city</option>
              {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-mid)', marginBottom: '5px' }}>Label</label>
            <input value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Arrival day, Temple day..." />
          </div>
          <button type="submit" disabled={loading} style={{ padding: '10px', background: 'var(--ink)', color: 'var(--paper)', border: 'none', borderRadius: 'var(--radius)', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)', marginTop: '0.5rem' }}>
            {loading ? 'Adding...' : 'Add day'}
          </button>
        </form>
      </div>
    </div>
  );
}

function AddItemModal({ onClose, onAdd, day, places }) {
  const [mode, setMode] = useState('place');
  const [placeId, setPlaceId] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        place_id: mode === 'place' ? placeId || null : null,
        custom_title: mode === 'custom' ? customTitle : null,
        custom_description: mode === 'custom' ? customDesc : null,
        start_time: startTime || null,
        end_time: endTime || null
      };
      const item = await api.addItem(day.id, data);
      onAdd(item);
      onClose();
    } catch {}
    finally { setLoading(false); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,14,42,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'var(--paper)', borderRadius: 'var(--radius-lg)', padding: '2rem', width: '420px', maxWidth: '95vw', position: 'relative', boxShadow: '0 20px 60px rgba(15,14,42,0.28)' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: 'var(--ink-light)' }}>✕</button>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', marginBottom: '0.5rem' }}>Add to day</h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--ink-light)', marginBottom: '1.25rem' }}>
          {new Date(day.date + 'T12:00:00').toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>

        <div style={{ display: 'flex', gap: '6px', marginBottom: '1.25rem' }}>
          {['place', 'custom'].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              padding: '6px 16px', fontSize: '0.8rem', borderRadius: '20px',
              border: '1px solid ' + (mode === m ? 'var(--ink)' : 'var(--border-mid)'),
              background: mode === m ? 'var(--ink)' : 'transparent',
              color: mode === m ? 'var(--paper)' : 'var(--ink-mid)',
              cursor: 'pointer', fontFamily: 'var(--font-body)'
            }}>
              {m === 'place' ? 'From planning list' : 'Custom'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '12px' }}>
          {mode === 'place' ? (
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-mid)', marginBottom: '5px' }}>Place</label>
              <select value={placeId} onChange={e => setPlaceId(e.target.value)}>
                <option value="">Select a place...</option>
                {places.filter(p => p.status !== 'rejected').map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
                ))}
              </select>
            </div>
          ) : (
            <>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-mid)', marginBottom: '5px' }}>Title *</label>
                <input value={customTitle} onChange={e => setCustomTitle(e.target.value)} placeholder="e.g. Check in to hotel" required={mode === 'custom'} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-mid)', marginBottom: '5px' }}>Notes</label>
                <textarea rows={2} value={customDesc} onChange={e => setCustomDesc(e.target.value)} placeholder="Any details..." style={{ resize: 'vertical' }} />
              </div>
            </>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-mid)', marginBottom: '5px' }}>Start time</label>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-mid)', marginBottom: '5px' }}>End time</label>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
            </div>
          </div>

          <button type="submit" disabled={loading} style={{ padding: '10px', background: 'var(--red)', color: 'white', border: 'none', borderRadius: 'var(--radius)', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)', marginTop: '0.25rem' }}>
            {loading ? 'Adding...' : 'Add to itinerary'}
          </button>
        </form>
      </div>
    </div>
  );
}

function TripMap({ days }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.L) return;
    const L = window.L;

    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current, { zoomControl: true }).setView([36.2048, 138.2529], 6);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        maxZoom: 19
      }).addTo(mapInstance.current);
    }

    const map = mapInstance.current;
    map.eachLayer(layer => { if (layer._popup || layer._latlng) map.removeLayer(layer); });

    const bounds = [];

    days.forEach((day, dayIdx) => {
      const items = day.items || [];
      items.forEach(item => {
        if (item.place_lat && item.place_lng) {
          const lat = parseFloat(item.place_lat);
          const lng = parseFloat(item.place_lng);
          bounds.push([lat, lng]);

          const icon = L.divIcon({
            className: '',
            html: `<div style="width:28px;height:28px;border-radius:50%;background:var(--red);border:2px solid white;display:flex;align-items:center;justify-content:center;font-size:11px;color:white;font-weight:600;box-shadow:0 2px 6px rgba(0,0,0,0.3)">${dayIdx + 1}</div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14]
          });

          L.marker([lat, lng], { icon })
            .addTo(map)
            .bindPopup(`<b>${item.place_name || item.custom_title}</b><br/><small>Day ${dayIdx + 1}</small>`);
        }
      });

      if (day.city_lat && day.city_lng) {
        bounds.push([parseFloat(day.city_lat), parseFloat(day.city_lng)]);
      }
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }

    return () => {};
  }, [days]);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      if (mapRef.current && !mapInstance.current) {
        const L = window.L;
        mapInstance.current = L.map(mapRef.current, { zoomControl: true }).setView([36.2048, 138.2529], 6);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; OpenStreetMap &copy; CARTO', maxZoom: 19
        }).addTo(mapInstance.current);
      }
    };
    if (!window.L) document.head.appendChild(script);
  }, []);

  return (
    <div ref={mapRef} style={{ width: '100%', height: '100%', borderRadius: 'var(--radius-lg)' }} />
  );
}

export default function TripPage() {
  const { user } = useAuth();
  const [days, setDays] = useState([]);
  const [cities, setCities] = useState([]);
  const [allPlaces, setAllPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(null);
  const [showAddDay, setShowAddDay] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [planFilter, setPlanFilter] = useState('all');
  const [dragPlaceId, setDragPlaceId] = useState(null);
  const [dragOverDayId, setDragOverDayId] = useState(null);

  useEffect(() => {
    Promise.all([api.days(), api.cities(), api.places()])
      .then(([d, c, p]) => { setDays(d); setCities(c); setAllPlaces(p); if (d.length) setActiveDay(d[0].id); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleAddDay(day) {
    setDays(prev => [...prev, { ...day, items: [] }].sort((a, b) => new Date(a.date) - new Date(b.date)));
  }

  function handleAddItem(item) {
    setDays(prev => prev.map(d => d.id === selectedDay.id ? { ...d, items: [...(d.items || []), item] } : d));
  }

  async function handleDeleteDay(dayId) {
    if (!confirm('Remove this day?')) return;
    await api.deleteDay(dayId).catch(() => {});
    setDays(prev => prev.filter(d => d.id !== dayId));
    if (activeDay === dayId) setActiveDay(days.find(d => d.id !== dayId)?.id || null);
  }

  async function handleDeleteItem(dayId, itemId) {
    await api.deleteItem(itemId).catch(() => {});
    setDays(prev => prev.map(d => d.id === dayId ? { ...d, items: d.items.filter(i => i.id !== itemId) } : d));
  }

  const currentDay = days.find(d => d.id === activeDay);

  const filteredPlanPlaces = allPlaces.filter(p => {
    if (p.status === 'rejected') return false;
    if (planFilter === 'all') return true;
    return p.status === planFilter;
  });

  function handlePlanDragStart(e, place) {
    setDragPlaceId(place.id);
    e.dataTransfer.effectAllowed = 'copy';
  }

  function handlePlanDragEnd() {
    setDragPlaceId(null);
    setDragOverDayId(null);
  }

  function handleDayDragOver(e, dayId) {
    if (!dragPlaceId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOverDayId(dayId);
  }

  function handleDayDragLeave(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverDayId(null);
    }
  }

  async function handleDayDrop(e, dayId) {
    e.preventDefault();
    if (!dragPlaceId) return;
    setDragOverDayId(null);
    const placeId = dragPlaceId;
    setDragPlaceId(null);
    try {
      const item = await api.addItem(dayId, { place_id: placeId });
      setDays(prev => prev.map(d => d.id === dayId ? { ...d, items: [...(d.items || []), item] } : d));
    } catch {}
  }

  const formatDate = (dateStr) => {
    // Normalise to plain YYYY-MM-DD before appending time, so we always get local midnight
    const plain = String(dateStr).slice(0, 10);
    const d = new Date(plain + 'T12:00:00');
    return {
      weekday: d.toLocaleDateString('en-AU', { weekday: 'short' }),
      day:     d.toLocaleDateString('en-AU', { day: 'numeric' }),
      month:   d.toLocaleDateString('en-AU', { month: 'short' }),
      full:    d.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    };
  };

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-light)' }}>
      Loading itinerary...
    </div>
  );

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: 'var(--grad-hero)', padding: '3rem 2rem 2.5rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: '2rem', top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--font-display)', fontSize: '8rem', color: 'rgba(255,255,255,0.06)', lineHeight: 1, userSelect: 'none' }}>旅行</div>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: 'var(--grad-accent)' }} />
        <h1 style={{ fontFamily: 'var(--font-display)', color: 'white', fontSize: '2.5rem', marginBottom: '0.5rem' }}>
          The Trip
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
          Day-by-day itinerary. Add days then fill them with places from the planning list.
        </p>
      </div>

      {/* Map */}
      <div style={{ height: '360px', background: 'var(--paper-warm)', borderBottom: '1px solid var(--border)', padding: '1rem 2rem' }}>
        <TripMap days={days} />
      </div>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 60px - 100px - 360px)' }}>
        {/* Day sidebar */}
        <div style={{ width: '220px', minWidth: '220px', background: 'var(--paper-warm)', borderRight: '1px solid var(--border)', padding: '1rem 0', flexShrink: 0 }}>
          <div style={{ padding: '0 1rem 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-light)' }}>Days</span>
            {user && (
              <button onClick={() => setShowAddDay(true)} style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--ink)', color: 'white', border: 'none', fontSize: '1rem', lineHeight: '22px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
            )}
          </div>

          {days.length === 0 ? (
            <p style={{ padding: '0 1rem', fontSize: '0.8rem', color: 'var(--ink-light)' }}>No days yet.</p>
          ) : (
            days.map((day, idx) => (
              <div
                key={day.id}
                onClick={() => setActiveDay(day.id)}
                onDragOver={e => handleDayDragOver(e, day.id)}
                onDragLeave={handleDayDragLeave}
                onDrop={e => handleDayDrop(e, day.id)}
                style={{
                  padding: '10px 1rem', cursor: dragPlaceId ? 'copy' : 'pointer',
                  background: activeDay === day.id ? 'white' : dragOverDayId === day.id ? 'rgba(199,43,36,0.06)' : 'transparent',
                  borderLeft: activeDay === day.id ? '3px solid var(--red)' : dragOverDayId === day.id ? '3px solid var(--red)' : '3px solid transparent',
                  transition: 'all 0.15s', outline: dragOverDayId === day.id ? '2px dashed var(--red)' : 'none', outlineOffset: '-2px'
                }}
              >
                {(() => { const f = formatDate(day.date); return (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--red)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Day {idx + 1}</span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--ink-light)', fontWeight: 400 }}>{f.weekday}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '2px' }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--ink)', lineHeight: 1 }}>{f.day}</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--ink-mid)' }}>{f.month}</span>
                    </div>
                    {day.city_name && <div style={{ fontSize: '0.7rem', color: 'var(--ink-light)', marginTop: '2px' }}>{day.city_name}</div>}
                    {day.label && <div style={{ fontSize: '0.7rem', color: 'var(--red)', fontStyle: 'italic', marginTop: '1px', opacity: 0.8 }}>{day.label}</div>}
                    <div style={{ fontSize: '0.65rem', color: 'var(--ink-light)', marginTop: '4px' }}>{(day.items || []).length} item{(day.items || []).length !== 1 ? 's' : ''}</div>
                  </>
                ); })()}
              </div>
            ))
          )}
        </div>

        {/* Day detail */}
        <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
          {!currentDay ? (
            <div style={{ textAlign: 'center', paddingTop: '4rem' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', color: 'var(--paper-dark)', marginBottom: '1rem' }}>旅</div>
              <p style={{ color: 'var(--ink-light)' }}>{user ? 'Add a day to start building the itinerary.' : 'Sign in to add days.'}</p>
              {user && (
                <button onClick={() => setShowAddDay(true)} style={{ marginTop: '1rem', padding: '10px 24px', background: 'var(--red)', color: 'white', border: 'none', borderRadius: 'var(--radius)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '0.85rem' }}>
                  Add first day
                </button>
              )}
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--red)', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Day {days.findIndex(d => d.id === activeDay) + 1}
                    {currentDay.city_name && ` · ${currentDay.city_name}`}
                  </div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--ink)', lineHeight: 1.1 }}>
                    {new Date(currentDay.date + 'T12:00:00').toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </h2>
                  {currentDay.label && <p style={{ color: 'var(--ink-light)', fontStyle: 'italic', marginTop: '4px' }}>{currentDay.label}</p>}
                </div>
                {user && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => { setSelectedDay(currentDay); setShowAddItem(true); }} style={{ padding: '8px 16px', background: 'var(--red)', color: 'white', border: 'none', borderRadius: 'var(--radius)', fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                      + Add item
                    </button>
                    <button onClick={() => handleDeleteDay(currentDay.id)} style={{ padding: '8px 12px', border: '1px solid var(--border-mid)', borderRadius: 'var(--radius)', fontSize: '0.82rem', cursor: 'pointer', color: 'var(--ink-light)', fontFamily: 'var(--font-body)' }}>
                      Remove day
                    </button>
                  </div>
                )}
              </div>

              {/* Timeline */}
              {(!currentDay.items || currentDay.items.length === 0) ? (
                <div style={{ padding: '3rem', textAlign: 'center', border: '1px dashed var(--border-mid)', borderRadius: 'var(--radius-lg)', color: 'var(--ink-light)', fontSize: '0.9rem' }}>
                  Nothing planned yet for this day.{user ? ' Click "Add item" to start.' : ''}
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '16px', top: 0, bottom: 0, width: '1px', background: 'var(--border-mid)' }} />
                  {currentDay.items.map((item, idx) => (
                    <div key={item.id} style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.25rem', position: 'relative' }}>
                      <div style={{ width: '32px', minWidth: '32px', height: '32px', borderRadius: '50%', background: 'var(--red)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', zIndex: 1, boxShadow: '0 0 0 3px var(--paper)' }}>
                        {CATEGORY_ICONS[item.place_category] || '📌'}
                      </div>
                      <div style={{ flex: 1, background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '0.875rem 1.125rem', boxShadow: 'var(--shadow-soft)' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                          <div>
                            {(item.start_time || item.end_time) && (
                              <div style={{ fontSize: '0.72rem', color: 'var(--red)', fontWeight: 500, letterSpacing: '0.06em', marginBottom: '3px' }}>
                                {item.start_time?.slice(0,5)}{item.end_time ? ` - ${item.end_time.slice(0,5)}` : ''}
                              </div>
                            )}
                            <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--ink)' }}>
                              {item.place_name || item.custom_title}
                            </h4>
                            {(item.custom_description) && (
                              <p style={{ fontSize: '0.82rem', color: 'var(--ink-light)', marginTop: '3px' }}>{item.custom_description}</p>
                            )}
                          </div>
                          {user && (
                            <button onClick={() => handleDeleteItem(currentDay.id, item.id)} style={{ color: 'var(--ink-light)', fontSize: '12px', cursor: 'pointer', padding: '2px 6px', background: 'none', border: 'none', flexShrink: 0 }}>✕</button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Planning sidebar */}
        <div style={{ width: '260px', minWidth: '260px', borderLeft: '1px solid var(--border)', background: 'var(--paper-warm)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-light)', marginBottom: '0.5rem' }}>Planning List</div>
            <p style={{ fontSize: '0.72rem', color: 'var(--ink-light)', marginBottom: '0.5rem', lineHeight: 1.4 }}>Drag a place onto a day to add it.</p>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {['all', 'considering', 'shortlisted', 'booked'].map(s => (
                <button key={s} onClick={() => setPlanFilter(s)} style={{
                  padding: '3px 9px', fontSize: '0.7rem', borderRadius: '999px', cursor: 'pointer',
                  fontFamily: 'var(--font-body)', border: '1px solid',
                  borderColor: planFilter === s ? 'var(--ink)' : 'var(--border)',
                  background: planFilter === s ? 'var(--ink)' : 'transparent',
                  color: planFilter === s ? 'var(--paper)' : 'var(--ink-mid)'
                }}>
                  {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
            {filteredPlanPlaces.length === 0 ? (
              <p style={{ padding: '1rem 0.5rem', fontSize: '0.8rem', color: 'var(--ink-light)', textAlign: 'center' }}>No places to show.</p>
            ) : filteredPlanPlaces.map(place => (
              <div
                key={place.id}
                draggable
                onDragStart={e => handlePlanDragStart(e, place)}
                onDragEnd={handlePlanDragEnd}
                style={{
                  padding: '8px 10px',
                  background: dragPlaceId === place.id ? 'var(--paper-dark)' : 'white',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  marginBottom: '6px',
                  cursor: 'grab',
                  opacity: dragPlaceId === place.id ? 0.4 : 1,
                  boxShadow: 'var(--shadow-soft)',
                  userSelect: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '13px', flexShrink: 0 }}>{CATEGORY_ICONS[place.category] || '📌'}</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{place.name}</span>
                </div>
                {place.city_id && (
                  <div style={{ fontSize: '0.69rem', color: 'var(--ink-light)', marginTop: '2px', paddingLeft: '19px' }}>
                    {cities.find(c => c.id === place.city_id)?.name}
                  </div>
                )}
                <div style={{ fontSize: '0.68rem', color: 'var(--ink-light)', marginTop: '2px', paddingLeft: '19px', textTransform: 'capitalize' }}>{place.status}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showAddDay && <AddDayModal onClose={() => setShowAddDay(false)} onAdd={handleAddDay} cities={cities} />}
      {showAddItem && selectedDay && (
        <AddItemModal onClose={() => setShowAddItem(false)} onAdd={handleAddItem} day={selectedDay} places={allPlaces} />
      )}
    </div>
  );
}
