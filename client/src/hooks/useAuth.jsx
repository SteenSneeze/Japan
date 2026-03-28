import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('japan_token');
    if (token) {
      api.me()
        .then(setUser)
        .catch(() => localStorage.removeItem('japan_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  async function login(username, password) {
    const data = await api.login(username, password);
    localStorage.setItem('japan_token', data.token);
    setUser(data.user);
    return data.user;
  }

  function logout() {
    localStorage.removeItem('japan_token');
    setUser(null);
  }

  async function changePassword(current_password, new_password) {
    await api.changePassword(current_password, new_password);
    setUser(prev => ({ ...prev, must_change_password: false }));
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
