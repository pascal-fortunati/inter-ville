import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function NavBar() {
  const { isAuthenticated, user, logout } = useAuth();
  return (
    <div className="navbar bg-base-100 shadow">
      <div className="flex-1">
        <Link to="/" className="btn btn-ghost text-xl">Inter-Ville</Link>
      </div>
      <div className="flex-none gap-2">
        <ul className="menu menu-horizontal px-1">
          <li><NavLink to="/" className={({ isActive }) => isActive ? 'font-semibold' : ''}>Challenges</NavLink></li>
          <li><NavLink to="/chat" className={({ isActive }) => isActive ? 'font-semibold' : ''}>Chat</NavLink></li>
          {isAuthenticated ? (
            <li>
              <details>
                <summary>{user?.pseudo || 'Profil'}</summary>
                <ul className="p-2 bg-base-100">
                  <li><NavLink to="/profile">Mon profil</NavLink></li>
                  <li><button className="btn btn-ghost" onClick={logout}>Se déconnecter</button></li>
                </ul>
              </details>
            </li>
          ) : (
            <>
              <li><NavLink to="/login">Connexion</NavLink></li>
              <li><NavLink to="/register">Inscription</NavLink></li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
}
