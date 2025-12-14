// Client HTTP Axios
// - Configure la baseURL et les cookies
// - setAuthToken pour ajouter/supprimer le Bearer JWT
// - assetUrl pour résoudre les URLs d'assets (uploads)
import axios from 'axios';
// Configuration de l'instance Axios
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
});
// Fonction pour définir ou supprimer le token d'authentification
export function setAuthToken(token) {
  if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  else delete api.defaults.headers.common['Authorization'];
}
// Fonction pour résoudre les URLs d'assets
export function assetUrl(url) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  const base = import.meta.env.VITE_API_URL;
  if (!base || base.startsWith('/')) {
    return url; // Vite proxy ou même origine
  }
  const origin = new URL(base).origin;
  const path = String(url || '').startsWith('/') ? String(url) : `/${String(url)}`;
  return `${origin}${path}`;
}

export default api;
