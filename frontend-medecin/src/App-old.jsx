import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { UserProvider } from "./contexts/UserContext";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import PatientsRecents from "./components/PatientsRecents";
import QuickActions from "./components/QuickActions";
import Appointments from "./components/Appointments";
import Profile from "./components/Profile";
import "./App.css";

function App() {
  return (
    <UserProvider>
      <Router>
        <div className="app">
          <Sidebar />
          <div className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/patients" element={<PatientsRecents />} />
              <Route path="/appointments" element={<Appointments />} />
              <Route path="/actions" element={<QuickActions />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </div>
        </div>
      </Router>
    </UserProvider>
  );
}

export default App;
