// Page Profil utilisateur
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api, { assetUrl } from '../api/client';
import { useToast } from '../components/Common/Toast.jsx';
import Page from '../components/Layout/Page.jsx';

export default function Profile() {
  const { user } = useAuth();
  const { success, error: errorToast } = useToast();
  const [me, setMe] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [pseudo, setPseudo] = useState('');
  const [ville, setVille] = useState('');
  const [promo, setPromo] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [stats, setStats] = useState({ points: 0, challenges: 0, comments: 0, participations_approved: 0, likes_on_challenges: 0, likes_on_comments: 0 });
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('theme') || 'light'; } catch { return 'light'; }
  });
  const [prefChatNotify, setPrefChatNotify] = useState(() => {
    try { return (localStorage.getItem('pref:chatNotify') ?? 'true') !== 'false'; } catch { return true; }
  });
  const [prefNotifySound, setPrefNotifySound] = useState(() => {
    try { return (localStorage.getItem('pref:notifySound') ?? 'true') !== 'false'; } catch { return true; }
  });
  const [prefChatSound, setPrefChatSound] = useState(() => {
    try { return (localStorage.getItem('pref:chatSound') ?? 'true') !== 'false'; } catch { return true; }
  });
  const [prefNotifySoundVol, setPrefNotifySoundVol] = useState(() => {
    try { return Number(localStorage.getItem('pref:notifySoundVol') ?? '60'); } catch { return 60; }
  });
  const [prefChatSoundVol, setPrefChatSoundVol] = useState(() => {
    try { return Number(localStorage.getItem('pref:chatSoundVol') ?? '55'); } catch { return 55; }
  });
  const [pwdCurrent, setPwdCurrent] = useState('');
  const [pwdNew, setPwdNew] = useState('');
  const [pwdConfirm, setPwdConfirm] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/users/me');
        const m = res.data || null;
        setMe(m);
        setPseudo(m?.username || '');
        setVille(m?.town || '');
        setPromo(m?.promo || '');
        setAvatarPreview(m?.avatar || null);
        try {
          const s = await api.get('/users/me/stats');
          setStats({
            points: s.data?.points || 0,
            challenges: s.data?.challenges || 0,
            comments: s.data?.comments || 0,
            participations_approved: s.data?.participations_approved || 0,
            likes_on_challenges: s.data?.likes_on_challenges || 0,
            likes_on_comments: s.data?.likes_on_comments || 0,
          });
        } catch { void 0 }
      } catch { void 0 }
    }
    load();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('theme', theme); } catch { void 0 }
  }, [theme]);

  useEffect(() => {
    function onStorage(e) {
      if (e.key === 'theme') {
        setTheme(e.newValue || 'light');
      }
    }
    window.addEventListener('storage', onStorage);
    return () => { window.removeEventListener('storage', onStorage); };
  }, []);

  useEffect(() => {
    try { localStorage.setItem('pref:chatNotify', prefChatNotify ? 'true' : 'false'); } catch { void 0 }
  }, [prefChatNotify]);
  useEffect(() => {
    try { localStorage.setItem('pref:notifySound', prefNotifySound ? 'true' : 'false'); } catch { void 0 }
  }, [prefNotifySound]);
  useEffect(() => {
    try { localStorage.setItem('pref:chatSound', prefChatSound ? 'true' : 'false'); } catch { void 0 }
  }, [prefChatSound]);
  useEffect(() => {
    try { localStorage.setItem('pref:notifySoundVol', String(prefNotifySoundVol)); } catch { void 0 }
  }, [prefNotifySoundVol]);
  useEffect(() => {
    try { localStorage.setItem('pref:chatSoundVol', String(prefChatSoundVol)); } catch { void 0 }
  }, [prefChatSoundVol]);

  function handleAvatarChange(e) {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result);
      reader.readAsDataURL(file);
    }
  }

  async function save() {
    setMessage({ type: '', text: '' });
    setLoading(true);
    try {
      await api.put('/users/me', { pseudo, ville, promo });
      setMessage({ type: 'success', text: 'Profil mis à jour avec succès !' });
      success('Profil mis à jour');
      setIsEditing(false);
    } catch {
      setMessage({ type: 'error', text: 'Erreur lors de la mise à jour' });
      errorToast('Erreur profil');
    } finally {
      setLoading(false);
    }
  }

  async function uploadAvatar() {
    if (!avatar) return;
    setLoading(true);
    try {
      const form = new FormData();
      form.append('avatar', avatar);
      const res = await api.put('/users/me/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMe(res.data);
      setMessage({ type: 'success', text: 'Avatar mis à jour avec succès !' });
      success('Avatar mis à jour');
      setAvatar(null);
    } catch {
      setMessage({ type: 'error', text: 'Erreur lors de l\'upload' });
      errorToast('Erreur avatar');
    } finally {
      setLoading(false);
    }
  }

  async function changePassword() {
    setMessage({ type: '', text: '' });
    if (!pwdCurrent || !pwdNew || !pwdConfirm) {
      setMessage({ type: 'error', text: 'Tous les champs sont requis' });
      return errorToast('Tous les champs sont requis');
    }
    if (pwdNew.length < 8) {
      setMessage({ type: 'error', text: 'Mot de passe trop court (≥ 8)' });
      return errorToast('Mot de passe trop court');
    }
    if (pwdNew !== pwdConfirm) {
      setMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas' });
      return errorToast('Confirmation incorrecte');
    }
    setLoading(true);
    try {
      await api.put('/users/me/password', { current_password: pwdCurrent, new_password: pwdNew });
      setMessage({ type: 'success', text: 'Mot de passe mis à jour' });
      success('Mot de passe mis à jour');
      setPwdCurrent(''); setPwdNew(''); setPwdConfirm('');
    } catch (e) {
      const m = e?.response?.data?.message || 'Erreur changement de mot de passe';
      setMessage({ type: 'error', text: m });
      errorToast(m);
    } finally {
      setLoading(false);
    }
  }

  function cancelEdit() {
    setPseudo(me?.username || '');
    setVille(me?.town || '');
    setPromo(me?.promo || '');
    setAvatarPreview(me?.avatar || null);
    setAvatar(null);
    setIsEditing(false);
    setMessage({ type: '', text: '' });
  }

  if (!user) {
    return (
      <Page icon="person" title="Mon Profil">
        <div className="max-w-2xl mx-auto">
          <div className="alert alert-warning shadow-lg">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-2xl">lock</span>
              <div>
                <h3 className="font-bold">Authentification requise</h3>
                <p className="text-sm">Connecte-toi pour accéder à ton profil</p>
              </div>
            </div>
          </div>
        </div>
      </Page>
    );
  }

  const memberSince = me?.created_at ? new Date(me.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' }) : '';

  return (
    <Page icon="person" title="Mon Profil" subtitle="Gère tes informations personnelles et tes préférences" maxW="max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Sidebar - Avatar & Stats */}
        <div className="lg:col-span-1">
          <div className="card bg-gradient-to-br from-base-100 to-base-200 shadow-2xl sticky top-8 border border-base-300">
            <div className="card-body items-center text-center p-6">

              {/* Avatar Section */}
              <div className="relative mb-6">
                <div className="avatar">
                  <div className="w-32 rounded-full ring-4 ring-primary ring-offset-base-100 ring-offset-4 shadow-xl">
                    {avatarPreview ? (
                      <img src={assetUrl(avatarPreview)} alt="Avatar" className="object-cover" />
                    ) : (
                      <div className="bg-primary w-32 h-32 rounded-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-5xl text-primary-content">person</span>
                      </div>
                    )}
                  </div>
                </div>
                {isEditing && (
                  <label className="btn btn-circle btn-primary btn-sm absolute bottom-0 right-0 cursor-pointer shadow-lg hover:shadow-xl transition-all">
                    <span className="material-symbols-outlined">photo_camera</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                  </label>
                )}
              </div>

              {/* User Info */}
              <h2 className="text-2xl font-bold mb-1">{me?.username || ''}</h2>
              <p className="text-sm opacity-70 mb-4">{me?.email || ''}</p>

              {/* Save Avatar Button */}
              {avatar && (
                <button
                  className="btn btn-primary btn-sm gap-2 shadow-md mb-4"
                  onClick={uploadAvatar}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    <span className="material-symbols-outlined">cloud_upload</span>
                  )}
                  Sauvegarder l'avatar
                </button>
              )}

              <div className="divider my-4"></div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-3 w-full mb-4">
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-4 rounded-xl border border-primary/20">
                  <div className="flex flex-col items-center">
                    <span className="material-symbols-outlined text-3xl text-primary mb-2">bolt</span>
                    <div className="text-2xl font-bold text-primary">{stats.points}</div>
                    <div className="text-xs opacity-70">Points</div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-secondary/10 to-secondary/5 p-4 rounded-xl border border-secondary/20">
                  <div className="flex flex-col items-center">
                    <span className="material-symbols-outlined text-3xl text-secondary mb-2">emoji_events</span>
                    <div className="text-2xl font-bold text-secondary">{stats.challenges}</div>
                    <div className="text-xs opacity-70">Challenges</div>
                  </div>
                </div>
              </div>

              {/* Additional Stats */}
              <div className="grid grid-cols-2 gap-2 w-full mb-4">
                <div className="bg-base-200 p-3 rounded-lg">
                  <div className="text-lg font-bold">{stats.participations_approved}</div>
                  <div className="text-xs opacity-70">Participations</div>
                </div>
                <div className="bg-base-200 p-3 rounded-lg">
                  <div className="text-lg font-bold">{stats.comments}</div>
                  <div className="text-xs opacity-70">Commentaires</div>
                </div>
                <div className="bg-base-200 p-3 rounded-lg">
                  <div className="text-lg font-bold">{stats.likes_on_challenges}</div>
                  <div className="text-xs opacity-70">Likes défis</div>
                </div>
                <div className="bg-base-200 p-3 rounded-lg">
                  <div className="text-lg font-bold">{stats.likes_on_comments}</div>
                  <div className="text-xs opacity-70">Likes comm.</div>
                </div>
              </div>

              {/* Member Since */}
              <div className="flex items-center gap-2 text-xs opacity-60 bg-base-200 px-3 py-2 rounded-full">
                <span className="material-symbols-outlined text-sm">calendar_month</span>
                <span>{memberSince ? `Membre depuis ${memberSince}` : 'Nouveau membre'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">

          {/* Informations personnelles */}
          <div className="card bg-base-100 shadow-2xl border border-base-300">
            <div className="card-body p-6">

              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary-content">badge</span>
                  </div>
                  <h2 className="text-2xl font-bold">Informations personnelles</h2>
                </div>
                {!isEditing && (
                  <button
                    className="btn btn-ghost btn-sm gap-2 hover:bg-primary/10"
                    onClick={() => setIsEditing(true)}
                  >
                    <span className="material-symbols-outlined">edit</span>
                    Modifier
                  </button>
                )}
              </div>

              {/* Message Alert */}
              {message.text && (
                <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'} mb-6 shadow-md`}>
                  <span className="material-symbols-outlined">
                    {message.type === 'success' ? 'check_circle' : 'error'}
                  </span>
                  <span>{message.text}</span>
                </div>
              )}

              {/* Form */}
              <div className="space-y-4">

                {/* Email (non modifiable) */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">email</span>
                      Email
                    </span>
                  </label>
                  <div className="input input-bordered flex items-center gap-3 bg-base-200">
                    <input
                      type="email"
                      className="grow bg-transparent"
                      value={me?.email || ''}
                      disabled
                      readOnly
                    />
                    <span className="badge badge-ghost badge-sm">Non modifiable</span>
                  </div>
                </div>

                {/* Pseudo */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">person</span>
                      Pseudo
                    </span>
                  </label>
                  <input
                    type="text"
                    className={`input input-bordered w-full ${!isEditing ? 'bg-base-200' : 'focus:ring-2 focus:ring-primary'}`}
                    placeholder="Ton pseudo"
                    value={pseudo}
                    onChange={e => setPseudo(e.target.value)}
                    disabled={!isEditing}
                  />
                  <label className="label">
                    <span className="label-text-alt opacity-70">Ton nom d'utilisateur visible par tous</span>
                  </label>
                </div>

                {/* Ville */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">location_city</span>
                      Ville
                    </span>
                  </label>
                  <input
                    type="text"
                    className={`input input-bordered w-full ${!isEditing ? 'bg-base-200' : 'focus:ring-2 focus:ring-primary'}`}
                    placeholder="Ex: Paris, Lyon, Marseille..."
                    value={ville}
                    onChange={e => setVille(e.target.value)}
                    disabled={!isEditing}
                  />
                </div>

                {/* Promotion */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">school</span>
                      Promotion
                    </span>
                  </label>
                  <input
                    type="text"
                    className={`input input-bordered w-full ${!isEditing ? 'bg-base-200' : 'focus:ring-2 focus:ring-primary'}`}
                    placeholder="Ex: 2025 ou CDPI"
                    value={promo}
                    onChange={e => setPromo(e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              {/* Actions */}
              {isEditing && (
                <div className="flex justify-end gap-3 mt-8">
                  <button
                    className="btn btn-ghost"
                    onClick={cancelEdit}
                    disabled={loading}
                  >
                    Annuler
                  </button>
                  <button
                    className="btn btn-primary gap-2 shadow-md"
                    onClick={save}
                    disabled={loading || !pseudo.trim()}
                  >
                    {loading ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined">save</span>
                        Sauvegarder
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Paramètres du compte */}
          <div className="card bg-base-100 shadow-2xl border border-base-300">
            <div className="card-body p-6">

              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary-content">settings</span>
                </div>
                <h3 className="text-xl font-bold">Paramètres du compte</h3>
              </div>

              <div className="flex items-center justify-between p-4 mt-4 rounded-xl bg-gradient-to-r from-base-200 to-base-100 border border-base-300 hover:shadow-md transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-base-300 flex items-center justify-center">
                    <span className="material-symbols-outlined">notifications</span>
                  </div>
                  <div>
                    <div className="font-semibold">Notifications du chat public</div>
                    <div className="text-sm opacity-70">Afficher un message lors des nouveaux posts</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  className="toggle toggle-primary toggle-lg"
                  checked={prefChatNotify}
                  onChange={(e) => setPrefChatNotify(e.target.checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 mt-4 rounded-xl bg-gradient-to-r from-base-200 to-base-100 border border-base-300 hover:shadow-md transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-base-300 flex items-center justify-center">
                    <span className="material-symbols-outlined">volume_up</span>
                  </div>
                  <div>
                    <div className="font-semibold">Son des notifications</div>
                    <div className="text-sm opacity-70">Jouer un son lors des toasts</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  className="toggle toggle-primary toggle-lg"
                  checked={prefNotifySound}
                  onChange={(e) => setPrefNotifySound(e.target.checked)}
                />
              </div>
              <div className="flex items-center justify-between p-3 mt-2 rounded-xl bg-base-200 border border-base-300">
                <div className="text-sm font-medium">Volume des notifications</div>
                <div className="flex items-center gap-3">
                  <input type="range" min="0" max="100" step="1" className="range range-primary range-lg w-48" value={prefNotifySoundVol} onChange={(e) => setPrefNotifySoundVol(Number(e.target.value))} />
                  <span className="badge badge-outline">{prefNotifySoundVol}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 mt-4 rounded-xl bg-gradient-to-r from-base-200 to-base-100 border border-base-300 hover:shadow-md transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-base-300 flex items-center justify-center">
                    <span className="material-symbols-outlined">chat</span>
                  </div>
                  <div>
                    <div className="font-semibold">Son des messages du chat</div>
                    <div className="text-sm opacity-70">Jouer un son à la réception</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  className="toggle toggle-primary toggle-lg"
                  checked={prefChatSound}
                  onChange={(e) => setPrefChatSound(e.target.checked)}
                />
              </div>
              <div className="flex items-center justify-between p-3 mt-2 rounded-xl bg-base-200 border border-base-300">
                <div className="text-sm font-medium">Volume des messages du chat</div>
                <div className="flex items-center gap-3">
                  <input type="range" min="0" max="100" step="1" className="range range-primary range-lg w-48" value={prefChatSoundVol} onChange={(e) => setPrefChatSoundVol(Number(e.target.value))} />
                  <span className="badge badge-outline">{prefChatSoundVol}%</span>
                </div>
              </div>

              <div className="mt-2">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined">shield_lock</span>
                  Sécurité
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm mb-2">
                    <span className="badge badge-outline">Rôle: {me?.role || 'user'}</span>
                    <span className={`badge ${me?.is_verified ? 'badge-success' : 'badge-warning'}`}>{me?.is_verified ? 'Compte validé' : 'En attente validation'}</span>
                    <span className={`badge ${me?.is_email_verified ? 'badge-success' : 'badge-warning'}`}>{me?.is_email_verified ? 'Email vérifié' : 'Email non vérifié'}</span>
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold flex items-center gap-2">
                        <span className="material-symbols-outlined text-base">lock</span>
                        Mot de passe actuel
                      </span>
                    </label>
                    <input type="password" className="input input-bordered w-full" value={pwdCurrent} onChange={e => setPwdCurrent(e.target.value)} placeholder="Mot de passe actuel" />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold flex items-center gap-2">
                        <span className="material-symbols-outlined text-base">vpn_key</span>
                        Nouveau mot de passe
                      </span>
                    </label>
                    <input type="password" className="input input-bordered w-full" value={pwdNew} onChange={e => setPwdNew(e.target.value)} placeholder="Nouveau mot de passe" />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold flex items-center gap-2">
                        <span className="material-symbols-outlined text-base">check_circle</span>
                        Confirmer le nouveau mot de passe
                      </span>
                    </label>
                    <input type="password" className="input input-bordered w-full" value={pwdConfirm} onChange={e => setPwdConfirm(e.target.value)} placeholder="Confirmer le nouveau mot de passe" />
                  </div>
                  <div className="flex justify-end mt-4">
                    <button className="btn btn-neutral gap-2" onClick={changePassword} disabled={loading}>
                      <span className="material-symbols-outlined">key</span>
                      Changer le mot de passe
                    </button>
                  </div>
                </div>
              </div>

              <div className="divider my-6"></div>

              {/* Danger Zone */}
              <div className="bg-error/10 border border-error/20 rounded-xl p-4">
                <h4 className="font-semibold text-error mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined">warning</span>
                  Zone dangereuse
                </h4>
                <p className="text-sm opacity-70 mb-4">
                  La suppression de ton compte est définitive et irréversible.
                </p>
                <button className="btn btn-error btn-outline btn-sm gap-2">
                  <span className="material-symbols-outlined">delete_forever</span>
                  Supprimer mon compte
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Page>
  );
}
