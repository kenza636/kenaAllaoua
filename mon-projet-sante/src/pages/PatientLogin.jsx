import React, { useState } from "react";

function PatientLogin({ setPage }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

 const handleSubmit = async (e) => {
  e.preventDefault();
  setErreur('');
  setChargement(true);

  try {
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role: 'patient' }),
    });

    const data = await res.json();

    if (!res.ok) {
      setErreur(data.message || 'Email ou mot de passe incorrect');
      return;
    }

    // ✅ Stocker le token
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    // ✅ Rediriger vers le frontend-patient avec le token et les données utilisateur dans l'URL
    const tokenEncode = encodeURIComponent(data.token);
    const userEncode = encodeURIComponent(JSON.stringify(data.user));
    window.location.href = `http://localhost:5174?token=${tokenEncode}&user=${userEncode}`;

  } catch (err) {
    setErreur('Erreur serveur. Vérifiez votre connexion.');
  } finally {
    setChargement(false);
  }
};

  const styles = {
    pageWrapper: {
      background: "#f8f9fa",
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "20px",
      fontFamily: '"Segoe UI", Roboto, sans-serif',
    },
    card: {
      backgroundColor: "#ffffff",
      padding: "50px 40px",
      borderRadius: "30px",
      width: "100%",
      maxWidth: "450px",
      boxShadow: "0 10px 40px rgba(0,0,0,0.03)",
      textAlign: "center",
      borderBottom: "4px solid #00a884",
      position: 'relative',
    },
    backBtn: {
      position: 'absolute',
      top: '20px',
      left: '20px',
      background: 'none',
      border: 'none',
      color: '#00a884',
      fontSize: '16px',
      fontWeight: '700',
      cursor: 'pointer',
    },
    headerIcon: {
      width: "70px",
      height: "70px",
      background: "linear-gradient(135deg, #00a884, #00d1a7)",
      borderRadius: "20px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      margin: "0 auto 25px",
      color: "white",
      fontSize: "35px",
    },
    title: {
      fontSize: "28px",
      fontWeight: "800",
      color: "#111",
      margin: "0 0 10px 0",
    },
    subtitle: { fontSize: "15px", color: "#6b7280", marginBottom: "35px" },
    fieldGroup: {
      textAlign: "left",
      marginBottom: "20px",
      position: "relative",
    },
    label: {
      display: "block",
      fontSize: "14px",
      fontWeight: "600",
      color: "#111",
      marginBottom: "8px",
    },
    inputWrapper: { position: "relative" },
    input: {
      width: "100%",
      padding: "16px 16px 16px 45px",
      borderRadius: "12px",
      border: "1px solid #f0f0f0",
      backgroundColor: "#f9fafb",
      fontSize: "14px",
      outline: "none",
      boxSizing: "border-box",
    },
    inputError: {
      width: "100%",
      padding: "16px 16px 16px 45px",
      borderRadius: "12px",
      border: "1px solid #ef4444",
      backgroundColor: "#fff5f5",
      fontSize: "14px",
      outline: "none",
      boxSizing: "border-box",
    },
    inputIcon: {
      position: "absolute",
      left: "15px",
      top: "50%",
      transform: "translateY(-50%)",
      color: "#9ca3af",
    },
    erreurBox: {
      backgroundColor: "#fff5f5",
      border: "1px solid #fecaca",
      borderRadius: "12px",
      padding: "12px 16px",
      marginBottom: "20px",
      color: "#ef4444",
      fontSize: "14px",
      textAlign: "left",
    },
    forgotPassword: {
      display: "block",
      textAlign: "right",
      fontSize: "13px",
      color: "#00a884",
      marginTop: "10px",
      fontWeight: "600",
      cursor: "pointer",
    },
    submitBtn: {
      width: "100%",
      padding: "18px",
      borderRadius: "14px",
      border: "none",
      background: chargement ? "#9ca3af" : "#00a884",
      color: "white",
      fontSize: "16px",
      fontWeight: "700",
      cursor: chargement ? "not-allowed" : "pointer",
      marginTop: "25px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "10px",
    },
    footerLinks: { marginTop: "30px", fontSize: "14px", color: "#6b7280" },
    link: { color: "#00a884", fontWeight: "700", cursor: "pointer" },
  };

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.card}>
        <button style={styles.backBtn} onClick={() => setPage("home")}>← Retour</button>
        <div style={styles.headerIcon}>🤍</div>
        <h1 style={styles.title}>Bon retour !</h1>
        <p style={styles.subtitle}>
          Connectez-vous à votre espace patient Mediko
        </p>

        {/* Affichage erreur */}
        {erreur && <div style={styles.erreurBox}>⚠️ {erreur}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Adresse email *</label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>✉️</span>
              <input
                style={erreur ? styles.inputError : styles.input}
                type="email"
                placeholder="nom.prenom@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Mot de passe *</label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>🔒</span>
              <input
                style={erreur ? styles.inputError : styles.input}
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span
                style={{
                  ...styles.inputIcon,
                  left: "auto",
                  right: "15px",
                  cursor: "pointer",
                }}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "🔓" : "🔒"}
              </span>
            </div>
            <span style={styles.forgotPassword}>Mot de passe oublié ?</span>
          </div>

          <button style={styles.submitBtn} type="submit" disabled={chargement}>
            {chargement ? "Connexion..." : "Se connecter"} <span>→</span>
          </button>
        </form>

        <div style={styles.footerLinks}>
          <p>
            Nouveau sur Mediko ?{" "}
            <span
              style={styles.link}
              onClick={() => setPage("patientRegister")}
            >
              Créer un compte
            </span>
          </p>
          <hr
            style={{
              border: "0",
              borderTop: "1px solid #eee",
              margin: "25px 0",
            }}
          />
          <p style={{ fontSize: "12px" }}>Plateforme sécurisée certifiée HDS</p>
        </div>
      </div>
    </div>
  );
}

export default PatientLogin;
