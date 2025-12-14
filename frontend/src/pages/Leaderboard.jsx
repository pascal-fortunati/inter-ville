// Page Classement - Design Modern 2025
// Prêt à copier-coller pour remplacer votre Leaderboard.jsx
import { useEffect, useState, useCallback } from 'react';
import api, { assetUrl } from '../api/client';
import Page from '../components/Layout/Page.jsx';

export default function Leaderboard() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [metric, setMetric] = useState('points');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/leaderboard', { params: { page, pageSize, metric } });
      setItems(res.data?.items || []);
      setTotal(res.data?.total || 0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, metric]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Extraire le top 3 pour le podium
  const top3 = items.slice(0, 3);
  const restOfList = items.slice(3);

  return (
    <Page
      icon="leaderboard"
      title="Classement"
      subtitle={`Top des étudiants par ${metric === 'points' ? 'points' : 'reconnaissance'}`}
      actions={(
        <>
          <select
            className="select select-bordered select-sm"
            value={pageSize}
            onChange={e => { setPage(1); setPageSize(Number(e.target.value)); }}
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
          <select
            className="select select-bordered select-sm"
            value={metric}
            onChange={e => { setPage(1); setMetric(e.target.value); }}
          >
            <option value="points">Points</option>
            <option value="recognition">Reconnaissance</option>
          </select>
          <span className="badge badge-primary gap-1">
            <span className="material-symbols-outlined text-sm">group</span>
            {total}
          </span>
        </>
      )}
      maxW="max-w-6xl"
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <span className="loading loading-ring loading-lg text-primary"></span>
          <p className="text-sm opacity-60">Chargement du classement...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="card bg-base-100 shadow-2xl border border-base-300">
          <div className="card-body items-center text-center py-16">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-5xl text-primary">leaderboard</span>
            </div>
            <h3 className="text-2xl font-bold mb-2">Aucun utilisateur</h3>
            <p className="opacity-70">Aucun résultat dans le classement pour le moment</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">

          {/* Podium - Top 3 */}
          {page === 1 && top3.length > 0 && (
            <div className="card bg-gradient-to-br from-base-100 to-base-200 shadow-2xl border border-base-300 overflow-hidden">
              <div className="card-body p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-warning to-warning/60 flex items-center justify-center shadow-lg">
                    <span className="material-symbols-outlined text-warning-content">emoji_events</span>
                  </div>
                  <h2 className="text-2xl font-bold">Podium</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 2ème place */}
                  {top3[1] && (
                    <div className="order-1 md:order-1">
                      <div className="card bg-gradient-to-br from-neutral/20 to-neutral/5 border-2 border-neutral/30 shadow-xl hover:shadow-2xl transition-all">
                        <div className="card-body items-center text-center p-6">
                          <div className="relative mb-4">
                            <div className="avatar">
                              <div className="w-20 rounded-full ring-4 ring-neutral ring-offset-base-100 ring-offset-2">
                                {top3[1].avatar ? (
                                  <img alt={top3[1].username} src={assetUrl(top3[1].avatar)} />
                                ) : (
                                  <div className="bg-gradient-to-br from-neutral to-neutral/60 text-neutral-content w-20 h-20 rounded-full flex items-center justify-center font-bold text-2xl">
                                    {top3[1].username?.[0]}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-neutral flex items-center justify-center shadow-lg">
                              <span className="text-neutral-content font-bold">2</span>
                            </div>
                          </div>
                          <h3 className="font-bold text-lg mb-1">{top3[1].username}</h3>
                          <p className="text-xs opacity-60 mb-3">{top3[1].town || 'Ville inconnue'}</p>
                          <div className="badge badge-neutral gap-1 badge-lg">
                            <span className="material-symbols-outlined text-sm">
                              {metric === 'points' ? 'bolt' : 'favorite'}
                            </span>
                            {metric === 'points' ? (top3[1].points || 0) : (top3[1].recognition || 0)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 1ère place */}
                  {top3[0] && (
                    <div className="order-2 md:order-2">
                      <div className="card bg-gradient-to-br from-warning/30 to-warning/10 border-2 border-warning shadow-2xl hover:shadow-warning/50 transition-all transform md:scale-110">
                        <div className="card-body items-center text-center p-6">
                          <div className="relative mb-4">
                            <div className="avatar">
                              <div className="w-24 rounded-full ring-4 ring-warning ring-offset-base-100 ring-offset-2 shadow-xl">
                                {top3[0].avatar ? (
                                  <img alt={top3[0].username} src={assetUrl(top3[0].avatar)} />
                                ) : (
                                  <div className="bg-gradient-to-br from-warning to-warning/60 text-warning-content w-24 h-24 rounded-full flex items-center justify-center font-bold text-3xl">
                                    {top3[0].username?.[0]}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-warning flex items-center justify-center shadow-xl">
                              <span className="material-symbols-outlined text-warning-content">workspace_premium</span>
                            </div>
                          </div>
                          <h3 className="font-bold text-xl mb-1">{top3[0].username}</h3>
                          <p className="text-xs opacity-60 mb-3">{top3[0].town || 'Ville inconnue'}</p>
                          <div className="badge badge-warning gap-1 badge-lg">
                            <span className="material-symbols-outlined">
                              {metric === 'points' ? 'bolt' : 'favorite'}
                            </span>
                            {metric === 'points' ? (top3[0].points || 0) : (top3[0].recognition || 0)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3ème place */}
                  {top3[2] && (
                    <div className="order-3 md:order-3">
                      <div className="card bg-gradient-to-br from-orange-700/20 to-orange-700/5 border-2 border-orange-700/30 shadow-xl hover:shadow-2xl transition-all">
                        <div className="card-body items-center text-center p-6">
                          <div className="relative mb-4">
                            <div className="avatar">
                              <div className="w-20 rounded-full ring-4 ring-orange-700 ring-offset-base-100 ring-offset-2">
                                {top3[2].avatar ? (
                                  <img alt={top3[2].username} src={assetUrl(top3[2].avatar)} />
                                ) : (
                                  <div className="bg-gradient-to-br from-orange-700 to-orange-700/60 text-white w-20 h-20 rounded-full flex items-center justify-center font-bold text-2xl">
                                    {top3[2].username?.[0]}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-orange-700 flex items-center justify-center shadow-lg">
                              <span className="text-white font-bold">3</span>
                            </div>
                          </div>
                          <h3 className="font-bold text-lg mb-1">{top3[2].username}</h3>
                          <p className="text-xs opacity-60 mb-3">{top3[2].town || 'Ville inconnue'}</p>
                          <div className="badge bg-orange-700 text-white gap-1 badge-lg border-none">
                            <span className="material-symbols-outlined text-sm">
                              {metric === 'points' ? 'bolt' : 'favorite'}
                            </span>
                            {metric === 'points' ? (top3[2].points || 0) : (top3[2].recognition || 0)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Liste du reste */}
          <div className="card bg-base-100 shadow-2xl border border-base-300">
            <div className="card-body p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary-content">list</span>
                </div>
                <h2 className="text-xl font-bold">
                  {page === 1 ? 'Reste du classement' : `Classement (page ${page})`}
                </h2>
              </div>

              <div className="space-y-2">
                {(page === 1 ? restOfList : items).map(u => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-4 rounded-xl hover:bg-base-200 transition-all border border-transparent hover:border-base-300 hover:shadow-md group"
                  >
                    {/* Rank + Avatar + Info */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {/* Rank */}
                      <div className="flex-shrink-0 w-12 text-center">
                        <div className="badge badge-lg badge-ghost font-bold">
                          #{u.rank}
                        </div>
                      </div>

                      {/* Avatar */}
                      <div className="avatar flex-shrink-0">
                        <div className="w-12 rounded-full ring-2 ring-base-300 group-hover:ring-primary transition-all">
                          {u.avatar ? (
                            <img alt={u.username} src={assetUrl(u.avatar)} />
                          ) : (
                            <div className="bg-gradient-to-br from-primary/20 to-secondary/20 w-12 h-12 rounded-full flex items-center justify-center font-bold">
                              {u.username?.[0]}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{u.username}</div>
                        <div className="text-xs opacity-60 flex items-center gap-2">
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
                    </div>

                    {/* Score */}
                    <div className="flex-shrink-0">
                      <div className="badge badge-primary gap-2 badge-lg">
                        <span className="material-symbols-outlined">
                          {metric === 'points' ? 'bolt' : 'favorite'}
                        </span>
                        <span className="font-bold">
                          {metric === 'points' ? (u.points || 0) : (u.recognition || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex justify-center mt-6 pt-6 border-t border-base-300">
                <div className="join shadow-md">
                  <button
                    className="join-item btn btn-sm"
                    disabled={page <= 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                  >
                    <span className="material-symbols-outlined">chevron_left</span>
                  </button>
                  <button className="join-item btn btn-sm btn-active">
                    Page {page} / {totalPages}
                  </button>
                  <button
                    className="join-item btn btn-sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => p + 1)}
                  >
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}
