import { useState, useEffect, useCallback } from 'react';
import api, { assetUrl } from '../api/client';
import socket from '../services/socket';
import { useToast } from '../components/Common/Toast.jsx';
import { useAuth } from '../context/AuthContext';
import CategoryBadge from '../components/Common/CategoryBadge.jsx';
import Page from '../components/Layout/Page.jsx';

export default function Admin() {

  const parseDate = (d) => {
    const s = String(d || '').trim();
    if (!s) return null;
    const iso = s.includes('T') ? s : s.replace(' ', 'T') + 'Z';
    const dt = new Date(iso);
    return Number.isNaN(dt.getTime()) ? null : dt;
  };
  const formatDate = (d) => {
    const dt = parseDate(d);
    return dt ? dt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : String(d || '');
  };
  const formatDateTime = (d) => {
    const dt = parseDate(d);
    return dt ? dt.toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }) : String(d || '');
  };
  const STATUS_LABELS = { pending: 'En attente', approved: 'Validée', rejected: 'Refusée' };
  function isImageUrl(url) {
    const u = String(url || '').toLowerCase();
    return /\.(png|jpg|jpeg|gif|webp)(\?.*)?$/i.test(u);
  }
  function isVideoUrl(url) {
    const u = String(url || '').toLowerCase();
    return /\.(mp4|webm|ogg)(\?.*)?$/i.test(u);
  }
  function isPdfUrl(url) {
    const u = String(url || '').toLowerCase();
    return /\.(pdf)(\?.*)?$/i.test(u);
  }
  const { user } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();
  const [activeTab, setActiveTab] = useState('pending');
  const [rows, setRows] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loadingPartsList, setLoadingPartsList] = useState(false);
  const [errorParts, setErrorParts] = useState('');

  const [pageCh, setPageCh] = useState(1);
  const [pageSizeCh, setPageSizeCh] = useState(10);
  const [pageCm, setPageCm] = useState(1);
  const [pageSizeCm, setPageSizeCm] = useState(20);
  const [totalCh, setTotalCh] = useState(0);
  const [totalCm, setTotalCm] = useState(0);
  const [parts, setParts] = useState([]);
  const [pagePr, setPagePr] = useState(1);
  const [pageSizePr, setPageSizePr] = useState(20);
  const [statusPr, setStatusPr] = useState('all');
  const [totalPr, setTotalPr] = useState(0);
  const [allUsers, setAllUsers] = useState([]);
  const [loadingAllUsers, setLoadingAllUsers] = useState(false);
  const [qUsers, setQUsers] = useState('');
  const [filterStatusUsers, setFilterStatusUsers] = useState('all');
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewType, setPreviewType] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', action: null });

  function showMessage(type, text) {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  }

  function openProof(url) {
    const u = String(url || '');
    if (!u) return;
    if (isPdfUrl(u)) { setPreviewUrl(u); setPreviewType('pdf'); setShowPreview(true); return; }
    if (isImageUrl(u)) { setPreviewUrl(u); setPreviewType('image'); setShowPreview(true); return; }
    if (isVideoUrl(u)) { setPreviewUrl(u); setPreviewType('video'); setShowPreview(true); return; }
    try { window.open(assetUrl(u), '_blank'); } catch { void 0 }
  }

  async function validate(id) {
    setLoading(true);
    try {
      await api.put(`/admin/users/${id}/validate`);
      setRows(rows.filter(r => r.id !== id));
      showMessage('success', 'Compte validé et email automatiquement vérifié');
      toastSuccess('Compte validé + email vérifié');
    } catch {
      showMessage('error', 'Erreur lors de la validation');
      toastError('Erreur validation');
    } finally {
      setLoading(false);
    }
  }



  async function deleteChallenge(id) {
    setConfirm({
      open: true,
      title: 'Supprimer ce challenge ?',
      message: 'Cette action est irréversible. Confirme la suppression.',
      action: async () => {
        setLoading(true);
        try {
          await api.delete(`/admin/challenges/${id}`);
          setChallenges(challenges.filter(ch => ch.id !== id));
          setTotalCh(t => Math.max(0, (t || 0) - 1));
          showMessage('success', 'Challenge supprimé');
          toastSuccess('Challenge supprimé');
        } catch {
          showMessage('error', 'Erreur lors de la suppression');
          toastError('Erreur suppression challenge');
        } finally {
          setLoading(false);
        }
      }
    });
  }

  async function deleteComment(id) {
    setConfirm({
      open: true,
      title: 'Supprimer ce commentaire ?',
      message: 'Cette action est irréversible. Confirme la suppression.',
      action: async () => {
        setLoading(true);
        try {
          await api.delete(`/admin/comments/${id}`);
          setComments(comments.filter(cm => cm.id !== id));
          setTotalCm(t => Math.max(0, (t || 0) - 1));
          showMessage('success', 'Commentaire supprimé');
          toastSuccess('Commentaire supprimé');
        } catch {
          showMessage('error', 'Erreur lors de la suppression');
          toastError('Erreur suppression commentaire');
        } finally {
          setLoading(false);
        }
      }
    });
  }

  const stats = {
    pending: rows.length,
    challenges: totalCh || challenges.length,
    comments: totalCm || comments.length,
    participations: totalPr || parts.length,
    users: allUsers.length
  };
  const filteredUsers = allUsers
    .filter(u => {
      const s = `${u.username} ${u.email} ${u.town || ''}`.toLowerCase();
      const matchesSearch = s.includes(qUsers.toLowerCase());
      const isOnline = onlineUserIds.has(u.id);
      const matchesStatus = filterStatusUsers === 'all' ? true : filterStatusUsers === 'online' ? isOnline : !isOnline;
      return matchesSearch && matchesStatus;
    });

  const loadPending = useCallback(async () => {
    try { const res = await api.get('/admin/users/pending'); setRows(res.data || []); } catch { void 0 }
  }, []);
  const loadChallenges = useCallback(async () => {
    try {
      const res = await api.get('/admin/content/challenges', { params: { page: pageCh, pageSize: pageSizeCh } });
      setChallenges(res.data?.items || []);
      setTotalCh(res.data?.total || 0);
    } catch { void 0 }
  }, [pageCh, pageSizeCh]);
  const loadComments = useCallback(async () => {
    try {
      const res = await api.get('/admin/content/comments', { params: { page: pageCm, pageSize: pageSizeCm } });
      setComments(res.data?.items || []);
      setTotalCm(res.data?.total || 0);
    } catch { void 0 }
  }, [pageCm, pageSizeCm]);
  const loadParticipations = useCallback(async () => {
    setLoadingPartsList(true);
    setErrorParts('');
    try {
      const res = await api.get('/admin/participations', { params: { page: pagePr, pageSize: pageSizePr, status: statusPr } });
      setParts(res.data?.items || []);
      setTotalPr(res.data?.total || 0);
    } catch (e) {
      setParts([]);
      setErrorParts(e?.response?.data?.message || 'Erreur chargement des participations');
    } finally {
      setLoadingPartsList(false);
    }
  }, [pagePr, pageSizePr, statusPr]);

  const loadChallengeStats = useCallback(async () => {
    try {
      const res = await api.get('/admin/content/challenges', { params: { page: 1, pageSize: 1 } });
      setTotalCh(res.data?.total || 0);
    } catch { void 0 }
  }, []);

  const loadCommentStats = useCallback(async () => {
    try {
      const res = await api.get('/admin/content/comments', { params: { page: 1, pageSize: 1 } });
      setTotalCm(res.data?.total || 0);
    } catch { void 0 }
  }, []);
  const loadParticipationStats = useCallback(async () => {
    try {
      const res = await api.get('/admin/participations', { params: { page: 1, pageSize: 1, status: 'all' } });
      setTotalPr(res.data?.total || 0);
    } catch { void 0 }
  }, []);
  const loadAllUsers = useCallback(async () => {
    setLoadingAllUsers(true);
    try {
      const res = await api.get('/directory/users');
      setAllUsers(res.data || []);
    } catch { setAllUsers([]); }
    finally { setLoadingAllUsers(false); }
  }, []);
  const loadOnline = useCallback(async () => {
    try {
      const res = await api.get('/users/online');
      setOnlineUserIds(new Set(res.data?.ids || []));
    } catch {
      setOnlineUserIds(new Set());
    }
  }, []);

  useEffect(() => { if (user?.role === 'admin') { loadPending(); loadChallengeStats(); loadCommentStats(); loadParticipationStats(); loadAllUsers(); loadOnline(); } }, [user, loadPending, loadChallengeStats, loadCommentStats, loadParticipationStats, loadAllUsers, loadOnline]);
  useEffect(() => { if (user?.role === 'admin') { if (activeTab === 'challenges') loadChallenges(); if (activeTab === 'comments') loadComments(); if (activeTab === 'participations') loadParticipations(); if (activeTab === 'users') { loadAllUsers(); loadOnline(); } } }, [user, activeTab, loadChallenges, loadComments, loadParticipations, loadAllUsers, loadOnline]);

  useEffect(() => {
    function onNewChallenge() { loadChallengeStats(); }
    function onNewComment() { loadCommentStats(); }
    function onNewParticipation() { loadParticipationStats(); if (activeTab === 'participations') loadParticipations(); if (activeTab === 'challenges') loadChallenges(); }
    function onUpdatedParticipation() { loadParticipationStats(); if (activeTab === 'participations') loadParticipations(); if (activeTab === 'challenges') loadChallenges(); }
    function onUserRegistered() { loadPending(); loadAllUsers(); loadOnline(); }
    socket.on('challenge:new', onNewChallenge);
    socket.on('comment:new', onNewComment);
    socket.on('participation:new', onNewParticipation);
    socket.on('participation:updated', onUpdatedParticipation);
    socket.on('user:registered', onUserRegistered);
    return () => { socket.off('challenge:new', onNewChallenge); socket.off('comment:new', onNewComment); socket.off('participation:new', onNewParticipation); socket.off('participation:updated', onUpdatedParticipation); socket.off('user:registered', onUserRegistered); };
  }, [loadChallengeStats, loadCommentStats, loadChallenges, loadParticipationStats, loadParticipations, activeTab, toastSuccess, loadPending, loadAllUsers, loadOnline]);
  useEffect(() => {
    if (!(user?.role === 'admin')) return;
    function onOnline(p) { setOnlineUserIds(s => { const n = new Set(s); n.add(p.userId); return n; }); }
    function onOffline(p) { setOnlineUserIds(s => { const n = new Set(s); n.delete(p.userId); return n; }); }
    socket.on('user:online', onOnline);
    socket.on('user:offline', onOffline);
    return () => { socket.off('user:online', onOnline); socket.off('user:offline', onOffline); };
  }, [user]);

  if (!user || user.role !== 'admin') {
    return (
      <Page icon="admin_panel_settings" title="Administration">
        <div className="max-w-2xl mx-auto">
          <div className="card bg-gradient-to-br from-error/20 to-error/10 shadow-2xl border-2 border-error/30">
            <div className="card-body items-center text-center py-16">
              <div className="w-20 h-20 rounded-full bg-error/20 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-5xl text-error">block</span>
              </div>
              <h2 className="text-2xl font-bold text-error mb-2">Accès refusé</h2>
              <p className="opacity-70">Cette section est réservée aux administrateurs</p>
            </div>
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page icon="admin_panel_settings" title="Administration" subtitle="Gestion des utilisateurs et du contenu">

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        <div
          className="card bg-gradient-to-br from-warning/10 to-warning/5 border border-warning/20 shadow-lg hover:shadow-xl transition-all cursor-pointer group"
          onClick={() => setActiveTab('pending')}
        >
          <div className="card-body p-4 flex-row items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-warning flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-warning-content">hourglass_top</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-warning">{stats.pending}</div>
              <div className="text-xs opacity-70">En attente</div>
            </div>
          </div>
        </div>



        <div
          className="card bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 shadow-lg hover:shadow-xl transition-all cursor-pointer group"
          onClick={() => setActiveTab('challenges')}
        >
          <div className="card-body p-4 flex-row items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-primary-content">emoji_events</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{stats.challenges}</div>
              <div className="text-xs opacity-70">Challenges</div>
            </div>
          </div>
        </div>

        <div
          className="card bg-gradient-to-br from-secondary/10 to-secondary/5 border border-secondary/20 shadow-lg hover:shadow-xl transition-all cursor-pointer group"
          onClick={() => setActiveTab('comments')}
        >
          <div className="card-body p-4 flex-row items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-secondary-content">chat_bubble</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-secondary">{stats.comments}</div>
              <div className="text-xs opacity-70">Commentaires</div>
            </div>
          </div>
        </div>

        <div
          className="card bg-gradient-to-br from-success/10 to-success/5 border border-success/20 shadow-lg hover:shadow-xl transition-all cursor-pointer group"
          onClick={() => { setActiveTab('participations'); loadParticipations(); }}
        >
          <div className="card-body p-4 flex-row items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-success flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-success-content">group</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-success">{stats.participations}</div>
              <div className="text-xs opacity-70">Participations</div>
            </div>
          </div>
        </div>

        <div
          className="card bg-gradient-to-br from-neutral/10 to-neutral/5 border border-neutral/20 shadow-lg hover:shadow-xl transition-all cursor-pointer group"
          onClick={() => setActiveTab('users')}
        >
          <div className="card-body p-4 flex-row items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-neutral flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-neutral-content">group</span>
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.users}</div>
              <div className="text-xs opacity-70">Étudiants</div>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Message */}
      {message.text && (
        <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'} shadow-lg mb-6 animate-in fade-in slide-in-from-top-2`}>
          <span className="material-symbols-outlined">
            {message.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span>{message.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="card bg-base-100 shadow-lg border border-base-300 mb-6">
        <div className="card-body p-3">
          <div className="flex flex-wrap gap-2">
            <button
              className={`btn btn-sm gap-2 ${activeTab === 'pending' ? 'btn-warning' : 'btn-ghost'}`}
              onClick={() => setActiveTab('pending')}
            >
              <span className="material-symbols-outlined">hourglass_top</span>
              <span className="hidden sm:inline">En attente</span>
              <span className="badge badge-sm">{stats.pending}</span>
            </button>

            <button
              className={`btn btn-sm gap-2 ${activeTab === 'challenges' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('challenges')}
            >
              <span className="material-symbols-outlined">emoji_events</span>
              <span className="hidden sm:inline">Challenges</span>
              <span className="badge badge-sm">{stats.challenges}</span>
            </button>
            <button
              className={`btn btn-sm gap-2 ${activeTab === 'comments' ? 'btn-secondary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('comments')}
            >
              <span className="material-symbols-outlined">chat_bubble</span>
              <span className="hidden sm:inline">Commentaires</span>
              <span className="badge badge-sm">{stats.comments}</span>
            </button>
            <button
              className={`btn btn-sm gap-2 ${activeTab === 'participations' ? 'btn-success' : 'btn-ghost'}`}
              onClick={() => setActiveTab('participations')}
            >
              <span className="material-symbols-outlined">group</span>
              <span className="hidden sm:inline">Participations</span>
              <span className="badge badge-sm">{stats.participations}</span>
            </button>
            <button
              className={`btn btn-sm gap-2 ${activeTab === 'users' ? 'btn-neutral' : 'btn-ghost'}`}
              onClick={() => setActiveTab('users')}
            >
              <span className="material-symbols-outlined">group</span>
              <span className="hidden sm:inline">Étudiants</span>
              <span className="badge badge-sm">{allUsers.length}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="card bg-base-100 shadow-2xl border border-base-300">
        <div className="card-body p-6">

          {/* Pending Users Tab */}
          {activeTab === 'pending' && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-warning flex items-center justify-center">
                  <span className="material-symbols-outlined text-warning-content">hourglass_top</span>
                </div>
                <h2 className="text-2xl font-bold">Comptes en attente de validation</h2>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <span className="loading loading-ring loading-lg text-warning"></span>
                  <p className="text-sm opacity-60">Chargement...</p>
                </div>
              ) : rows.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-5xl text-success">check_circle</span>
                  </div>
                  <h3 className="text-xl font-bold mb-2">Tout est validé !</h3>
                  <p className="opacity-70">Aucun utilisateur en attente</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {rows.map(r => (
                    <div key={r.id} className="card bg-gradient-to-r from-base-200 to-base-100 shadow-md hover:shadow-lg transition-all border border-base-300">
                      <div className="card-body p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="avatar placeholder">
                              <div className="bg-gradient-to-br from-warning to-warning/60 text-warning-content rounded-full w-14 h-14 shadow-md flex items-center justify-center">
                                <span className="text-2xl font-bold">{r.username[0].toUpperCase()}</span>
                              </div>
                            </div>
                            <div>
                              <div className="font-bold text-lg flex items-center gap-2">
                                {r.username}
                                {!r.is_email_verified && (
                                  <span className="badge badge-info badge-sm">Email non vérifié</span>
                                )}
                              </div>
                              <div className="text-sm opacity-70 flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">mail</span>
                                {r.email}
                              </div>
                              <div className="text-xs opacity-50 mt-1 flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs">calendar_month</span>
                                {formatDate(r.created_at)}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              className="btn btn-success btn-sm gap-2"
                              onClick={() => validate(r.id)}
                              disabled={loading}
                            >
                              <span className="material-symbols-outlined">check_circle</span>
                              <span className="hidden sm:inline">Valider</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}



          {/* Challenges Tab */}
          {activeTab === 'challenges' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary-content">emoji_events</span>
                  </div>
                  <h2 className="text-2xl font-bold">Challenges publiés</h2>
                </div>
                <select
                  className="select select-bordered select-sm"
                  value={pageSizeCh}
                  onChange={e => setPageSizeCh(Number(e.target.value))}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <span className="loading loading-ring loading-lg text-primary"></span>
                  <p className="text-sm opacity-60">Chargement...</p>
                </div>
              ) : challenges.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-5xl text-primary">emoji_events</span>
                  </div>
                  <h3 className="text-xl font-bold mb-2">Aucun challenge</h3>
                  <p className="opacity-70">Aucun challenge publié pour le moment</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {challenges.map(ch => (
                      <div key={ch.id} className="card bg-gradient-to-r from-base-200 to-base-100 shadow-md hover:shadow-lg transition-all border border-base-300">
                        <div className="card-body p-4">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <h3 className="font-bold text-lg">{ch.title}</h3>
                                <CategoryBadge name={ch.category} className="badge-sm" />
                              </div>
                              <div className="flex flex-wrap gap-4 text-sm opacity-70">
                                <span className="flex items-center gap-1">
                                  <span className="material-symbols-outlined text-sm">person</span>
                                  {ch.author}
                                </span>
                                <span className="flex items-center gap-1">
                                  <span className="material-symbols-outlined text-sm">favorite</span>
                                  {ch.likes_count}
                                </span>
                                <span className="flex items-center gap-1">
                                  <span className="material-symbols-outlined text-sm">chat_bubble</span>
                                  {ch.comments_count}
                                </span>
                                <span className="flex items-center gap-1">
                                  <span className="material-symbols-outlined text-sm">group</span>
                                  {ch.participations_count}
                                </span>
                              </div>
                            </div>
                            <button
                              className="btn btn-error btn-sm gap-2"
                              onClick={() => deleteChallenge(ch.id)}
                              disabled={loading}
                            >
                              <span className="material-symbols-outlined">delete</span>
                              <span className="hidden sm:inline">Supprimer</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-center mt-6 pt-6 border-t border-base-300">
                    <div className="join shadow-md">
                      <button
                        className="join-item btn btn-sm"
                        disabled={pageCh <= 1}
                        onClick={() => setPageCh(p => p - 1)}
                      >
                        <span className="material-symbols-outlined">chevron_left</span>
                      </button>
                      <button className="join-item btn btn-sm btn-active">Page {pageCh}</button>
                      <button
                        className="join-item btn btn-sm"
                        onClick={() => setPageCh(p => p + 1)}
                      >
                        <span className="material-symbols-outlined">chevron_right</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Comments Tab */}
          {activeTab === 'comments' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                    <span className="material-symbols-outlined text-secondary-content">chat_bubble</span>
                  </div>
                  <h2 className="text-2xl font-bold">Commentaires</h2>
                </div>
                <select
                  className="select select-bordered select-sm"
                  value={pageSizeCm}
                  onChange={e => setPageSizeCm(Number(e.target.value))}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <span className="loading loading-ring loading-lg text-secondary"></span>
                  <p className="text-sm opacity-60">Chargement...</p>
                </div>
              ) : comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-20 h-20 rounded-full bg-secondary/20 flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-5xl text-secondary">chat_bubble</span>
                  </div>
                  <h3 className="text-xl font-bold mb-2">Aucun commentaire</h3>
                  <p className="opacity-70">Aucun commentaire pour le moment</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {comments.map(cm => (
                      <div key={cm.id} className="card bg-gradient-to-r from-base-200 to-base-100 shadow-md hover:shadow-lg transition-all border border-base-300">
                        <div className="card-body p-4">
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <span className="font-bold">{cm.author}</span>
                                <span className="badge badge-ghost badge-sm">Challenge #{cm.challenge_id}</span>
                              </div>
                              <p className="text-sm mb-2 bg-base-300/50 p-2 rounded">{cm.text}</p>
                              <div className="text-xs opacity-50 flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs">schedule</span>
                                {formatDateTime(cm.created_at)}
                              </div>
                            </div>
                            <button
                              className="btn btn-error btn-sm gap-2"
                              onClick={() => deleteComment(cm.id)}
                              disabled={loading}
                            >
                              <span className="material-symbols-outlined">delete</span>
                              <span className="hidden sm:inline">Supprimer</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-center mt-6 pt-6 border-t border-base-300">
                    <div className="join shadow-md">
                      <button
                        className="join-item btn btn-sm"
                        disabled={pageCm <= 1}
                        onClick={() => setPageCm(p => p - 1)}
                      >
                        <span className="material-symbols-outlined">chevron_left</span>
                      </button>
                      <button className="join-item btn btn-sm btn-active">Page {pageCm}</button>
                      <button
                        className="join-item btn btn-sm"
                        onClick={() => setPageCm(p => p + 1)}
                      >
                        <span className="material-symbols-outlined">chevron_right</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Participations Tab */}
          {activeTab === 'participations' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-success flex items-center justify-center">
                    <span className="material-symbols-outlined text-success-content">group</span>
                  </div>
                  <h2 className="text-2xl font-bold">Participations</h2>
                </div>
                <div className="flex items-center gap-2">
                  <select className="select select-bordered select-sm" value={statusPr} onChange={e => { setPagePr(1); setStatusPr(e.target.value); }}>
                    <option value="pending">En attente</option>
                    <option value="approved">Validées</option>
                    <option value="rejected">Refusées</option>
                    <option value="all">Toutes</option>
                  </select>
                  <select className="select select-bordered select-sm" value={pageSizePr} onChange={e => setPageSizePr(Number(e.target.value))}>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                  <button className="btn btn-ghost btn-sm" onClick={() => loadParticipations()}>
                    <span className="material-symbols-outlined">refresh</span>
                  </button>
                </div>
              </div>

              {loadingPartsList ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <span className="loading loading-ring loading-lg text-success"></span>
                  <p className="text-sm opacity-60">Chargement...</p>
                </div>
              ) : errorParts ? (
                <div className="alert alert-error shadow-md">
                  <span className="material-symbols-outlined">error</span>
                  <span>{errorParts}</span>
                </div>
              ) : parts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-5xl text-success">group</span>
                  </div>
                  <h3 className="text-xl font-bold mb-2">Aucune participation</h3>
                  <p className="opacity-70">Aucune participation pour le moment</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {parts.map(p => (
                      <div key={p.id} className="card bg-gradient-to-r from-base-200 to-base-100 shadow-md hover:shadow-lg transition-all border border-base-300">
                        <div className="card-body p-4">
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-2 flex-wrap flex-1">
                                <span className="badge"># {p.id}</span>
                                <span className="font-bold">{p.username}</span>
                                <span className="opacity-50">→</span>
                                <span className="font-semibold text-primary">{p.challenge_title}</span>
                                <span className={`badge ${p.status === 'approved' ? 'badge-success' : p.status === 'rejected' ? 'badge-error' : 'badge-warning'}`}>
                                  {STATUS_LABELS[p.status] || p.status}
                                </span>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  className="btn btn-success btn-sm btn-circle"
                                  title="Approuver"
                                  onClick={async () => {
                                    try {
                                      await api.put(`/participations/${p.id}`, { status: 'approved' });
                                      await loadParticipations();
                                      showMessage('success', 'Participation approuvée');
                                    } catch {
                                      toastError('Erreur');
                                    }
                                  }}
                                >
                                  <span className="material-symbols-outlined">check</span>
                                </button>
                                <button
                                  className="btn btn-error btn-sm btn-circle"
                                  title="Rejeter"
                                  onClick={async () => {
                                    try {
                                      await api.put(`/participations/${p.id}`, { status: 'rejected' });
                                      await loadParticipations();
                                      showMessage('success', 'Participation rejetée');
                                    } catch {
                                      toastError('Erreur');
                                    }
                                  }}
                                >
                                  <span className="material-symbols-outlined">close</span>
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-xs opacity-70">
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs">schedule</span>
                                {formatDateTime(p.created_at)}
                              </span>
                              {p.proof_url && (
                                <button
                                  className="btn btn-primary btn-xs gap-1"
                                  onClick={() => openProof(p.proof_url)}
                                >
                                  <span className="material-symbols-outlined text-xs">visibility</span>
                                  Voir la preuve
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {totalPr > pageSizePr && (
                    <div className="flex justify-center mt-6 pt-6 border-t border-base-300">
                      <div className="join shadow-md">
                        <button
                          className="join-item btn btn-sm"
                          disabled={pagePr <= 1}
                          onClick={() => setPagePr(p => Math.max(1, p - 1))}
                        >
                          <span className="material-symbols-outlined">chevron_left</span>
                        </button>
                        <button className="join-item btn btn-sm btn-active">Page {pagePr}</button>
                        <button
                          className="join-item btn btn-sm"
                          disabled={(pagePr * pageSizePr) >= totalPr}
                          onClick={() => setPagePr(p => p + 1)}
                        >
                          <span className="material-symbols-outlined">chevron_right</span>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-neutral flex items-center justify-center">
                    <span className="material-symbols-outlined text-neutral-content">group</span>
                  </div>
                  <h2 className="text-2xl font-bold">Étudiants</h2>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <label htmlFor="admin-users-search" className="sr-only">Rechercher</label>
                    <input
                      id="admin-users-search"
                      name="search"
                      aria-label="Rechercher des étudiants"
                      aria-controls="admin-users-results"
                      autoComplete="off"
                      className="input input-bordered input-sm pl-9 w-64 sm:w-80 md:w-96"
                      type="text"
                      placeholder="Rechercher..."
                      value={qUsers}
                      onChange={e => setQUsers(e.target.value)}
                    />
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm opacity-50">
                      search
                    </span>
                  </div>
                  <select
                    id="admin-users-status"
                    name="status"
                    aria-label="Filtrer par statut"
                    className="select select-bordered select-sm"
                    value={filterStatusUsers}
                    onChange={e => setFilterStatusUsers(e.target.value)}
                  >
                    <option value="all">Tous</option>
                    <option value="online">En ligne</option>
                    <option value="offline">Hors ligne</option>
                  </select>
                  <button className="btn btn-ghost btn-sm" onClick={() => { loadAllUsers(); loadOnline(); }}>
                    <span className="material-symbols-outlined">refresh</span>
                  </button>
                </div>
              </div>

              {loadingAllUsers ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <span className="loading loading-ring loading-lg"></span>
                  <p className="text-sm opacity-60">Chargement...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-20 h-20 rounded-full bg-neutral/20 flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-5xl">group</span>
                  </div>
                  <h3 className="text-xl font-bold mb-2">Aucun utilisateur</h3>
                  <p className="opacity-70">Aucun élève à afficher</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredUsers.map(u => (
                    <div key={u.id} className="card bg-gradient-to-r from-base-200 to-base-100 shadow-md hover:shadow-lg transition-all border border-base-300">
                      <div className="card-body p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <div className="avatar">
                                <div className="w-14 rounded-full ring-2 ring-base-300">
                                  {u.avatar ? (
                                    <img src={assetUrl(u.avatar)} alt={u.username} />
                                  ) : (
                                    <div className="bg-primary text-primary-content w-14 h-14 flex items-center justify-center text-xl font-bold">
                                      {u.username?.[0]?.toUpperCase()}
                                    </div>
                                  )}
                                </div>
                              </div>
                              {onlineUserIds.has(u.id) ? (
                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-base-100 animate-pulse"></span>
                              ) : null}
                            </div>
                            <div>
                              <div className="font-bold text-lg">{u.username}</div>
                              <div className="text-sm opacity-70 flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">mail</span>
                                {u.email}
                              </div>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {u.town ? (
                                  <span className="badge badge-ghost badge-sm gap-1">
                                    <span className="material-symbols-outlined text-xs">location_city</span>
                                    {u.town}
                                  </span>
                                ) : null}
                                {u.promo ? (
                                  <span className="badge badge-ghost badge-sm gap-1">
                                    <span className="material-symbols-outlined text-xs">school</span>
                                    {u.promo}
                                  </span>
                                ) : null}
                                {typeof u.points === 'number' ? (
                                  <span className="badge badge-primary badge-sm gap-1">
                                    <span className="material-symbols-outlined text-xs">bolt</span>
                                    {u.points}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`badge badge-sm ${u.is_verified ? 'badge-success' : 'badge-warning'}`}>{u.is_verified ? 'Validé' : 'Non validé'}</span>
                            <span className={`badge badge-sm ${u.is_email_verified ? 'badge-info' : 'badge-ghost'}`}>{u.is_email_verified ? 'Email vérifié' : 'Email non vérifié'}</span>
                            <div className={`w-2 h-2 rounded-full ${onlineUserIds.has(u.id) ? 'bg-success animate-pulse' : 'bg-base-300'}`}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-base-300 flex items-center justify-between">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <span className="material-symbols-outlined">visibility</span>
                Preuve
              </h3>
              <button
                className="btn btn-ghost btn-sm btn-circle"
                onClick={() => setShowPreview(false)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-4 overflow-auto flex-1">
              {previewType === 'image' && (
                <img src={assetUrl(previewUrl)} alt="Preuve" className="rounded-xl w-full shadow-lg" />
              )}
              {previewType === 'video' && (
                <video src={assetUrl(previewUrl)} controls className="rounded-xl w-full shadow-lg" />
              )}
              {previewType === 'pdf' && (
                <iframe src={assetUrl(previewUrl)} className="w-full h-[70vh] rounded-xl shadow-lg" title="PDF" />
              )}
              {!previewType && (
                <a
                  className="btn btn-primary gap-2"
                  href={assetUrl(previewUrl)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="material-symbols-outlined">open_in_new</span>
                  Ouvrir dans un nouvel onglet
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirm.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="p-4 border-b border-base-300">
              <h3 className="font-bold text-lg text-error flex items-center gap-2">
                <span className="material-symbols-outlined">warning</span>
                {confirm.title || 'Confirmation'}
              </h3>
            </div>
            <div className="p-6">
              <p className="opacity-80">{confirm.message || 'Veux-tu continuer ?'}</p>
            </div>
            <div className="p-4 border-t border-base-300 flex justify-end gap-2">
              <button
                className="btn btn-ghost"
                onClick={() => setConfirm({ open: false, title: '', message: '', action: null })}
              >
                Annuler
              </button>
              <button
                className="btn btn-error gap-2"
                onClick={async () => {
                  const act = confirm.action;
                  setConfirm({ open: false, title: '', message: '', action: null });
                  if (typeof act === 'function') await act();
                }}
              >
                <span className="material-symbols-outlined">delete</span>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}
