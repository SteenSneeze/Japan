import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useMobile } from '../hooks/useMobile';
import { useState } from 'react';
import LoginModal from './LoginModal';

const NAV_LINKS = [
  { to: '/plan',      label: 'Planning',  icon: '🗺' },
  { to: '/trip',      label: 'The Trip',  icon: '📅' },
  { to: '/logistics', label: 'Costs',     icon: '💴' },
];

export default function Nav() {
  const { user, logout } = useAuth();
  const loc = useLocation();
  const isMobile = useMobile();
  const [showLogin, setShowLogin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path) => loc.pathname.startsWith(path);

  return (
    <>
      <nav style={{
        background: 'var(--grad-nav)', borderBottom: '3px solid var(--red)',
        padding: '0 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: '62px', position: 'sticky', top: 0, zIndex: 200,
        boxShadow: '0 4px 24px rgba(15,14,42,0.35)'
      }}>
        {/* Logo */}
        <Link to="/" style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'white', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <span style={{ color: 'var(--red)', fontSize: '1.4rem', filter: 'drop-shadow(0 0 8px rgba(232,25,125,0.5))' }}>日本</span>
          {!isMobile && <span>TRIP</span>}
        </Link>

        {/* Desktop links */}
        {!isMobile && (
          <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
            {NAV_LINKS.map(({ to, label }) => (
              <Link key={to} to={to} style={{
                color: isActive(to) ? 'white' : 'rgba(255,255,255,0.65)',
                fontFamily: 'var(--font-body)', fontSize: '0.82rem', fontWeight: 500,
                letterSpacing: '0.08em', textTransform: 'uppercase', textDecoration: 'none',
                padding: '6px 14px', borderRadius: 'var(--radius)', transition: 'color 0.15s',
                background: isActive(to) ? 'rgba(232,25,125,0.2)' : 'transparent'
              }}>{label}</Link>
            ))}
          </div>
        )}

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {user ? (
            <>
              <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: user.avatar_color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '12px', color: 'white', boxShadow: '0 0 0 2px rgba(255,255,255,0.2)' }} title={user.display_name}>
                {user.display_name.slice(0,2).toUpperCase()}
              </div>
              {!isMobile && (
                <button onClick={logout} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'var(--font-body)', padding: '5px 12px', borderRadius: 'var(--radius)' }}>
                  Sign out
                </button>
              )}
            </>
          ) : (
            !isMobile && (
              <button onClick={() => setShowLogin(true)} style={{ background: 'var(--grad-accent)', border: 'none', color: 'white', padding: '7px 18px', borderRadius: 'var(--radius)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', boxShadow: '0 2px 12px rgba(232,25,125,0.4)' }}>
                Sign in to edit
              </button>
            )
          )}

          {/* Hamburger */}
          {isMobile && (
            <button onClick={() => setMenuOpen(o => !o)} style={{ display: 'flex', flexDirection: 'column', gap: '5px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', marginLeft: '4px' }}>
              <span style={{ display: 'block', width: '22px', height: '2px', background: menuOpen ? 'var(--red)' : 'white', transition: 'all 0.2s', transform: menuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
              <span style={{ display: 'block', width: '22px', height: '2px', background: 'white', transition: 'all 0.2s', opacity: menuOpen ? 0 : 1 }} />
              <span style={{ display: 'block', width: '22px', height: '2px', background: menuOpen ? 'var(--red)' : 'white', transition: 'all 0.2s', transform: menuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
            </button>
          )}
        </div>
      </nav>

      {/* Mobile menu drawer */}
      {isMobile && menuOpen && (
        <div style={{ position: 'fixed', top: '65px', left: 0, right: 0, background: 'var(--grad-nav)', borderBottom: '3px solid var(--red)', zIndex: 199, boxShadow: '0 8px 32px rgba(15,14,42,0.5)', padding: '0.5rem 0' }}>
          {NAV_LINKS.map(({ to, label, icon }) => (
            <Link key={to} to={to} onClick={() => setMenuOpen(false)} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '14px 1.5rem',
              color: isActive(to) ? 'white' : 'rgba(255,255,255,0.75)',
              textDecoration: 'none', fontFamily: 'var(--font-body)', fontSize: '1rem', fontWeight: 500,
              background: isActive(to) ? 'rgba(232,25,125,0.15)' : 'transparent',
              borderLeft: isActive(to) ? '3px solid var(--red)' : '3px solid transparent',
            }}>
              <span style={{ fontSize: '1.2rem' }}>{icon}</span>
              {label}
            </Link>
          ))}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '0.5rem 0', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {user ? (
              <>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>{user.display_name}</span>
                <button onClick={() => { logout(); setMenuOpen(false); }} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'var(--font-body)', padding: '6px 14px', borderRadius: 'var(--radius)' }}>
                  Sign out
                </button>
              </>
            ) : (
              <button onClick={() => { setShowLogin(true); setMenuOpen(false); }} style={{ width: '100%', background: 'var(--grad-accent)', border: 'none', color: 'white', padding: '10px', borderRadius: 'var(--radius)', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                Sign in to edit
              </button>
            )}
          </div>
        </div>
      )}

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  );
}
