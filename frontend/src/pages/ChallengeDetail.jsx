// Page Détail du challenge
// - Affiche contenu, likes, commentaires et participations
// - Écoute les évènements temps réel (commentaires)
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api, { assetUrl } from '../api/client';
import { useAuth } from '../context/AuthContext';
import LikeButton from '../components/Common/LikeButton.jsx';
import CategoryBadge from '../components/Common/CategoryBadge.jsx';
import { useToast } from '../components/Common/Toast.jsx';
import socket from '../services/socket';
import Page from '../components/Layout/Page.jsx';
import DOMPurify from 'dompurify';

export default function ChallengeDetail() {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();
  const { success, error: errorToast } = useToast();
  const [challenge, setChallenge] = useState(null);
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [partCount, setPartCount] = useState(0);
  const [joined, setJoined] = useState(false);
  const [partStatus, setPartStatus] = useState('pending');
  const [proofUrl, setProofUrl] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [c, cm] = await Promise.all([
        api.get(`/challenges/${id}`),
        api.get(`/challenges/${id}/comments`),
      ]);
      setChallenge(c.data);
      setComments(cm.data || []);
    } catch {
      setError('Impossible de charger le challenge');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadPartCount = useCallback(async () => {
    try {
      const r = await api.get(`/challenges/${id}/participations/count`);
      setPartCount(Number(r.data?.count || 0));
    } catch { void 0 }
  }, [id]);

  useEffect(() => { loadPartCount(); }, [loadPartCount]);

  async function participate() {
    if (!isAuthenticated || !user?.is_verified || joined || busy) return;
    setBusy(true);
    try {
      const res = await api.post(`/challenges/${id}/participations`, { proofUrl: proofUrl || null });
      setJoined(true);
      setPartStatus('pending');
      setProofUrl('');
      setPartCount(Number(res.data?.count || (partCount + 1)));
      success('Participation enregistrée');
    } catch (e) {
      const code = e?.response?.status;
      if (code === 409) {
        setJoined(true);
        setPartStatus('pending');
        success('Tu participes déjà à ce challenge');
      } else {
        errorToast('Erreur participation');
      }
    } finally {
      setBusy(false);
    }
  }

  const checkJoined = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const r = await api.get(`/challenges/${id}/participations/me`);
      setJoined(!!r.data?.joined);
      setPartStatus(r.data?.status || 'pending');
      if (r.data?.proof_url) setProofUrl(r.data.proof_url);
    } catch { void 0 }
  }, [id, isAuthenticated]);

  async function addComment() {
    if (!text.trim()) return;
    try {
      await api.post(`/challenges/${id}/comments`, { text });
      setText('');
      success('Commentaire ajouté');
    } catch {
      setError("Erreur lors de l'envoi du commentaire");
      errorToast('Erreur commentaire');
    }
  }

  useEffect(() => { load(); }, [load]);
  useEffect(() => { checkJoined(); }, [checkJoined]);

  useEffect(() => {
    function onNewComment(payload) {
      if (Number(payload.challengeId) === Number(id)) {
        setComments(c => [{ id: payload.id, author: payload.author || 'Un utilisateur', text: payload.text }, ...c]);
      }
    }
    socket.on('comment:new', onNewComment);
    return () => { socket.off('comment:new', onNewComment); };
  }, [id]);

  if (loading) return <div className="loading loading-dots loading-lg" />;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!challenge) return null;
  const safeDescription = DOMPurify.sanitize(String(challenge?.description || ''));

  return (
    <Page icon="emoji_events" title="Challenge" subtitle="Détails et interactions" maxW="max-w-3xl">
      <div className="card bg-base-100 shadow mb-6">
        {challenge.image_url && <figure className="px-4 pt-4"><img src={assetUrl(challenge.image_url)} alt="" className="rounded-xl object-cover h-64 w-full" /></figure>}
        <div className="card-body">
          <div className="flex items-start justify-between">
            <h2 className="card-title">{challenge.title}</h2>
            <CategoryBadge name={challenge.category} />
          </div>
          <div dangerouslySetInnerHTML={{ __html: safeDescription }} />
          <div className="mt-2 flex items-center justify-between">
            <LikeButton targetType="challenge" targetId={id} />
            <div className="flex items-center gap-2">
              <div className="badge badge-ghost gap-1">
                <span className="material-symbols-outlined">group</span>
                {partCount}
              </div>
              {joined && (
                partStatus === 'approved' ? (
                  <span className="badge badge-success gap-1"><span className="material-symbols-outlined">verified</span>Validé</span>
                ) : partStatus === 'rejected' ? (
                  <span className="badge badge-error gap-1"><span className="material-symbols-outlined">cancel</span>Refusé</span>
                ) : (
                  <span className="badge badge-warning gap-1"><span className="material-symbols-outlined">hourglass_top</span>En attente</span>
                )
              )}
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  className="input input-bordered input-sm w-48"
                  placeholder="Lien de preuve (URL, optionnel)"
                  value={proofUrl}
                  onChange={e => setProofUrl(e.target.value)}
                  disabled={!isAuthenticated || partStatus === 'approved'}
                />
                <button
                  className={`btn btn-primary btn-sm ${(!isAuthenticated || !user?.is_verified || busy) ? 'btn-disabled' : ''}`}
                  onClick={async () => {
                    if (!joined) { await participate(); }
                    else {
                      if (!proofUrl?.trim()) return;
                      setBusy(true);
                      try {
                        await api.put(`/challenges/${id}/participations/me`, { proofUrl });
                        success('Preuve envoyée');
                      } catch { errorToast('Erreur preuve'); }
                      finally { setBusy(false); }
                    }
                  }}
                  disabled={!isAuthenticated || !user?.is_verified || busy || (joined && partStatus === 'approved')}
                >
                  {joined ? (
                    partStatus === 'approved' ? 'Validé' : (busy ? '...' : (partStatus === 'rejected' ? 'Réenvoyer la preuve' : 'Envoyer la preuve'))
                  ) : (
                    !isAuthenticated ? 'Connecte-toi' : (!user?.is_verified ? 'Compte non validé' : (busy ? '...' : 'Participer'))
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h3 className="card-title">Commentaires</h3>
          <ul className="space-y-2 mb-4">
            {comments.map(c => (
              <li key={c.id} className="p-3 rounded bg-base-200">
                <div className="text-sm opacity-70">{c.author}</div>
                <div className="flex items-center justify-between gap-3">
                  <div>{c.text}</div>
                  <LikeButton targetType="comment" targetId={c.id} />
                </div>
              </li>
            ))}
            {!comments.length && <li className="p-3">Aucun commentaire</li>}
          </ul>
          <div className="form-control">
            <textarea className="textarea textarea-bordered w-full" placeholder="Ajouter un commentaire" value={text} onChange={e => setText(e.target.value)} disabled={!isAuthenticated} />
          </div>
          <div className="card-actions justify-end mt-2">
            <button className="btn btn-primary" onClick={addComment} disabled={!isAuthenticated}>Envoyer</button>
          </div>
          {!isAuthenticated && <div className="mt-2 text-sm opacity-70">Connecte-toi pour commenter</div>}
        </div>
      </div>
    </Page>
  );
}
