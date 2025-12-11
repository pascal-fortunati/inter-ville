import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = () => {
    const { isAuthenticated, logout } = useAuth();
    return (
        <header className="drawer drawer-end main-font-r sticky top-0 z-50 bg-white">
            <input id="my-drawer-3" type="checkbox" className="drawer-toggle" />
            <div className="drawer-content flex flex-col">
                {/* Navbar */}
                <div className="navbar w-full">
                    <Link className="mx-2 flex-1 px-2 text-3xl font-bold whitespace-nowrap" to="/">Inter-Ville</Link>
                    <div className="flex-none lg:hidden">
                        <label htmlFor="my-drawer-3" aria-label="open sidebar" className="btn btn-square btn-ghost">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                className="inline-block h-6 w-6 stroke-current"
                            >
                                <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M4 6h16M4 12h16M4 18h16"
                                ></path>
                            </svg>
                        </label>
                    </div>
                    <div className="hidden flex-none lg:block">
                    <ul className="menu menu-horizontal font-semibold">
                        {/* Navbar menu content here */}
                            <li><Link className='text-xl' to='/'>Accueil</Link></li>
                            <li><Link className='text-xl' to='/challenges'>Challenges</Link></li>
                            {!isAuthenticated && (
                                <>
                                  <li><Link className='text-xl' to='/login'>Connexion</Link></li>
                                  <li><Link className='text-xl' to='/register'>Inscription</Link></li>
                                </>
                            )}
                            {isAuthenticated && (
                                <>
                                  <li><Link className='text-xl' to='/chat'>Chat</Link></li>
                                  <li><Link className='text-xl' to='/profile'>Profil</Link></li>
                                  <li><button className='text-xl' onClick={logout}>Déconnexion</button></li>
                                </>
                            )}
                        </ul>
                    </div>
                </div>
            </div>
            <div className="drawer-side">
                <label htmlFor="my-drawer-3" aria-label="close sidebar" className="drawer-overlay"></label>
                <ul className="menu bg-white min-h-full font-semibold w-80 p-4 pt-[64px]">
                {/* Sidebar content here */}
                    <li><Link className='text-xl py-6' to='/'>Accueil</Link></li>
                    <li><Link className='text-xl py-6' to='/challenges'>Challenges</Link></li>
                    {!isAuthenticated && (
                        <>
                          <li><Link className='text-xl py-6' to='/login'>Connexion</Link></li>
                          <li><Link className='text-xl py-6' to='/register'>Inscription</Link></li>
                        </>
                    )}
                    {isAuthenticated && (
                        <>
                          <li><Link className='text-xl py-6' to='/chat'>Chat</Link></li>
                          <li><Link className='text-xl py-6' to='/profile'>Profil</Link></li>
                          <li><button className='text-xl py-6' onClick={logout}>Déconnexion</button></li>
                        </>
                    )}
                </ul>
            </div>
        </header>
    );
};

export default Header;