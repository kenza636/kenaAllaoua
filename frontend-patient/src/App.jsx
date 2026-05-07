import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import DoctorSearch from "./DoctorSearch";
import DoctorAvailability from "./DoctorAvailability";
import Appointments from "./Appointments";
import Profile from "./Profile";
import Payments from "./Payments";
import Notifications from "./Notifications";
import VideoCall from "./VideoCall";
import IncomingCallModal from "./components/IncomingCallModal";

import { BookingsProvider } from "./contexts/BookingsContext";
import { UserProvider } from "./contexts/UserContext";
import { NotificationsProvider } from "./contexts/NotificationsContext";
import { SocketProvider } from "./contexts/SocketContext";

function App() {
  const [pret, setPret] = useState(false);
  const [connecte, setConnecte] = useState(false);

  useEffect(() => {
    // 1. Lire le token et les données utilisateur depuis l'URL en PREMIER
    const params = new URLSearchParams(window.location.search);
    const tokenUrl = params.get("token");
    const userUrl = params.get("user");

    if (tokenUrl) {
      localStorage.setItem("token", decodeURIComponent(tokenUrl));
    }
    if (userUrl) {
      try {
        const userData = JSON.parse(decodeURIComponent(userUrl));
        localStorage.setItem("user", JSON.stringify(userData));
      } catch (e) {
        console.error("Erreur parsing user data:", e);
      }
    }

    if (tokenUrl || userUrl) {
      window.history.replaceState({}, "", "/");
    }

    // 2. Vérifier si connecté
    const token = localStorage.getItem("token");
    setConnecte(!!token);
    setPret(true);
  }, []); // ✅ [] = seulement au premier chargement, pas à chaque navigation

  if (!pret) return null;

  if (!connecte) {
    window.location.href = "http://localhost:5174";
    return null;
  }

  // ✅ Une fois connecté, React Router gère toute la navigation interne
  return (
    <BookingsProvider>
      <UserProvider>
        <NotificationsProvider>
          <SocketProvider>
            <Router>
              <IncomingCallModal />
              <Routes>
                <Route path="/" element={<DoctorSearch />} />
                <Route path="/doctor/:id" element={<DoctorAvailability />} />
                <Route path="/appointments" element={<Appointments />} />
                <Route path="/payments" element={<Payments />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/profile" element={<Profile />} />
                <Route
                  path="/teleconsultation/:roomId"
                  element={<VideoCall />}
                />
              </Routes>
            </Router>
          </SocketProvider>
        </NotificationsProvider>
      </UserProvider>
    </BookingsProvider>
  );
}

export default App;
