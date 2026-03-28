import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Hero */}
      <div style={{ flex: 1, background: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', position: 'relative', overflow: 'hidden' }}>
        {/* Background kanji */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '40vw', color: 'rgba(255,255,255,0.025)', lineHeight: 1, userSelect: 'none' }}>日</span>
        </div>
        {/* Red stripe */}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: 'var(--red)' }} />

        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--red)', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
            日本 · 旅行
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(3rem, 8vw, 6rem)', color: 'var(--paper)', lineHeight: 1, marginBottom: '1.5rem', fontWeight: 800 }}>
            Japan Trip
          </h1>
          <p style={{ color: 'var(--paper-dark)', fontSize: '1rem', marginBottom: '3rem', maxWidth: '400px', margin: '0 auto 3rem', fontWeight: 300 }}>
            Plan, vote, and coordinate the trip with the group. One place for everything.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/plan" style={{
              padding: '14px 32px', background: 'var(--red)', color: 'white',
              borderRadius: 'var(--radius)', fontWeight: 500, fontSize: '0.9rem',
              letterSpacing: '0.06em', textDecoration: 'none', transition: 'background 0.15s',
              fontFamily: 'var(--font-body)'
            }}>
              Start planning
            </Link>
            <Link to="/trip" style={{
              padding: '14px 32px', background: 'transparent', color: 'var(--paper)',
              border: '1px solid rgba(245,240,232,0.3)', borderRadius: 'var(--radius)',
              fontWeight: 400, fontSize: '0.9rem', letterSpacing: '0.06em',
              textDecoration: 'none', fontFamily: 'var(--font-body)'
            }}>
              View itinerary
            </Link>
          </div>
        </div>
      </div>

      {/* Feature strip */}
      <div style={{ background: 'var(--paper-warm)', borderTop: '3px solid var(--red)', padding: '2.5rem 2rem' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
          {[
            { kanji: '投票', title: 'Vote on places', desc: 'Everyone votes on hotels, restaurants and attractions before anything is decided.' },
            { kanji: '地図', title: 'See it on the map', desc: 'The trip page shows all your booked spots plotted on an interactive map.' },
            { kanji: '計画', title: 'Plan together', desc: 'Each friend has an account. Add places, leave comments, and update statuses.' }
          ].map(f => (
            <div key={f.kanji} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', color: 'var(--red)', marginBottom: '0.5rem', opacity: 0.7 }}>{f.kanji}</div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: '0.4rem', color: 'var(--ink)' }}>{f.title}</h3>
              <p style={{ fontSize: '0.83rem', color: 'var(--ink-light)', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
