import React, { useState } from 'react';

function DoctorLogin({ setPage }) {
  const [showPass, setShowPass] = useState(false);

  const styles = {
    mainStyle: { background: '#f8f9fa', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: '"Segoe UI", sans-serif' },
    loginCard: { backgroundColor: '#ffffff', borderRadius: '25px', padding: '45px', width: '100%', maxWidth: '400px', boxShadow: '0 10px 30px rgba(0,0,0,0.02)', textAlign: 'center', position: 'relative' },
    backBtn: { position: 'absolute', top: '20px', left: '20px', background: 'none', border: 'none', color: '#2563eb', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' },
    iconCircle: { backgroundColor: '#3b82f6', width: '70px', height: '70px', borderRadius: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 25px auto' },
    inputGroup: { marginBottom: '20px', textAlign: 'left', position: 'relative' },
    labelStyle: { display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#111' },
    inputStyle: { width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e5e7eb', backgroundColor: '#f9fafb', fontSize: '15px', outline: 'none', boxSizing: 'border-box' },
    buttonStyle: { width: '100%', padding: '16px', borderRadius: '12px', border: 'none', backgroundColor: '#2563eb', color: 'white', fontSize: '16px', fontWeight: '700', cursor: 'pointer', marginTop: '10px' },
    eyeIcon: { position: 'absolute', right: '15px', top: '38px', cursor: 'pointer', color: '#9ca3af' }
  };

  return (
    <div style={styles.mainStyle}>
      <div style={styles.loginCard}>
        <button style={styles.backBtn} onClick={() => setPage("choice")}>← Retour</button>
        <div style={styles.iconCircle}>
          <span style={{ fontSize: '35px', color: 'white' }}>🩺</span>
          
        </div>

        <h2 style={{ fontSize: '26px', fontWeight: '700', marginBottom: '10px' }}>Espace Professionnel</h2>
        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '35px' }}>Connectez-vous pour accéder à votre agenda</p>

        <form>
          <div style={styles.inputGroup}>
            <label style={styles.labelStyle}>Email</label>
            <input type="email" placeholder="votre@email.fr" style={styles.inputStyle} required />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.labelStyle}>Mot de passe</label>
            <input type={showPass ? "text" : "password"} placeholder="••••••••" style={styles.inputStyle} required />
            <span style={styles.eyeIcon} onClick={() => setShowPass(!showPass)}>👁️</span>
          </div>

          <button type="submit" style={styles.buttonStyle}>Se connecter</button>
        </form>

        <p style={{ marginTop: '25px', fontSize: '14px', color: '#6b7280' }}>
          Pas encore inscrit ? <span onClick={() => setPage("doctorRegister")} style={{ color: '#2563eb', fontWeight: 'bold', cursor: 'pointer' }}>Créer un compte</span>
        </p>
        
        <button onClick={() => setPage("choice")} style={{background:'none', border:'none', color:'#9ca3af', cursor:'pointer', marginTop:'15px'}}>
          ← Retour
        </button>
      </div>
    </div>
  );
}

export default DoctorLogin;