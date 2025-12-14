// Page d'accueil
// - Affiche un hero, des stats rapides
// - Liste les 5 derniers challenges et les 5 meilleurs
import { Link } from "react-router-dom";
import ChallengeCard from "./components/ChallengeCard";
import React, { useEffect, useState } from 'react';
import api from './api/client';

const EMPTY = [];

export default function Home() {
  const [latest, setLatest] = useState(EMPTY);
  const [top, setTop] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [_stats, setStats] = useState({ challenges: 0, comments: 0, likes: 0 });
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [rRecent, rTop] = await Promise.all([
          api.get('/challenges', { params: { sort: 'recent', page: 1, pageSize: 3 } }),
          api.get('/challenges', { params: { sort: 'likes', page: 1, pageSize: 3 } }),
        ]);
        const recentItems = rRecent.data?.items ? rRecent.data.items : (Array.isArray(rRecent.data) ? rRecent.data : []);
        const topItems = rTop.data?.items ? rTop.data.items : (Array.isArray(rTop.data) ? rTop.data : []);
        setLatest(recentItems.slice(0, 3));
        setTop(topItems.slice(0, 3));
        const map = new Map();
        [...recentItems, ...topItems].forEach(ch => { if (ch && ch.id != null) map.set(ch.id, ch); });
        const all = Array.from(map.values());
        const challenges = all.length;
        const comments = all.reduce((a, b) => a + (b.comments_count || 0), 0);
        const likes = all.reduce((a, b) => a + (b.likes_count || 0), 0);
        setStats({ challenges, comments, likes });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);
  return (
    <div className="min-h-screen bg-base-200">
      <div className="container mx-auto px-4 py-8">
        <section className="hero min-h-[40vh] bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl">
          <div className="hero-content text-center">
            <div className="max-w-xl">
               <div className="flex flex-col items-center justify-center gap-3">
                <div
                  className="h-12 w-[220px]"
                  role="img"
                  aria-label="La Plateforme"
                  style={{
                    WebkitMaskImage: 'url(/logo.lp.png)',
                    maskImage: 'url(/logo.lp.png)',
                    WebkitMaskRepeat: 'no-repeat',
                    maskRepeat: 'no-repeat',
                    WebkitMaskPosition: 'center',
                    maskPosition: 'center',
                    WebkitMaskSize: 'contain',
                    maskSize: 'contain',
                    backgroundColor: 'hsl(var(--p))',
                  }}
                />
                <h1 className="text-5xl font-semibold">Challenges</h1>
              </div>
              <p className="py-6">Challenges des étudiants. Crée, participe, recommence.</p>
              <div className="join">
                <Link to="/defis" className="btn btn-primary join-item">Voir les défis</Link>
                <Link to="/defis/nouveau" className="btn btn-ghost join-item">Créer un défis</Link>
              </div>
            </div>
          </div>
        </section>
        <section className="mt-8">
          <h2 className="text-2xl font-bold my-6">Derniers défis</h2>
          {loading && <div className="loading loading-dots loading-lg" />}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
            {latest.map(ch => (
              <ChallengeCard key={ch.id} challenge={ch} />
            ))}
          </div>
          {!loading && latest.length === 0 && <div className="alert mt-4">Aucun défis récent</div>}

          <h2 className="text-2xl font-bold my-6">Meilleurs défis</h2>
          {loading && <div className="loading loading-dots loading-lg" />}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
            {top.map(ch => (
              <ChallengeCard key={ch.id} challenge={ch} />
            ))}
          </div>
          {!loading && top.length === 0 && <div className="alert mt-4">Aucun défis populaire</div>}
        </section>
      </div>
    </div>
  );
}
