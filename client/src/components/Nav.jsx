import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useState } from 'react';
import LoginModal from './LoginModal';

const styles = {
  nav: {
    background: 'var(--ink)',
    borderBottom: '3px solid var(--red)',
    padding: '0 2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '60px',
    position: 'sticky',
    top: 0,
    zIndex: 100
  },
  logo: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.2rem',
    color: 'var(--paper)',
    letterSpacing: '0.05em',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  kanji: {
    color: 'var(--red)',
    fontSize: '1.4rem'
  },
  links: {
    display: 'flex',
    gap: '2rem',
    alignItems: 'center'
  },
  link: {
    color: 'var(--paper-dark)',
    fontFamily: 'var(--font-body)',
    fontSize: '0.85rem',
    fontWeight: 400,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    transition: 'color 0.15s',
    textDecoration: 'none'
  },
  linkActive: {
    color: 'var(--red)'
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 500,
    fontSize: '12px',
    color: 'white',
    cursor: 'default'
  },
  loginBtn: {
    background: 'transparent',
    border: '1px solid rgba(245,240,232,0.3)',
    color: 'var(--paper)',
    padding: '6px 14px',
    borderRadius: 'var(--radius)',
    fontSize: '0.8rem',
    letterSpacing: '0.06em',
    cursor: 'pointer',
    transition: 'all 0.15s',
    fontFamily: 'var(--font-body)'
  },
  logoutBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--paper-dark)',
    fontSize: '0.75rem',
    cursor: 'pointer',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    fontFamily: 'var(--font-body)'
  }
};

export default function Nav() {
  const { user, logout } = useAuth();
  const loc = useLocation();
  const [showLogin, setShowLogin] = useState(false);

  const linkStyle = (path) => ({
    ...styles.link,
    ...(loc.pathname.startsWith(path) ? styles.linkActive : {})
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
          <Link to="/logistics" style={linkStyle('/logistics')}>Logistics</Link>
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
