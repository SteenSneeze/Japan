import { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

// ── Calendar constants ──────────────────────────────────────────────────────
const START_HOUR     = 7;
const END_HOUR       = 23;
const PX_PER_HOUR    = 80;
const DEFAULT_DUR    = 60; // minutes
const CALENDAR_H     = (END_HOUR - START_HOUR) * PX_PER_HOUR;
const LABEL_W        = 56; // px for time labels

const CATEGORY_ICONS = {
  accommodation: '🏨', food: '🍜', attraction: '⛩', transport: '🚅', other: '📌'
};
const CATEGORY_COLORS = {
  accommodation: { border: '#1a56db', bg: '#e8f0fe', text: '#1a56db' },
  food:          { border: '#856404', bg: '#fff8e1', text: '#856404' },
  attraction:    { border: '#e8197d', bg: '#fce4ec', text: '#c0156e' },
  transport:     { border: '#2e7d32', bg: '#e8f5e9', text: '#2e7d32' },
  other:         { border: '#6a1b9a', bg: '#f3e5f5', text: '#6a1b9a' },
};
const STATUS_COLORS = {
  considering: { color: '#856404', bg: '#fff8e1' },
  shortlisted: { color: '#1a56db', bg: '#e8f0fe' },
  booked:      { color: '#2e7d32', bg: '#e8f5e9' },
};

// ── Time helpers ────────────────────────────────────────────────────────────
function timeToMins(t) {
  const [h, m] = String(t).slice(0, 5).split(':').map(Number);
  return h * 60 + m;
}
function minsToTime(m) {
  const h = Math.floor(m / 60), min = m % 60;
  return `${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}`;
}
function snapMins(mins, snap = 15) {
  return Math.round(mins / snap) * snap;
}
function timeToTop(t) {
  return (timeToMins(t) - START_HOUR * 60) / 60 * PX_PER_HOUR;
}

// ── Overlap layout ──────────────────────────────────────────────────────────
function computeLayout(items) {
  const sorted = [...items]
    .filter(i => i.start_time)
    .map(i => ({
      id: i.id,
      s: timeToMins(i.start_time),
      e: i.end_time ? timeToMins(i.end_time) : timeToMins(i.start_time) + DEFAULT_DUR,
    }))
    .sort((a, b) => a.s - b.s);

  const cols = [];        // cols[c] = end time of last item in that column
  const colMap = new Map(); // id -> col index

  for (const it of sorted) {
    let c = cols.findIndex(end => end <= it.s);
    if (c === -1) { c = cols.length; cols.push(it.e); }
    else cols[c] = it.e;
    colMap.set(it.id, c);
  }

  return { colMap, totalCols: Math.max(cols.length, 1) };
}

// ── Modals ──────────────────────────────────────────────────────────────────
function AddDayModal({ onClose, onAdd, cities }) {
  const [date, setDate] = useState('');
  const [cityId, setCityId] = useState(cities[0]?.id || '');
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!date) return;
    setLoading(true);
    try { const day = await api.createDay({ date, city_id: cityId || null, label }); onAdd(day); onClose(); }
    catch {} finally { setLoading(false); }
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

function AddItemModal({ onClose, onAdd, day, places, prefillTime }) {
  const [mode, setMode] = useState('place');
  const [placeId, setPlaceId] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [startTime, setStartTime] = useState(prefillTime || '');
  const [endTime, setEndTime] = useState(prefillTime ? minsToTime(timeToMins(prefillTime) + DEFAULT_DUR) : '');
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
        end_time: endTime || null,
      };
      const item = await api.addItem(day.id, data);
      onAdd(item);
      onClose();
    } catch {} finally { setLoading(false); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,14,42,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'var(--paper)', borderRadius: 'var(--radius-lg)', padding: '2rem', width: '420px', maxWidth: '95vw', position: 'relative', boxShadow: '0 20px 60px rgba(15,14,42,0.28)' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: 'var(--ink-light)' }}>✕</button>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', marginBottom: '0.5rem' }}>Add to day</h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--ink-light)', marginBottom: '1.25rem' }}>
          {new Date(String(day.date).slice(0, 10) + 'T12:00:00').toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '1.25rem' }}>
          {['place','custom'].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              padding: '6px 16px', fontSize: '0.8rem', borderRadius: '20px',
              border: '1px solid ' + (mode === m ? 'var(--ink)' : 'var(--border-mid)'),
              background: mode === m ? 'var(--ink)' : 'transparent',
              color: mode === m ? 'var(--paper)' : 'var(--ink-mid)', cursor: 'pointer', fontFamily: 'var(--font-body)'
            }}>{m === 'place' ? 'From planning list' : 'Custom'}</button>
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
              <input type="time" value={startTime} onChange={e => { setStartTime(e.target.value); if (!endTime && e.target.value) setEndTime(minsToTime(timeToMins(e.target.value) + DEFAULT_DUR)); }} />
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

