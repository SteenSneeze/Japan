import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Hero */}
      <div style={{ flex: 1, background: 'var(--grad-hero)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5rem 2rem', position: 'relative', overflow: 'hidden' }}>
        {/* Background kanji */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '40vw', color: 'rgba(255,255,255,0.04)', lineHeight: 1, userSelect: 'none' }}>日</span>
        </div>
        {/* Accent stripe */}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '5px', background: 'var(--grad-accent)' }} />
        {/* Glow */}
        <div style={{ position: 'absolute', top: '20%', left: '30%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(232,25,125,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--red)', letterSpacing: '0.35em', textTransform: 'uppercase', marginBottom: '1.5rem', filter: 'drop-shadow(0 0 12px rgba(232,25,125,0.6))' }}>
            日本 · 旅行
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(3.5rem, 9vw, 7rem)', color: 'white', lineHeight: 1, marginBottom: '1.5rem', fontWeight: 800, textShadow: '0 2px 40px rgba(15,14,42,0.5)' }}>
            Japan Trip
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '1.05rem', maxWidth: '420px', margin: '0 auto 3rem', fontWeight: 300, lineHeight: 1.7 }}>
            Plan, vote, and coordinate the trip with the group. One place for everything.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/plan" style={{
              padding: '14px 36px', background: 'var(--grad-accent)', color: 'white',
              borderRadius: 'var(--radius)', fontWeight: 600, fontSize: '0.9rem',
              letterSpacing: '0.06em', textDecoration: 'none',
              fontFamily: 'var(--font-body)', boxShadow: '0 4px 20px rgba(232,25,125,0.45)'
            }}>
              Start planning
            </Link>
            <Link to="/trip" style={{
              padding: '14px 36px', background: 'rgba(255,255,255,0.1)', color: 'white',
              border: '1.5px solid rgba(255,255,255,0.25)', borderRadius: 'var(--radius)',
              fontWeight: 500, fontSize: '0.9rem', letterSpacing: '0.06em',
              textDecoration: 'none', fontFamily: 'var(--font-body)',
              backdropFilter: 'blur(4px)'
            }}>
              View itinerary
            </Link>
          </div>
        </div>
      </div>

      {/* Feature strip */}
      <div style={{ background: 'white', borderTop: '3px solid var(--red)', padding: '3rem 2rem', boxShadow: '0 -4px 24px rgba(15,14,42,0.06)' }}>
        <div style={{ maxWidth: '840px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2.5rem' }}>
          {[
            { kanji: '投票', title: 'Vote on places', desc: 'Everyone votes on hotels, restaurants and attractions before anything is decided.' },
            { kanji: '地図', title: 'See it on the map', desc: 'The trip page shows all your booked spots plotted on an interactive map of Japan.' },
            { kanji: '計画', title: 'Plan together', desc: 'Each friend has an account. Add places, leave comments, and update statuses.' }
          ].map(f => (
            <div key={f.kanji} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.8rem', background: 'var(--grad-accent)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.6rem' }}>{f.kanji}</div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', marginBottom: '0.5rem', color: 'var(--ink)' }}>{f.title}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--ink-light)', lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
