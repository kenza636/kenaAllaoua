import React, { useState } from 'react';

const API_URL = "http://localhost:5000/api";
const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ConnecterMedecin({ setPage }) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erreur, setErreur] = useState("");
  const [emailErr, setEmailErr] = useState("");
  const [passwordErr, setPasswordErr] = useState("");
  const [chargement, setChargement] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur("");
    setEmailErr("");
    setPasswordErr("");

    if (!RE_EMAIL.test(email)) {
      setEmailErr("Adresse email invalide");
      return;
    }
    if (!password.trim()) {
      setPasswordErr("Mot de passe requis");
      return;
    }

    setChargement(true);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role: "medecin" }),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data.message || "Email ou mot de passe incorrect";
        if (msg.toLowerCase().includes("email")) {
          setEmailErr(msg);
        } else {
          setErreur(msg);
        }
        return;
      }

      // Stocker le token et les infos utilisateur (pour l'application actuelle)
      localStorage.setItem("medecin_token", data.token);
      localStorage.setItem("medecin_user",  JSON.stringify(data.user));

      // Rediriger vers le dashboard médecin avec le token et l'utilisateur dans l'URL
      const tokenEncode = encodeURIComponent(data.token);
      const userEncode = encodeURIComponent(JSON.stringify(data.user));
      window.location.href = `http://localhost:5175?token=${tokenEncode}&user=${userEncode}`;

    } catch (err) {
      setErreur(err.message);
    } finally {
      setChargement(false);
    }
  };

  const styles = {
    pageWrapper: {
      background: '#f0f7ff',
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px',
      fontFamily: '"Segoe UI", Roboto, sans-serif',
      position: 'absolute',
      top: 0,
      left: 0,
      boxSizing: 'border-box',
      margin: 0
    },
    card: {
      backgroundColor: '#ffffff',
      padding: '50px 40px',
      borderRadius: '30px',
      width: '100%',
      maxWidth: '450px',
      boxShadow: '0 15px 35px rgba(0, 0, 0, 0.06)',
      textAlign: 'center',
      borderBottom: '4px solid #2563eb',
      position: 'relative'
    },
    backBtn: {
      position: 'absolute',
      top: '25px',
      left: '25px',
      background: 'none',
      border: 'none',
      color: '#3b82f6',
      fontWeight: 'bold',
      cursor: 'pointer',
      fontSize: '15px',
      display: 'flex',
      alignItems: 'center',
      gap: '5px'
    },
    logoBox: {
      width: '180px',
      height: 'auto',
      margin: '0 auto 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    logoImg: { width: '100%', height: 'auto', objectFit: 'contain' },
    title: { fontSize: '28px', fontWeight: '800', color: '#111', margin: '0 0 10px 0' },
    subtitle: { fontSize: '15px', color: '#6b7280', marginBottom: '35px' },
    fieldGroup: { textAlign: 'left', marginBottom: '20px', position: 'relative' },
    label: { display: 'block', fontSize: '14px', fontWeight: '600', color: '#111', marginBottom: '8px' },
    inputWrapper: { position: 'relative' },
    input: {
      width: '100%',
      padding: '16px 45px 16px 15px',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
      backgroundColor: '#f9fafb',
      fontSize: '14px',
      outline: 'none',
      boxSizing: 'border-box',
    },
    inputError: {
      border: '1px solid #ef4444',
    },
    lockIcon: {
      position: 'absolute',
      right: '15px',
      top: '50%',
      transform: 'translateY(-50%)',
      cursor: 'pointer',
      color: '#9ca3af',
      fontSize: '18px'
    },
    forgotPassword: {
      display: 'block',
      textAlign: 'right',
      fontSize: '13px',
      color: '#2563eb',
      marginTop: '10px',
      fontWeight: '600',
      cursor: 'pointer'
    },
    errorBox: {
      background: '#fef2f2',
      border: '1px solid #fecaca',
      borderRadius: '10px',
      padding: '12px 16px',
      color: '#dc2626',
      fontSize: '13px',
      textAlign: 'left',
      marginBottom: '15px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    submitBtn: {
      width: '100%',
      padding: '18px',
      borderRadius: '14px',
      border: 'none',
      background: chargement ? '#9ca3af' : '#2563eb',
      color: 'white',
      fontSize: '16px',
      fontWeight: '700',
      cursor: chargement ? 'not-allowed' : 'pointer',
      marginTop: '10px',
      boxShadow: '0 5px 15px rgba(37, 99, 235, 0.2)',
      transition: 'background 0.2s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px'
    },
    footerLinks: { marginTop: '30px', fontSize: '14px', color: '#6b7280' },
    link: { color: '#2563eb', fontWeight: '700', cursor: 'pointer' }
  };

  return (
    <div style={styles.pageWrapper}>
      <style>{`
        body, html { margin: 0; padding: 0; overflow-x: hidden; background: #f0f7ff; }
        input:focus { border-color: #2563eb !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
      `}</style>

      <div style={styles.card}>
        <button style={styles.backBtn} onClick={() => setPage("home")}>
          ← Retour
        </button>

        <div style={styles.logoBox}>
          <img src="/logo.png" alt="Mediko" style={styles.logoImg} />
        </div>

        <h1 style={styles.title}>Espace Médecin</h1>
        <p style={styles.subtitle}>Connectez-vous pour gérer vos consultations</p>

        {erreur && (
          <div style={styles.errorBox}>
            <span>⚠️</span> {erreur}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Adresse email professionnelle *</label>
            <div style={styles.inputWrapper}>
              <input
                style={{ ...styles.input, ...(emailErr ? styles.inputError : {}) }}
                type="email"
                placeholder="docteur.nom@mediko.dz"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailErr) setEmailErr("");
                  if (erreur) setErreur("");
                }}
                required
              />
            </div>
            {emailErr && <p style={{ color: '#dc2626', fontSize: '12px', margin: '8px 0 0' }}>{emailErr}</p>}
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Mot de passe *</label>
            <div style={styles.inputWrapper}>
              <input
                style={{ ...styles.input, ...(passwordErr ? styles.inputError : {}) }}
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordErr) setPasswordErr("");
                  if (erreur) setErreur("");
                }}
                required
              />
              <span style={styles.lockIcon} onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? "🔓" : "🔒"}
              </span>
            </div>
            {passwordErr && <p style={{ color: '#dc2626', fontSize: '12px', margin: '8px 0 0' }}>{passwordErr}</p>}
            <span style={styles.forgotPassword}>Mot de passe oublié ?</span>
          </div>

          <button style={styles.submitBtn} type="submit" disabled={chargement}>
            {chargement ? (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}>
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
                Connexion...
              </>
            ) : "Se connecter au portail →"}
          </button>

          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </form>

        <div style={styles.footerLinks}>
          <p>Pas encore inscrit ? <span style={styles.link} onClick={() => setPage("doctorRegister")}>Créer un compte pro</span></p>
        </div>
      </div>
    </div>
  );
}

export default ConnecterMedecin;
