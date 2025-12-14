// Page Liste des challenges - Design Modern 2025
// Prêt à copier-coller pour remplacer votre ChallengeList.jsx
import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api, { assetUrl } from '../api/client';
import ChallengeCard from '../components/ChallengeCard.jsx';
import SkeletonCard from '../components/Common/SkeletonCard.jsx';
import { useToast } from '../components/Common/Toast.jsx';
import socket from '../services/socket';
import Page from '../components/Layout/Page.jsx';
import CategoryBadge from '../components/Common/CategoryBadge.jsx';
import LikeButton from '../components/Common/LikeButton.jsx';

const CATEGORIES = [
  { value: 'Code', icon: 'code', color: 'info' },
  { value: 'Cuisine', icon: 'restaurant', color: 'primary' },
  { value: 'Gaming', icon: 'sports_esports', color: 'error' },
  { value: 'Sport', icon: 'sports_soccer', color: 'success' },
  { value: 'Vidéo', icon: 'movie', color: 'info' },
  { value: 'Musique', icon: 'music_note', color: 'accent' },
  { value: 'Photo', icon: 'photo_camera', color: 'secondary' },
  { value: 'Art', icon: 'palette', color: 'neutral' },
  { value: 'Culture', icon: 'museum', color: 'secondary' },
  { value: 'DIY', icon: 'handyman', color: 'warning' },
];

