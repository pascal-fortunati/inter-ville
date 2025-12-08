import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export default function Profile() {
  const { user } = useAuth();
  const [pseudo, setPseudo] = useState(user?.pseudo || '');
  const [ville, setVille] = useState(user?.ville || '');
  const [promo, setPromo] = useState(user?.promo || '');
  const [message, setMessage] = useState('');

  async function save() {
    setMessage('');
    try {
      await api.put('/users/me', { pseudo, ville, promo });
      setMessage('Profil mis à jour');
    } catch (e) {
      setMessage('Erreur lors de la mise à jour');
    }
  }

  if (!user) return <div className="alert">Veuillez vous connecter</div>;

  return (
    <div className="max-w-lg mx-auto">
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title">Mon profil</h2>
          {message && <div className="alert">{message}</div>}
          <div className="form-control">
            <label className="label"><span className="label-text">Pseudo</span></label>
            <input className="input input-bordered" value={pseudo} onChange={e => setPseudo(e.target.value)} />
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Ville</span></label>
            <input className="input input-bordered" value={ville} onChange={e => setVille(e.target.value)} />
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Promo</span></label>
            <input className="input input-bordered" value={promo} onChange={e => setPromo(e.target.value)} />
          </div>
          <div className="card-actions justify-end mt-4">
            <button className="btn btn-primary" onClick={save}>Sauvegarder</button>
          </div>
        </div>
      </div>
    </div>
  );
}
