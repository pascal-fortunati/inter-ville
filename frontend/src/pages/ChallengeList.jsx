import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

const CATEGORIES = ['Tous', 'Code', 'Gaming', 'DIY'];

export default function ChallengeList() {
  const [category, setCategory] = useState('Tous');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function fetchChallenges(cat) {
    setLoading(true);
    setError('');
    try {
      const params = cat && cat !== 'Tous' ? { params: { category: cat } } : undefined;
      const res = await api.get('/challenges', params);
      setItems(res.data || []);
    } catch (e) {
      setError('Impossible de charger les challenges');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchChallenges(category); }, [category]);

  return (
    <div>
      <div className="tabs tabs-boxed w-fit mb-4">
        {CATEGORIES.map(cat => (
          <button key={cat} className={`tab ${category === cat ? 'tab-active' : ''}`} onClick={() => setCategory(cat)}>{cat}</button>
        ))}
      </div>
      {loading && <div className="loading loading-dots loading-lg" />}
      {error && <div className="alert alert-error mb-4">{error}</div>}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map(ch => (
          <div key={ch.id} className="card bg-base-100 shadow">
            <div className="card-body">
              <h2 className="card-title">{ch.title}</h2>
              <p className="text-sm opacity-70">{ch.category}</p>
              <p>{ch.description}</p>
              <div className="card-actions justify-end">
                <Link className="btn btn-primary" to={`/challenges/${ch.id}`}>Voir</Link>
              </div>
            </div>
          </div>
        ))}
        {!loading && items.length === 0 && (
          <div className="alert">Aucun challenge</div>
        )}
      </div>
    </div>
  );
}
