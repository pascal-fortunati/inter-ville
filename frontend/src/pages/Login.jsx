import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function isLaplateforme(email) {
    return /@laplateforme\.io$/i.test(email);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (!isLaplateforme(email)) {
      setError('Email @laplateforme.io requis');
      return;
    }
    const res = await login(email, password);
    if (res.ok) navigate('/');
    else setError(res.error);
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title">Connexion</h2>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={onSubmit} className="space-y-4">
            <input className="input input-bordered w-full" type="email" placeholder="Email @laplateforme.io" value={email} onChange={e => setEmail(e.target.value)} />
            <input className="input input-bordered w-full" type="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} />
            <button className="btn btn-primary w-full" disabled={loading}>
              {loading ? 'Chargement...' : 'Se connecter'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
