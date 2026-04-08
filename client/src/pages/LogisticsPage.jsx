import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

const S = {
  page: { maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem' },
  header: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' },
  title: { fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--ink)' },
  tabs: { display: 'flex', gap: 0, borderBottom: '2px solid var(--border)', marginBottom: '2rem' },
  tab: (active) => ({
    padding: '0.6rem 1.5rem',
    fontFamily: 'var(--font-body)',
    fontSize: '0.85rem',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    fontWeight: active ? 600 : 400,
    color: active ? 'var(--red)' : 'var(--ink-light)',
    background: 'none',
    border: 'none',
    borderBottom: active ? '2px solid var(--red)' : '2px solid transparent',
    marginBottom: '-2px',
    cursor: 'pointer'
  }),
  addBtn: {
    background: 'var(--red)', color: 'white', border: 'none',
    padding: '0.5rem 1.2rem', borderRadius: 'var(--radius)',
    fontSize: '0.85rem', letterSpacing: '0.06em', cursor: 'pointer'
  },
  card: {
    background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
    padding: '1.25rem 1.5rem', marginBottom: '1rem', boxShadow: 'var(--shadow-soft)',
    display: 'flex', flexDirection: 'column', gap: '0.5rem'
  },
  cardTop: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' },
  cardTitle: { fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '0.5rem' },
  routeTitle: { fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '0.5rem' },
  arrow: { color: 'var(--red)', fontWeight: 300 },
  meta: { display: 'flex', flexWrap: 'wrap', gap: '0.75rem 1.5rem', marginTop: '0.25rem' },
  metaItem: { fontSize: '0.82rem', color: 'var(--ink-light)', display: 'flex', gap: '0.35rem', alignItems: 'center' },
  metaLabel: { fontWeight: 600, color: 'var(--ink-mid)', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.06em' },
  badge: (variant) => {
    const map = {
      booked: { bg: '#e8f5e9', color: '#2e7d32' },
      cancelled: { bg: '#fdecea', color: '#c0392b' },
      considering: { bg: '#fff8e1', color: '#856404' },
      safety: { bg: '#fdecea', color: '#c0392b' },
      emergency: { bg: '#fdecea', color: '#c0392b' },
      visa: { bg: '#e8f0fe', color: '#1a56db' },
      'travel-info': { bg: '#e8f5e9', color: '#2e7d32' },
      booking: { bg: '#fff8e1', color: '#856404' },
      other: { bg: 'var(--paper-warm)', color: 'var(--ink-light)' },
    };
    const { bg, color } = map[variant] || map.other;
    return {
      display: 'inline-block', padding: '2px 8px', borderRadius: 'var(--radius)',
      fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase',
      background: bg, color
    };
  },
  actions: { display: 'flex', gap: '0.5rem', flexShrink: 0 },
  iconBtn: {
    background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
    padding: '4px 10px', fontSize: '0.75rem', color: 'var(--ink-light)', cursor: 'pointer'
  },
  notes: { fontSize: '0.82rem', color: 'var(--ink-light)', fontStyle: 'italic', borderTop: '1px solid var(--border)', paddingTop: '0.5rem', marginTop: '0.25rem' },
  addedBy: { fontSize: '0.75rem', color: 'var(--ink-light)', marginTop: '0.25rem' },
  empty: { textAlign: 'center', padding: '4rem 2rem', color: 'var(--ink-light)', fontSize: '0.9rem' },

  // Modal
  overlay: { position: 'fixed', inset: 0, background: 'rgba(26,18,8,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' },
  modal: { background: 'var(--paper)', borderRadius: 'var(--radius-lg)', padding: '2rem', width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  modalTitle: { fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '1.5rem' },
  field: { marginBottom: '1rem' },
  label: { display: 'block', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-mid)', marginBottom: '0.4rem' },
  input: { width: '100%', padding: '0.55rem 0.75rem', border: '1px solid var(--border-mid)', borderRadius: 'var(--radius)', fontSize: '0.9rem', fontFamily: 'var(--font-body)', background: 'white', color: 'var(--ink)' },
  select: { width: '100%', padding: '0.55rem 0.75rem', border: '1px solid var(--border-mid)', borderRadius: 'var(--radius)', fontSize: '0.9rem', fontFamily: 'var(--font-body)', background: 'white', color: 'var(--ink)' },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' },
  modalFooter: { display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' },
  cancelBtn: { background: 'none', border: '1px solid var(--border-mid)', borderRadius: 'var(--radius)', padding: '0.5rem 1.2rem', fontSize: '0.85rem', cursor: 'pointer', color: 'var(--ink-mid)' },
  saveBtn: { background: 'var(--red)', color: 'white', border: 'none', borderRadius: 'var(--radius)', padding: '0.5rem 1.5rem', fontSize: '0.85rem', cursor: 'pointer' },

  // Cost summary
  summary: { background: 'var(--ink)', color: 'var(--paper)', borderRadius: 'var(--radius-lg)', padding: '1.25rem 1.5rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center' },
  summaryTotal: { fontFamily: 'var(--font-display)', fontSize: '1.6rem' },
  summaryLabel: { fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.6)', marginBottom: '2px' },
  summaryBreakdown: { display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1.5rem', flex: 1 },
  summaryPill: { fontSize: '0.8rem', color: 'var(--paper-dark)' }
};

function fmt(dt) {
  if (!dt) return null;
  return new Date(dt.slice(0, 16)).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function fmtDate(d) {
  if (!d) return null;
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Shared modal shell ────────────────────────────────────────────────────────

function Modal({ title, onClose, onSubmit, saving, saveLabel, children }) {
  return (
    <div style={S.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={S.modal}>
        <h2 style={S.modalTitle}>{title}</h2>
        <form onSubmit={onSubmit}>
          {children}
          <div style={S.modalFooter}>
            <button type="button" style={S.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" style={S.saveBtn} disabled={saving}>{saving ? 'Saving…' : saveLabel}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Flights ───────────────────────────────────────────────────────────────────

function FlightModal({ flight, onSave, onClose }) {
  const [form, setForm] = useState({
    airline: flight?.airline || '',
    flight_number: flight?.flight_number || '',
    from_location: flight?.from_location || '',
    to_location: flight?.to_location || '',
    departure_datetime: flight?.departure_datetime ? flight.departure_datetime.slice(0, 16) : '',
    arrival_datetime: flight?.arrival_datetime ? flight.arrival_datetime.slice(0, 16) : '',
    booking_reference: flight?.booking_reference || '',
    price: flight?.price || '',
    notes: flight?.notes || ''
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { ...form };
      if (!data.departure_datetime) delete data.departure_datetime;
      if (!data.arrival_datetime) delete data.arrival_datetime;
      onSave(flight ? await api.updateFlight(flight.id, data) : await api.createFlight(data));
      onClose();
    } catch (err) { alert(err.message); } finally { setSaving(false); }
  }

  return (
    <Modal title={flight ? 'Edit Flight' : 'Add Flight'} onClose={onClose} onSubmit={handleSubmit} saving={saving} saveLabel="Save Flight">
      <div style={S.row2}>
        <div style={S.field}><label style={S.label}>From *</label><input style={S.input} value={form.from_location} onChange={e => set('from_location', e.target.value)} required placeholder="London Heathrow" /></div>
        <div style={S.field}><label style={S.label}>To *</label><input style={S.input} value={form.to_location} onChange={e => set('to_location', e.target.value)} required placeholder="Osaka Kansai" /></div>
      </div>
      <div style={S.row2}>
        <div style={S.field}><label style={S.label}>Airline</label><input style={S.input} value={form.airline} onChange={e => set('airline', e.target.value)} placeholder="ANA, JAL…" /></div>
        <div style={S.field}><label style={S.label}>Flight Number</label><input style={S.input} value={form.flight_number} onChange={e => set('flight_number', e.target.value)} placeholder="NH205" /></div>
      </div>
      <div style={S.row2}>
        <div style={S.field}><label style={S.label}>Departure</label><input style={S.input} type="datetime-local" value={form.departure_datetime} onChange={e => set('departure_datetime', e.target.value)} /></div>
        <div style={S.field}><label style={S.label}>Arrival</label><input style={S.input} type="datetime-local" value={form.arrival_datetime} onChange={e => set('arrival_datetime', e.target.value)} /></div>
      </div>
      <div style={S.row2}>
        <div style={S.field}><label style={S.label}>Booking Reference</label><input style={S.input} value={form.booking_reference} onChange={e => set('booking_reference', e.target.value)} placeholder="ABC123" /></div>
        <div style={S.field}><label style={S.label}>Price</label><input style={S.input} value={form.price} onChange={e => set('price', e.target.value)} placeholder="£450 total" /></div>
      </div>
      <div style={S.field}><label style={S.label}>Notes</label><input style={S.input} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Luggage, seat numbers…" /></div>
    </Modal>
  );
}

function FlightCard({ flight, onEdit, onDelete, canEdit }) {
  return (
    <div style={S.card}>
      <div style={S.cardTop}>
        <div style={S.routeTitle}>
          <span>{flight.from_location}</span>
          <span style={S.arrow}>→</span>
          <span>{flight.to_location}</span>
        </div>
        {canEdit && <div style={S.actions}>
          <button style={S.iconBtn} onClick={() => onEdit(flight)}>Edit</button>
          <button style={{ ...S.iconBtn, color: 'var(--red)' }} onClick={() => onDelete(flight.id)}>Delete</button>
        </div>}
      </div>
      <div style={S.meta}>
        {flight.airline && <span style={S.metaItem}><span style={S.metaLabel}>Airline</span>{flight.airline}{flight.flight_number ? ` · ${flight.flight_number}` : ''}</span>}
        {flight.departure_datetime && <span style={S.metaItem}><span style={S.metaLabel}>Departs</span>{fmt(flight.departure_datetime)}</span>}
        {flight.arrival_datetime && <span style={S.metaItem}><span style={S.metaLabel}>Arrives</span>{fmt(flight.arrival_datetime)}</span>}
        {flight.booking_reference && <span style={S.metaItem}><span style={S.metaLabel}>Ref</span><strong>{flight.booking_reference}</strong></span>}
        {flight.price && <span style={S.metaItem}><span style={S.metaLabel}>Price</span>{flight.price}</span>}
      </div>
      {flight.notes && <div style={S.notes}>{flight.notes}</div>}
      <div style={S.addedBy}>Added by {flight.added_by_name || 'unknown'}</div>
    </div>
  );
}

// ── Accommodation ─────────────────────────────────────────────────────────────

function AccomModal({ accom, cities, onSave, onClose }) {
  const [form, setForm] = useState({
    city_id: accom?.city_id || '',
    name: accom?.name || '',
    address: accom?.address || '',
    check_in: accom?.check_in ? accom.check_in.slice(0, 10) : '',
    check_out: accom?.check_out ? accom.check_out.slice(0, 10) : '',
    booking_reference: accom?.booking_reference || '',
    price_per_night: accom?.price_per_night || '',
    total_price: accom?.total_price || '',
    url: accom?.url || '',
    notes: accom?.notes || '',
    status: accom?.status || 'considering'
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { ...form, city_id: form.city_id || null };
      onSave(accom ? await api.updateAccommodation(accom.id, data) : await api.createAccommodation(data));
      onClose();
    } catch (err) { alert(err.message); } finally { setSaving(false); }
  }

  return (
    <Modal title={accom ? 'Edit Accommodation' : 'Add Accommodation'} onClose={onClose} onSubmit={handleSubmit} saving={saving} saveLabel="Save Accommodation">
      <div style={S.field}><label style={S.label}>Name *</label><input style={S.input} value={form.name} onChange={e => set('name', e.target.value)} required placeholder="Hotel Monterey Osaka" /></div>
      <div style={S.row2}>
        <div style={S.field}><label style={S.label}>City</label>
          <select style={S.select} value={form.city_id} onChange={e => set('city_id', e.target.value)}>
            <option value="">— any —</option>
            {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div style={S.field}><label style={S.label}>Status</label>
          <select style={S.select} value={form.status} onChange={e => set('status', e.target.value)}>
            <option value="considering">Considering</option>
            <option value="booked">Booked</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>
      <div style={S.field}><label style={S.label}>Address</label><input style={S.input} value={form.address} onChange={e => set('address', e.target.value)} placeholder="Full address" /></div>
      <div style={S.row2}>
        <div style={S.field}><label style={S.label}>Check-in</label><input style={S.input} type="date" value={form.check_in} onChange={e => set('check_in', e.target.value)} /></div>
        <div style={S.field}><label style={S.label}>Check-out</label><input style={S.input} type="date" value={form.check_out} onChange={e => set('check_out', e.target.value)} /></div>
      </div>
      <div style={S.row2}>
        <div style={S.field}><label style={S.label}>Price / Night</label><input style={S.input} value={form.price_per_night} onChange={e => set('price_per_night', e.target.value)} placeholder="¥12,000" /></div>
        <div style={S.field}><label style={S.label}>Total Price</label><input style={S.input} value={form.total_price} onChange={e => set('total_price', e.target.value)} placeholder="¥60,000" /></div>
      </div>
      <div style={S.field}><label style={S.label}>Booking Reference</label><input style={S.input} value={form.booking_reference} onChange={e => set('booking_reference', e.target.value)} placeholder="XYZ987654" /></div>
      <div style={S.field}><label style={S.label}>URL</label><input style={S.input} type="url" value={form.url} onChange={e => set('url', e.target.value)} placeholder="https://…" /></div>
      <div style={S.field}><label style={S.label}>Notes</label><input style={S.input} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Free breakfast, late checkout arranged…" /></div>
    </Modal>
  );
}

function AccomCard({ accom, onEdit, onDelete, canEdit }) {
  const nights = accom.check_in && accom.check_out
    ? Math.round((new Date(accom.check_out) - new Date(accom.check_in)) / 86400000)
    : null;
  return (
    <div style={S.card}>
      <div style={S.cardTop}>
        <div>
          <div style={S.cardTitle}>
            {accom.name}
            {accom.city_name && <span style={{ fontSize: '0.85rem', fontWeight: 300, color: 'var(--ink-light)' }}>— {accom.city_name}</span>}
          </div>
          <span style={S.badge(accom.status)}>{accom.status}</span>
        </div>
        {canEdit && <div style={S.actions}>
          <button style={S.iconBtn} onClick={() => onEdit(accom)}>Edit</button>
          <button style={{ ...S.iconBtn, color: 'var(--red)' }} onClick={() => onDelete(accom.id)}>Delete</button>
        </div>}
      </div>
      <div style={S.meta}>
        {accom.check_in && <span style={S.metaItem}><span style={S.metaLabel}>Check-in</span>{fmtDate(accom.check_in)}</span>}
        {accom.check_out && <span style={S.metaItem}><span style={S.metaLabel}>Check-out</span>{fmtDate(accom.check_out)}</span>}
        {nights !== null && <span style={S.metaItem}><span style={S.metaLabel}>Nights</span>{nights}</span>}
        {accom.booking_reference && <span style={S.metaItem}><span style={S.metaLabel}>Ref</span><strong>{accom.booking_reference}</strong></span>}
        {accom.price_per_night && <span style={S.metaItem}><span style={S.metaLabel}>Per night</span>{accom.price_per_night}</span>}
        {accom.total_price && <span style={S.metaItem}><span style={S.metaLabel}>Total</span>{accom.total_price}</span>}
      </div>
      {accom.address && <div style={{ ...S.metaItem, marginTop: '0.1rem' }}><span style={S.metaLabel}>Address</span>{accom.address}</div>}
      {accom.url && <div style={{ marginTop: '0.25rem' }}><a href={accom.url} target="_blank" rel="noreferrer" style={{ color: 'var(--red)', fontSize: '0.82rem' }}>View booking ↗</a></div>}
      {accom.notes && <div style={S.notes}>{accom.notes}</div>}
      <div style={S.addedBy}>Added by {accom.added_by_name || 'unknown'}</div>
    </div>
  );
}

// ── Important Links ───────────────────────────────────────────────────────────

const LINK_CATEGORIES = [
  { value: 'safety',      label: 'Safety' },
  { value: 'emergency',   label: 'Emergency' },
  { value: 'visa',        label: 'Visa & Entry' },
  { value: 'travel-info', label: 'Travel Info' },
  { value: 'booking',     label: 'Booking' },
  { value: 'other',       label: 'Other' },
];

function LinkModal({ link, onSave, onClose }) {
  const [form, setForm] = useState({
    title: link?.title || '',
    url: link?.url || '',
    description: link?.description || '',
    category: link?.category || 'other'
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      onSave(link ? await api.updateLink(link.id, form) : await api.createLink(form));
      onClose();
    } catch (err) { alert(err.message); } finally { setSaving(false); }
  }

  return (
    <Modal title={link ? 'Edit Link' : 'Add Link'} onClose={onClose} onSubmit={handleSubmit} saving={saving} saveLabel="Save Link">
      <div style={S.field}><label style={S.label}>Title *</label><input style={S.input} value={form.title} onChange={e => set('title', e.target.value)} required placeholder="Smart Traveller — Japan" /></div>
      <div style={S.field}><label style={S.label}>URL *</label><input style={S.input} type="url" value={form.url} onChange={e => set('url', e.target.value)} required placeholder="https://…" /></div>
      <div style={S.field}><label style={S.label}>Category</label>
        <select style={S.select} value={form.category} onChange={e => set('category', e.target.value)}>
          {LINK_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>
      <div style={S.field}><label style={S.label}>Description</label><input style={S.input} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Official travel advisories and registration" /></div>
    </Modal>
  );
}

function LinkCard({ link, onEdit, onDelete, canEdit }) {
  const catLabel = LINK_CATEGORIES.find(c => c.value === link.category)?.label || link.category;
  return (
    <div style={S.card}>
      <div style={S.cardTop}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <a href={link.url} target="_blank" rel="noreferrer" style={{ ...S.cardTitle, color: 'var(--red)', fontSize: '1.1rem', textDecoration: 'none' }}>
              {link.title} ↗
            </a>
          </div>
          <span style={S.badge(link.category)}>{catLabel}</span>
        </div>
        {canEdit && <div style={S.actions}>
          <button style={S.iconBtn} onClick={() => onEdit(link)}>Edit</button>
          <button style={{ ...S.iconBtn, color: 'var(--red)' }} onClick={() => onDelete(link.id)}>Delete</button>
        </div>}
      </div>
      {link.description && <div style={{ fontSize: '0.85rem', color: 'var(--ink-mid)' }}>{link.description}</div>}
      <div style={{ fontSize: '0.75rem', color: 'var(--ink-light)', wordBreak: 'break-all' }}>{link.url}</div>
      <div style={S.addedBy}>Added by {link.added_by_name || 'unknown'}</div>
    </div>
  );
}

// ── Costs ─────────────────────────────────────────────────────────────────────

const COST_CATEGORIES = [
  { value: 'flights',            label: 'Flights' },
  { value: 'accommodation',      label: 'Accommodation' },
  { value: 'food',               label: 'Food & Drink' },
  { value: 'activities',         label: 'Activities' },
  { value: 'transport',          label: 'Transport' },
  { value: 'shopping',           label: 'Shopping' },
  { value: 'travel_insurance',   label: 'Travel Insurance' },
  { value: 'esim',               label: 'eSIM' },
  { value: 'other',              label: 'Other' },
];

const COST_CAT_COLORS = {
  flights:          '#e8f0fe',
  accommodation:    '#e8f5e9',
  food:             '#fff3e0',
  activities:       '#f3e5f5',
  transport:        '#e0f7fa',
  shopping:         '#fce4ec',
  travel_insurance: '#fde8f0',
  esim:             '#e8f9f5',
  other:            'var(--paper-warm)'
};

function fmt$( amount) {
  return `A$ ${parseFloat(amount).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function CostSummary({ costs, flights = [], accoms = [] }) {
  const byCat = {};

  costs.forEach(c => {
    byCat[c.category] = (byCat[c.category] || 0) + parseFloat(c.amount || 0);
  });

  const flightTotal = flights.reduce((sum, f) => {
    const n = parseFloat(f.price);
    return sum + (isNaN(n) ? 0 : n);
  }, 0);
  if (flightTotal > 0) byCat['flights'] = (byCat['flights'] || 0) + flightTotal;

  const accomTotal = accoms.reduce((sum, a) => {
    const n = parseFloat(a.total_price);
    return sum + (isNaN(n) ? 0 : n);
  }, 0);
  if (accomTotal > 0) byCat['accommodation'] = (byCat['accommodation'] || 0) + accomTotal;

  const total = Object.values(byCat).reduce((s, v) => s + v, 0);

  if (total === 0 && costs.length === 0 && flights.length === 0 && accoms.length === 0) return null;

  return (
    <div style={S.summary}>
      <div>
        <div style={S.summaryLabel}>Total</div>
        <div style={S.summaryTotal}>{fmt$(total)}</div>
      </div>
      <div style={S.summaryBreakdown}>
        {Object.entries(byCat).map(([cat, catTotal]) => {
          const label = COST_CATEGORIES.find(c => c.value === cat)?.label || cat;
          return (
            <div key={cat} style={S.summaryPill}>
              <span style={{ opacity: 0.6 }}>{label}</span>{' '}
              <span style={{ fontWeight: 600 }}>{fmt$(catTotal)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CostModal({ cost, onSave, onClose }) {
  const [form, setForm] = useState({
    title: cost?.title || '',
    amount: cost?.amount || '',
    category: cost?.category || 'other',
    date: cost?.date ? cost.date.slice(0, 10) : '',
    paid_by: cost?.paid_by || '',
    notes: cost?.notes || ''
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { ...form, amount: parseFloat(form.amount), currency: 'AUD' };
      onSave(cost ? await api.updateCost(cost.id, data) : await api.createCost(data));
      onClose();
    } catch (err) { alert(err.message); } finally { setSaving(false); }
  }

  return (
    <Modal title={cost ? 'Edit Cost' : 'Add Cost'} onClose={onClose} onSubmit={handleSubmit} saving={saving} saveLabel="Save Cost">
      <div style={S.field}><label style={S.label}>Description *</label><input style={S.input} value={form.title} onChange={e => set('title', e.target.value)} required placeholder="Return flights SYD–KIX" /></div>
      <div style={S.row2}>
        <div style={S.field}>
          <label style={S.label}>Amount (AUD) *</label>
          <input style={S.input} type="number" step="0.01" min="0" value={form.amount} onChange={e => set('amount', e.target.value)} required placeholder="0.00" />
        </div>
        <div style={S.field}><label style={S.label}>Category</label>
          <select style={S.select} value={form.category} onChange={e => set('category', e.target.value)}>
            {COST_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
      </div>
      <div style={S.row2}>
        <div style={S.field}><label style={S.label}>Date</label><input style={S.input} type="date" value={form.date} onChange={e => set('date', e.target.value)} /></div>
        <div style={S.field}><label style={S.label}>Paid by</label><input style={S.input} value={form.paid_by} onChange={e => set('paid_by', e.target.value)} placeholder="Who paid this?" /></div>
      </div>
      <div style={S.field}><label style={S.label}>Notes</label><input style={S.input} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any extra details…" /></div>
    </Modal>
  );
}

function CostCard({ cost, onEdit, onDelete, canEdit, users, isAdmin, onTogglePayment }) {
  const catLabel = COST_CATEGORIES.find(c => c.value === cost.category)?.label || cost.category;
  const paidIds = cost.paid_user_ids || [];
  return (
    <div style={{ ...S.card, borderLeft: '3px solid', borderLeftColor: COST_CAT_COLORS[cost.category] || 'var(--border)' }}>
      <div style={S.cardTop}>
        <div>
          <div style={S.cardTitle}>{cost.title}</div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--ink)' }}>{fmt$(cost.amount)}</span>
            <span style={{ ...S.badge('other'), background: COST_CAT_COLORS[cost.category] }}>{catLabel}</span>
          </div>
        </div>
        {canEdit && <div style={S.actions}>
          <button style={S.iconBtn} onClick={() => onEdit(cost)}>Edit</button>
          <button style={{ ...S.iconBtn, color: 'var(--red)' }} onClick={() => onDelete(cost.id)}>Delete</button>
        </div>}
      </div>
      <div style={S.meta}>
        {cost.date && <span style={S.metaItem}><span style={S.metaLabel}>Date</span>{fmtDate(cost.date)}</span>}
        {cost.paid_by && <span style={S.metaItem}><span style={S.metaLabel}>Paid by</span>{cost.paid_by}</span>}
      </div>
      {cost.notes && <div style={S.notes}>{cost.notes}</div>}

      {users.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.6rem', marginTop: '0.25rem' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--ink-mid)', marginBottom: '0.4rem' }}>
            Who's paid{' '}
            <span style={{ fontWeight: 400, color: 'var(--ink-light)' }}>({paidIds.length}/{users.length})</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
            {users.map(u => {
              const paid = paidIds.includes(u.id);
              return (
                <button
                  key={u.id}
                  onClick={() => isAdmin && onTogglePayment(cost.id, u.id)}
                  title={paid ? `${u.display_name} — paid ✓` : `${u.display_name} — not paid yet${isAdmin ? ' (click to mark paid)' : ''}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    padding: '3px 9px 3px 5px', borderRadius: '999px',
                    border: '1px solid ' + (paid ? '#2e7d32' : 'var(--border)'),
                    background: paid ? '#e8f5e9' : 'white',
                    cursor: isAdmin ? 'pointer' : 'default',
                    fontSize: '0.75rem', fontFamily: 'var(--font-body)',
                    color: paid ? '#2e7d32' : 'var(--ink-light)',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: u.avatar_color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: 'white', fontWeight: 700, flexShrink: 0 }}>
                    {u.display_name.slice(0, 1).toUpperCase()}
                  </div>
                  {u.display_name}
                  {paid && <span style={{ fontSize: '10px' }}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div style={S.addedBy}>Added by {cost.added_by_name || 'unknown'}</div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'costs', label: 'Costs' },
  { id: 'links', label: 'Links' },
];

const sectionHead = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  margin: '2rem 0 1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)'
};
const sectionTitle = { fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--ink)' };
const smallAddBtn = {
  background: 'var(--ink)', color: 'white', border: 'none',
  padding: '0.35rem 0.9rem', borderRadius: 'var(--radius)',
  fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'var(--font-body)'
};

export default function LogisticsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('costs');
  const [costFilter, setCostFilter] = useState('all');
  const [flights, setFlights] = useState([]);
  const [accoms, setAccoms] = useState([]);
  const [links, setLinks] = useState([]);
  const [costs, setCosts] = useState([]);
  const [cities, setCities] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  useEffect(() => {
    Promise.all([api.flights(), api.accommodations(), api.links(), api.costs(), api.cities(), api.users()])
      .then(([f, a, l, c, ci, u]) => { setFlights(f); setAccoms(a); setLinks(l); setCosts(c); setCities(ci); setUsers(u); })
      .finally(() => setLoading(false));
  }, []);

  async function handleTogglePayment(costId, userId) {
    try {
      const { paid_user_ids } = await api.toggleCostPayment(costId, userId);
      setCosts(prev => prev.map(c => c.id === costId ? { ...c, paid_user_ids } : c));
    } catch {}
  }

  const counts = { costs: flights.length + accoms.length + costs.length, links: links.length };

  function upsert(setter, saved) {
    setter(prev => {
      const idx = prev.findIndex(x => x.id === saved.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next; }
      return [...prev, saved];
    });
  }

  async function del(setter, apiFn, id, label) {
    if (!confirm(`Delete this ${label}?`)) return;
    await apiFn(id);
    setter(prev => prev.filter(x => x.id !== id));
  }

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--ink-light)' }}>Loading…</div>;

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.title}>費用 Costs</h1>
        {tab === 'links' && user && (
          <button style={S.addBtn} onClick={() => setModal({ type: 'links', data: null })}>+ Add Link</button>
        )}
      </div>

      <div style={S.tabs}>
        {TABS.map(t => (
          <button key={t.id} style={S.tab(tab === t.id)} onClick={() => setTab(t.id)}>
            {t.label}{counts[t.id] > 0 ? ` (${counts[t.id]})` : ''}
          </button>
        ))}
      </div>

      {tab === 'costs' && (
        <>
          <CostSummary costs={costs} flights={flights} accoms={accoms} />

          {/* Flights */}
          <div style={sectionHead}>
            <span style={sectionTitle}>✈ Flights</span>
            {user && <button style={smallAddBtn} onClick={() => setModal({ type: 'flights', data: null })}>+ Add Flight</button>}
          </div>
          {flights.length === 0
            ? <div style={{ ...S.empty, padding: '1.25rem', textAlign: 'left', fontSize: '0.85rem' }}>No flights yet.{user ? ' Click "+ Add Flight" to get started.' : ''}</div>
            : flights.map(f => <FlightCard key={f.id} flight={f} canEdit={!!user} onEdit={d => setModal({ type: 'flights', data: d })} onDelete={id => del(setFlights, api.deleteFlight, id, 'flight')} />)
          }

          {/* Accommodation */}
          <div style={sectionHead}>
            <span style={sectionTitle}>🏨 Accommodation</span>
            {user && <button style={smallAddBtn} onClick={() => setModal({ type: 'accommodation', data: null })}>+ Add Accommodation</button>}
          </div>
          {accoms.length === 0
            ? <div style={{ ...S.empty, padding: '1.25rem', textAlign: 'left', fontSize: '0.85rem' }}>No accommodation yet.{user ? ' Click "+ Add Accommodation" to get started.' : ''}</div>
            : accoms.map(a => <AccomCard key={a.id} accom={a} canEdit={!!user} onEdit={d => setModal({ type: 'accommodation', data: d })} onDelete={id => del(setAccoms, api.deleteAccommodation, id, 'accommodation')} />)
          }

          {/* Cost items */}
          <div style={sectionHead}>
            <span style={sectionTitle}>💴 Cost Items</span>
            {user && <button style={smallAddBtn} onClick={() => setModal({ type: 'costs', data: null })}>+ Add Cost</button>}
          </div>
          {costs.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.25rem' }}>
              <button onClick={() => setCostFilter('all')} style={{ padding: '4px 14px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: costFilter === 'all' ? 600 : 400, cursor: 'pointer', border: '1px solid', borderColor: costFilter === 'all' ? 'var(--ink)' : 'var(--border)', background: costFilter === 'all' ? 'var(--ink)' : 'white', color: costFilter === 'all' ? 'var(--paper)' : 'var(--ink-light)' }}>
                All ({costs.length})
              </button>
              {COST_CATEGORIES.filter(cat => costs.some(c => c.category === cat.value)).map(cat => {
                const count = costs.filter(c => c.category === cat.value).length;
                const active = costFilter === cat.value;
                return (
                  <button key={cat.value} onClick={() => setCostFilter(cat.value)} style={{ padding: '4px 14px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: active ? 600 : 400, cursor: 'pointer', border: '1px solid', borderColor: active ? 'var(--ink)' : 'var(--border)', background: active ? COST_CAT_COLORS[cat.value] : 'white', color: active ? 'var(--ink)' : 'var(--ink-light)' }}>
                    {cat.label} ({count})
                  </button>
                );
              })}
            </div>
          )}
          {costs.length === 0
            ? <div style={{ ...S.empty, padding: '1.25rem', textAlign: 'left', fontSize: '0.85rem' }}>No costs tracked yet.{user ? ' Add flights, accommodation, activities…' : ' Sign in to add costs.'}</div>
            : costs
                .filter(c => costFilter === 'all' || c.category === costFilter)
                .map(c => <CostCard key={c.id} cost={c} canEdit={!!user} onEdit={d => setModal({ type: 'costs', data: d })} onDelete={id => del(setCosts, api.deleteCost, id, 'cost')} users={users} isAdmin={!!user?.is_admin} onTogglePayment={handleTogglePayment} />)
          }
        </>
      )}

      {tab === 'links' && (
        <>
          {links.length === 0
            ? <div style={S.empty}>No links yet.{user ? ' Add important links like Safe Traveler, visa info, emergency contacts…' : ' Sign in to add links.'}</div>
            : links.map(l => <LinkCard key={l.id} link={l} canEdit={!!user} onEdit={d => setModal({ type: 'links', data: d })} onDelete={id => del(setLinks, api.deleteLink, id, 'link')} />)
          }
        </>
      )}

      {modal?.type === 'flights' && <FlightModal flight={modal.data} onSave={s => upsert(setFlights, s)} onClose={() => setModal(null)} />}
      {modal?.type === 'accommodation' && <AccomModal accom={modal.data} cities={cities} onSave={s => upsert(setAccoms, s)} onClose={() => setModal(null)} />}
      {modal?.type === 'links' && <LinkModal link={modal.data} onSave={s => upsert(setLinks, s)} onClose={() => setModal(null)} />}
      {modal?.type === 'costs' && <CostModal cost={modal.data} onSave={s => upsert(setCosts, s)} onClose={() => setModal(null)} />}
    </div>
  );
}
