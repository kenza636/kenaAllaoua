import { useContext, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "./contexts/UserContext";
import { NotificationsContext } from "./contexts/NotificationsContext";
import { BookingsContext } from "./contexts/BookingsContext";
import Header from "./Header";
import "./DoctorSearch.css";

const API = "http://localhost:5000/api";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const RE_PHONE    = /^(05|06|07)\d{8}$/;
const RE_EMAIL    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function calcAge(ddn) {
  if (!ddn) return null;
  const birth = new Date(ddn);
  const now   = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

function toDateInput(mysqlDate) {
  if (!mysqlDate) return "";
  return mysqlDate.split("T")[0];
}

function fmtDate(d) {
  if (!d) return "—";
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2,"0")}/${String(dt.getMonth()+1).padStart(2,"0")}/${dt.getFullYear()}`;
}

const cardStyle = {
  backgroundColor: "#FFFFFF", borderRadius: "24px", padding: "32px",
  boxShadow: "0 24px 48px -20px rgba(15,23,42,0.25)", marginBottom: "24px",
};
const labelStyle = { fontWeight: "600", fontSize: "14px", marginBottom: "8px", display: "block", color: "#0F172A" };

const Profile = () => {
  const navigate = useNavigate();
  const { user, setUser }  = useContext(UserContext);
  const { getPast }        = useContext(BookingsContext);
  const notifsData         = useContext(NotificationsContext);

  const videoRef  = useRef(null);
  const canvasRef = useRef(null);

  const [editing,      setEditing]      = useState(false);
  const [loading,      setLoading]      = useState(true);
  const [cameraOpen,   setCameraOpen]   = useState(false);
  const [isCameraReady,setIsCameraReady]= useState(false);
  const [photo,        setPhoto]        = useState(null);

  // Champs lecture seule (utilisateur) — sauf tel maintenant éditable
  const [nom,    setNom]    = useState("");
  const [prenom, setPrenom] = useState("");
  const [email,  setEmail]  = useState("");
  const [tel,    setTel]    = useState("");

  // Champs éditables (table patients)
  const [gender,         setGender]         = useState("");
  const [dateOfBirth,    setDateOfBirth]    = useState("");
  const [bloodType,      setBloodType]      = useState("");
  const [address,        setAddress]        = useState("");
  const [city,           setCity]           = useState("");
  const [height,         setHeight]         = useState("");
  const [weight,         setWeight]         = useState("");
  const [emergencyName,  setEmergencyName]  = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [telError,       setTelError]       = useState("");
  const [emailError,     setEmailError]     = useState("");
  const [urgenceTelError,setUrgenceTelError]= useState("");

  const age = calcAge(dateOfBirth);

  // ── Fetch profil complet ──────────────────────────────────────
  useEffect(() => {
    const id = user?.id || user?.id_u;
    if (!id) return;
    fetch(`${API}/patients/${id}`)
      .then(r => r.json())
      .then(d => {
        setNom(d.nom_u    || "");
        setPrenom(d.prenom_u || "");
        setEmail(d.email_u  || "");
        setTel(d.tel_u      || "");
        setGender(d.sexe             || "");
        setDateOfBirth(toDateInput(d.date_naissance));
        setBloodType(d.groupe_sanguin || "");
        setAddress(d.adresse          || "");
        setCity(d.ville               || "");
        setHeight(d.taille            || "");
        setWeight(d.poids             || "");
        setEmergencyName(d.urgence_nom  || "");
        setEmergencyPhone(d.urgence_tel || "");
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user?.id, user?.id_u]);

  // ── Save ─────────────────────────────────────────────────────
  const handleSave = async () => {
    setTelError("");
    setEmailError("");
    setUrgenceTelError("");

    // Validation téléphone
    if (tel && !RE_PHONE.test(tel)) {
      setTelError("Format : 05/06/07XXXXXXXX (10 chiffres)");
      return;
    }

    // Validation email
    if (email && !RE_EMAIL.test(email)) {
      setEmailError("Adresse email invalide");
      return;
    }

    // Validation téléphone urgence
    if (emergencyPhone && !RE_PHONE.test(emergencyPhone)) {
      setUrgenceTelError("Format urgence : 05/06/07XXXXXXXX (10 chiffres)");
      return;
    }

    try {
      // Sauvegarder contact (email, tel)
      if (email !== user?.email || tel !== user?.tel) {
        const resContact = await fetch(`${API}/patients/update-contact`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: user?.id || user?.id_u,
            email,
            tel,
          }),
        });
        if (!resContact.ok) throw new Error("Erreur contact");
      }

      // Sauvegarder profil patients
      const res = await fetch(`${API}/patients/profil`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user?.id || user?.id_u,
          dateOfBirth, gender, bloodType,
          address, city, height, weight,
          emergencyName, emergencyPhone,
        }),
      });
      if (!res.ok) throw new Error();

      const updated = { ...user, email, tel, sexe: gender, date_naissance: dateOfBirth };
      localStorage.setItem("user", JSON.stringify(updated));
      setUser(updated);
      setEditing(false);
      notifsData.addNotification("Profil mis à jour ✅", "Vos informations ont été sauvegardées");
    } catch (err) {
      alert("Erreur lors de la sauvegarde: " + err.message);
    }
  };

  // ── Camera ────────────────────────────────────────────────────
  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraOpen(true); setIsCameraReady(false);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().then(() => setIsCameraReady(true)).catch(console.error);
      }
    } catch { alert("Impossible d'accéder à la caméra"); }
  };
  const capturePhoto = () => {
    if (!isCameraReady || !videoRef.current || !canvasRef.current) return;
    const v = videoRef.current, c = canvasRef.current, ctx = c.getContext("2d");
    c.width = v.videoWidth; c.height = v.videoHeight;
    ctx.translate(c.width, 0); ctx.scale(-1, 1);
    ctx.drawImage(v, 0, 0);
    setPhoto(c.toDataURL("image/jpeg", 0.9));
    closeCamera();
  };
  const closeCamera = () => {
    videoRef.current?.srcObject?.getTracks().forEach(t => t.stop());
    setCameraOpen(false); setIsCameraReady(false);
  };

  const inp = (edit) => ({
    padding: "12px 16px", borderRadius: "8px",
    border: edit ? "1px solid #00a884" : "1px solid #F1F5F9",
    backgroundColor: edit ? "#FFFFFF" : "#F8FAFC",
    fontSize: "14px", color: edit ? "#0F172A" : "#64748B",
    width: "100%", outline: "none", boxSizing: "border-box", transition: "all 0.2s ease",
  });

  const initiales = `${prenom?.[0] || ""}${nom?.[0] || ""}`.toUpperCase();

  if (loading) return (
    <div className="page-wrapper" style={{ backgroundColor: "#F1F5F9", minHeight: "100vh" }}>
      <Header pageTitle="Mon profil" />
      <div style={{ textAlign: "center", padding: "80px", color: "#64748b" }}>⏳ Chargement…</div>
    </div>
  );

  return (
    <div className="page-wrapper" style={{ backgroundColor: "#F1F5F9", minHeight: "100vh" }}>
      <Header pageTitle="Mon profil" />

      {/* Bandeau */}
      <div style={{
        background: "linear-gradient(135deg, #00a884, #0072BC)",
        padding: "28px 40px", display: "flex", alignItems: "center",
        justifyContent: "space-between", borderRadius: "24px", margin: "16px 24px 0",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <button
            onClick={() => navigate(-1)}
            className="back-link"
            style={{ color: "white" }}
          >
            ← Retour
          </button>
          <div style={{
            width: "80px", height: "80px", borderRadius: "50%",
            backgroundColor: "rgba(255,255,255,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "28px", fontWeight: "700", color: "white",
            overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "28px", fontWeight: "700", color: "white",
            overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
          }}>
            {photo
              ? <img src={photo} alt="profil" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : (initiales || "👤")
            }
          </div>
          <div style={{ color: "white" }}>
            <h2 style={{ margin: "0 0 4px 0", fontSize: "22px", fontWeight: 800 }}>
              {prenom} {nom}
            </h2>
            <p style={{ margin: 0, fontSize: "13px", opacity: 0.8 }}>
              Dossier #{String(user?.id || "").padStart(6, "0")}
              {age ? ` · ${age} ans` : ""}
              {gender === "M" ? " · ♂ Homme" : gender === "F" ? " · ♀ Femme" : ""}
            </p>
          </div>
        </div>

        <button
          onClick={() => editing ? handleSave() : setEditing(true)}
          style={{
            backgroundColor: editing ? "#10B981" : "rgba(255,255,255,0.15)",
            border: "1px solid rgba(255,255,255,0.4)", color: "white",
            padding: "12px 24px", borderRadius: "12px", cursor: "pointer",
            fontWeight: 700, fontSize: "14px", display: "flex", alignItems: "center",
            gap: "8px", transition: "all 0.2s ease",
          }}
        >
          {editing ? "💾 Sauvegarder" : "✏️ Modifier Profil"}
        </button>
      </div>

      {/* Contenu */}
      <div style={{ padding: "32px 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "24px", maxWidth: "1200px", margin: "0 auto" }}>

          {/* ── Colonne gauche ── */}
          <div>
            <div style={cardStyle}>
              <h3 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "24px", color: "#0F172A" }}>
                📋 Informations Personnelles
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

                {/* Nom + Prénom (lecture seule) */}
                {[
                  { label: "Prénom", value: prenom, setter: setPrenom, readOnly: true },
                  { label: "Nom",    value: nom,    setter: setNom,    readOnly: true },
                ].map(({ label, value, setter, readOnly }) => (
                  <div key={label}>
                    <label style={labelStyle}>{label}</label>
                    <input value={value} readOnly={readOnly} onChange={e => setter(e.target.value)} style={inp(editing && !readOnly)} />
                  </div>
                ))}

                {/* Email (éditable) */}
                <div>
                  <label style={labelStyle}>Email</label>
                  <input
                    value={email}
                    onChange={e => { setEmail(e.target.value); setEmailError(""); }}
                    readOnly={!editing}
                    style={{ ...inp(editing), borderColor: emailError ? "#ef4444" : (editing ? "#00a884" : "#F1F5F9") }}
                  />
                  {emailError && <p style={{ color: "#ef4444", fontSize: "12px", margin: "4px 0 0" }}>{emailError}</p>}
                </div>

                {/* Téléphone (éditable) */}
                <div>
                  <label style={labelStyle}>Téléphone</label>
                  <input
                    value={tel}
                    onChange={e => { setTel(e.target.value); setTelError(""); }}
                    readOnly={!editing}
                    style={{ ...inp(editing), borderColor: telError ? "#ef4444" : (editing ? "#00a884" : "#F1F5F9") }}
                  />
                  {telError && <p style={{ color: "#ef4444", fontSize: "12px", margin: "4px 0 0" }}>{telError}</p>}
                </div>

                {/* Sexe — sélecteur boutons */}
                <div>
                  <label style={labelStyle}>Sexe</label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    {[
                      { val: "M", label: "♂ Homme", color: "#2563eb" },
                      { val: "F", label: "♀ Femme", color: "#db2777" },
                    ].map(s => (
                      <button
                        key={s.val}
                        onClick={() => editing && setGender(s.val)}
                        style={{
                          flex: 1, padding: "12px", borderRadius: "8px",
                          fontWeight: 700, fontSize: "14px", cursor: editing ? "pointer" : "default",
                          background: gender === s.val ? s.color : "#f8fafc",
                          color:      gender === s.val ? "#fff"   : "#64748b",
                          border:     gender === s.val ? "none"   : "1px solid #e2e8f0",
                          transition: "all 0.2s ease",
                        }}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date de naissance + âge auto */}
                <div>
                  <label style={labelStyle}>
                    Date de naissance
                    {age !== null && (
                      <span style={{ marginLeft: "8px", fontWeight: 400, color: "#64748b", fontSize: "13px" }}>
                        → {age} ans
                      </span>
                    )}
                  </label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={e => setDateOfBirth(e.target.value)}
                    readOnly={!editing}
                    max={new Date().toISOString().split("T")[0]}
                    style={inp(editing)}
                  />
                </div>
              </div>
            </div>

            {/* Contact urgence */}
            <div style={cardStyle}>
              <h3 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "24px", color: "#0F172A" }}>
                🏥 Contact d'Urgence
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={labelStyle}>Nom</label>
                  <input value={emergencyName} onChange={e => setEmergencyName(e.target.value)}
                    placeholder="Nom contact urgence" readOnly={!editing} style={inp(editing)} />
                </div>
                <div>
                  <label style={labelStyle}>Téléphone</label>
                  <input
                    value={emergencyPhone}
                    onChange={e => {
                      setEmergencyPhone(e.target.value);
                      setUrgenceTelError(e.target.value && !RE_PHONE.test(e.target.value)
                        ? "Format : 05/06/07XXXXXXXX (10 chiffres)" : "");
                    }}
                    placeholder="05XXXXXXXX"
                    readOnly={!editing}
                    maxLength={10}
                    style={{ ...inp(editing), borderColor: urgenceTelError ? "#dc2626" : undefined }}
                    type="tel"
                  />
                  {urgenceTelError && <p style={{ color: "#dc2626", fontSize: "12px", marginTop: "4px" }}>{urgenceTelError}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* ── Colonne centre ── */}
          <div>
            {editing && (
              <div style={cardStyle}>
                <h3 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "20px", color: "#0F172A" }}>
                  📷 Photo de profil
                </h3>
                <div style={{ display: "flex", gap: "12px" }}>
                  <label style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "1px solid #e5e7eb", background: "#f8fafc", cursor: "pointer", textAlign: "center", fontWeight: 600, fontSize: "14px", color: "#374151" }}>
                    📁 Choisir fichier
                    <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) setPhoto(URL.createObjectURL(f)); }} style={{ display: "none" }} />
                  </label>
                  <button onClick={openCamera} style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "1px solid #e5e7eb", background: "#f8fafc", cursor: "pointer", fontWeight: 600, fontSize: "14px", color: "#374151" }}>
                    📷 Prendre photo
                  </button>
                </div>
              </div>
            )}

            {/* Consultations récentes */}
            <div style={{ ...cardStyle, minHeight: "300px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "24px", color: "#0F172A" }}>
                📅 Consultations Récentes
              </h3>
              {getPast().slice(0, 3).map(b => (
                <div key={b.id} style={{ padding: "14px 16px", borderRadius: "12px", border: "1px solid #F1F5F9", background: "#F8FAFC", marginBottom: "12px" }}>
                  <div style={{ fontWeight: 600, color: "#0F172A", marginBottom: "4px" }}>{b.doctorName}</div>
                  <div style={{ fontSize: "13px", color: "#64748B" }}>📅 {b.date} — 🕒 {b.slot}</div>
                </div>
              ))}
              {getPast().length === 0 && (
                <div style={{ textAlign: "center", color: "#94a3b8", padding: "40px 0" }}>Aucune consultation</div>
              )}
            </div>
          </div>

          {/* ── Colonne droite ── */}
          <div>
            <div style={cardStyle}>
              <h3 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "24px", color: "#0F172A" }}>
                📍 Adresse
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={labelStyle}>Adresse</label>
                  <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Adresse" readOnly={!editing} style={inp(editing)} />
                </div>
                <div>
                  <label style={labelStyle}>Ville</label>
                  <input value={city} onChange={e => setCity(e.target.value)} placeholder="Ville" readOnly={!editing} style={inp(editing)} />
                </div>
              </div>
            </div>

            <div style={cardStyle}>
              <h3 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "24px", color: "#0F172A" }}>
                🩺 Données Médicales
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Groupe sanguin — select */}
                <div>
                  <label style={labelStyle}>Groupe sanguin</label>
                  {editing ? (
                    <select
                      value={bloodType}
                      onChange={e => setBloodType(e.target.value)}
                      style={{ ...inp(true), cursor: "pointer" }}
                    >
                      <option value="">— Sélectionner —</option>
                      {BLOOD_TYPES.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  ) : (
                    <input value={bloodType || "—"} readOnly style={inp(false)} />
                  )}
                </div>

                {[
                  { label: "Taille (cm)", value: height, set: setHeight, placeholder: "Ex: 175" },
                  { label: "Poids (kg)",  value: weight, set: setWeight, placeholder: "Ex: 70"  },
                ].map(({ label, value, set, placeholder }) => (
                  <div key={label}>
                    <label style={labelStyle}>{label}</label>
                    <input value={value} onChange={e => set(e.target.value)} placeholder={placeholder} readOnly={!editing} style={inp(editing)} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal caméra */}
      {cameraOpen && (
        <div onClick={closeCamera} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: "20px", padding: "28px", width: "420px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>📷 Prendre une photo</h2>
              <button onClick={closeCamera} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>✕</button>
            </div>
            <video ref={videoRef} autoPlay playsInline style={{ width: "100%", borderRadius: "12px" }} />
            <canvas ref={canvasRef} style={{ display: "none" }} />
            <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
              <button onClick={capturePhoto} disabled={!isCameraReady} style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "none", background: isCameraReady ? "#00a884" : "#ccc", color: "white", fontWeight: 700, cursor: isCameraReady ? "pointer" : "not-allowed" }}>
                📸 {isCameraReady ? "Capturer" : "Chargement..."}
              </button>
              <button onClick={closeCamera} style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "1px solid #e5e7eb", background: "white", fontWeight: 600, cursor: "pointer" }}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
