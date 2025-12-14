// Page Création de challenge
// - Formulaire avec upload image/vidéo
// - Publie et redirige vers le challenge créé
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { assetUrl } from '../api/client';
import { useToast } from '../components/Common/Toast.jsx';
import { useAuth } from '../context/AuthContext';
import Page from '../components/Layout/Page.jsx';
import { Editor } from '@tinymce/tinymce-react';
import DOMPurify from 'dompurify';
import 'tinymce/tinymce';
import 'tinymce/models/dom/model';
import 'tinymce/themes/silver';
import 'tinymce/icons/default';
import 'tinymce/skins/ui/oxide/skin';
import 'tinymce/skins/ui/oxide-dark/skin';
import 'tinymce/plugins/link';
import 'tinymce/plugins/lists';
import 'tinymce/plugins/image';
import 'tinymce/plugins/media';
import 'tinymce/plugins/code';
import 'tinymce/plugins/table';
import 'tinymce/plugins/quickbars';

const CATEGORIES = [
  { value: 'Code', icon: 'code', color: 'badge-info' },
  { value: 'Gaming', icon: 'sports_esports', color: 'badge-error' },
  { value: 'DIY', icon: 'handyman', color: 'badge-warning' },
  { value: 'Sport', icon: 'sports_soccer', color: 'badge-success' },
  { value: 'Photo', icon: 'photo_camera', color: 'badge-secondary' },
  { value: 'Musique', icon: 'music_note', color: 'badge-accent' },
  { value: 'Cuisine', icon: 'restaurant', color: 'badge-primary' },
  { value: 'Art', icon: 'palette', color: 'badge-ghost' },
  { value: 'Vidéo', icon: 'movie', color: 'badge-info' },
  { value: 'Culture', icon: 'museum', color: 'badge-secondary' },
];

const BTN_COLORS = {
  'Code': 'btn-info',
  'Cuisine': 'btn-primary',
  'Gaming': 'btn-error',
  'Sport': 'btn-success',
  'Vidéo': 'btn-info',
  'Musique': 'btn-accent',
  'Photo': 'btn-secondary',
  'Art': 'btn-neutral',
  'Culture': 'btn-secondary',
  'DIY': 'btn-warning',
};

