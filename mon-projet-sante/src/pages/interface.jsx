import React, { useState, useEffect } from "react";

// --- COMPOSANT DE DESTINATION (Après le splash) ---
const ProfileChoice = () => (
  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8f9fa' }}>
    <h2 style={{ color: '#0072BC', fontFamily: 'sans-serif' }}>Bienvenue sur Mediko</h2>
    <p style={{ fontFamily: 'sans-serif', color: '#666' }}>Sélectionnez votre profil pour continuer</p>
  </div>
);

function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Le splash reste 3 secondes ou jusqu'au clic
    const timer = setTimeout(() => setShowSplash(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!showSplash) return <ProfileChoice />;

  // --- STYLES DE L'INTERFACE ---
  const styles = {
    wrapper: {
      height: "100vh",
      width: "100vw",
      margin: 0,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "#ffffff",
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      overflow: "hidden",
      position: "relative"
    },
    bgCircle: {
      position: "absolute",
      width: "600px",
      height: "600px",
      background: "radial-gradient(circle, rgba(65, 173, 73, 0.05) 0%, rgba(0, 114, 188, 0.05) 100%)",
      borderRadius: "50%",
      zIndex: 0
    },
    container: {
      zIndex: 1,
      textAlign: "center",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "20px"
    },
    logoWrapper: {
      width: "180px", // Taille ajustée pour le logo
      marginBottom: "15px",
      animation: "float 3s ease-in-out infinite"
    },
    logoImg: {
      width: "100%",
      height: "auto",
      objectFit: "contain"
    },
    title: {
      fontSize: "3rem",
      fontWeight: "900",
      margin: "0 0 10px 0",
      letterSpacing: "-1.5px",
      color: "#1a202c",
      lineHeight: "1.2"
    },
    highlight: {
      background: "linear-gradient(90deg, #0072BC, #41AD49)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent"
    },
    description: {
      fontSize: "1.1rem",
      color: "#718096",
      maxWidth: "450px",
      lineHeight: "1.6",
      marginBottom: "30px"
    },
    statsContainer: {
      display: "flex",
      gap: "30px",
      marginBottom: "40px",
      padding: "15px 30px",
      background: "#f8fafc",
      borderRadius: "20px",
      border: "1px solid #edf2f7"
    },
    statBox: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      textAlign: "left"
    },
    ctaButton: {
      padding: "18px 50px",
      borderRadius: "15px",
      border: "none",
      background: "#1a202c",
      color: "white",
      fontSize: "1.1rem",
      fontWeight: "600",
      cursor: "pointer",
      boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
      transition: "all 0.3s ease"
    }
  };

  return (
    <>
      <style>
        {`
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
            100% { transform: translateY(0px); }
          }
          @keyframes reveal {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .reveal {
            animation: reveal 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          }
          .btn-hover:hover {
            transform: translateY(-3px);
            background: #2d3748;
            box-shadow: 0 15px 30px rgba(0,0,0,0.2);
          }
        `}
      </style>

      <div style={styles.wrapper}>
        <div style={styles.bgCircle}></div>
        
        <div style={styles.container} className="reveal">
          
          {/* LOGO EN HAUT */}
          <div style={styles.logoWrapper}>
            <img src="/logo.png" alt="Logo Mediko" style={styles.logoImg} />
          </div>

          {/* TITRE ET DESCRIPTION */}
          <h1 style={styles.title}>
            L'e-santé avec <br/> <span style={styles.highlight}>Mediko</span>
          </h1>
          
          <p style={styles.description}>
            Simplifiez vos prises de rendez-vous et gérez votre santé en toute sérénité avec nos experts.
          </p>

          {/* BLOC STATISTIQUES RECORRIGÉ */}
<div style={{ 
  display: "flex", 
  justifyContent: "center", 
  gap: "40px", 
  marginTop: "30px", 
  marginBottom: "30px",
  width: "100%" 
}}>
  {/* Stat 1 */}
  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
    <span style={{ fontSize: "24px" }}>⭐</span>
    <div style={{ textAlign: "left" }}>
      <strong style={{ color: "#1a202c", fontSize: "16px", display: "block" }}>10k+</strong>
      <span style={{ color: "#4a5568", fontSize: "13px" }}>Patients</span>
    </div>
  </div>

  {/* Stat 2 */}
  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
    <span style={{ fontSize: "24px" }}>🩺</span>
    <div style={{ textAlign: "left" }}>
      <strong style={{ color: "#1a202c", fontSize: "16px", display: "block" }}>500+</strong>
      <span style={{ color: "#4a5568", fontSize: "13px" }}>Médecins</span>
    </div>
  </div>

  {/* Stat 3 */}
  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
    <span style={{ fontSize: "24px" }}>🗓️</span>
    <div style={{ textAlign: "left" }}>
      <strong style={{ color: "#1a202c", fontSize: "16px", display: "block" }}>50k+</strong>
      <span style={{ color: "#4a5568", fontSize: "13px" }}>RDV / mois</span>
    </div>
  </div>
</div>

          {/* BOUTON D'ACTION */}
          <button 
            className="btn-hover"
            style={styles.ctaButton}
            onClick={() => setShowSplash(false)}
          >
            Commencer l'expérience
          </button>

          {/* PETITS ARGUMENTS BAS DE PAGE */}
          <div style={{ marginTop: "40px", display: "flex", gap: "25px", color: "#cbd5e0", fontSize: "0.85rem", fontWeight: "500" }}>
            <span>✓ 100% Rapide</span>
            <span>✓ Gratuit</span>
            <span>✓ Sécurisé RGPD</span>
          </div>

        </div>
      </div>
    </>
  );
}

export default App;