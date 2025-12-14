// Bouton de like réutilisable
// - Gère le compteur, l'état liké et les mises à jour optimistes
// - Écoute les évènements Socket.io pour MAJ en temps réel
import { useEffect, useState, useCallback } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import socket from '../../services/socket';
// Composant Bouton de like
export default function LikeButton({ targetType, targetId }) {
  const { user, isAuthenticated } = useAuth();
  const [count, setCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likeId, setLikeId] = useState(null);
  const [busy, setBusy] = useState(false);
  // Chargement initial des données de like
  const load = useCallback(async () => {
    try {
      const res = await api.get(`/${targetType}s/${targetId}/likes`);
      setCount(res.data?.count || 0);
      if (user) {
        const check = await api.get(`/likes/user/${user.id}`, { params: { targetType, targetId } });
        setLiked(!!check.data?.liked);
        setLikeId(check.data?.likeId || null);
      }
    } catch {
      setCount(c => c);
    }
  }, [targetType, targetId, user]);
  // Charger les données au montage et à chaque changement de cible
  useEffect(() => { load(); }, [load]);
  // Écouter les évènements de like via Socket.io
  useEffect(() => {
    function onAdded(payload) {
      if (payload.targetType === targetType && Number(payload.targetId) === Number(targetId)) {
        setCount(payload.count);
      }
    }
    function onRemoved(payload) {
      if (payload.targetType === targetType && Number(payload.targetId) === Number(targetId)) {
        setCount(payload.count);
      }
    }
    socket.on('like:added', onAdded);
    socket.on('like:removed', onRemoved);
    return () => {
      socket.off('like:added', onAdded);
      socket.off('like:removed', onRemoved);
    };
  }, [targetType, targetId]);
  // Fonction de toggle du like
  async function toggle() {
    if (!isAuthenticated || busy) return;
    setBusy(true);
    const optimisticLiked = !liked;
    setLiked(optimisticLiked);
    setCount(c => optimisticLiked ? c + 1 : Math.max(0, c - 1));
    try {
      if (optimisticLiked) {
        const res = await api.post('/likes', { targetType, targetId });
        setLikeId(res.data?.id || null);
      } else {
        if (likeId) await api.delete(`/likes/${likeId}`);
        setLikeId(null);
      }
    } catch {
      setLiked(!optimisticLiked);
      setCount(c => !optimisticLiked ? c + 1 : Math.max(0, c - 1));
    } finally {
      setBusy(false);
    }
  }

  return (
    <button onClick={toggle} disabled={!isAuthenticated} className={`btn btn-ghost gap-2 ${busy ? 'opacity-60' : ''}`}>
      <span className={`material-symbols-outlined ${liked ? 'text-error' : ''} transition-transform ${busy ? 'scale-95' : 'scale-100'}`} style={{ fontVariationSettings: `'FILL' ${liked ? 1 : 0}, 'wght' 300, 'GRAD' 0, 'opsz' 24` }}>{liked ? 'favorite' : 'favorite_border'}</span>
      <span className="font-semibold">{count}</span>
    </button>
  );
}
