import { createContext, useContext, useMemo, useState } from 'react';
import api, { setAuthToken } from '../api/client.jsx';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const isAuthenticated = !!token;

  async function login(email, password) {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      setUser(res.data.user || null);
      setToken(res.data.token || null);
      setAuthToken(res.data.token || null);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.response?.data?.message || 'Erreur de connexion' };
    } finally {
      setLoading(false);
    }
  }

  async function register(payload) {
    setLoading(true);
    try {
      await api.post('/auth/register', payload);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.response?.data?.message || 'Erreur d\'inscription' };
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    setUser(null);
    setToken(null);
    setAuthToken(null);
  }

  const value = useMemo(() => ({ user, token, loading, isAuthenticated, login, logout, register }), [user, token, loading, isAuthenticated]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