export default function ChallengeList() {
  const { error: errorToast } = useToast();
  const [selected, setSelected] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sort, setSort] = useState('recent');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);
  const [total, setTotal] = useState(0);
  const displayedItems = items;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const [layout, setLayout] = useState(() => {
    const v = typeof window !== 'undefined' ? window.localStorage.getItem('challenges.layout') : null;
    return v === 'list' ? 'list' : 'grid';
  });

  useEffect(() => {
    try { window.localStorage.setItem('challenges.layout', layout); } catch { void 0 }
  }, [layout]);

  const fetchChallenges = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { params: {} };
      if (selected.length) params.params.categories = selected.join(',');
      if (sort) params.params.sort = sort;
      params.params.page = page;
      params.params.pageSize = pageSize;
      const res = await api.get('/challenges', params);
      const data = res.data?.items ? res.data : { items: res.data || [], total: res.data?.length || 0 };
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch {
      setError('Impossible de charger les défis');
      errorToast('Impossible de charger les défis');
    } finally {
      setLoading(false);
    }
  }, [selected, sort, page, pageSize, errorToast]);

  useEffect(() => { fetchChallenges(); }, [fetchChallenges]);

  useEffect(() => {
    function onNewChallenge() {
      fetchChallenges();
    }
    socket.on('challenge:new', onNewChallenge);
    return () => { socket.off('challenge:new', onNewChallenge); };
  }, [fetchChallenges]);

  function toggleCategory(cat) {
    setSelected(s => s.includes(cat) ? s.filter(x => x !== cat) : [...s, cat]);
    setPage(1);
  }

  return (
    <Page
      icon="emoji_events"
      title="Défis"
      subtitle="Choisis une catégorie et participe aux défis"
      actions={(
        <>
          <select
            className="select select-bordered select-sm"
            value={sort}
            onChange={e => setSort(e.target.value)}
          >
            <option value="recent">Plus récents</option>
            <option value="likes">Plus likés</option>
            <option value="comments">Plus commentés</option>
          </select>
          <Link className="btn btn-primary btn-sm gap-2 shadow-md" to="/defis/nouveau">
            <span className="material-symbols-outlined">add_circle</span>
            <span className="hidden sm:inline">Créer un défi</span>
          </Link>
          <button
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
      {/* Categories Filter */}
      <div className="card bg-gradient-to-br from-base-100 to-base-200 shadow-2xl border border-base-300 mb-6">
        <div className="card-body p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-primary-content">filter_alt</span>
            </div>
            <h3 className="text-lg font-bold">Filtrer par catégorie</h3>
            {selected.length > 0 && (
              <span className="badge badge-primary gap-1">
                <span className="material-symbols-outlined text-xs">check_circle</span>
                {selected.length}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => {
              const isSel = selected.includes(cat.value);
              return (
                <button
                  key={cat.value}
                  className={`btn btn-sm gap-2 transition-all ${
                    isSel 
                      ? `btn-${cat.color} shadow-md` 
                      : `btn-outline btn-${cat.color} hover:btn-${cat.color}`
                  }`}
                  onClick={() => toggleCategory(cat.value)}
                >
                  <span className="material-symbols-outlined text-lg">{cat.icon}</span>
                  <span>{cat.value}</span>
                  {isSel && <span className="material-symbols-outlined">check</span>}
                </button>
              );
            })}
          </div>

          {selected.length > 0 && (
            <div className="divider my-2"></div>
          )}

          {selected.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm opacity-70">Sélection:</span>
                {selected.map(cat => {
                  const catData = CATEGORIES.find(c => c.value === cat);
                  return (
                    <span key={cat} className="badge badge-lg gap-2">
                      <span className="material-symbols-outlined text-sm">{catData?.icon}</span>
                      {cat}
                    </span>
                  );
                })}
              </div>
              <button
                className="btn btn-ghost btn-sm gap-2"
                onClick={() => setSelected([])}
              >
                <span className="material-symbols-outlined">close</span>
                Effacer tout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-error shadow-lg mb-6 animate-in fade-in slide-in-from-top-2">
          <span className="material-symbols-outlined">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className={`grid gap-4 ${
          layout === 'grid' 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
            : 'grid-cols-1'
        }`}>
          {Array.from({ length: pageSize }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Challenges Grid/List */}
      {!loading && (
        <>
          {displayedItems.length === 0 ? (
            <div className="card bg-base-100 shadow-2xl border border-base-300">
              <div className="card-body items-center text-center py-16">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-6xl text-primary">emoji_events</span>
                </div>
                <h3 className="text-2xl font-bold mb-2">Aucun défi trouvé</h3>
                <p className="opacity-70 mb-6 max-w-md">
                  {selected.length > 0 
                    ? 'Aucun défi ne correspond à tes filtres. Essaie une autre catégorie !' 
                    : 'Sois le premier à créer un défi pour ta communauté !'}
                </p>
                <Link className="btn btn-primary gap-2 shadow-lg" to="/defis/nouveau">
                  <span className="material-symbols-outlined">add_circle</span>
                  Créer un défi
                </Link>
              </div>
            </div>
          ) : layout === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedItems.map(ch => (
                <ChallengeCard key={ch.id} challenge={ch} />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {displayedItems.map(ch => {
                const img = (ch.image_url ? assetUrl(ch.image_url) : (() => { 
                  const html = String(ch.description || ''); 
                  const m = html.match(/<img[^>]*src=["']([^"']+)["']/i); 
                  return m && m[1] ? assetUrl(m[1]) : null; 
                })());
                const text = String(ch.description || '').replace(/<[^>]+>/g, '');
                
                return (
                  <div 
                    key={ch.id} 
                    className="card bg-base-100 shadow-md hover:shadow-xl transition-all border border-base-300 group"
                  >
                    <div className="card-body p-4">
                      <div className="flex gap-4">
                        {/* Image */}
                        <Link to={`/defis/${ch.id}`} className="flex-shrink-0">
                          {img ? (
                            <div className="w-24 h-24 rounded-xl overflow-hidden ring-2 ring-base-300 group-hover:ring-primary transition-all">
                              <img 
                                src={img} 
                                alt={ch.title} 
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                              />
                            </div>
                          ) : (
                            <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center ring-2 ring-base-300 group-hover:ring-primary transition-all">
                              <span className="material-symbols-outlined text-4xl text-primary opacity-50">emoji_events</span>
                            </div>
                          )}
                        </Link>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <Link 
                              to={`/defis/${ch.id}`} 
                              className="font-bold text-lg line-clamp-1 hover:text-primary transition-colors"
                            >
                              {ch.title}
                            </Link>
                            <CategoryBadge name={ch.category} />
                          </div>

                          <p className="text-sm opacity-70 line-clamp-2 mb-3">{text}</p>

                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-3 text-xs opacity-70">
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">favorite</span>
                                {ch.likes_count || 0}
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">chat_bubble</span>
                                {ch.comments_count || 0}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <LikeButton targetType="challenge" targetId={ch.id} />
                              <Link 
                                to={`/defis/${ch.id}`} 
                                className="btn btn-ghost btn-xs gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <span className="material-symbols-outlined text-lg">visibility</span>
                                <span className="hidden sm:inline">Voir</span>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Pagination */}
      {!loading && displayedItems.length > 0 && (
        <div className="card bg-base-100 shadow-lg border border-base-300 mt-6">
          <div className="card-body p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              
              {/* Page info */}
              <div className="text-sm opacity-70">
                Affichage de {(page - 1) * pageSize + 1} à {Math.min(page * pageSize, total)} sur {total} défis
              </div>

              {/* Page numbers */}
              <div className="join shadow-md">
                <button
                  className="join-item btn btn-sm"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>

                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                  let p;
                  if (totalPages <= 5) {
                    p = i + 1;
                  } else if (page <= 3) {
                    p = i + 1;
                  } else if (page >= totalPages - 2) {
                    p = totalPages - 4 + i;
                  } else {
                    p = page - 2 + i;
                  }

                  return (
                    <button
                      key={p}
                      className={`join-item btn btn-sm ${page === p ? 'btn-active btn-primary' : ''}`}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </button>
                  );
                })}

                <button
                  className="join-item btn btn-sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>

              {/* Page size selector */}
              <select
                className="select select-bordered select-sm"
                value={pageSize}
                onChange={e => {
                  setPage(1);
                  setPageSize(Number(e.target.value));
                }}
              >
                <option value={6}>6 par page</option>
                <option value={9}>9 par page</option>
                <option value={12}>12 par page</option>
                <option value={18}>18 par page</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}
