import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function ChallengeDetail() {
  const { id } = useParams();
  const { token } = useAuth();
  const [challenge, setChallenge] = useState(null);
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    } catch (e) {
      setError('Impossible de charger le challenge');
    } finally {
      setLoading(false);
    }
  }, [id]);

  async function addComment() {
    if (!text.trim()) return;
    try {
      await api.post(`/challenges/${id}/comments`, { text });
      setText('');
      load();
    } catch (e) {}
  }

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="loading loading-dots loading-lg"/>;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!challenge) return null;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="card bg-base-100 shadow mb-6">
        <div className="card-body">
          <h2 className="card-title">{challenge.title}</h2>
          <p className="text-sm opacity-70">{challenge.category}</p>
          <p>{challenge.description}</p>
        </div>
      </div>
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h3 className="card-title">Commentaires</h3>
          <ul className="space-y-2 mb-4">
            {comments.map(c => (
              <li key={c.id} className="p-3 rounded bg-base-200">
                <div className="text-sm opacity-70">{c.author}</div>
                <div>{c.text}</div>
              </li>
            ))}
            {!comments.length && <li className="p-3">Aucun commentaire</li>}
          </ul>
          <div className="join w-full">
            <input className="input input-bordered join-item w-full" placeholder="Ajouter un commentaire" value={text} onChange={e => setText(e.target.value)} disabled={!token} />
            <button className="btn btn-primary join-item" onClick={addComment} disabled={!token}>Envoyer</button>
          </div>
          {!token && <div className="mt-2 text-sm opacity-70">Connecte-toi pour commenter</div>}
        </div>
      </div>
    </div>
  );
}
