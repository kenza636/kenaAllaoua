import React from "react";

function ProfileChoice({ setPage }) {
  // --- STYLES ---
  const main = {
    background: "#E5ECF1", // Ton fond principal
    minHeight: "100vh",
    width: "100vw",
    margin: 0,
    padding: "40px 20px",
    fontFamily: "'Segoe UI', Roboto, sans-serif",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
    position: "absolute",
    top: 0,
    left: 0,
  };

  const header = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    maxWidth: "1000px",
    width: "100%",
    marginBottom: "70px",
  };

  const titleStyle = {
    fontSize: "3.5rem",
    fontWeight: "800",
    margin: 0,
    lineHeight: 1.1
  };

  const logoBox = {
    width: "250px", 
    height: "auto",
    background: "transparent", 
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "20px",
  };

  const logoImg = {
    width: "100%",
    height: "auto",
    objectFit: "contain",
  };

  const cardsContainer = {
    display: "flex",
    maxWidth: "1050px",
    width: "100%",
    gap: "30px",
  };

  const card = {
    flex: 1,
    background: "#fff",
    borderRadius: "30px",
    padding: "40px 30px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    boxShadow: "0 10px 40px rgba(0,0,0,0.03)",
  };

  const listItem = {
    display: "flex",
    alignItems: "center",
    background: "#f8fafc",
    padding: "14px 18px",
    borderRadius: "14px",
    marginBottom: "10px",
    fontSize: "14px",
    width: "100%",
    textAlign: "left",
    color: "#4b5563",
    border: "1px solid #f1f5f9"
  };

  const buttonStyle = (bg) => ({
    width: "100%",
    padding: "18px",
    marginTop: "20px",
    borderRadius: "14px",
    border: "none",
    background: bg,
    color: "#fff",
    fontWeight: "700",
    fontSize: "16px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px"
  });

  const secondaryButtonStyle = (color) => ({
    marginTop: "12px",
    width: "100%",
    padding: "15px",
    borderRadius: "12px",
    border: `2px solid ${color}`,
    background: "transparent",
    color: color,
    fontWeight: "600",
    fontSize: "15px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  });

  return (
    <div style={main}>
      <style>{`
        body, html { margin: 0; padding: 0; overflow-x: hidden; background: #E5ECF1; }
      `}</style>

      {/* HEADER */}
      <div style={header}>
        <div style={{ flex: 1, paddingRight: "60px" }}>
          <div style={logoBox}>
            <img src="/logo.png" alt="Logo Mediko" style={logoImg} />
          </div>
          
          <h1 style={{ ...titleStyle, color: "#10B981" }}>Bienvenue sur</h1>
          <h1 style={{ ...titleStyle, color: "#426ac2" }}>Mediko</h1>
          <p style={{ fontSize: "1.1rem", color: "#718096", marginTop: "15px", maxWidth: "450px" }}>
            La plateforme de rendez-vous médicaux en ligne qui simplifie la gestion de votre santé au quotidien.
          </p>
          
          {/* STATS */}
          <div style={{ display: "flex", gap: "25px", marginTop: "25px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span>⭐</span>
              <div style={{ fontSize: "13px" }}><strong>10k+</strong> <br/> <span style={{color: "#9ca3af"}}>Patients</span></div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span>🩺</span>
              <div style={{ fontSize: "13px" }}><strong>500+</strong> <br/> <span style={{color: "#9ca3af"}}>Médecins</span></div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span>🗓️</span>
              <div style={{ fontSize: "13px" }}><strong>50k+</strong> <br/> <span style={{color: "#9ca3af"}}>RDV / mois</span></div>
            </div>
          </div>
        </div>

        {/* VIDÉO CORRIGÉE */}
        <div style={{ 
          borderRadius: '30px', 
          overflow: 'hidden', 
          width: '480px', 
          background: "#E5ECF1", // Changé pour correspondre exactement au fond de la page
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <video 
            src="/bbb.webm" 
            width="100%" 
            autoPlay 
            loop 
            muted 
            playsInline 
            style={{ display: 'block' }} 
          />
        </div>
      </div>

      {/* CARDS CONTAINER */}
      <div style={cardsContainer}>
        {/* CARTE PATIENT */}
        <div style={card}>
          <div style={{ fontSize: "35px", marginBottom: "15px" }}>🤍</div>
          <h2 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "15px" }}>Je suis patient</h2>
          <div style={listItem}>📅 Recherchez un médecin par spécialité</div>
          <div style={listItem}>🕒 Réservez en ligne 24h/24</div>
          <div style={listItem}>❤️ Gérez votre historique médical</div>
          <div style={listItem}>🛡️ Données sécurisées RGPD</div>
          <button onClick={() => setPage("patientRegister")} style={buttonStyle("#059669")}>
            Créer mon compte patient <span>→</span>
          </button>
          <button onClick={() => setPage("connecterPatient")} style={secondaryButtonStyle("#059669")}>
            Déjà inscrit ? Se connecter
          </button>
        </div>

        {/* CARTE MÉDECIN */}
        <div style={card}>
          <div style={{ fontSize: "35px", marginBottom: "15px" }}>🩺</div>
          <h2 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "15px" }}>Je suis médecin</h2>
          <div style={listItem}>📅 Agenda en ligne synchronisé</div>
          <div style={listItem}>🕒 Réduisez les absences</div>
          <div style={listItem}>💙 Gestion des dossiers patients</div>
          <div style={listItem}>⭐ Visibilité accrue</div>
          <button onClick={() => setPage("doctorRegister")} style={buttonStyle("#2563eb")}>
            Créer mon compte médecin <span>→</span>
          </button>
          <button onClick={() => setPage("connecterMedecin")} style={secondaryButtonStyle("#2563eb")}>
            Espace professionnel : Connexion
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProfileChoice;