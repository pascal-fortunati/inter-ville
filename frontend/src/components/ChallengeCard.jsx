// Carte challenge - Design Modern 2025
// - Aperçu optimisé avec overlay
// - Stats intégrées sur l'image
// - Actions groupées et hiérarchisées
import { Link } from 'react-router-dom';
import api, { assetUrl } from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';
import CategoryBadge from './Common/CategoryBadge.jsx';
import LikeButton from './Common/LikeButton.jsx';
import { useState, useEffect, useMemo } from 'react';
import socket from '../services/socket';
// - Gère l'état d'inscription et les interactions en temps réel
const ChallengeCard = ({ challenge }) => {
  const { title, category, description, id, image_url, likes_count, comments_count } = challenge;
  const { isAuthenticated, user } = useAuth();
  const [joined, setJoined] = useState(false);
  const [busy, setBusy] = useState(false);
  const [likeCount, setLikeCount] = useState(likes_count || 0);
  const [commentCount, setCommentCount] = useState(comments_count || 0);
  const previewText = useMemo(() => String(description || '').replace(/<[^>]+>/g, ''), [description]);
  const previewImg = useMemo(() => {
    if (image_url) return assetUrl(image_url);
    const html = String(description || '');
    const m = html.match(/<img[^>]*src=["']([^"']+)["']/i);
    if (m && m[1]) return assetUrl(m[1]);
    return null;
  }, [image_url, description]);
  // - Met à jour les compteurs de likes et commentaires en temps réel
  useEffect(() => {
    setLikeCount(likes_count || 0);
    setCommentCount(comments_count || 0);
  }, [likes_count, comments_count]);
  // - Écoute les événements socket pour les mises à jour en temps réel
  useEffect(() => {
    function onAdded(p) {
      if (p.targetType === 'challenge' && Number(p.targetId) === Number(id)) {
        setLikeCount(p.count);
      }
    }
    function onRemoved(p) {
      if (p.targetType === 'challenge' && Number(p.targetId) === Number(id)) {
        setLikeCount(p.count);
      }
    }
    function onNewComment(p) {
      if (Number(p.challengeId) === Number(id)) {
        setCommentCount(c => c + 1);
      }
    }
    socket.on('like:added', onAdded);
    socket.on('like:removed', onRemoved);
    socket.on('comment:new', onNewComment);
    return () => {
      socket.off('like:added', onAdded);
      socket.off('like:removed', onRemoved);
      socket.off('comment:new', onNewComment);
    };
  }, [id]);
  // - Vérifie si l'utilisateur est déjà inscrit au challenge
  useEffect(() => {
    let alive = true;
    async function fetchJoined() {
      if (!isAuthenticated) return;
      try {
        const r = await api.get(`/challenges/${id}/participations/me`);
        if (!alive) return;
        setJoined(!!r.data?.joined);
      } catch { void 0 }
    }
    fetchJoined();
    return () => { alive = false; };
  }, [isAuthenticated, id]);
  // - Gère l'inscription au challenge
  async function participate() {
    if (!isAuthenticated || !user?.is_verified || joined || busy) return;
    setBusy(true);
    try {
      await api.post(`/challenges/${id}/participations`);
      setJoined(true);
    } catch (e) {
      const code = e?.response?.status;
      if (code === 409) {
        setJoined(true);
      }
    } finally {
      setBusy(false);
    }
  }
  // - Libellé du bouton en fonction de l'état
  const participateLabel = joined
    ? 'Inscrit'
    : (!isAuthenticated
      ? 'Connecte-toi'
      : (!user?.is_verified
        ? 'Compte non validé'
        : (busy ? '...' : 'Participer')));

  return (
    <div className="card bg-base-100 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group border border-base-300">

      {/* Image avec overlay et stats */}
      <Link to={`/defis/${id}`} className="relative">
        {previewImg ? (
          <figure className="relative h-48 overflow-hidden">
            <img
              src={previewImg}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

            {/* Stats sur l'image */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full">
                  <span className="material-symbols-outlined text-red-400 text-sm">favorite</span>
                  <span className="text-white text-xs font-semibold">{likeCount}</span>
                </div>
                <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full">
                  <span className="material-symbols-outlined text-blue-400 text-sm">chat_bubble</span>
                  <span className="text-white text-xs font-semibold">{commentCount}</span>
                </div>
              </div>
              <CategoryBadge name={category} />
            </div>
          </figure>
        ) : (
          // Fallback sans image
          <div className="h-48 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center relative">
            <span className="material-symbols-outlined text-6xl opacity-20">emoji_events</span>
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-black/20 backdrop-blur-sm px-2 py-1 rounded-full">
                  <span className="material-symbols-outlined text-primary text-sm">favorite</span>
                  <span className="text-base-content text-xs font-semibold">{likeCount}</span>
                </div>
                <div className="flex items-center gap-1 bg-black/20 backdrop-blur-sm px-2 py-1 rounded-full">
                  <span className="material-symbols-outlined text-primary text-sm">chat_bubble</span>
                  <span className="text-base-content text-xs font-semibold">{commentCount}</span>
                </div>
              </div>
              <CategoryBadge name={category} />
            </div>
          </div>
        )}
      </Link>

      {/* Contenu */}
      <div className="card-body p-4">
        {/* Titre */}
        <Link to={`/defis/${id}`}>
          <h2 className="card-title text-base font-bold line-clamp-2 hover:text-primary transition-colors mb-2">
            {title}
          </h2>
        </Link>

        {/* Description */}
        <p className="text-sm text-base-content/70 line-clamp-2 mb-4 leading-relaxed">
          {previewText}
        </p>

        {/* Actions */}
        <div className="flex items-center justify-between gap-2 mt-auto pt-2 border-t border-base-300">
          <div className="flex items-center gap-1">
            <LikeButton targetType="challenge" targetId={id} />
            <Link
              to={`/defis/${id}`}
              className="btn btn-ghost btn-sm gap-1 hover:bg-primary/10"
            >
              <span className="material-symbols-outlined text-lg">visibility</span>
              <span className="hidden sm:inline">Détails</span>
            </Link>
          </div>

          <button
            className={`btn btn-sm gap-1 ${joined
              ? 'btn-success'
              : 'btn-primary'
              } ${(!isAuthenticated || !user?.is_verified || busy) ? 'btn-disabled' : ''}`}
            disabled={!isAuthenticated || !user?.is_verified || joined || busy}
            onClick={participate}
          >
            <span className="material-symbols-outlined text-base">
              {joined ? 'check_circle' : 'add_circle'}
            </span>
            <span className="hidden sm:inline">{participateLabel}</span>
            <span className="sm:hidden">{joined ? '✓' : '+'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChallengeCard
