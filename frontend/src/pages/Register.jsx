// Page Inscription - Design Modern 2025
// Prêt à copier-coller pour remplacer votre Register.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Page from '../components/Layout/Page.jsx';
import { useToast } from '../components/Common/Toast.jsx';

export default function Register() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pseudo, setPseudo] = useState('');
  const [ville, setVille] = useState('');
  const [promo, setPromo] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  function isLaplateforme(email) {
    return /@laplateforme\.io$/i.test(email);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!isLaplateforme(email)) {
      setError('Email @laplateforme.io requis');
      toastError('Email @laplateforme.io requis');
      return;
    }
    const res = await register({ email, password, pseudo, ville, promo });
    if (res.ok) {
      setSuccess('Inscription effectuée. Email vérifié. En attente de validation admin.');
      toastSuccess('Inscription réussie');
      setTimeout(() => navigate('/login'), 1200);
    } else {
      setError(res.error);
      toastError(res.error || "Erreur d'inscription");
    }
  }

  return (
    <Page showBreadcrumb={false} title={null} subtitle={null} icon={null}>
      <div className="min-h-[calc(100vh-20rem)] flex items-center justify-center py-8">
        <div className="w-full max-w-2xl">

          {/* Main Card */}
          <div className="card bg-gradient-to-br from-base-100 to-base-200 shadow-2xl border border-base-300">
            <div className="card-body p-8">

              {/* Header avec icône */}
              <div className="flex flex-col items-center mb-6">
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-lg mb-4">
                  <span className="material-symbols-outlined text-3xl text-primary-content">person_add</span>
                </div>
                <h2 className="text-2xl font-bold text-center">Rejoins-nous !</h2>
                <p className="text-sm opacity-70 text-center mt-1">
                  Crée ton compte en quelques secondes
                </p>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="alert alert-error shadow-md mb-4 animate-in fade-in slide-in-from-top-2">
                  <span className="material-symbols-outlined">error</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Success Alert */}
              {success && (
                <div className="alert alert-success shadow-md mb-4 animate-in fade-in slide-in-from-top-2">
                  <span className="material-symbols-outlined">check_circle</span>
                  <span>{success}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={onSubmit} className="space-y-4">

                {/* Email Input */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">email</span>
                      Email
                    </span>
                    <span className="label-text-alt text-error">*</span>
                  </label>
                  <div className="relative">
                    <input
                      className="input input-bordered w-full pl-10 focus:outline-none focus:ring-2 focus:ring-primary"
                      type="email"
                      placeholder="prenom.nom@laplateforme.io"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                    />
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 opacity-50">
                      alternate_email
                    </span>
                  </div>
                  <label className="label">
                    <span className="label-text-alt opacity-70">
                      Obligatoire - Format @laplateforme.io
                    </span>
                  </label>
                </div>

                {/* Password Input */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">lock</span>
                      Mot de passe
                    </span>
                    <span className="label-text-alt text-error">*</span>
                  </label>
                  <div className="relative">
                    <input
                      className="input input-bordered w-full pl-10 pr-12 focus:outline-none focus:ring-2 focus:ring-primary"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                    />
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 opacity-50">
                      key
                    </span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm btn-circle absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <span className="material-symbols-outlined text-lg">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Pseudo Input */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">badge</span>
                      Pseudo
                    </span>
                    <span className="label-text-alt text-error">*</span>
                  </label>
                  <div className="relative">
                    <input
                      className="input input-bordered w-full pl-10 focus:outline-none focus:ring-2 focus:ring-primary"
                      type="text"
                      placeholder="Ton pseudo"
                      value={pseudo}
                      onChange={e => setPseudo(e.target.value)}
                      required
                    />
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 opacity-50">
                      person
                    </span>
                  </div>
                </div>

                {/* Ville Input */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">location_city</span>
                      Ville
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      className="input input-bordered w-full pl-10 focus:outline-none focus:ring-2 focus:ring-primary"
                      type="text"
                      placeholder="Ex: Marseille, Paris, Lyon..."
                      value={ville}
                      onChange={e => setVille(e.target.value)}
                    />
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 opacity-50">
                      place
                    </span>
                  </div>
                </div>

                {/* Promo Input */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">school</span>
                      Promotion
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      className="input input-bordered w-full pl-10 focus:outline-none focus:ring-2 focus:ring-primary"
                      type="text"
                      placeholder="Ex: 2025, CDPI-2025, CDA..."
                      value={promo}
                      onChange={e => setPromo(e.target.value)}
                    />
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 opacity-50">
                      workspace_premium
                    </span>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  className="btn btn-primary w-full gap-2 shadow-lg hover:shadow-xl transition-all mt-6"
                  disabled={loading || !email || !password || !pseudo}
                >
                  {loading ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Création en cours...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">person_add</span>
                      Créer mon compte
                    </>
                  )}
                </button>

                {/* Required fields info */}
                <p className="text-xs text-center opacity-60 mt-2">
                  <span className="text-error">*</span> Champs obligatoires
                </p>
              </form>

              {/* Divider */}
              <div className="divider my-6">DÉJÀ UN COMPTE ?</div>

              {/* Login link */}
              <div className="text-center">
                <Link
                  to="/login"
                  className="btn btn-outline btn-primary btn-sm gap-2"
                >
                  <span className="material-symbols-outlined">login</span>
                  Se connecter
                </Link>
              </div>
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">

            {/* Validation info */}
            <div className="card bg-base-100 shadow-lg border border-base-300">
              <div className="card-body p-4">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-warning text-xl flex-shrink-0">schedule</span>
                  <div className="text-xs">
                    <p className="font-semibold mb-1">Validation admin</p>
                    <p className="opacity-70">
                      Ton compte sera vérifié par un administrateur avant activation
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Email verification info */}
            <div className="card bg-base-100 shadow-lg border border-base-300">
              <div className="card-body p-4">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-success text-xl flex-shrink-0">verified</span>
                  <div className="text-xs">
                    <p className="font-semibold mb-1">Email vérifié</p>
                    <p className="opacity-70">
                      Les emails @laplateforme.io sont automatiquement vérifiés
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Page>
  );
}