// ── Map ─────────────────────────────────────────────────────────────────────
function TripMap({ days }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  useEffect(() => {
    if (!window.L) return;
    const L = window.L;
    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current, { zoomControl: true }).setView([36.2048, 138.2529], 6);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { attribution: '&copy; OpenStreetMap &copy; CARTO', maxZoom: 19 }).addTo(mapInstance.current);
    }
    const map = mapInstance.current;
    map.eachLayer(layer => { if (layer._popup || layer._latlng) map.removeLayer(layer); });
    const bounds = [];
    days.forEach((day, di) => {
      (day.items || []).forEach(item => {
        if (item.place_lat && item.place_lng) {
          const lat = parseFloat(item.place_lat), lng = parseFloat(item.place_lng);
          bounds.push([lat, lng]);
          const icon = L.divIcon({ className: '', html: `<div style="width:28px;height:28px;border-radius:50%;background:var(--red);border:2px solid white;display:flex;align-items:center;justify-content:center;font-size:11px;color:white;font-weight:600;box-shadow:0 2px 6px rgba(0,0,0,0.3)">${di+1}</div>`, iconSize: [28,28], iconAnchor: [14,14] });
          L.marker([lat, lng], { icon }).addTo(map).bindPopup(`<b>${item.place_name||item.custom_title}</b><br/><small>Day ${di+1}</small>`);
        }
      });
      if (day.city_lat && day.city_lng) bounds.push([parseFloat(day.city_lat), parseFloat(day.city_lng)]);
    });
    if (bounds.length) map.fitBounds(bounds, { padding: [40, 40] });
  }, [days]);

  useEffect(() => {
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    s.onload = () => {
      if (mapRef.current && !mapInstance.current) {
        const L = window.L;
        mapInstance.current = L.map(mapRef.current, { zoomControl: true }).setView([36.2048, 138.2529], 6);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { attribution: '&copy; OpenStreetMap &copy; CARTO', maxZoom: 19 }).addTo(mapInstance.current);
      }
    };
    if (!window.L) document.head.appendChild(s);
  }, []);

  return <div ref={mapRef} style={{ width: '100%', height: '100%', borderRadius: 'var(--radius-lg)' }} />;
}

