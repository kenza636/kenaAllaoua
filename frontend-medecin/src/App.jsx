import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import PatientsRecents from "./components/PatientsRecents";
import QuickActions from "./components/QuickActions";
import Appointments from "./components/Appointments";
import Profile from "./components/Profile";
import VideoCall from "./components/VideoCall";
import Toast from "./components/Toast";
import { UserProvider } from "./contexts/UserContext";
import { SocketProvider } from "./contexts/SocketContext";
import { NotificationsProvider } from "./contexts/NotificationsContext";
import "./App.css";
import Disponibilites from "./components/Disponibilites";

function AppLayout() {
  return (
    <Routes>
      <Route path="/teleconsultation/:roomId" element={<VideoCall />} />

      <Route path="/*" element={
        <div className="app">
          <Sidebar />
          <div className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/patients" element={<PatientsRecents />} />
              <Route path="/appointments" element={<Appointments />} />
              <Route path="/actions" element={<QuickActions />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/disponibilites" element={<Disponibilites />} />
            </Routes>
          </div>
        </div>
      } />
    </Routes>
  );
}

function App() {
  // Importer les identifiants depuis l'URL si on arrive après une redirection depuis le site principal
  const params = new URLSearchParams(window.location.search);
  const tokenUrl = params.get("token");
  const userUrl = params.get("user");

  if (tokenUrl && userUrl) {
    try {
      localStorage.setItem("medecin_token", decodeURIComponent(tokenUrl));
      localStorage.setItem("medecin_user", decodeURIComponent(userUrl));
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (err) {
      console.error("Impossible de sauvegarder l'utilisateur médecin depuis l'URL", err);
    }
  }

  // Redirect to login if no stored user (handles post-logout state)
  const stored = localStorage.getItem("medecin_user");
  if (!stored) {
    window.location.href = "http://localhost:5173";
    return null;
  }

  return (
    <UserProvider>
      <NotificationsProvider>
        <SocketProvider>
          <Router>
            <Toast />
            <AppLayout />
          </Router>
        </SocketProvider>
      </NotificationsProvider>
    </UserProvider>
  );
}

export default App;
