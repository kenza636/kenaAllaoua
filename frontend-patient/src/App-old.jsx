import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DoctorSearch from "./DoctorSearch";
import DoctorAvailability from "./DoctorAvailability";
import Appointments from "./Appointments";
import Profile from "./Profile";
import Payments from "./Payments";
import Notifications from "./Notifications";

import { BookingsProvider } from "./contexts/BookingsContext";
import { UserProvider } from "./contexts/UserContext";
import { NotificationsProvider } from "./contexts/NotificationsContext";

function App() {
  return (
    <BookingsProvider>
      <UserProvider>
        <NotificationsProvider>
          <Router>
            <Routes>
              <Route path="/" element={<DoctorSearch />} />
              <Route path="/doctor/:id" element={<DoctorAvailability />} />
              <Route path="/appointments" element={<Appointments />} />
              <Route path="/payments" element={<Payments />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </Router>
        </NotificationsProvider>
      </UserProvider>
    </BookingsProvider>
  );
}

export default App;
