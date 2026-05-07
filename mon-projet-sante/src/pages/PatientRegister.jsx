import React, { useState } from 'react';

const API_URL = "http://localhost:5000/api";

function PatientRegister({ setPage }) {
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState(false);
  const [formErrors, setFormErrors] = useState({
    nom: "",
    prenom: "",
    dateNaissance: "",
    telephone: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptCGU: "",
  });

  const RE_PHONE = /^(05|06|07)\d{8}$/;
  const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    dateNaissance: "",
    telephone: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptCGU: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur("");
    setFormErrors({
      nom: "",
      prenom: "",
      dateNaissance: "",
      telephone: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptCGU: "",
    });

    const fieldErrors = {};

    if (!form.nom.trim()) fieldErrors.nom = "Le nom est obligatoire.";
    if (!form.prenom.trim()) fieldErrors.prenom = "Le prénom est obligatoire.";
    if (!form.email.trim()) fieldErrors.email = "L'adresse email est obligatoire.";
    if (!form.password) fieldErrors.password = "Le mot de passe est obligatoire.";
    if (!form.confirmPassword) fieldErrors.confirmPassword = "La confirmation du mot de passe est obligatoire.";
    if (!form.dateNaissance) fieldErrors.dateNaissance = "La date de naissance est obligatoire.";
    if (!form.telephone.trim()) fieldErrors.telephone = "Le téléphone est obligatoire.";
    if (!form.acceptCGU) fieldErrors.acceptCGU = "Vous devez accepter les conditions générales d'utilisation.";

    if (form.telephone && !RE_PHONE.test(form.telephone)) {
      fieldErrors.telephone = "Format téléphone invalide — ex: 0612345678";
    }
    if (form.email && !RE_EMAIL.test(form.email)) {
      fieldErrors.email = "Adresse email invalide";
    }
    if (form.password && form.confirmPassword && form.password !== form.confirmPassword) {
      fieldErrors.password = "Les mots de passe ne correspondent pas.";
      fieldErrors.confirmPassword = "Les mots de passe ne correspondent pas.";
    }
    if (form.password && form.password.length < 8) {
      fieldErrors.password = "Le mot de passe doit contenir au moins 8 caractères.";
    }
    if (form.password && form.password.length > 20) {
      fieldErrors.password = "Le mot de passe ne doit pas dépasser 20 caractères.";
    }
    if (form.password && !/[a-zA-Z]/.test(form.password)) {
      fieldErrors.password = "Le mot de passe doit contenir au moins une lettre.";
    }
    if (form.password && !/[0-9]/.test(form.password)) {
      fieldErrors.password = "Le mot de passe doit contenir au moins un chiffre.";
    }

    if (form.dateNaissance) {
      const birthDate = new Date(form.dateNaissance);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 18) {
        fieldErrors.dateNaissance = "Vous devez avoir au moins 18 ans pour vous inscrire.";
      }
    }

    if (Object.keys(fieldErrors).length > 0) {
      setFormErrors(fieldErrors);
      return;
    }

    setChargement(true);
    try {
      const res = await fetch(`${API_URL}/auth/register/patient`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: form.nom,
          prenom: form.prenom,
          dateNaissance: form.dateNaissance,
          telephone: form.telephone,
          email: form.email,
          password: form.password,
          role: "patient",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors && Array.isArray(data.errors)) {
          const serverFieldErrors = {};
          const serverMessages = [];

          data.errors.forEach((msg) => {
            const lower = msg.toLowerCase();
            if (lower.includes("email")) serverFieldErrors.email = msg;
            else if (lower.includes("mot de passe") || lower.includes("mot de passe")) {
              serverFieldErrors.password = msg;
              if (lower.includes("confir") || lower.includes("correspond")) {
                serverFieldErrors.confirmPassword = msg;
              }
            } else if (lower.includes("naissance") || lower.includes("18 ans")) {
              serverFieldErrors.dateNaissance = msg;
            } else if (lower.includes("téléphone") || lower.includes("telephone")) {
              serverFieldErrors.telephone = msg;
            } else if (lower.includes("nom")) {
              serverFieldErrors.nom = msg;
            } else if (lower.includes("prénom") || lower.includes("prenom")) {
              serverFieldErrors.prenom = msg;
            } else {
              serverMessages.push(msg);
            }
          });

          setFormErrors((prev) => ({ ...prev, ...serverFieldErrors }));
          if (serverMessages.length > 0) {
            setErreur(serverMessages.join('\n'));
          }
        } else {
          setErreur(data.message || "Erreur lors de l'inscription.");
        }
        throw new Error(data.message || "Erreur");
      }

      // Auto-login après inscription
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setSucces(true);
      setTimeout(() => {
        const tokenEncode = encodeURIComponent(data.token);
        const userEncode = encodeURIComponent(JSON.stringify(data.user));
        window.location.href = `http://localhost:5174?token=${tokenEncode}&user=${userEncode}`;
      }, 1500);

    } catch (err) {
      // Erreur déjà gérée ci-dessus
    } finally {
      setChargement(false);
    }
  };

  const styles = {
    pageWrapper: {
      background: '#f8f9fa',
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      padding: '40px 20px',
      fontFamily: '"Segoe UI", sans-serif',
      position: 'absolute',
      top: 0,
      left: 0,
      boxSizing: 'border-box'
    },
    card: {
      backgroundColor: '#ffffff',
      padding: '40px',
      borderRadius: '25px',
      width: '100%',
      maxWidth: '900px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.05)',
      zIndex: 1
    },
    headerIcon: {
      width: '120px',
      height: 'auto',
      backgroundColor: 'transparent',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 20px'
    },
    logoImg: { width: '100%', height: 'auto', objectFit: 'contain' },
    row: { display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' },
    fieldGroup: { flex: 1, minWidth: '250px', textAlign: 'left', position: 'relative' },
    label: { display: 'block', fontSize: '14px', fontWeight: '600', color: '#111', marginBottom: '8px' },
    input: { width: '100%', padding: '14px 15px', borderRadius: '12px', border: '1px solid #eee', backgroundColor: '#f9fafb', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
    inputError: { borderColor: '#dc2626', backgroundColor: '#fff1f2' },
    lockIcon: { position: 'absolute', right: '15px', top: '42px', cursor: 'pointer', fontSize: '18px' },
    backBtn: { background: 'none', border: 'none', color: '#00a884', fontWeight: 'bold', cursor: 'pointer', marginBottom: '20px', fontSize: '16px' },
    submitBtn: {
      width: '100%',
      padding: '16px',
      borderRadius: '12px',
      border: 'none',
      backgroundColor: chargement ? '#9ca3af' : '#00a884',
      color: 'white',
      fontSize: '16px',
      fontWeight: '600',
      cursor: chargement ? 'not-allowed' : 'pointer',
      marginTop: '20px',
      transition: 'background 0.2s'
    },
    errorBox: {
      background: '#fef2f2',
      border: '1px solid #fecaca',
      borderRadius: '10px',
      padding: '12px 16px',
      color: '#dc2626',
      fontSize: '13px',
      marginBottom: '15px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    successBox: {
      background: '#f0fdf4',
      border: '1px solid #bbf7d0',
      borderRadius: '10px',
      padding: '14px 16px',
      color: '#16a34a',
      fontSize: '14px',
      fontWeight: '600',
      marginBottom: '15px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    }
  };

  return (
    <div style={styles.pageWrapper}>
      <style>{`
        body, html { margin: 0; padding: 0; overflow-x: hidden; }
        input:focus { border-color: #00a884 !important; outline: none; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={styles.card}>
        <div style={{ textAlign: 'left' }}>
          <button style={styles.backBtn} onClick={() => setPage("home")}>← Retour</button>
        </div>

        <div style={styles.headerIcon}>
          <img src="/logo.png" alt="Mediko" style={styles.logoImg} />
        </div>

        <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '10px', textAlign: 'center' }}>
          Créer votre compte patient
        </h1>
        <p style={{ color: '#6b7280', marginBottom: '30px', textAlign: 'center' }}>
          Inscrivez-vous pour accéder à notre plateforme de rendez-vous médicaux en ligne
        </p>

        {erreur && (
          <div style={styles.errorBox}>
            ⚠️ {erreur.split('\n').map((err, i) => <div key={i}>{err}</div>)}
          </div>
        )}
        {succes && (
          <div style={styles.successBox}>✅ Compte créé avec succès ! Redirection...</div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={styles.row}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Nom *</label>
              <input
                style={{ ...styles.input, ...(formErrors.nom ? styles.inputError : {}) }}
                type="text" name="nom" placeholder="Nom" value={form.nom} onChange={handleChange} required
              />
              {formErrors.nom && <p style={{ color: '#dc2626', fontSize: '12px', margin: '6px 0 0' }}>{formErrors.nom}</p>}
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Prénom *</label>
              <input
                style={{ ...styles.input, ...(formErrors.prenom ? styles.inputError : {}) }}
                type="text" name="prenom" placeholder="Prénom" value={form.prenom} onChange={handleChange} required
              />
              {formErrors.prenom && <p style={{ color: '#dc2626', fontSize: '12px', margin: '6px 0 0' }}>{formErrors.prenom}</p>}
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Date de naissance *</label>
              <input
                style={{ ...styles.input, ...(formErrors.dateNaissance ? styles.inputError : {}) }}
                type="date" name="dateNaissance" value={form.dateNaissance} onChange={handleChange} required
              />
              {formErrors.dateNaissance && <p style={{ color: '#dc2626', fontSize: '12px', margin: '6px 0 0' }}>{formErrors.dateNaissance}</p>}
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Téléphone *</label>
              <input
                style={{ ...styles.input, ...(formErrors.telephone ? styles.inputError : {}) }}
                type="tel" name="telephone" placeholder="05XXXXXXXX"
                maxLength="10" value={form.telephone}
                onChange={handleChange}
                required
              />
              {formErrors.telephone && <p style={{ color: '#dc2626', fontSize: '12px', margin: '6px 0 0' }}>{formErrors.telephone}</p>}
            </div>
          </div>

          <div style={{ marginBottom: '20px', textAlign: 'left' }}>
            <label style={styles.label}>Adresse email *</label>
            <input
              style={{ ...styles.input, ...(formErrors.email ? styles.inputError : {}) }}
              type="email" name="email" placeholder="jean.dupont@email.com" value={form.email}
              onChange={handleChange}
              required
            />
            {formErrors.email && <p style={{ color: '#dc2626', fontSize: '12px', margin: '6px 0 0' }}>{formErrors.email}</p>}
          </div>

          <div style={styles.row}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Mot de passe *</label>
              <input
                style={{ ...styles.input, ...(formErrors.password ? styles.inputError : {}) }}
                type={showPass ? "text" : "password"}
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
              />
              <span style={styles.lockIcon} onClick={() => setShowPass(!showPass)}>{showPass ? "🔓" : "🔒"}</span>
              {formErrors.password && <p style={{ color: '#dc2626', fontSize: '12px', margin: '6px 0 0' }}>{formErrors.password}</p>}
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Confirmer le mot de passe *</label>
              <input
                style={{ ...styles.input, ...(formErrors.confirmPassword ? styles.inputError : {}) }}
                type={showConf ? "text" : "password"}
                name="confirmPassword"
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={handleChange}
                required
              />
              <span style={styles.lockIcon} onClick={() => setShowConf(!showConf)}>{showConf ? "🔓" : "🔒"}</span>
              {formErrors.confirmPassword && <p style={{ color: '#dc2626', fontSize: '12px', margin: '6px 0 0' }}>{formErrors.confirmPassword}</p>}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '15px', backgroundColor: '#f0f9ff', padding: '20px', borderRadius: '15px', textAlign: 'left', marginTop: '20px' }}>
            <input type="checkbox" name="acceptCGU" checked={form.acceptCGU} onChange={handleChange} required style={{ width: '20px', height: '20px', marginTop: '2px', flexShrink: 0 }} />
            <label style={{ fontSize: '13px', color: '#4b5563', lineHeight: '1.5' }}>
              J'accepte les <span style={{ color: '#00a884', fontWeight: 'bold', cursor: 'pointer' }}>conditions générales d'utilisation</span> et la <span style={{ color: '#00a884', fontWeight: 'bold', cursor: 'pointer' }}>politique de confidentialité</span>. Je consens au traitement de mes données de santé conformément au RGPD.
            </label>
          </div>
          {formErrors.acceptCGU && <p style={{ color: '#dc2626', fontSize: '12px', margin: '8px 0 0' }}>{formErrors.acceptCGU}</p>}

          <button style={styles.submitBtn} type="submit" disabled={chargement}>
            {chargement ? "Création en cours..." : "Créer mon compte patient"}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#6b7280' }}>
          Déjà inscrit ? <span style={{ color: '#00a884', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => setPage("connecterPatient")}>Se connecter</span>
        </p>
      </div>
    </div>
  );
}

export default PatientRegister;
