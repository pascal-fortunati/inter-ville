// Routeur principal de l'application
// - Définit la navigation, le layout commun et protège certaines pages
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import NavBar from './components/Layout/Header.jsx';
import Footer from './components/Layout/Footer.jsx';
import RequireAuth from './components/RequireAuth.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ToastProvider } from './components/Common/Toast.jsx';
import Home from './Home.jsx';
import ChallengeDetail from './pages/ChallengeDetail.jsx';
import ChallengeList from './pages/ChallengeList.jsx';
import ChallengeCreate from './pages/ChallengeCreate.jsx';
import Chat from './pages/Chat.jsx';
import Login from './pages/Login.jsx';
import Profile from './pages/Profile.jsx';
import Register from './pages/Register.jsx';
import "./tailwind.css";
import Admin from './pages/Admin.jsx';
import Users from './pages/Users.jsx';
import Leaderboard from './pages/Leaderboard.jsx';
import DMTray from './components/Chat/DMTray.jsx';
import ThemeSidebar from './components/Common/ThemeSidebar.jsx';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <div className="min-h-screen flex flex-col">
            <NavBar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                {/* Nouvelles routes FR */}
                <Route path="/connexion" element={<Login />} />
                <Route path="/inscription" element={<Register />} />
                <Route path="/defis" element={<ChallengeList />} />
                <Route path="/defis/nouveau" element={<RequireAuth><ChallengeCreate /></RequireAuth>} />
                <Route path="/defis/:id" element={<ChallengeDetail />} />
                <Route path="/profil" element={<RequireAuth><Profile /></RequireAuth>} />
                <Route path="/admin" element={<RequireAuth><Admin /></RequireAuth>} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/chat/direct/:userId" element={<RequireAuth><Chat /></RequireAuth>} />
                <Route path="/chat/direct" element={<Navigate to="/chat" replace />} />
                <Route path="/etudiants" element={<RequireAuth><Users /></RequireAuth>} />
                <Route path="/classements" element={<Leaderboard />} />

                {/* Compatibilité: redirections des anciens slugs vers les nouveaux */}
                <Route path="/login" element={<Navigate to="/connexion" replace />} />
                <Route path="/register" element={<Navigate to="/inscription" replace />} />
                <Route path="/challenges" element={<Navigate to="/defis" replace />} />
                <Route path="/challenges/new" element={<Navigate to="/defis/nouveau" replace />} />
                {/* Conserver l’accès direct pour les détails des challenges */}
                <Route path="/challenges/:id" element={<ChallengeDetail />} />
                <Route path="/profile" element={<Navigate to="/profil" replace />} />
                <Route path="/users" element={<Navigate to="/etudiants" replace />} />
                <Route path="/leaderboard" element={<Navigate to="/classements" replace />} />
              </Routes>
            </main>
            <DMTray />
            <ThemeSidebar />
            <Footer />
          </div>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
export default App;
