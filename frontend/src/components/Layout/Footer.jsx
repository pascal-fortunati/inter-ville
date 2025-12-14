// Pied de page
export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-base-200 via-base-100 to-base-300 text-base-content border-t border-base-300 shadow-inner">
      <div className="h-1 w-full bg-gradient-to-r from-primary via-secondary to-accent animate-gradient-x" />
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Logo & Slogan */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div
              className="h-8 w-[180px] bg-primary"
              role="img"
              aria-label="Logo"
              style={{
                WebkitMaskImage: 'url(/logo.lp.png)',
                maskImage: 'url(/logo.lp.png)',
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center',
                maskPosition: 'center',
                WebkitMaskSize: 'contain',
                maskSize: 'contain',
              }}
              />
            </div>
            <p className="opacity-80 text-sm font-medium">Challenges des étudiants de La Plateforme.</p>
            <div className="flex gap-2 flex-wrap">
              <span className="badge badge-primary gap-1 px-3 py-2 text-base"><span className="material-symbols-outlined">bolt</span>Défis</span>
              <span className="badge badge-secondary gap-1 px-3 py-2 text-base"><span className="material-symbols-outlined">forum</span>Chat</span>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-semibold mb-4 text-lg tracking-wide uppercase text-primary">Navigation</h3>
            <ul className="space-y-3">
              <li><a className="link link-hover flex items-center gap-2 text-base hover:text-primary transition-colors" href="/defis"><span className="material-symbols-outlined">emoji_events</span>Défis</a></li>
              <li><a className="link link-hover flex items-center gap-2 text-base hover:text-primary transition-colors" href="/classements"><span className="material-symbols-outlined">leaderboard</span>Classement</a></li>
              <li><a className="link link-hover flex items-center gap-2 text-base hover:text-primary transition-colors" href="/chat"><span className="material-symbols-outlined">forum</span>Chat</a></li>
              <li><a className="link link-hover flex items-center gap-2 text-base hover:text-primary transition-colors" href="/etudiants"><span className="material-symbols-outlined">group</span>Étudiants</a></li>
              <li><a className="link link-hover flex items-center gap-2 text-base hover:text-primary transition-colors" href="/profil"><span className="material-symbols-outlined">person</span>Profil</a></li>
            </ul>
          </div>

          {/* Catégories */}
          <div>
            <h3 className="font-semibold mb-4 text-lg tracking-wide uppercase text-primary">Catégories</h3>
            <div className="flex flex-wrap gap-2">
              {['Code', 'Cuisine', 'Gaming', 'Sport', 'Vidéo', 'Musique', 'Photo'].map((cat) => (
                <span key={cat} className="badge badge-outline border-primary text-primary px-3 py-2 text-base font-semibold bg-base-100/60 hover:bg-primary hover:text-white transition-colors cursor-pointer">{cat}</span>
              ))}
            </div>
          </div>

          {/* Contact & Réseaux */}
          <div>
            <h3 className="font-semibold mb-4 text-lg tracking-wide uppercase text-primary">Contact</h3>
            <ul className="space-y-2 text-base">
              <li className="flex items-center gap-2 opacity-90"><span className="material-symbols-outlined">mail</span><span>contact@inter‑ville.local</span></li>
              <li className="flex items-center gap-2 opacity-90"><span className="material-symbols-outlined">location_on</span><span>La Plateforme_, Marseille</span></li>
            </ul>
            <div className="mt-5 flex gap-4">
              <a className="btn btn-circle btn-outline border-primary hover:bg-primary hover:text-white transition-colors" href="#" title="Instagram"><span className="material-symbols-outlined text-2xl">photo_camera</span></a>
              <a className="btn btn-circle btn-outline border-primary hover:bg-primary hover:text-white transition-colors" href="#" title="YouTube"><span className="material-symbols-outlined text-2xl">play_circle</span></a>
              <a className="btn btn-circle btn-outline border-primary hover:bg-primary hover:text-white transition-colors" href="#" title="X/Twitter"><span className="material-symbols-outlined text-2xl">share</span></a>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-base-300 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="opacity-70 text-sm">© {new Date().getFullYear()} Inter‑Ville. Tous droits réservés.</p>
          <div className="flex gap-3 text-xs opacity-60">
            <a href="#" className="hover:underline">Mentions légales</a>
            <span>•</span>
            <a href="#" className="hover:underline">Politique de confidentialité</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
