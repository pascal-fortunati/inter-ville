// Page Étudiants utilisateurs - Design Modern 2025
// Prêt à copier-coller pour remplacer votre Users.jsx
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api, { assetUrl } from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';
import socket from '../services/socket';
import Page from '../components/Layout/Page.jsx';

export default function Users() {
  const { isAuthenticated } = useAuth();
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('username');
  const [online, setOnline] = useState(new Set());
  const [layout, setLayout] = useState(() => {
    const v = typeof window !== 'undefined' ? window.localStorage.getItem('users.layout') : null;
    return v === 'list' ? 'list' : 'grid';
  });

  useEffect(() => {
    try { window.localStorage.setItem('users.layout', layout); } catch { void 0 }
  }, [layout]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (isAuthenticated) {
        const u = await api.get('/directory/users');
        setRows(u.data || []);
        const on = await api.get('/users/online');
        setOnline(new Set(on.data?.ids || []));
      } else {
        setRows([]);
        setOnline(new Set());
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!isAuthenticated) return;
    function onOnline(p) { setOnline(s => new Set(s).add(p.userId)); }
    function onOffline(p) { setOnline(s => { const n = new Set(s); n.delete(p.userId); return n; }); }
    socket.on('user:online', onOnline);
    socket.on('user:offline', onOffline);
    return () => { socket.off('user:online', onOnline); socket.off('user:offline', onOffline); };
  }, [isAuthenticated]);

  const filtered = rows
    .filter(u => {
      const s = `${u.username} ${u.email} ${u.town || ''}`.toLowerCase();
      const matchesSearch = s.includes(q.toLowerCase());
      const isOnline = online.has(u.id);
      const matchesStatus =
        filterStatus === 'all' ? true :
          filterStatus === 'online' ? isOnline :
            !isOnline;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'points') return (b.points || 0) - (a.points || 0);
      return a.username.localeCompare(b.username);
    });

  const onlineCount = rows.filter(u => online.has(u.id)).length;

  if (!isAuthenticated) {
    return (
      <Page icon="group" title="Étudiants">
        <div className="max-w-2xl mx-auto">
          <div className="card bg-gradient-to-br from-base-100 to-base-200 shadow-2xl border border-base-300">
            <div className="card-body items-center text-center py-16">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-5xl text-primary">lock</span>
              </div>
              <h2 className="text-2xl font-bold mb-2">Connexion requise</h2>
              <p className="opacity-70 mb-6">
                Tu dois être connecté pour voir les Étudiants de la plateforme
              </p>
              <button className="btn btn-primary gap-2">
                <span className="material-symbols-outlined">login</span>
                Se connecter
              </button>
            </div>
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page
      icon="group"
      title="Étudiants"
      subtitle="Découvre les Étudiants de la plateforme"
      actions={(
        <>
          <div className="relative">
            <label htmlFor="users-search" className="sr-only">Rechercher</label>
            <input
              id="users-search"
              name="search"
              aria-label="Rechercher des utilisateurs"
              aria-controls="users-results"
              autoComplete="off"
              className="input input-bordered input-w-80 sm:w-150 pl-9"
              type="text"
              placeholder="Rechercher..."
              value={q}
              onChange={e => setQ(e.target.value)}
            />
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm opacity-50">
              search
            </span>
          </div>
          <select
            id="users-filter-status"
            name="status"
            aria-label="Filtrer par statut"
            className="select select-bordered select-sm"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="all">Tous</option>
            <option value="online">En ligne</option>
            <option value="offline">Hors ligne</option>
          </select>
          <select
            id="users-sort-by"
            name="sort"
            aria-label="Trier par"
            className="select select-bordered select-sm"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
          >
            <option value="username">Nom</option>
            <option value="points">Points</option>
          </select>
          <button
            id="users-layout-toggle"
            aria-label={layout === 'grid' ? 'Basculer en vue liste' : 'Basculer en vue grille'}
            aria-pressed={layout === 'list'}
            className="btn btn-ghost btn-sm btn-square"
            title={layout === 'grid' ? 'Vue grille' : 'Vue liste'}
            onClick={() => setLayout(l => (l === 'grid' ? 'list' : 'grid'))}
          >
            <span className="material-symbols-outlined">
              {layout === 'grid' ? 'grid_view' : 'view_list'}
            </span>
          </button>
        </>
      )}
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 shadow-lg">
          <div className="card-body p-4 flex-row items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-primary-content">group</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{rows.length}</div>
              <div className="text-sm opacity-70">Membres</div>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-success/10 to-success/5 border border-success/20 shadow-lg">
          <div className="card-body p-4 flex-row items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-success flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-success-content">fiber_manual_record</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-success">{onlineCount}</div>
              <div className="text-sm opacity-70">En ligne</div>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-base-300/50 to-base-200 border border-base-300 shadow-lg">
          <div className="card-body p-4 flex-row items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-base-300 flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined">radio_button_unchecked</span>
            </div>
            <div>
              <div className="text-2xl font-bold">{rows.length - onlineCount}</div>
              <div className="text-sm opacity-70">Hors ligne</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="card bg-base-100 shadow-2xl border border-base-300">
        <div className="card-body p-6">

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <span className="loading loading-ring loading-lg text-primary"></span>
              <p className="text-sm opacity-60">Chargement des Étudiants.</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-5xl text-primary">
                  {q ? 'search_off' : 'person_off'}
                </span>
              </div>
              <h3 className="text-xl font-bold mb-2">Aucun utilisateur trouvé</h3>
              <p className="opacity-70 mb-4">
                {q ? 'Essaie une autre recherche' : 'Aucun utilisateur ne correspond aux filtres'}
              </p>
              {q && (
                <button className="btn btn-ghost btn-sm gap-2" onClick={() => setQ('')}>
                  <span className="material-symbols-outlined">close</span>
                  Effacer la recherche
                </button>
              )}
            </div>
          )}

          {/* Users Grid/List */}
          {!loading && filtered.length > 0 && (
            <>
              <div id="users-results" className={`grid gap-3 ${layout === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                {filtered.map(u => {
                  const isOnline = online.has(u.id);

                  return layout === 'grid' ? (
                    // Vue Grille (Cards)
                    <div
                      key={u.id}
                      className="card bg-gradient-to-br from-base-200 to-base-100 shadow-md hover:shadow-xl transition-all border border-base-300 group"
                    >
                      <div className="card-body p-4">
                        {/* Avatar + Status */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="relative">
                            <div className="avatar">
                              <div className="w-16 rounded-full ring-2 ring-base-300 group-hover:ring-primary transition-all">
                                {u.avatar ? (
                                  <img src={assetUrl(u.avatar)} alt={u.username} />
                                ) : (
                                  <div className="bg-primary text-primary-content w-16 h-16 flex items-center justify-center text-xl font-bold">
                                    {u.username[0]}
                                  </div>
                                )}
                              </div>
                            </div>
                            {isOnline && (
                              <span className="absolute bottom-0 right-0 w-4 h-4 bg-success rounded-full border-2 border-base-100 animate-pulse"></span>
                            )}
                          </div>
                          <Link
                            className="btn btn-primary btn-sm btn-circle opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                            title="Message privé"
                            to={`/chat/direct/${u.id}`}
                          >
                            <span className="material-symbols-outlined text-lg">send</span>
                          </Link>
                        </div>

                        {/* User Info */}
                        <h3 className="font-bold text-lg truncate mb-1">{u.username}</h3>
                        <p className="text-xs opacity-60 truncate flex items-center gap-1 mb-3">
                          <span className="material-symbols-outlined text-xs">email</span>
                          {u.email}
                        </p>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2">
                          {u.town && (
                            <span className="badge badge-ghost badge-sm gap-1">
                              <span className="material-symbols-outlined text-xs">location_city</span>
                              {u.town}
                            </span>
                          )}
                          {u.promo && (
                            <span className="badge badge-ghost badge-sm gap-1">
                              <span className="material-symbols-outlined text-xs">school</span>
                              {u.promo}
                            </span>
                          )}
                          {typeof u.points === 'number' && (
                            <span className="badge badge-primary badge-sm gap-1">
                              <span className="material-symbols-outlined text-xs">bolt</span>
                              {u.points}
                            </span>
                          )}
                        </div>

                        {/* Status */}
                        <div className="mt-3 pt-3 border-t border-base-300">
                          {isOnline ? (
                            <span className="flex items-center gap-2 text-xs text-success">
                              <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
                              En ligne
                            </span>
                          ) : (
                            <span className="flex items-center gap-2 text-xs opacity-50">
                              <span className="w-2 h-2 rounded-full bg-base-300"></span>
                              Hors ligne
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Vue Liste (Compact)
                    <div
                      key={u.id}
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-base-200 transition-all border border-transparent hover:border-base-300 hover:shadow-md group"
                    >
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <div className="avatar">
                          <div className="w-12 rounded-full ring-2 ring-base-300 group-hover:ring-primary transition-all">
                            {u.avatar ? (
                              <img src={assetUrl(u.avatar)} alt={u.username} />
                            ) : (
                              <div className="bg-primary text-primary-content w-12 h-12 flex items-center justify-center font-bold">
                                {u.username[0]}
                              </div>
                            )}
                          </div>
                        </div>
                        {isOnline && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-base-100 animate-pulse"></span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{u.username}</div>
                        <div className="text-xs opacity-60 flex items-center gap-3">
                          <span className="flex items-center gap-1 truncate">
                            <span className="material-symbols-outlined text-xs">email</span>
                            {u.email}
                          </span>
                          {u.town && (
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">location_city</span>
                              {u.town}
                            </span>
                          )}
                          {u.promo && (
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">school</span>
                              {u.promo}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Points + Status + Action */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {typeof u.points === 'number' && (
                          <span className="badge badge-primary gap-1">
                            <span className="material-symbols-outlined text-sm">bolt</span>
                            {u.points}
                          </span>
                        )}
                        <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-success animate-pulse' : 'bg-base-300'}`}></div>
                        <Link
                          className="btn btn-primary btn-sm btn-circle opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Message privé"
                          to={`/chat/direct/${u.id}`}
                        >
                          <span className="material-symbols-outlined">send</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Results Count */}
              <div className="text-center mt-6 pt-6 border-t border-base-300">
                <p className="text-sm opacity-70">
                  {filtered.length === rows.length ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-lg">info</span>
                      {rows.length} utilisateur{rows.length > 1 ? 's' : ''} au total
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-lg">filter_alt</span>
                      {filtered.length} résultat{filtered.length > 1 ? 's' : ''} sur {rows.length}
                    </span>
                  )}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </Page>
  );
}
