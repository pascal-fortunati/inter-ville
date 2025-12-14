// Contexte d'authentification
// - Gère utilisateur, token, login/register/logout
// - Persiste le token et bootstrape /users/me
// - (Ré)initialise Socket.io après connexion
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api, { setAuthToken } from '../api/client.jsx';
import socket from '../services/socket';
// Context d'authentification
const AuthContext = createContext(null);
// Fournisseur du contexte d'authentification
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => {
    try { return localStorage.getItem('token') || null; } catch { return null; }
  });
  const [loading, setLoading] = useState(false);
  const isAuthenticated = !!user || !!token;
  // Fonction de connexion
  async function login(email, password) {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      setUser(res.data.user || null);
      setToken(res.data.token || null);
      setAuthToken(res.data.token || null);
      if (res.data.token) localStorage.setItem('token', res.data.token);
      try { socket.disconnect(); socket.connect(); } catch { void 0 }
      return { ok: true };
    } catch (e) {
      const data = e?.response?.data || {};
      const msg = data.message || data.errors?.global || data.error || 'Erreur de connexion';
      return { ok: false, error: msg };
    } finally {
      setLoading(false);
    }
  }
  // Fonction d'inscription
  async function register(payload) {
    setLoading(true);
    try {
      const res = await api.post('/auth/register', payload);
      if (res.data?.dev_token) {
        try {
          await api.post('/auth/verify-email', { token: res.data.dev_token });
        } catch { void 0 }
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.response?.data?.message || 'Erreur d\'inscription' };
    } finally {
      setLoading(false);
    }
  }
  // Fonction de déconnexion
  async function logout() {
    setUser(null);
    setToken(null);
    setAuthToken(null);
    try { await api.post('/auth/logout'); } catch { void 0 }
    try { socket.disconnect(); } catch { void 0 }
    try { localStorage.removeItem('token'); } catch { void 0 }
  }
  // Effet de bootstrapping de l'utilisateur courant
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!token) return;
        setAuthToken(token);
        const res = await api.get('/users/me');
        if (!mounted) return;
        setUser(res.data || null);
      } catch (e) {
        const status = e?.response?.status;
        if (status === 401) {
          setUser(null);
          setToken(null);
          setAuthToken(null);
          try { localStorage.removeItem('token'); } catch { void 0 }
        }
      }
    })();
    return () => { mounted = false; };
  }, [token]);

  const value = useMemo(() => ({ user, token, loading, isAuthenticated, login, logout, register }), [user, token, loading, isAuthenticated]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook d'accès au contexte d'authentification
export function useAuth() {
  return useContext(AuthContext);
}
