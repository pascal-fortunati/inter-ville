import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const ChallengeCard = ({ challenge }) => {
  const { title, theme, participationCount, summary, id } = challenge;
  const { isAuthenticated } = useAuth();

  return (
    <div className="card min-w-64 min-h-64 bg-base-100 shadow-xl">
      <div className="card-body">
        <div className="flex justify-between items-start">
          <h2 className="card-title">{title}</h2>
          <div className="badge badge-accent">{theme}</div>
        </div>
        
        <p className="text-sm text-gray-500 mb-2">
          {participationCount} participation(s) en cours
        </p>
        
        <p>{summary}</p>
        
        <div className="card-actions justify-end mt-4">
          <Link to={`/challenge/${id}`} className="btn btn-ghost lg:btn-sm">Voir détail</Link>
          <button 
            className={`btn btn-primary lg:btn-sm ${!isAuthenticated ? 'btn-disabled' : ''}`}
            disabled={!isAuthenticated}
          >
            S'inscrire
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChallengeCard;