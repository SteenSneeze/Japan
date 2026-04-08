import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useState } from 'react';
import LoginModal from './LoginModal';

const styles = {
  nav: {
    background: 'var(--grad-nav)',
    borderBottom: '3px solid var(--red)',
    padding: '0 2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '62px',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 4px 24px rgba(15,14,42,0.35)'
  },
  logo: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.25rem',
    color: 'white',
    letterSpacing: '0.06em',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  kanji: {
    color: 'var(--red)',
    fontSize: '1.5rem',
    filter: 'drop-shadow(0 0 8px rgba(232,25,125,0.5))'
  },
  links: {
    display: 'flex',
    gap: '0.25rem',
    alignItems: 'center'
  },
  link: {
    color: 'rgba(255,255,255,0.65)',
    fontFamily: 'var(--font-body)',
    fontSize: '0.82rem',
    fontWeight: 500,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    transition: 'color 0.15s',
    textDecoration: 'none',
    padding: '6px 14px',
    borderRadius: 'var(--radius)'
  },
  linkActive: {
    color: 'white',
    background: 'rgba(232,25,125,0.2)'
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  avatar: {
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    fontSize: '12px',
    color: 'white',
    cursor: 'default',
    boxShadow: '0 0 0 2px rgba(255,255,255,0.2)'
  },
  loginBtn: {
    background: 'var(--grad-accent)',
    border: 'none',
    color: 'white',
    padding: '7px 18px',
    borderRadius: 'var(--radius)',
    fontSize: '0.8rem',
    fontWeight: 600,
    letterSpacing: '0.05em',
    cursor: 'pointer',
    transition: 'opacity 0.15s, transform 0.15s',
    fontFamily: 'var(--font-body)',
    boxShadow: '0 2px 12px rgba(232,25,125,0.4)'
  },
  logoutBtn: {
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.2)',
    color: 'rgba(255,255,255,0.6)',
    fontSize: '0.75rem',
    cursor: 'pointer',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    fontFamily: 'var(--font-body)',
    padding: '5px 12px',
    borderRadius: 'var(--radius)'
  }
};

export default function Nav() {
  const { user, logout } = useAuth();
  const loc = useLocation();
  const [showLogin, setShowLogin] = useState(false);

  const linkStyle = (path) => ({
    ...styles.link,
    ...(loc.pathname.startsWith(path) ? styles.linkActive : {}),
    display: 'inline-block'
  });

  return (
    <>
      <nav style={styles.nav}>
        <div style={styles.logo}>
          <span style={styles.kanji}>日本</span>
          <span>TRIP</span>
        </div>
        <div style={styles.links}>
          <Link to="/plan" style={linkStyle('/plan')}>Planning</Link>
          <Link to="/trip" style={linkStyle('/trip')}>The Trip</Link>
          <Link to="/logistics" style={linkStyle('/logistics')}>Costs</Link>
        </div>
        <div style={styles.right}>
          {user ? (
            <>
              <div
                style={{ ...styles.avatar, background: user.avatar_color }}
                title={user.display_name}
              >
                {user.display_name.slice(0,2).toUpperCase()}
              </div>
              <button style={styles.logoutBtn} onClick={logout}>Sign out</button>
            </>
          ) : (
            <button style={styles.loginBtn} onClick={() => setShowLogin(true)}>
              Sign in to edit
            </button>
          )}
        </div>
      </nav>
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  );
}
