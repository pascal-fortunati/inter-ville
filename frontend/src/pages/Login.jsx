// Page Connexion - Design Modern 2025
// Prêt à copier-coller pour remplacer votre Login.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Page from '../components/Layout/Page.jsx';
import { useToast } from '../components/Common/Toast.jsx';

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const { success, error: errorToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  function isLaplateforme(email) {
    return /@laplateforme\.io$/i.test(email);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (!isLaplateforme(email)) {
      setError('Email @laplateforme.io requis');
      errorToast('Email @laplateforme.io requis');
      return;
    }
    const res = await login(email, password);
    if (res.ok) {
      success('Connexion réussie');
      navigate('/');
    } else {
      setError(res.error);
      errorToast(res.error || 'Erreur de connexion');
    }
  }

  return (
    <Page showBreadcrumb={false} title={null} subtitle={null} icon={null}>
      <div className="min-h-[calc(100vh-20rem)] flex items-center justify-center">
        <div className="w-full max-w-2xl">
          {/* Main Card */}
          <div className="card bg-gradient-to-br from-base-100 to-base-200 shadow-2xl border border-base-300">
            <div className="card-body p-8">

              {/* Header avec icône */}
              <div className="flex flex-col items-center mb-6">
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-lg mb-4">
                  <span className="material-symbols-outlined text-3xl text-primary-content">login</span>
                </div>
                <h2 className="text-2xl font-bold text-center">Bienvenue !</h2>
                <p className="text-sm opacity-70 text-center mt-1">
                  Connecte-toi avec ton compte La Plateforme
                </p>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="alert alert-error shadow-md mb-4 animate-in fade-in slide-in-from-top-2">
                  <span className="material-symbols-outlined">error</span>
                  <span>{error}</span>
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
                  </label>
                  <div className="relative">
                    <input
                      className="input input-bordered w-full pl-10 focus:outline-none focus:ring-2 focus:ring-primary"
                      type="email"
                      placeholder="ton.email@laplateforme.io"
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
                      Utilise ton adresse @laplateforme.io
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

                {/* Submit Button */}
                <button
                  className="btn btn-primary w-full gap-2 shadow-lg hover:shadow-xl transition-all mt-6"
                  disabled={loading || !email || !password}
                >
                  {loading ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Connexion en cours...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">login</span>
                      Se connecter
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="divider my-6">OU</div>

              {/* Sign up link */}
              <div className="text-center">
                <p className="text-sm opacity-70 mb-3">
                  Pas encore de compte ?
                </p>
                <Link
                  to="/inscription"
                  className="btn btn-outline btn-primary btn-sm gap-2"
                >
                  <span className="material-symbols-outlined">person_add</span>
                  Créer un compte
                </Link>
              </div>
            </div>
          </div>

          {/* Info Card */}
          <div className="card bg-base-100 shadow-lg border border-base-300 mt-4">
            <div className="card-body p-4">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-info text-xl flex-shrink-0">info</span>
                <div className="text-sm">
                  <p className="font-semibold mb-1">Besoin d'aide ?</p>
                  <p className="opacity-70">
                    Seuls les emails @laplateforme.io sont acceptés.
                    Si tu rencontres des problèmes, contacte l'administration.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Page>
  );
}