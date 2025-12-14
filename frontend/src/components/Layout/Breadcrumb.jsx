import { Link, useLocation } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import api from '../../api/client';

function resolveCrumb(path, dyn) {
  const rules = [
    { test: p => p === '/', label: 'Accueil', icon: 'home' },
    { test: p => p === '/defis', label: 'Défis', icon: 'emoji_events' },
    { test: p => p === '/defis/nouveau', label: 'Nouveau', icon: 'add_circle' },
    { test: p => /^\/defis\/\d+$/.test(p), label: dyn?.[path]?.label || 'Détail', icon: 'visibility' },
    { test: p => /^\/challenges\/\d+$/.test(p), label: dyn?.[path]?.label || 'Détail', icon: 'visibility' },
    { test: p => p === '/connexion', label: 'Connexion', icon: 'login' },
    { test: p => p === '/inscription', label: 'Inscription', icon: 'person_add' },
    { test: p => p === '/profil', label: 'Profil', icon: 'person' },
    { test: p => p === '/admin', label: 'Administration', icon: 'admin_panel_settings' },
    { test: p => p === '/chat', label: 'Chat', icon: 'forum' },
    { test: p => /^\/chat\/direct\/\d+$/.test(p), label: dyn?.[path]?.label || 'Direct', icon: 'person' },
    { test: p => p === '/etudiants', label: 'Étudiants', icon: 'group' },
    { test: p => p === '/classements', label: 'Classement', icon: 'leaderboard' },
  ];
  for (const r of rules) if (r.test(path)) return r;
  const seg = path.split('/').filter(Boolean).slice(-1)[0] || '';
  const label = seg.replace(/[-_]/g, ' ').replace(/\b\w/g, s => s.toUpperCase());
  return { label: label || 'Page', icon: 'chevron_right' };
}

export default function Breadcrumb() {
  const location = useLocation();
  const parts = location.pathname.split('/').filter(Boolean);
  const paths = parts.map((_, i) => '/' + parts.slice(0, i + 1).join('/'));
  const items = useMemo(() => ['/', ...paths], [paths]);
  const [dyn, setDyn] = useState({});

  useEffect(() => {
    let alive = true;
    async function fetchForPath(p) {
      try {
        if (/^\/defis\/\d+$/.test(p) || /^\/challenges\/\d+$/.test(p)) {
          const id = Number(p.split('/').filter(Boolean).slice(-1)[0]);
          const r = await api.get(`/challenges/${id}`);
          const title = String(r.data?.title || '').trim();
          if (!alive) return;
          if (title) setDyn(prev => ({ ...prev, [p]: { label: title } }));
        }
        if (/^\/chat\/direct\/\d+$/.test(p)) {
          const uid = Number(p.split('/').filter(Boolean).slice(-1)[0]);
          const r = await api.get(`/auth/get/${uid}`);
          const username = String(r.data?.username || '').trim();
          if (!alive) return;
          if (username) setDyn(prev => ({ ...prev, [p]: { label: `DM avec ${username}` } }));
        }
      } catch {
        // silent fallback
      }
    }
    (async () => {
      for (const p of items) {
        if (!dyn[p] && (/^\/defis\/\d+$/.test(p) || /^\/challenges\/\d+$/.test(p) || /^\/chat\/direct\/\d+$/.test(p))) {
          await fetchForPath(p);
        }
      }
    })();
    return () => { alive = false; };
  }, [items, dyn]);

  return (
    <nav className="mb-6">
      <div className="w-full bg-base-100/80 backdrop-blur border border-base-300 rounded-md shadow px-4 py-3">
        <ul className="flex flex-wrap items-center gap-1 md:gap-2 text-base">
          {items.map((p, i) => {
            const isLast = i === items.length - 1;
            const { label, icon } = resolveCrumb(p, dyn);
            return (
              <li key={p} className="flex items-center">
                {i > 0 && (
                  <span className="mx-1 text-base-content/40 select-none">{/** Chevron separator */}
                    <span className="material-symbols-outlined text-xs md:text-base align-middle">chevron_right</span>
                  </span>
                )}
                {isLast ? (
                  <span className="flex items-center gap-1 font-bold text-primary/90 cursor-default select-text">
                    <span className="material-symbols-outlined text-primary text-lg md:text-xl align-middle drop-shadow-sm">{icon}</span>
                    <span className="truncate max-w-[120px] md:max-w-[200px]" title={label}>{label}</span>
                  </span>
                ) : (
                  <Link to={p} className="flex items-center gap-1 px-2 py-1 rounded-full hover:bg-primary/10 hover:text-primary focus:bg-primary/20 focus:text-primary transition-colors text-base-content/80 font-medium">
                    <span className="material-symbols-outlined text-base md:text-lg align-middle">{icon}</span>
                    <span className="truncate max-w-[100px] md:max-w-[160px]" title={label}>{label}</span>
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

