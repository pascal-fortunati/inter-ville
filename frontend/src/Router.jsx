import { BrowserRouter, Route, Routes } from 'react-router-dom';
import NavBar from './components/Header.jsx';
import RequireAuth from './components/RequireAuth.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import Home from './Home.jsx';
import ChallengeDetail from './pages/ChallengeDetail.jsx';
import Chat from './pages/Chat.jsx';
import Login from './pages/Login.jsx';
import Profile from './pages/Profile.jsx';
import Register from './pages/Register.jsx';
import "./tailwind.css";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
          <NavBar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/challenges/:id" element={<ChallengeDetail />} />
              <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
              <Route path="/chat" element={<Chat />} />
            </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
export default App;