// ── Main page ────────────────────────────────────────────────────────────────
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
  const [addItemPrefillTime, setAddItemPrefillTime] = useState('');
  const [planFilter, setPlanFilter] = useState('all');

  // Planning sidebar drag (place → day)
  const [dragPlaceId, setDragPlaceId] = useState(null);
  const [dragOverDayId, setDragOverDayId] = useState(null);

  // Calendar item drag (reschedule)
  const [dragItemId, setDragItemId] = useState(null);
  const [dragItemDur, setDragItemDur] = useState(DEFAULT_DUR); // duration in mins

  // Shared ghost preview state
  const [ghostTime, setGhostTime] = useState(null); // "HH:MM" or null
  const calendarRef = useRef(null);

  useEffect(() => {
    Promise.all([api.days(), api.cities(), api.places()])
      .then(([d, c, p]) => { setDays(d); setCities(c); setAllPlaces(p); if (d.length) setActiveDay(d[0].id); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleAddDay(day) {
    setDays(prev => [...prev, { ...day, items: [] }].sort((a,b) => new Date(a.date)-new Date(b.date)));
  }
  function handleAddItem(item) {
    setDays(prev => prev.map(d => d.id === selectedDay.id ? { ...d, items: [...(d.items||[]), item] } : d));
  }
  async function handleDeleteDay(dayId) {
    if (!confirm('Remove this day?')) return;
    await api.deleteDay(dayId).catch(()=>{});
    setDays(prev => prev.filter(d => d.id !== dayId));
    if (activeDay === dayId) setActiveDay(days.find(d => d.id !== dayId)?.id || null);
  }
  async function handleDeleteItem(dayId, itemId) {
    await api.deleteItem(itemId).catch(()=>{});
    setDays(prev => prev.map(d => d.id === dayId ? { ...d, items: d.items.filter(i => i.id !== itemId) } : d));
  }

  const currentDay = days.find(d => d.id === activeDay);

  const filteredPlanPlaces = allPlaces.filter(p => {
    if (p.status === 'rejected') return false;
    return planFilter === 'all' || p.status === planFilter;
  });

  // ── Planning sidebar drag ──────────────────────────────────────────────────
  function handlePlanDragStart(e, place) {
    setDragPlaceId(place.id);
    e.dataTransfer.effectAllowed = 'copy';
  }
  function handlePlanDragEnd() {
    setDragPlaceId(null); setDragOverDayId(null); setGhostTime(null);
  }
  function handleDaySidebarDragOver(e, dayId) {
    if (!dragPlaceId) return;
    e.preventDefault(); e.dataTransfer.dropEffect = 'copy';
    setDragOverDayId(dayId);
  }
  function handleDaySidebarDragLeave(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) setDragOverDayId(null);
  }
  async function handleDaySidebarDrop(e, dayId) {
    e.preventDefault();
    if (!dragPlaceId) return;
    setDragOverDayId(null);
    const placeId = dragPlaceId; setDragPlaceId(null);
    try {
      const item = await api.addItem(dayId, { place_id: placeId });
      setDays(prev => prev.map(d => d.id === dayId ? { ...d, items: [...(d.items||[]), item] } : d));
      setActiveDay(dayId);
    } catch {}
  }

  // ── Calendar helpers ───────────────────────────────────────────────────────
  function getTimeFromEvent(e) {
    if (!calendarRef.current) return null;
    const rect = calendarRef.current.getBoundingClientRect();
    const y = Math.max(0, e.clientY - rect.top);
    const snapped = snapMins((y / PX_PER_HOUR) * 60 + START_HOUR * 60);
    const h = Math.floor(snapped / 60), m = snapped % 60;
    if (h < START_HOUR || h >= END_HOUR) return null;
    return minsToTime(Math.min(snapped, (END_HOUR - 1) * 60));
  }

  function handleCalendarDragOver(e) {
    if (!dragPlaceId && !dragItemId) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = dragPlaceId ? 'copy' : 'move';
    const t = getTimeFromEvent(e);
    if (t) setGhostTime(t);
  }

  function handleCalendarDragLeave(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) setGhostTime(null);
  }

  async function handleCalendarDrop(e) {
    e.preventDefault();
    const time = getTimeFromEvent(e) || ghostTime;
    setGhostTime(null);

    if (dragPlaceId && currentDay && time) {
      const placeId = dragPlaceId; setDragPlaceId(null);
      const endTime = minsToTime(Math.min(timeToMins(time) + DEFAULT_DUR, END_HOUR * 60));
      try {
        const item = await api.addItem(currentDay.id, { place_id: placeId, start_time: time, end_time: endTime });
        setDays(prev => prev.map(d => d.id === currentDay.id ? { ...d, items: [...(d.items||[]), item] } : d));
      } catch {}

    } else if (dragItemId && currentDay && time) {
      const iid = dragItemId; setDragItemId(null);
      const dur = dragItemDur;
      const endTime = minsToTime(Math.min(timeToMins(time) + dur, END_HOUR * 60));
      setDays(prev => prev.map(d => d.id === currentDay.id ? {
        ...d, items: d.items.map(i => i.id === iid ? { ...i, start_time: time, end_time: endTime } : i)
      } : d));
      try { await api.updateItem(iid, { start_time: time, end_time: endTime }); } catch {}
    }
  }

  // ── Calendar item drag (reschedule) ────────────────────────────────────────
  function handleItemDragStart(e, item) {
    e.stopPropagation();
    setDragItemId(item.id);
    const dur = (item.start_time && item.end_time)
      ? timeToMins(item.end_time) - timeToMins(item.start_time)
      : DEFAULT_DUR;
    setDragItemDur(dur);
    e.dataTransfer.effectAllowed = 'move';
  }
  function handleItemDragEnd() {
    setDragItemId(null); setGhostTime(null);
  }

  const formatDate = (dateStr) => {
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
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-light)' }}>Loading itinerary...</div>
  );

  // Split items into scheduled / unscheduled
  const allItems    = currentDay?.items || [];
  const scheduled   = allItems.filter(i => i.start_time).sort((a,b) => timeToMins(a.start_time) - timeToMins(b.start_time));
  const unscheduled = allItems.filter(i => !i.start_time);
  const { colMap, totalCols } = computeLayout(scheduled);

  // Ghost block height
  const ghostHeight = (dragItemId ? dragItemDur : DEFAULT_DUR) / 60 * PX_PER_HOUR;

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: 'var(--grad-hero)', padding: '3rem 2rem 2.5rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: '2rem', top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--font-display)', fontSize: '8rem', color: 'rgba(255,255,255,0.06)', lineHeight: 1, userSelect: 'none' }}>旅行</div>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: 'var(--grad-accent)' }} />
        <h1 style={{ fontFamily: 'var(--font-display)', color: 'white', fontSize: '2.5rem', marginBottom: '0.5rem' }}>The Trip</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>Drag places onto the calendar to time-block your days.</p>
      </div>

      {/* Map */}
      <div style={{ height: '300px', background: 'var(--paper-warm)', borderBottom: '1px solid var(--border)', padding: '1rem 2rem' }}>
        <TripMap days={days} />
      </div>

      <div style={{ display: 'flex', height: 'calc(100vh - 60px - 106px - 300px)', minHeight: '600px' }}>

        {/* ── Day sidebar ── */}
        <div style={{ width: '200px', minWidth: '200px', background: 'var(--paper-warm)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-light)' }}>Days</span>
            {user && <button onClick={() => setShowAddDay(true)} style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--ink)', color: 'white', border: 'none', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>}
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {days.length === 0
              ? <p style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--ink-light)' }}>No days yet.</p>
              : days.map((day, idx) => (
                <div key={day.id} onClick={() => setActiveDay(day.id)}
                  onDragOver={e => handleDaySidebarDragOver(e, day.id)}
                  onDragLeave={handleDaySidebarDragLeave}
                  onDrop={e => handleDaySidebarDrop(e, day.id)}
                  style={{
                    padding: '10px 1rem', cursor: dragPlaceId ? 'copy' : 'pointer',
                    background: activeDay === day.id ? 'white' : dragOverDayId === day.id ? 'rgba(232,25,125,0.06)' : 'transparent',
                    borderLeft: activeDay === day.id ? '3px solid var(--red)' : dragOverDayId === day.id ? '3px solid var(--red)' : '3px solid transparent',
                    outline: dragOverDayId === day.id ? '2px dashed var(--red)' : 'none', outlineOffset: '-2px',
                    transition: 'all 0.15s'
                  }}>
                  {(() => { const f = formatDate(day.date); return (<>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--red)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Day {idx+1}</span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--ink-light)' }}>{f.weekday}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '2px' }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--ink)', lineHeight: 1 }}>{f.day}</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--ink-mid)' }}>{f.month}</span>
                    </div>
                    {day.city_name && <div style={{ fontSize: '0.7rem', color: 'var(--ink-light)', marginTop: '2px' }}>{day.city_name}</div>}
                    {day.label && <div style={{ fontSize: '0.7rem', color: 'var(--red)', fontStyle: 'italic', marginTop: '1px', opacity: 0.8 }}>{day.label}</div>}
                    <div style={{ fontSize: '0.65rem', color: 'var(--ink-light)', marginTop: '4px' }}>{(day.items||[]).length} item{(day.items||[]).length !== 1 ? 's' : ''}</div>
                  </>); })()}
                </div>
              ))
            }
          </div>
        </div>

        {/* ── Day detail ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', minWidth: 0 }}>
          {!currentDay ? (
            <div style={{ textAlign: 'center', paddingTop: '4rem' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', color: 'var(--paper-dark)', marginBottom: '1rem' }}>旅</div>
              <p style={{ color: 'var(--ink-light)' }}>{user ? 'Select or add a day.' : 'Sign in to add days.'}</p>
              {user && <button onClick={() => setShowAddDay(true)} style={{ marginTop: '1rem', padding: '10px 24px', background: 'var(--red)', color: 'white', border: 'none', borderRadius: 'var(--radius)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '0.85rem' }}>Add first day</button>}
            </div>
          ) : (<>
            {/* Day header */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--red)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '2px' }}>
                  Day {days.findIndex(d => d.id === activeDay) + 1}{currentDay.city_name && ` · ${currentDay.city_name}`}
                </div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--ink)', lineHeight: 1.1, margin: 0 }}>
                  {new Date(String(currentDay.date).slice(0,10)+'T12:00:00').toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </h2>
                {currentDay.label && <p style={{ color: 'var(--ink-light)', fontStyle: 'italic', marginTop: '2px', fontSize: '0.85rem' }}>{currentDay.label}</p>}
              </div>
              {user && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => { setSelectedDay(currentDay); setAddItemPrefillTime(''); setShowAddItem(true); }} style={{ padding: '7px 14px', background: 'var(--red)', color: 'white', border: 'none', borderRadius: 'var(--radius)', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+ Add item</button>
                  <button onClick={() => handleDeleteDay(currentDay.id)} style={{ padding: '7px 12px', border: '1px solid var(--border-mid)', borderRadius: 'var(--radius)', fontSize: '0.8rem', cursor: 'pointer', color: 'var(--ink-light)', fontFamily: 'var(--font-body)' }}>Remove day</button>
                </div>
              )}
            </div>

            {/* Unscheduled items */}
            {unscheduled.length > 0 && (
              <div style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid var(--border)', flexShrink: 0, background: 'var(--paper-warm)' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-light)', marginBottom: '6px' }}>Unscheduled</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {unscheduled.map(item => {
                    const fullPlace = item.place_id ? allPlaces.find(p => p.id === item.place_id) : null;
                    const cc = CATEGORY_COLORS[item.place_category] || CATEGORY_COLORS.other;
                    return (
                      <div key={item.id}
                        draggable={!!user}
                        onDragStart={e => handleItemDragStart(e, item)}
                        onDragEnd={handleItemDragEnd}
                        style={{ background: cc.bg, border: `1.5px solid ${cc.border}`, borderRadius: 'var(--radius)', padding: '5px 10px', cursor: user ? 'grab' : 'default', userSelect: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '12px' }}>{CATEGORY_ICONS[item.place_category] || '📌'}</span>
                        <span style={{ fontSize: '0.78rem', fontWeight: 500, color: cc.text }}>{item.place_name || item.custom_title}</span>
                        {user && <button onClick={() => handleDeleteItem(currentDay.id, item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: cc.text, opacity: 0.5, fontSize: '10px', padding: '0 2px', marginLeft: '2px' }}>✕</button>}
                      </div>
                    );
                  })}
                </div>
                <p style={{ fontSize: '0.68rem', color: 'var(--ink-light)', marginTop: '5px' }}>Drag these onto the calendar below to schedule them.</p>
              </div>
            )}

            {/* Calendar grid */}
            <div
              style={{ flex: 1, overflowY: 'auto', padding: '0 0 2rem', position: 'relative', minHeight: CALENDAR_H + 40 }}
              onDragOver={handleCalendarDragOver}
              onDragLeave={handleCalendarDragLeave}
              onDrop={handleCalendarDrop}
            >
              {(dragPlaceId || dragItemId) && !ghostTime && (
                <div style={{ position: 'sticky', top: 0, zIndex: 5, background: 'rgba(232,25,125,0.08)', textAlign: 'center', padding: '8px', fontSize: '0.8rem', color: 'var(--red)', fontWeight: 500, borderBottom: '1px dashed var(--red)' }}>
                  Drop here to place on the calendar
                </div>
              )}

              <div ref={calendarRef} style={{ position: 'relative', height: CALENDAR_H, marginTop: '8px' }}>

                {/* Hour rows */}
                {Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => {
                  const h = START_HOUR + i;
                  return (
                    <div key={h} style={{ position: 'absolute', top: i * PX_PER_HOUR, left: 0, right: 0, display: 'flex', alignItems: 'flex-start', pointerEvents: 'none' }}>
                      <div style={{ width: LABEL_W, paddingTop: '2px', paddingRight: '8px', textAlign: 'right', flexShrink: 0 }}>
                        <span style={{ fontSize: '0.68rem', color: 'var(--ink-light)', fontWeight: 500 }}>
                          {h === 12 ? '12 PM' : h > 12 ? `${h-12} PM` : `${h} AM`}
                        </span>
                      </div>
                      <div style={{ flex: 1, borderTop: i === 0 ? 'none' : '1px solid var(--border)', height: 1 }} />
                    </div>
                  );
                })}

                {/* Half-hour ticks */}
                {Array.from({ length: END_HOUR - START_HOUR }, (_, i) => (
                  <div key={`h${i}`} style={{ position: 'absolute', top: (i + 0.5) * PX_PER_HOUR, left: LABEL_W, right: 0, borderTop: '1px dashed rgba(0,0,0,0.06)', pointerEvents: 'none' }} />
                ))}

                {/* Ghost preview block */}
                {ghostTime && (
                  <div style={{
                    position: 'absolute',
                    top: timeToTop(ghostTime),
                    left: LABEL_W + 4,
                    right: 4,
                    height: Math.max(ghostHeight, 24),
                    background: 'rgba(232,25,125,0.15)',
                    border: '2px dashed var(--red)',
                    borderRadius: 'var(--radius)',
                    display: 'flex', alignItems: 'center', padding: '0 10px',
                    pointerEvents: 'none', zIndex: 3
                  }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--red)', fontWeight: 600 }}>
                      {ghostTime} – {minsToTime(Math.min(timeToMins(ghostTime) + (dragItemId ? dragItemDur : DEFAULT_DUR), END_HOUR * 60))}
                    </span>
                  </div>
                )}

                {/* Scheduled item blocks */}
                {scheduled.map(item => {
                  const fullPlace = item.place_id ? allPlaces.find(p => p.id === item.place_id) : null;
                  const cc = CATEGORY_COLORS[item.place_category] || CATEGORY_COLORS.other;
                  const sc = fullPlace ? STATUS_COLORS[fullPlace.status] : null;
                  const startMins = timeToMins(item.start_time);
                  const endMins   = item.end_time ? timeToMins(item.end_time) : startMins + DEFAULT_DUR;
                  const top    = (startMins - START_HOUR * 60) / 60 * PX_PER_HOUR;
                  const height = Math.max((endMins - startMins) / 60 * PX_PER_HOUR, 28);
                  const col    = colMap.get(item.id) ?? 0;
                  const colW   = `calc((100% - ${LABEL_W + 8}px) / ${totalCols})`;
                  const left   = `calc(${LABEL_W + 4}px + ${col} * ${colW})`;
                  const isDragging = dragItemId === item.id;

                  return (
                    <div key={item.id}
                      draggable={!!user}
                      onDragStart={e => handleItemDragStart(e, item)}
                      onDragEnd={handleItemDragEnd}
                      style={{
                        position: 'absolute', top, left, width: `calc(${colW} - 4px)`,
                        height, zIndex: isDragging ? 0 : 2,
                        opacity: isDragging ? 0.25 : 1, transition: 'opacity 0.15s',
                        background: 'white',
                        border: `1.5px solid ${cc.border}`,
                        borderLeft: `4px solid ${cc.border}`,
                        borderRadius: 'var(--radius)',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                        overflow: 'hidden',
                        cursor: user ? 'grab' : 'default',
                        userSelect: 'none',
                        display: 'flex', flexDirection: 'column',
                      }}
                    >
                      <div style={{ padding: '4px 8px', flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '1px' }}>
                        {/* Time */}
                        <div style={{ fontSize: '0.65rem', color: cc.text, fontWeight: 700, letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                          {item.start_time?.slice(0,5)}{item.end_time ? ` – ${item.end_time.slice(0,5)}` : ''}
                        </div>
                        {/* Name */}
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.2, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: height > 60 ? 2 : 1, WebkitBoxOrient: 'vertical' }}>
                          {CATEGORY_ICONS[item.place_category]} {item.place_name || item.custom_title}
                        </div>

                        {/* Extended info — only if block is tall enough */}
                        {height > 70 && (fullPlace?.description || item.custom_description) && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--ink-mid)', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', marginTop: '2px' }}>
                            {fullPlace?.description || item.custom_description}
                          </div>
                        )}
                        {height > 100 && fullPlace?.notes && fullPlace.notes !== fullPlace?.description && (
                          <div style={{ fontSize: '0.69rem', color: 'var(--ink-light)', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {fullPlace.notes}
                          </div>
                        )}
                        {height > 80 && fullPlace?.address && (
                          <div style={{ fontSize: '0.69rem', color: 'var(--ink-light)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            📍 {fullPlace.address}
                          </div>
                        )}
                        {height > 110 && fullPlace?.price && (
                          <div style={{ fontSize: '0.69rem', color: 'var(--ink-light)' }}>💴 {fullPlace.price}</div>
                        )}
                        {height > 120 && fullPlace?.url && (
                          <a href={fullPlace.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.69rem', color: cc.text, textDecoration: 'none' }} onClick={e => e.stopPropagation()}>
                            🔗 Link
                          </a>
                        )}
                        {height > 90 && sc && (
                          <span style={{ fontSize: '0.62rem', fontWeight: 600, padding: '1px 5px', borderRadius: '3px', background: sc.bg, color: sc.color, alignSelf: 'flex-start', textTransform: 'capitalize', marginTop: 'auto' }}>
                            {fullPlace?.status}
                          </span>
                        )}
                      </div>

                      {/* Delete button */}
                      {user && (
                        <button
                          onClick={e => { e.stopPropagation(); handleDeleteItem(currentDay.id, item.id); }}
                          style={{ position: 'absolute', top: '2px', right: '3px', background: 'none', border: 'none', cursor: 'pointer', color: cc.border, fontSize: '10px', opacity: 0.6, padding: '1px 3px', lineHeight: 1 }}
                        >✕</button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>)}
        </div>

        {/* ── Planning sidebar ── */}
        <div style={{ width: '240px', minWidth: '240px', borderLeft: '1px solid var(--border)', background: 'var(--paper-warm)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-light)', marginBottom: '0.4rem' }}>Planning List</div>
            <p style={{ fontSize: '0.7rem', color: 'var(--ink-light)', marginBottom: '0.5rem', lineHeight: 1.4 }}>Drag onto the calendar to time-block. Default duration: 1 hr.</p>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {['all','considering','shortlisted','booked'].map(s => (
                <button key={s} onClick={() => setPlanFilter(s)} style={{
                  padding: '3px 8px', fontSize: '0.68rem', borderRadius: '999px', cursor: 'pointer', fontFamily: 'var(--font-body)', border: '1px solid',
                  borderColor: planFilter === s ? 'var(--ink)' : 'var(--border)',
                  background: planFilter === s ? 'var(--ink)' : 'transparent',
                  color: planFilter === s ? 'var(--paper)' : 'var(--ink-mid)'
                }}>{s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}</button>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
            {filteredPlanPlaces.length === 0
              ? <p style={{ padding: '1rem 0.5rem', fontSize: '0.8rem', color: 'var(--ink-light)', textAlign: 'center' }}>No places to show.</p>
              : filteredPlanPlaces.map(place => {
                const cc = CATEGORY_COLORS[place.category] || CATEGORY_COLORS.other;
                const sc = STATUS_COLORS[place.status];
                return (
                  <div key={place.id} draggable
                    onDragStart={e => handlePlanDragStart(e, place)}
                    onDragEnd={handlePlanDragEnd}
                    style={{
                      padding: '8px 10px', background: dragPlaceId === place.id ? 'var(--paper-dark)' : 'white',
                      border: `1px solid var(--border)`, borderLeft: `3px solid ${cc.border}`,
                      borderRadius: 'var(--radius)', marginBottom: '6px', cursor: 'grab',
                      opacity: dragPlaceId === place.id ? 0.4 : 1, boxShadow: 'var(--shadow-soft)', userSelect: 'none'
                    }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '13px', flexShrink: 0 }}>{CATEGORY_ICONS[place.category] || '📌'}</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{place.name}</span>
                    </div>
                    {place.description && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--ink-light)', marginTop: '3px', paddingLeft: '19px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{place.description}</div>
                    )}
                    <div style={{ display: 'flex', gap: '6px', marginTop: '4px', paddingLeft: '19px', flexWrap: 'wrap', alignItems: 'center' }}>
                      {place.city_id && <span style={{ fontSize: '0.67rem', color: 'var(--ink-light)' }}>{cities.find(c => c.id === place.city_id)?.name}</span>}
                      {sc && <span style={{ fontSize: '0.63rem', fontWeight: 600, padding: '1px 5px', borderRadius: '3px', background: sc.bg, color: sc.color, textTransform: 'capitalize' }}>{place.status}</span>}
                    </div>
                  </div>
                );
              })
            }
          </div>
        </div>
      </div>

      {showAddDay && <AddDayModal onClose={() => setShowAddDay(false)} onAdd={handleAddDay} cities={cities} />}
      {showAddItem && selectedDay && (
        <AddItemModal onClose={() => setShowAddItem(false)} onAdd={handleAddItem} day={selectedDay} places={allPlaces} prefillTime={addItemPrefillTime} />
      )}
    </div>
  );
}
