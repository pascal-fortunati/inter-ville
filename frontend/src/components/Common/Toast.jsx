// Toast utilisateur
// - Contexte pour afficher succès/erreur/info
// - Fermeture automatique via timers
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { playNotificationSound } from '../../services/sound.js';
// - Positionnement configurable (début, centre, fin)
const ToastContext = createContext(null);
// - Durée par défaut configurable
export function ToastProvider({ children, defaultDurationMs = 3000, placement = 'end' }) {
  const [items, setItems] = useState([]);
  const timersRef = useRef(new Map());
  const nextIdRef = useRef(0);
  function push(type, message, opts = {}) {
    const id = String(++nextIdRef.current);
    const duration = Number(opts.durationMs || (type === 'success' ? 2500 : type === 'error' ? 4000 : defaultDurationMs));
    setItems(arr => [...arr, { id, type, message }]);
    try { playNotificationSound(); } catch { void 0 }
    const t = setTimeout(() => remove(id), Math.max(500, duration));
    timersRef.current.set(id, t);
  }
  function remove(id) {
    const t = timersRef.current.get(id);
    if (t) { clearTimeout(t); timersRef.current.delete(id); }
    setItems(arr => arr.filter(t => t.id !== id));
  }
  const value = {
    success: (m, opts) => push('success', m, opts),
    error: (m, opts) => push('error', m, opts),
    info: (m, opts) => push('info', m, opts)
  };
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach(t => clearTimeout(t));
      timers.clear();
    };
  }, []);
  const placementClass = placement === 'start' ? 'toast-start' : placement === 'center' ? 'toast-center' : 'toast-end';
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={`toast ${placementClass} top-16 z-50`}>
        {items.map(t => (
          <div key={t.id} className="alert bg-primary text-primary-content shadow-xl border border-primary">
            <span className="material-symbols-outlined mr-1">
              {t.type === 'success' ? 'check_circle' : t.type === 'error' ? 'error' : 'info'}
            </span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
// - Hook pour utiliser le contexte dans les composants
export function useToast() {
  return useContext(ToastContext);
}
