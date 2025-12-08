import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pseudo, setPseudo] = useState('');
  const [ville, setVille] = useState('');
  const [promo, setPromo] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function isLaplateforme(email) {
    return /@laplateforme\.io$/i.test(email);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!isLaplateforme(email)) {
      setError('Email @laplateforme.io requis');
      return;
    }
    const res = await register({ email, password, pseudo, ville, promo });
    if (res.ok) {
      setSuccess('Inscription effectuée. En attente de validation admin.');
      setTimeout(() => navigate('/login'), 1200);
    } else setError(res.error);
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title">Inscription</h2>
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}
          <form onSubmit={onSubmit} className="space-y-4">
            <input className="input input-bordered w-full" type="email" placeholder="Email @laplateforme.io" value={email} onChange={e => setEmail(e.target.value)} />
            <input className="input input-bordered w-full" type="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} />
            <input className="input input-bordered w-full" type="text" placeholder="Pseudo" value={pseudo} onChange={e => setPseudo(e.target.value)} />
            <input className="input input-bordered w-full" type="text" placeholder="Ville" value={ville} onChange={e => setVille(e.target.value)} />
            <input className="input input-bordered w-full" type="text" placeholder="Promo" value={promo} onChange={e => setPromo(e.target.value)} />
            <button className="btn btn-primary w-full" disabled={loading}>
              {loading ? 'Chargement...' : 'Créer mon compte'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
