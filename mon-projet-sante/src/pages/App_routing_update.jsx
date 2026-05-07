// Ajout dans App.jsx — remplace la fonction App() par celle-ci
// et ajoute les imports nécessaires en haut

// NOUVEAUX IMPORTS à ajouter :
// import DashboardPatient from "./pages/DashboardPatient";
// import DashboardMedecin from "./pages/DashboardMedecin";

// REMPLACE la fonction App() par :

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [currentPage, setCurrentPage] = useState("home");

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 3500);
    return () => clearTimeout(timer);
  }, []);

  // Vérifier si déjà connecté au chargement
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    if (token && user) {
      const parsedUser = JSON.parse(user);
      if (parsedUser.role === "patient") setCurrentPage("dashboardPatient");
      else if (parsedUser.role === "medecin") setCurrentPage("dashboardMedecin");
    }
  }, []);

  if (showSplash) return <SplashScreen />;
  if (currentPage === "patientRegister")
    return <PatientRegister setPage={setCurrentPage} />;
  if (currentPage === "connecterPatient")
    return <ConnecterPatient setPage={setCurrentPage} />;
  if (currentPage === "doctorRegister")
    return <DoctorRegister setPage={setCurrentPage} />;
  if (currentPage === "connecterMedecin")
    return <ConnecterMedecin setPage={setCurrentPage} />;

  // Pages dashboard (à créer)
  // if (currentPage === "dashboardPatient")
  //   return <DashboardPatient setPage={setCurrentPage} />;
  // if (currentPage === "dashboardMedecin")
  //   return <DashboardMedecin setPage={setCurrentPage} />;

  // Placeholder temporaire pour les dashboards
  if (currentPage === "dashboardPatient")
    return <DashboardPlaceholder role="patient" setPage={setCurrentPage} />;
  if (currentPage === "dashboardMedecin")
    return <DashboardPlaceholder role="medecin" setPage={setCurrentPage} />;

  return <HomePage setPage={setCurrentPage} />;
}

// Placeholder temporaire jusqu'à la création des vrais dashboards
const DashboardPlaceholder = ({ role, setPage }) => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isPatient = role === "patient";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setPage("home");
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: isPatient ? "#f0fdf4" : "#eff6ff",
      fontFamily: '"Segoe UI", sans-serif'
    }}>
      <div style={{
        background: "#fff", borderRadius: "24px", padding: "50px 40px",
        textAlign: "center", boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
        maxWidth: "500px", width: "100%"
      }}>
        <div style={{ fontSize: "60px", marginBottom: "20px" }}>
          {isPatient ? "🏥" : "🩺"}
        </div>
        <h1 style={{ color: isPatient ? "#059669" : "#2563eb", marginBottom: "10px" }}>
          Bienvenue, {user.prenom || user.nom || "Utilisateur"} !
        </h1>
        <p style={{ color: "#6b7280", marginBottom: "30px" }}>
          {isPatient
            ? "Votre espace patient est prêt. Le dashboard complet arrive bientôt."
            : "Votre espace professionnel est prêt. Le dashboard complet arrive bientôt."}
        </p>
        <div style={{
          background: isPatient ? "#f0fdf4" : "#eff6ff",
          border: `1px solid ${isPatient ? "#bbf7d0" : "#bfdbfe"}`,
          borderRadius: "12px", padding: "15px", marginBottom: "25px",
          fontSize: "13px", color: "#4b5563"
        }}>
          ✅ Connecté en tant que <strong>{role}</strong><br />
          📧 {user.email}
        </div>
        <button
          onClick={handleLogout}
          style={{
            padding: "14px 32px", borderRadius: "12px", border: "none",
            background: "#f1f5f9", color: "#374151", fontWeight: "600",
            cursor: "pointer", fontSize: "14px"
          }}
        >
          Se déconnecter
        </button>
      </div>
    </div>
  );
};
