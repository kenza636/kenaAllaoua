import React, { useState, useRef } from 'react';

const API_URL = "http://localhost:5000/api";

function DoctorRegister({ setPage }) {
  const [showPass, setShowPass]     = useState(false);
  const [showConf, setShowConf]     = useState(false);
  const [diplomaFile, setDiplomaFile] = useState(null);
  const [dragOver, setDragOver]     = useState(false);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur]         = useState("");
  const [succes, setSucces]         = useState(false);
  const [formErrors, setFormErrors] = useState({
    nom: "",
    prenom: "",
    rpps: "",
    specialite: "",
    adresse: "",
    codePostal: "",
    wilaya: "",
    email: "",
    telephone: "",
    password: "",
    confirmPassword: "",
    acceptCGU: "",
    diploma: "",
  });
  const fileInputRef = useRef(null);

  const RE_PHONE = /^(05|06|07)\d{8}$/;
  const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const ALLOWED  = /\.(pdf|jpe?g|png)$/i;

  const [form, setForm] = useState({
    nom: "", prenom: "", rpps: "", specialite: "",
    adresse: "", codePostal: "", wilaya: "",
    email: "", telephone: "", password: "", confirmPassword: "",
    acceptCGU: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    setFormErrors(prev => ({ ...prev, [name]: "" }));
  };

  const acceptFile = (file) => {
    if (!file) return;
    if (!ALLOWED.test(file.name)) {
      setFormErrors(prev => ({ ...prev, diploma: "Format non accepté — PDF, JPG ou PNG uniquement." }));
      return setErreur("Format non accepté — PDF, JPG ou PNG uniquement.");
    }
    if (file.size > 10 * 1024 * 1024) {
      setFormErrors(prev => ({ ...prev, diploma: "Fichier trop lourd — maximum 10 Mo." }));
      return setErreur("Fichier trop lourd — maximum 10 Mo.");
    }
    setErreur("");
    setFormErrors(prev => ({ ...prev, diploma: "" }));
    setDiplomaFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    acceptFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur("");
    setFormErrors({
      nom: "",
      prenom: "",
      rpps: "",
      specialite: "",
      adresse: "",
      codePostal: "",
      wilaya: "",
      email: "",
      telephone: "",
      password: "",
      confirmPassword: "",
      acceptCGU: "",
      diploma: "",
    });

    const fieldErrors = {};

    if (!form.nom.trim()) fieldErrors.nom = "Le nom est obligatoire.";
    if (!form.prenom.trim()) fieldErrors.prenom = "Le prénom est obligatoire.";
    if (!form.rpps.trim()) fieldErrors.rpps = "Le RPPS est obligatoire.";
    if (!form.specialite) fieldErrors.specialite = "La spécialité est obligatoire.";
    if (!form.email.trim()) fieldErrors.email = "L'adresse email est obligatoire.";
    if (!form.telephone.trim()) fieldErrors.telephone = "Le téléphone est obligatoire.";
    if (!form.password) fieldErrors.password = "Le mot de passe est obligatoire.";
    if (!form.confirmPassword) fieldErrors.confirmPassword = "La confirmation du mot de passe est obligatoire.";
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
    if (!diplomaFile) {
      fieldErrors.diploma = "Veuillez joindre votre justificatif de diplôme.";
    }

    if (Object.keys(fieldErrors).length > 0) {
      setFormErrors(fieldErrors);
      return;
    }

    setChargement(true);
    try {
      const fd = new FormData();
      fd.append("nom",        form.nom);
      fd.append("prenom",     form.prenom);
      fd.append("rpps",       form.rpps);
      fd.append("specialite", form.specialite);
      fd.append("adresse",    form.adresse);
      fd.append("codePostal", form.codePostal);
      fd.append("wilaya",     form.wilaya);
      fd.append("email",      form.email);
      fd.append("telephone",  form.telephone);
      fd.append("password",   form.password);
      fd.append("diploma",    diplomaFile);

      const res  = await fetch(`${API_URL}/auth/register/medecin`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        if (data.errors && Array.isArray(data.errors)) {
          const serverFieldErrors = {};
          const serverMessages = [];

          data.errors.forEach((msg) => {
            const lower = msg.toLowerCase();
            if (lower.includes("email")) serverFieldErrors.email = msg;
            else if (lower.includes("téléphone") || lower.includes("telephone")) serverFieldErrors.telephone = msg;
            else if (lower.includes("rpps")) serverFieldErrors.rpps = msg;
            else if (lower.includes("spécialité") || lower.includes("specialite")) serverFieldErrors.specialite = msg;
            else if (lower.includes("nom")) serverFieldErrors.nom = msg;
            else if (lower.includes("prénom") || lower.includes("prenom")) serverFieldErrors.prenom = msg;
            else if (lower.includes("mot de passe") || lower.includes("password")) {
              serverFieldErrors.password = msg;
              if (lower.includes("confirmation") || lower.includes("correspond")) {
                serverFieldErrors.confirmPassword = msg;
              }
            } else if (lower.includes("diplôme") || lower.includes("diplome") || lower.includes("justificatif")) {
              serverFieldErrors.diploma = msg;
            } else if (lower.includes("adresse")) serverFieldErrors.adresse = msg;
            else if (lower.includes("postal")) serverFieldErrors.codePostal = msg;
            else if (lower.includes("wilaya")) serverFieldErrors.wilaya = msg;
            else if (lower.includes("cgu")) serverFieldErrors.acceptCGU = msg;
            else {
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

      setSucces(true);
      setTimeout(() => setPage("connecterMedecin"), 2500);
    } catch (err) {
      // Erreur déjà gérée ci-dessus
    } finally {
      setChargement(false);
    }
  };

  const wilayas = [
    "01 Adrar","02 Chlef","03 Laghouat","04 Oum El Bouaghi","05 Batna","06 Béjaïa","07 Biskra","08 Béchar","09 Blida","10 Bouira",
    "11 Tamanrasset","12 Tébessa","13 Tlemcen","14 Tiaret","15 Tizi Ouzou","16 Alger","17 Djelfa","18 Jijel","19 Sétif","20 Saïda",
    "21 Skikda","22 Sidi Bel Abbès","23 Annaba","24 Guelma","25 Constantine","26 Médéa","27 Mostaganem","28 M'Sila","29 Mascara","30 Ouargla",
    "31 Oran","32 El Bayadh","33 Illizi","34 Bordj Bou Arreridj","35 Boumerdès","36 El Tarf","37 Tindouf","38 Tissemsilt","39 El Oued","40 Khenchela",
    "41 Souk Ahras","42 Tipaza","43 Mila","44 Aïn Defla","45 Naâma","46 Aïn Témouchent","47 Ghardaïa","48 Relizane","49 El M'Ghair","50 El Meniaa",
    "51 Ouled Djellal","52 Bordj Baji Mokhtar","53 Béni Abbès","54 Timimoun","55 Touggourt","56 Djanet","57 In Salah","58 In Guezzam",
  ];

  const specialities = [
    "Anesthésiologie","Cardiologie","Chirurgie Générale","Dermatologie",
    "Gastro-entérologie","Gynécologie-Obstétrique","Médecine Générale",
    "Neurologie","Ophtalmologie","Orthopédie","Pédiatrie","Psychiatrie",
    "Radiologie","Urologie","Dentiste",
  ];

  const s = {
    wrap:  { background:'#f8f9fa', minHeight:'100vh', display:'flex', justifyContent:'center', padding:'40px 20px', fontFamily:'"Segoe UI", sans-serif' },
    card:  { backgroundColor:'#fff', padding:'40px', borderRadius:'25px', width:'100%', maxWidth:'850px', boxShadow:'0 10px 40px rgba(0,0,0,0.05)', position:'relative' },
    back:  { background:'none', border:'none', color:'#3b82f6', fontWeight:'600', cursor:'pointer', fontSize:'15px', position:'absolute', top:'30px', left:'30px' },
    icon:  { width:'60px', height:'60px', backgroundColor:'#3b82f6', borderRadius:'18px', display:'flex', alignItems:'center', justifyContent:'center', margin:'10px auto 20px', color:'white', fontSize:'28px' },
    sec:   { fontSize:'16px', fontWeight:'600', color:'#111', margin:'30px 0 15px', textAlign:'left', display:'flex', alignItems:'center', gap:'10px' },
    row:   { display:'flex', gap:'20px', marginBottom:'15px', flexWrap:'wrap' },
    field: { flex:1, minWidth:'250px', textAlign:'left', position:'relative' },
    lbl:   { display:'block', fontSize:'13px', fontWeight:'600', color:'#111', marginBottom:'8px' },
    inp:   { width:'100%', padding:'12px 40px 12px 40px', borderRadius:'10px', border:'1px solid #eee', backgroundColor:'#f9fafb', fontSize:'14px', outline:'none', boxSizing:'border-box' },
    inpR:  { width:'100%', padding:'12px 40px 12px 15px', borderRadius:'10px', border:'1px solid #eee', backgroundColor:'#f9fafb', fontSize:'14px', outline:'none', boxSizing:'border-box' },
    inpN:  { width:'100%', padding:'12px 15px', borderRadius:'10px', border:'1px solid #eee', backgroundColor:'#f9fafb', fontSize:'14px', outline:'none', boxSizing:'border-box' },
    lIcon: { position:'absolute', left:'15px', top:'36px', color:'#9ca3af', fontSize:'14px' },
    rIcon: { position:'absolute', right:'15px', top:'35px', cursor:'pointer', color:'#9ca3af', fontSize:'16px' },
    cgu:   { display:'flex', gap:'12px', alignItems:'flex-start', backgroundColor:'#f0f7ff', padding:'20px', borderRadius:'12px', marginTop:'20px', textAlign:'left', border:'1px solid #e0efff' },
    btn:   { width:'100%', padding:'16px', borderRadius:'12px', border:'none', backgroundColor: chargement ? '#9ca3af' : '#3b82f6', color:'white', fontSize:'16px', fontWeight:'700', cursor: chargement ? 'not-allowed' : 'pointer', marginTop:'20px', transition:'background 0.2s' },
    err:   { background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'10px', padding:'12px 16px', color:'#dc2626', fontSize:'13px', marginBottom:'15px', display:'flex', alignItems:'center', gap:'8px' },
    ok:    { background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:'10px', padding:'14px 16px', color:'#16a34a', fontSize:'14px', fontWeight:'600', marginBottom:'15px', textAlign:'center' },
  };

  const dropStyle = {
    border: `2px dashed ${dragOver ? '#3b82f6' : diplomaFile ? '#16a34a' : '#d1d5db'}`,
    borderRadius: '14px', padding: '28px 20px', textAlign: 'center',
    backgroundColor: dragOver ? '#eff6ff' : diplomaFile ? '#f0fdf4' : '#f9fafb',
    cursor: 'pointer', transition: 'all 0.2s',
  };

  return (
    <div style={s.wrap}>
      <style>{`body,html{margin:0;padding:0;overflow-x:hidden}input:focus,select:focus{border-color:#3b82f6!important;outline:none}`}</style>
      <div style={s.card}>
        <button style={s.back} onClick={() => setPage("home")}>← Retour</button>
        <div style={s.icon}>🩺</div>
        <h1 style={{ fontSize:'24px', fontWeight:'700', margin:'0 0 10px', textAlign:'center' }}>Inscription professionnel de santé</h1>
        <p style={{ color:'#6b7280', fontSize:'14px', marginBottom:'20px', textAlign:'center' }}>Rejoignez Mediko et gérez vos rendez-vous en ligne facilement</p>

        {erreur && (
          <div style={s.err}>
            ⚠️ {erreur.split('\n').map((err, i) => <div key={i}>{err}</div>)}
          </div>
        )}
        {succes && (
          <div style={s.ok}>
            ✅ Inscription envoyée ! Votre compte sera vérifié sous 24-48h.<br/>
            <span style={{ fontSize:'13px', fontWeight:'normal' }}>Redirection vers la connexion...</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Infos personnelles */}
          <h3 style={s.sec}>👤 Informations personnelles</h3>
          <div style={s.row}>
            <div style={s.field}>
              <label style={s.lbl}>Nom *</label>
              <span style={s.lIcon}>👤</span>
              <input style={{ ...s.inp, borderColor: formErrors.nom ? '#dc2626' : undefined }} type="text" name="nom" placeholder="Nom" value={form.nom} onChange={handleChange} required />
              {formErrors.nom && <p style={{ color:'#dc2626', fontSize:'12px', margin:'6px 0 0' }}>{formErrors.nom}</p>}
            </div>
            <div style={s.field}>
              <label style={s.lbl}>Prénom *</label>
              <span style={s.lIcon}>👤</span>
              <input style={{ ...s.inp, borderColor: formErrors.prenom ? '#dc2626' : undefined }} type="text" name="prenom" placeholder="Prénom" value={form.prenom} onChange={handleChange} required />
              {formErrors.prenom && <p style={{ color:'#dc2626', fontSize:'12px', margin:'6px 0 0' }}>{formErrors.prenom}</p>}
            </div>
          </div>

          {/* Infos pro */}
          <h3 style={s.sec}>🩺 Informations professionnelles</h3>
          <div style={s.row}>
            <div style={s.field}>
              <label style={s.lbl}>Numéro RPPS *</label>
              <span style={s.lIcon}>🪪</span>
              <input style={{ ...s.inp, borderColor: formErrors.rpps ? '#dc2626' : undefined }} type="text" name="rpps" placeholder="12345678901" value={form.rpps} onChange={handleChange} required />
              {formErrors.rpps && <p style={{ color:'#dc2626', fontSize:'12px', margin:'6px 0 0' }}>{formErrors.rpps}</p>}
            </div>
            <div style={s.field}>
              <label style={s.lbl}>Spécialité *</label>
              <select style={{ ...s.inpN, borderColor: formErrors.specialite ? '#dc2626' : undefined }} name="specialite" value={form.specialite} onChange={handleChange} required>
                <option value="">Choisir une spécialité</option>
                {specialities.map(sp => <option key={sp} value={sp}>{sp}</option>)}
              </select>
              {formErrors.specialite && <p style={{ color:'#dc2626', fontSize:'12px', margin:'6px 0 0' }}>{formErrors.specialite}</p>}
            </div>
          </div>

          {/* Upload diplôme */}
          <div style={s.row}>
            <div style={{ ...s.field, flex: '1 1 100%' }}>
              <label style={s.lbl}>📎 Justificatif de diplôme * <span style={{ color:'#9ca3af', fontWeight:400 }}>(PDF, JPG, PNG — max 10 Mo)</span></label>
              <div
                style={dropStyle}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  style={{ display: 'none' }}
                  onChange={e => acceptFile(e.target.files[0])}
                />
                {diplomaFile ? (
                  <div>
                    <div style={{ fontSize: '32px', marginBottom: '6px' }}>✅</div>
                    <p style={{ color: '#16a34a', fontWeight: '600', margin: '0 0 4px' }}>{diplomaFile.name}</p>
                    <p style={{ color: '#6b7280', fontSize: '12px', margin: 0 }}>
                      {(diplomaFile.size / 1024).toFixed(0)} Ko — Cliquez pour remplacer
                    </p>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '36px', marginBottom: '8px' }}>📁</div>
                    <p style={{ color: '#374151', fontWeight: '600', margin: '0 0 4px' }}>
                      Glissez votre fichier ici ou cliquez pour parcourir
                    </p>
                    <p style={{ color: '#9ca3af', fontSize: '12px', margin: 0 }}>PDF, JPG, PNG jusqu'à 10 Mo</p>
                  </div>
                )}
              </div>
              {formErrors.diploma && <p style={{ color:'#dc2626', fontSize:'12px', margin:'8px 0 0' }}>{formErrors.diploma}</p>}
            </div>
          </div>

          {/* Adresse */}
          <h3 style={s.sec}>📍 Adresse du cabinet</h3>
          <div style={s.row}>
            <div style={{ ...s.field, flex: 2 }}>
              <label style={s.lbl}>Adresse *</label>
              <span style={s.lIcon}>📍</span>
              <input style={{ ...s.inp, borderColor: formErrors.adresse ? '#dc2626' : undefined }} type="text" name="adresse" placeholder="15 rue de la Santé" value={form.adresse} onChange={handleChange} required />
              {formErrors.adresse && <p style={{ color:'#dc2626', fontSize:'12px', margin:'6px 0 0' }}>{formErrors.adresse}</p>}
            </div>
          </div>
          <div style={s.row}>
            <div style={s.field}>
              <label style={s.lbl}>Code postal *</label>
              <input style={{ ...s.inpN, borderColor: formErrors.codePostal ? '#dc2626' : undefined }} type="text" name="codePostal" placeholder="19000" value={form.codePostal} onChange={handleChange} required />
              {formErrors.codePostal && <p style={{ color:'#dc2626', fontSize:'12px', margin:'6px 0 0' }}>{formErrors.codePostal}</p>}
            </div>
            <div style={s.field}>
              <label style={s.lbl}>Ville (Wilaya) *</label>
              <select style={{ ...s.inpN, borderColor: formErrors.wilaya ? '#dc2626' : undefined }} name="wilaya" value={form.wilaya} onChange={handleChange} required>
                <option value="">Sélectionner une wilaya</option>
                {wilayas.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
              {formErrors.wilaya && <p style={{ color:'#dc2626', fontSize:'12px', margin:'6px 0 0' }}>{formErrors.wilaya}</p>}
            </div>
          </div>

          {/* Contact */}
          <h3 style={s.sec}>📧 Contact et sécurité</h3>
          <div style={s.row}>
            <div style={s.field}>
              <label style={s.lbl}>Email professionnel *</label>
              <span style={s.lIcon}>✉️</span>
              <input
                style={{ ...s.inp, borderColor: formErrors.email ? '#dc2626' : undefined }}
                type="email" name="email" placeholder="dr.nom@medecin.dz" value={form.email}
                onChange={handleChange}
                required
              />
              {formErrors.email && <p style={{ color:'#dc2626', fontSize:'12px', margin:'4px 0 0' }}>{formErrors.email}</p>}
            </div>
            <div style={s.field}>
              <label style={s.lbl}>Téléphone *</label>
              <span style={s.lIcon}>📞</span>
              <input
                style={{ ...s.inp, borderColor: formErrors.telephone ? '#dc2626' : undefined }}
                type="tel" name="telephone" maxLength="10" placeholder="05XXXXXXXX" value={form.telephone}
                onChange={handleChange}
                required
              />
              {formErrors.telephone && <p style={{ color:'#dc2626', fontSize:'12px', margin:'4px 0 0' }}>{formErrors.telephone}</p>}
            </div>
          </div>
          <div style={s.row}>
            <div style={s.field}>
              <label style={s.lbl}>Mot de passe *</label>
              <input style={{ ...s.inpR, borderColor: formErrors.password ? '#dc2626' : undefined }} type={showPass ? "text" : "password"} name="password" placeholder="••••••••" value={form.password} onChange={handleChange} required />
              <span style={s.rIcon} onClick={() => setShowPass(!showPass)}>{showPass ? "🔓" : "🔒"}</span>
              {formErrors.password && <p style={{ color:'#dc2626', fontSize:'12px', margin:'6px 0 0' }}>{formErrors.password}</p>}
            </div>
            <div style={s.field}>
              <label style={s.lbl}>Confirmer le mot de passe *</label>
              <input style={{ ...s.inpR, borderColor: formErrors.confirmPassword ? '#dc2626' : undefined }} type={showConf ? "text" : "password"} name="confirmPassword" placeholder="••••••••" value={form.confirmPassword} onChange={handleChange} required />
              <span style={s.rIcon} onClick={() => setShowConf(!showConf)}>{showConf ? "🔓" : "🔒"}</span>
              {formErrors.confirmPassword && <p style={{ color:'#dc2626', fontSize:'12px', margin:'6px 0 0' }}>{formErrors.confirmPassword}</p>}
            </div>
          </div>

          <div style={{ ...s.cgu, borderColor: formErrors.acceptCGU ? '#dc2626' : '#e0efff' }}>
            <input type="checkbox" name="acceptCGU" checked={form.acceptCGU} onChange={handleChange} required style={{ marginTop:'4px' }} />
            <label style={{ fontSize:'13px', color:'#4b5563', lineHeight:'1.6' }}>
              J'accepte les <span style={{ color:'#3b82f6', fontWeight:'bold', cursor:'pointer' }}>conditions générales d'utilisation</span> et certifie l'exactitude des informations. Mon compte sera vérifié avant activation.
            </label>
          </div>
          {formErrors.acceptCGU && <p style={{ color:'#dc2626', fontSize:'12px', margin:'8px 0 0' }}>{formErrors.acceptCGU}</p>}

          <button style={s.btn} type="submit" disabled={chargement}>
            {chargement ? "Envoi en cours..." : "Créer mon compte professionnel"}
          </button>
        </form>

        <div style={{ marginTop:'20px', fontSize:'14px', color:'#6b7280', textAlign:'center', lineHeight:'2' }}>
          Vous êtes patient ? <span onClick={() => setPage("patientRegister")} style={{ color:'#3b82f6', fontWeight:'bold', cursor:'pointer' }}>Inscription patient</span><br/>
          <span style={{ fontSize:'13px' }}>Vous avez déjà un compte ? <span onClick={() => setPage("connecterMedecin")} style={{ color:'#3b82f6', fontWeight:'bold', cursor:'pointer' }}>Se connecter</span></span>
        </div>
        <p style={{ fontSize:'11px', color:'#9ca3af', marginTop:'20px', textAlign:'center' }}>
          Votre compte sera vérifié sous 24-48h • Données sécurisées et conformes au RGPD
        </p>
      </div>
    </div>
  );
}

export default DoctorRegister;
