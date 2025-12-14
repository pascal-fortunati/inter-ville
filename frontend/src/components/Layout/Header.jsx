// En-tête de l'application
// - Navigation, état d'authentification et notifications de chat
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import socket from '../../services/socket';
import { useToast } from '../Common/Toast.jsx';
import api from '../../api/client.jsx';
import { playChatSound } from '../../services/sound.js';
// - Affiche le nombre de messages non lus dans le chat public
const Header = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const { info: toastInfo, success: toastSuccess } = useToast();
  const location = useLocation();
  const [unreadChat, setUnreadChat] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [unreadMentions, setUnreadMentions] = useState(0);
  const fetchPending = useCallback(async () => {
    if (user?.role !== 'admin') return;
    try {
      const res = await api.get('/admin/users/pending');
      const rows = Array.isArray(res.data) ? res.data : [];
      setPendingCount(rows.length || 0);
    } catch { void 0 }
  }, [user]);
  // - Gère les notifications de nouveaux messages dans le chat public
  useEffect(() => {
    function onReceive(payload) {
      if (location.pathname === '/chat') return;
      if (user && Number(payload.user_id) === Number(user.id)) return;
      try { localStorage.setItem('chat:lastNotifiedAt', Date.now().toString()); } catch { void 0 }
      setUnreadChat(c => c + 1);
      try { playChatSound(); } catch { void 0 }
      try {
        const enabled = (localStorage.getItem('pref:chatNotify') ?? 'true') !== 'false';
        if (enabled) toastInfo('Nouveau message dans le chat public', { durationMs: 2500 });
      } catch { toastInfo('Nouveau message dans le chat public', { durationMs: 2500 }); }
      try {
        const txt = String(payload.text || '');
        const me = user?.username || '';
        if (me && new RegExp(`(^|\\s)@${me.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(txt)) {
          setUnreadMentions(m => m + 1);
          localStorage.setItem('mention:lastNotifiedAt', Date.now().toString());
          toastInfo('Tu as été mentionné dans le chat public', { durationMs: 2500 });
        }
      } catch { void 0 }
    }
    socket.on('message:receive', onReceive);
    return () => { socket.off('message:receive', onReceive); };
  }, [location.pathname, user, toastInfo]);
  // - Notification admin lors d'une nouvelle inscription
  useEffect(() => {
    function onUserRegistered(p) {
      if (user?.role !== 'admin') return;
      toastSuccess(`Nouvel inscrit: ${p.username}`);
      fetchPending();
    }
    socket.on('user:registered', onUserRegistered);
    return () => { socket.off('user:registered', onUserRegistered); };
  }, [user, toastSuccess, fetchPending]);
  useEffect(() => {
    function onValidated() {
      if (user?.role !== 'admin') return;
      setTimeout(() => { fetchPending(); }, 0);
    }
    socket.on('user:validated', onValidated);
    return () => { socket.off('user:validated', onValidated); };
  }, [user, fetchPending]);
  useEffect(() => {
    function onUnvalidated(payload) {
      if (user?.role !== 'admin') return;
      const who = payload?.username || payload?.email || 'Un utilisateur';
      toastInfo(`Tentative de connexion non validée: ${who}`, { durationMs: 2500 });
      setAttempts(a => a + 1);
    }
    socket.on('user:login_unvalidated', onUnvalidated);
    return () => { socket.off('user:login_unvalidated', onUnvalidated); };
  }, [user, toastInfo]);
  useEffect(() => { setTimeout(() => { fetchPending(); }, 0); }, [fetchPending]);
  useEffect(() => { if (location.pathname === '/admin') { setTimeout(() => setAttempts(0), 0); } }, [location.pathname]);
  // - Réinitialise le compteur de messages non lus lorsque le chat est ouvert
  useEffect(() => {
    function onOpened() { setUnreadChat(0); }
    window.addEventListener('chat:opened', onOpened);
    return () => { window.removeEventListener('chat:opened', onOpened); };
  }, []);
  useEffect(() => {
    function onOpened() { setUnreadMentions(0); }
    window.addEventListener('chat:opened', onOpened);
    return () => { window.removeEventListener('chat:opened', onOpened); };
  }, []);
  return (
    <>
    <div className="navbar bg-base-100 shadow-sm sticky top-0 z-50">
      <div className="navbar-start">
        <div className="lg:hidden">
          <button aria-label="Ouvrir le menu" className="btn btn-ghost" onClick={() => setMobileOpen(true)}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        </div>
        <Link to="/" className="btn btn-ghost text-xl gap-2">
          <div
            className="h-8 w-[180px] bg-primary"
            role="img"
            aria-label="Logo"
            style={{
              WebkitMaskImage: 'url(/logo.lp.png)',
              maskImage: 'url(/logo.lp.png)',
              WebkitMaskRepeat: 'no-repeat',
              maskRepeat: 'no-repeat',
              WebkitMaskPosition: 'center',
              maskPosition: 'center',
              WebkitMaskSize: 'contain',
              maskSize: 'contain',
            }}
          />
        </Link>
      </div>
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1">
          <li>
            <NavLink to="/" end className={({ isActive }) => `flex items-center gap-2 px-2 py-1 rounded-md ${isActive ? 'text-primary font-semibold bg-base-200' : 'hover:bg-base-200'}`}>
              <span className="material-symbols-outlined">home</span>
              Accueil
            </NavLink>
          </li>
          <li>
            <NavLink to="/defis" className={({ isActive }) => `flex items-center gap-2 px-2 py-1 rounded-md ${isActive ? 'text-primary font-semibold bg-base-200' : 'hover:bg-base-200'}`}>
              <span className="material-symbols-outlined">emoji_events</span>
              Défis
            </NavLink>
          </li>
          <li>
            <NavLink to="/classements" className={({ isActive }) => `flex items-center gap-2 px-2 py-1 rounded-md ${isActive ? 'text-primary font-semibold bg-base-200' : 'hover:bg-base-200'}`}>
              <span className="material-symbols-outlined">leaderboard</span>
              Classement
            </NavLink>
          </li>
          {isAuthenticated ? (
            <>
              <li>
              <NavLink to="/chat" className={({ isActive }) => `flex items-center gap-2 px-2 py-1 rounded-md ${isActive ? 'text-primary font-semibold bg-base-200' : 'hover:bg-base-200'}`}>
                <span className="material-symbols-outlined">forum</span>
                Chat
                {unreadChat > 0 && (<span className="badge badge-error badge-xs ml-1">{unreadChat}</span>)}
                {unreadMentions > 0 && (<span className="badge badge-warning badge-xs ml-1">{unreadMentions}</span>)}
              </NavLink>
              </li>
              <li>
                <NavLink to="/etudiants" className={({ isActive }) => `flex items-center gap-2 px-2 py-1 rounded-md ${isActive ? 'text-primary font-semibold bg-base-200' : 'hover:bg-base-200'}`}>
                  <span className="material-symbols-outlined">school</span>
                  Étudiants
                </NavLink>
              </li>
              <li>
                <NavLink to="/profil" className={({ isActive }) => `flex items-center gap-2 px-2 py-1 rounded-md ${isActive ? 'text-primary font-semibold bg-base-200' : 'hover:bg-base-200'}`}>
                  <span className="material-symbols-outlined">manage_accounts</span>
                  Profil
                </NavLink>
              </li>
              {user?.role === 'admin' && (
                <li>
                  <NavLink to="/admin" className={({ isActive }) => `flex items-center gap-2 px-2 py-1 rounded-md ${isActive ? 'text-primary font-semibold bg-base-200' : 'hover:bg-base-200'}`}>
                    <span className="material-symbols-outlined">admin_panel_settings</span>
                    Admin
                    {pendingCount > 0 && (<span className="badge badge-warning badge-xs ml-1">{pendingCount}</span>)}
                    {attempts > 0 && (<span className="badge badge-error badge-xs ml-1">{attempts}</span>)}
                  </NavLink>
                </li>
              )}
              <li>
                <button onClick={async () => { await logout(); toastSuccess('Déconnexion réussie'); }} className="flex items-center gap-2">
                  <span className="material-symbols-outlined">logout</span>
                  Déconnexion
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <NavLink to="/connexion" className={({ isActive }) => `flex items-center gap-2 px-2 py-1 rounded-md ${isActive ? 'text-primary font-semibold bg-base-200' : 'hover:bg-base-200'}`}>
                  <span className="material-symbols-outlined">login</span>
                  Connexion
                </NavLink>
              </li>
              <li>
                <NavLink to="/inscription" className={({ isActive }) => `flex items-center gap-2 px-2 py-1 rounded-md ${isActive ? 'text-primary font-semibold bg-base-200' : 'hover:bg-base-200'}`}>
                  <span className="material-symbols-outlined">person_add</span>
                  Inscription
                </NavLink>
              </li>
            </>
          )}
        </ul>
      </div>
      <div className="navbar-end">
        <button aria-label="Thèmes" className="btn btn-ghost" onClick={() => window.dispatchEvent(new Event('theme:open'))}>
          <span className="material-symbols-outlined">palette</span>
        </button>
      </div>
    </div>
    {mobileOpen && (
      <div className="fixed inset-0 z-50" onClick={() => setMobileOpen(false)}>
        <div className="absolute inset-0 bg-black/50"></div>
      </div>
    )}
    {mobileOpen && (
      <div className="fixed inset-y-0 left-0 z-50 w-72 max-w-[80vw] bg-base-100 p-4 shadow-2xl border-r border-base-300">
        <div className="flex items-center justify-between mb-4">
          <Link to="/" onClick={() => setMobileOpen(false)} className="btn btn-ghost text-lg gap-2">
            <div
              className="h-8 w-[160px] bg-primary"
              role="img"
              aria-label="Logo"
              style={{
                WebkitMaskImage: 'url(/logo.lp.png)',
                maskImage: 'url(/logo.lp.png)',
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center',
                maskPosition: 'center',
                WebkitMaskSize: 'contain',
                maskSize: 'contain',
              }}
            />
          </Link>
          <div className="flex items-center gap-2">
            <button className="btn btn-ghost btn-circle" onClick={() => setMobileOpen(false)} title="Fermer"><span className="material-symbols-outlined">close</span></button>
          </div>
        </div>
        <ul className="menu gap-1">
          <li>
            <NavLink to="/" end onClick={() => setMobileOpen(false)} className={({ isActive }) => `text-lg px-3 py-3 rounded-lg flex items-center gap-3 ${isActive ? 'text-primary font-semibold bg-base-200' : 'hover:bg-base-200'}`}>
              <span className="material-symbols-outlined">home</span>
              Accueil
            </NavLink>
          </li>
          <li>
            <NavLink to="/defis" onClick={() => setMobileOpen(false)} className={({ isActive }) => `text-lg px-3 py-3 rounded-lg flex items-center gap-3 ${isActive ? 'text-primary font-semibold bg-base-200' : 'hover:bg-base-200'}`}>
              <span className="material-symbols-outlined">emoji_events</span>
              Défis
            </NavLink>
          </li>
          <li>
            <NavLink to="/classements" onClick={() => setMobileOpen(false)} className={({ isActive }) => `text-lg px-3 py-3 rounded-lg flex items-center gap-3 ${isActive ? 'text-primary font-semibold bg-base-200' : 'hover:bg-base-200'}`}>
              <span className="material-symbols-outlined">leaderboard</span>
              Classement
            </NavLink>
          </li>
          {!isAuthenticated && (
            <>
              <li>
                <NavLink to="/connexion" onClick={() => setMobileOpen(false)} className={({ isActive }) => `text-lg px-3 py-3 rounded-lg flex items-center gap-3 ${isActive ? 'text-primary font-semibold bg-base-200' : 'hover:bg-base-200'}`}>
                  <span className="material-symbols-outlined">login</span>
                  Connexion
                </NavLink>
              </li>
              <li>
                <NavLink to="/inscription" onClick={() => setMobileOpen(false)} className={({ isActive }) => `text-lg px-3 py-3 rounded-lg flex items-center gap-3 ${isActive ? 'text-primary font-semibold bg-base-200' : 'hover:bg-base-200'}`}>
                  <span className="material-symbols-outlined">person_add</span>
                  Inscription
                </NavLink>
              </li>
            </>
          )}
          {isAuthenticated && (
            <>
              <li>
                <NavLink to="/chat" onClick={() => setMobileOpen(false)} className={({ isActive }) => `text-lg px-3 py-3 rounded-lg flex items-center gap-3 ${isActive ? 'text-primary font-semibold bg-base-200' : 'hover:bg-base-200'}`}>
                  <span className="material-symbols-outlined">forum</span>
                  Chat
                  {unreadChat > 0 && (<span className="badge badge-error badge-sm ml-1">{unreadChat}</span>)}
                  {unreadMentions > 0 && (<span className="badge badge-warning badge-sm ml-1">{unreadMentions}</span>)}
                </NavLink>
              </li>
              <li>
                <NavLink to="/etudiants" onClick={() => setMobileOpen(false)} className={({ isActive }) => `text-lg px-3 py-3 rounded-lg flex items-center gap-3 ${isActive ? 'text-primary font-semibold bg-base-200' : 'hover:bg-base-200'}`}>
                  <span className="material-symbols-outlined">school</span>
                  Étudiants
                </NavLink>
              </li>
              <li>
                <NavLink to="/profil" onClick={() => setMobileOpen(false)} className={({ isActive }) => `text-lg px-3 py-3 rounded-lg flex items-center gap-3 ${isActive ? 'text-primary font-semibold bg-base-200' : 'hover:bg-base-200'}`}>
                  <span className="material-symbols-outlined">manage_accounts</span>
                  Profil
                </NavLink>
              </li>
              {user?.role === 'admin' && (
                <li>
                  <NavLink to="/admin" onClick={() => setMobileOpen(false)} className={({ isActive }) => `text-lg px-3 py-3 rounded-lg flex items-center gap-3 ${isActive ? 'text-primary font-semibold bg-base-200' : 'hover:bg-base-200'}`}>
                    <span className="material-symbols-outlined">admin_panel_settings</span>
                    Admin
                    {pendingCount > 0 && (<span className="badge badge-warning badge-sm ml-1">{pendingCount}</span>)}
                    {attempts > 0 && (<span className="badge badge-error badge-sm ml-1">{attempts}</span>)}
                  </NavLink>
                </li>
              )}
              <li>
                <button onClick={async () => { await logout(); setMobileOpen(false); toastSuccess('Déconnexion réussie'); }} className="text-lg px-3 py-3 rounded-lg flex items-center gap-3">
                  <span className="material-symbols-outlined">logout</span>
                  Déconnexion
                </button>
              </li>
            </>
          )}
        </ul>
      </div>
    )}
    </>
  );
};

export default Header;