export default function ChallengeCreate() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { success, error: errorToast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Code');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const plainDesc = useMemo(() => String(description || '').replace(/<[^>]*>/g, '').trim(), [description]);
  const safePreview = useMemo(() => DOMPurify.sanitize(String(description || 'La description de ton défi apparaîtra ici...'), { ADD_TAGS: ['video', 'source'], ADD_ATTR: ['controls', 'src', 'type'] }), [description]);
  const licenseKey = import.meta.env.VITE_TINYMCE_LICENSE_KEY || 'gpl';
  const tinymceInit = useMemo(() => ({
    height: 300,
    menubar: false,
    plugins: 'link lists image media code table quickbars',
    toolbar: 'undo redo | blocks | bold italic underline | alignleft aligncenter alignright | bullist numlist | link image media | removeformat',
    image_caption: true,
    image_advtab: true,
    quickbars_selection_toolbar: 'bold italic | quicklink h2 h3 blockquote',
    quickbars_insert_toolbar: 'image table',
    language: 'fr_FR',
    language_url: 'https://cdn.jsdelivr.net/npm/tinymce-i18n@latest/langs/fr_FR.js',
    promotion: false,
    onboarding: false,
    license_key: licenseKey,
    file_picker_types: 'image media',
    file_picker_callback: async (callback, value, meta) => {
      try {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = meta.filetype === 'image' ? 'image/*' : 'video/*';
        input.onchange = async () => {
          const file = input.files?.[0];
          if (!file) return;
          const form = new FormData();
          form.append('file', file, file.name);
          const endpoint = meta.filetype === 'image' ? '/uploads/image' : '/uploads/video';
          const res = await api.post(endpoint, form, { headers: { 'Content-Type': 'multipart/form-data' } });
          const url = assetUrl(res.data?.location);
          callback(url);
        };
        input.click();
      } catch { void 0; }
    },
    images_upload_handler: async (blobInfo, progress) => {
      const form = new FormData();
      form.append('file', blobInfo.blob(), blobInfo.filename());
      const res = await api.post('/uploads/image', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => { if (e.total) progress(Math.round(100 * e.loaded / e.total)); }
      });
      return assetUrl(res.data?.location);
    },
  }), [licenseKey]);

  async function submit() {
    setError('');

    if (!title.trim()) {
      setError('Le titre est requis');
      errorToast('Le titre est requis');
      return;
    }
    if (plainDesc.length < 20) {
      setError('La description doit contenir au moins 20 caractères');
      errorToast('Description trop courte');
      return;
    }

    setLoading(true);
    try {
      const sanitized = DOMPurify.sanitize(String(description || ''), { ADD_TAGS: ['video', 'source'], ADD_ATTR: ['controls', 'src', 'type'] });
      const form = new FormData();
      form.append('title', title);
      form.append('description', sanitized);
      form.append('category', category);
      const res = await api.post('/challenges', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      const id = res.data?.id;
      if (id) navigate(`/defis/${id}`);
      success('Défi créé avec succès');
    } catch {
      setError('Erreur lors de la création du défi');
      errorToast('Erreur lors de la création du défi');
    } finally {
      setLoading(false);
    }
  }

  if (!isAuthenticated) {
    return null;
  }

  const selectedCategory = CATEGORIES.find(c => c.value === category);

  return (
    <Page icon="emoji_events" title="Créer un défi" subtitle="Partage un défi avec les étudiants de la plateforme et lance la compétition !" maxW="max-w-3xl">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">

          {/* Error Alert */}
          {error && (
            <div className="alert alert-error mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div className="form-control mb-6">
            <label className="label">
              <span className="label-text font-semibold text-base">Titre du défi</span>
            </label>
            <input
              type="text"
              className="input input-bordered input-lg w-full"
              placeholder="Ex: Défi de code 48h"
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={100}
            />
            <label className="label">
              <span className="label-text-alt text-base-content/70">
                Un titre accrocheur pour ton défi
              </span>
              <span className="label-text-alt text-base-content/50">
                {title.length}/100
              </span>
            </label>
          </div>

          {/* Description */}
          <div className="form-control mb-6">
            <label className="label">
              <span className="label-text font-semibold text-base">Description</span>
            </label>
            <Editor
              key="tinymce"
              init={tinymceInit}
              value={description}
              onEditorChange={(v) => setDescription(v)}
            />
            <label className="label">
              <span className="label-text-alt text-base-content/70">
                Sois précis pour que tout le monde comprenne
              </span>
              <span className="label-text-alt text-base-content/50">
                {plainDesc.length}/1000
              </span>
            </label>
          </div>

          {/* Category Selection */}
          <div className="form-control mb-6">
            <label className="label">
              <span className="label-text font-semibold text-base">Catégorie</span>
            </label>
            <div className="grid grid-cols-5 gap-3">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  className={`btn ${category === cat.value ? BTN_COLORS[cat.value] : `btn-outline ${BTN_COLORS[cat.value]}`} justify-start gap-2`}
                  onClick={() => setCategory(cat.value)}
                >
                  <span className="material-symbols-outlined text-xl">{cat.icon}</span>
                  <span>{cat.value}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Preview Card */}
          <div className="divider my-8">Aperçu</div>

          <div className="card bg-base-200 shadow">
            <div className="card-body">
              <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="text-lg font-bold flex-1">
                  {title || 'Titre de ton défi'}
                </h3>
                <span className={`badge ${selectedCategory?.color} badge-lg gap-2 flex-shrink-0`}>
                  <span className="material-symbols-outlined text-base">{selectedCategory?.icon}</span>
                  <span>{category}</span>
                </span>
              </div>
              <div className="text-sm opacity-70 mb-4" dangerouslySetInnerHTML={{ __html: safePreview }} />
              <div className="flex items-center gap-3 text-sm opacity-60">
                <span className="material-symbols-outlined">person</span>
                <span>Toi</span>
                <span>•</span>
                <span>À l'instant</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="card-actions justify-end mt-8 gap-2">
            <button className="btn btn-ghost" onClick={() => navigate('/defis')}>
              Annuler
            </button>
            <button
              className="btn btn-primary btn-lg gap-2"
              onClick={submit}
              disabled={loading || !title.trim() || plainDesc.length < 20}
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Création en cours...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">rocket_launch</span>
                  Publier le défi
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </Page>
  );
}
