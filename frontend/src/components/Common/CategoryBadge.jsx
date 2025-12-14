// Badge de catégorie
// Affiche une étiquette avec une couleur et une icône selon la catégorie
const MAP = {
  'Code': { color: 'badge-info', icon: 'code' },
  'Gaming': { color: 'badge-error', icon: 'sports_esports' },
  'DIY': { color: 'badge-warning', icon: 'handyman' },
  'Sport': { color: 'badge-success', icon: 'sports_soccer' },
  'Photo': { color: 'badge-secondary', icon: 'photo_camera' },
  'Musique': { color: 'badge-accent', icon: 'music_note' },
  'Cuisine': { color: 'badge-primary', icon: 'restaurant' },
  'Art': { color: 'badge-ghost', icon: 'palette' },
  'Vidéo': { color: 'badge-info', icon: 'movie' },
  'Culture': { color: 'badge-secondary', icon: 'museum' }
};

// Composant Badge de catégorie
export default function CategoryBadge({ name, className = '' }) {
  const meta = MAP[name] || { color: 'badge-outline', icon: 'category' };
  return (
    <div className={`badge ${meta.color} gap-1 transition-transform hover:scale-105 ${className}`}>
      <span className="material-symbols-outlined">{meta.icon}</span>
      <span>{name}</span>
    </div>
  );
}
