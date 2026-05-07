import React, { useState, useRef, useEffect } from "react";
import { Phone, Mail, MapPin, Briefcase, Camera, Save, Edit2 } from "lucide-react";
import { useUser, getInitiales } from "../contexts/UserContext";

const API = "http://localhost:5000/api";

// JS getDay() → schedule array index  (0=Sun→6, 1=Mon→0, … 6=Sat→5)
const JS_DAY_TO_IDX = [6, 0, 1, 2, 3, 4, 5]; // Sunday=6, Monday=0, …

const DAYS_DEFAULT = [
  { day: "Lundi",    active: true,  start: "09:00", end: "17:00", hasBreak: true,  breakStart: "12:00", breakEnd: "13:00" },
  { day: "Mardi",    active: true,  start: "09:00", end: "17:00", hasBreak: true,  breakStart: "12:00", breakEnd: "13:00" },
  { day: "Mercredi", active: true,  start: "09:00", end: "17:00", hasBreak: true,  breakStart: "12:00", breakEnd: "13:00" },
  { day: "Jeudi",    active: true,  start: "09:00", end: "17:00", hasBreak: true,  breakStart: "12:00", breakEnd: "13:00" },
  { day: "Vendredi", active: true,  start: "09:00", end: "17:00", hasBreak: true,  breakStart: "12:00", breakEnd: "13:00" },
  { day: "Samedi",   active: true,  start: "09:00", end: "12:00", hasBreak: false, breakStart: "",      breakEnd: ""      },
  { day: "Dimanche", active: false, start: "09:00", end: "17:00", hasBreak: false, breakStart: "",      breakEnd: ""      },
];

function toMinutes(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}
function fromMinutes(total) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function Profile() {
  const { user } = useUser();
  const userId = user?.id || user?.id_u;
  const scheduleStorageKey = userId ? `medecin-schedule-${userId}` : null;

  // ── Profile fields ──────────────────────────────────────────────
  const LANG_OPTIONS = ["Français", "Arabe", "Anglais", "Kabyle", "Espagnol", "Allemand", "Tamazight"];

  const [isEditing, setIsEditing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [doctor, setDoctor] = useState({
    name:        `Dr. ${user.prenom} ${user.nom}`,
    specialty:   user.specialite,
    email:       user.email,
    phone:       user.telephone,
    address:     user.adresse,
    teleconsult: user.teleconsult !== undefined ? user.teleconsult : false,
    tarif:       user.tarif ?? "",
    languages:   user.languages || "Français, Arabe",
    photo:       null,
  });

  const selectedLangs = doctor.languages
    ? doctor.languages.split(",").map(l => l.trim()).filter(Boolean)
    : [];

  const toggleLang = (lang) => {
    const current = selectedLangs;
    const next = current.includes(lang)
      ? current.filter(l => l !== lang)
      : [...current, lang];
    setDoctor(d => ({ ...d, languages: next.join(", ") }));
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await fetch(`${API}/medecin/profile`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: userId,
          languages: doctor.languages,
          bio: doctor.bio,
          localisation: doctor.address,
          teleconsult: doctor.teleconsult,
          tarif: doctor.tarif !== "" && doctor.tarif !== null && doctor.tarif !== undefined
            ? Number(doctor.tarif)
            : null,
          annees_experience: doctor.annees_experience,
          schedule,
        }),
      });
    } catch { /* non-blocking */ }
    setSavingProfile(false);
    setIsEditing(false);
  };

  const initiales      = getInitiales(user.prenom, user.nom);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);

  // ── Weekly schedule ─────────────────────────────────────────────
  const localScheduleLoaded = useRef(false);
  const [schedule, setSchedule] = useState(() => {
    if (typeof window === "undefined" || !scheduleStorageKey) return DAYS_DEFAULT;
    try {
      const stored = localStorage.getItem(scheduleStorageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length === DAYS_DEFAULT.length) {
          localScheduleLoaded.current = true;
          return parsed;
        }
      }
    } catch {
      // ignore invalid storage
    }
    return DAYS_DEFAULT;
  });
  const [generating, setGenerating] = useState(false);
  const [generateMsg, setGenerateMsg] = useState(null);

  useEffect(() => {
    if (!userId) return;
    const loadProfile = async () => {
      try {
        const res = await fetch(`${API}/medecin/profile/${userId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.languages) {
          setDoctor(d => ({ ...d, languages: data.languages }));
        }
        if (data.adresse) {
          setDoctor(d => ({ ...d, address: data.adresse }));
        }
        if (data.bio) {
          setDoctor(d => ({ ...d, bio: data.bio }));
        }
        if (data.localisation) {
          setDoctor(d => ({ ...d, address: data.localisation }));
        }
        if (data.tarif !== undefined && data.tarif !== null) {
          setDoctor(d => ({ ...d, tarif: data.tarif }));
        }
        if (data.teleconsult !== undefined && data.teleconsult !== null) {
          setDoctor(d => ({ ...d, teleconsult: Boolean(data.teleconsult) }));
        }
        if (data.telephone) {
          setDoctor(d => ({ ...d, phone: data.telephone }));
        }
        if (data.annees_experience) {
          setDoctor(d => ({ ...d, annees_experience: data.annees_experience }));
        }

        if (!localScheduleLoaded.current) {
          if (Array.isArray(data.schedule) && data.schedule.length === DAYS_DEFAULT.length) {
            setSchedule(data.schedule);
          } else if (typeof data.schedule === "string") {
            try {
              const parsedSched = JSON.parse(data.schedule);
              if (Array.isArray(parsedSched) && parsedSched.length === DAYS_DEFAULT.length) {
                setSchedule(parsedSched);
              }
            } catch {
              // ignore invalid schedule payload
            }
          }
        }
      } catch {
        // ignore load failure
      }
    };
    loadProfile();
  }, [userId]);

  useEffect(() => {
    if (!scheduleStorageKey || typeof window === "undefined") return;
    try {
      localStorage.setItem(scheduleStorageKey, JSON.stringify(schedule));
    } catch {
      // ignore storage write failure
    }
  }, [schedule, scheduleStorageKey]);

  // ── Camera logic ────────────────────────────────────────────────
  useEffect(() => {
    if (!isCameraOpen || !videoRef.current) return;
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => { videoRef.current.srcObject = stream; videoRef.current.play(); })
      .catch(err   => { alert("Impossible d'accéder à la caméra : " + err.message); setIsCameraOpen(false); });
  }, [isCameraOpen]);

  const capturePhoto = () => {
    if (!canvasRef.current || !videoRef.current) return;
    canvasRef.current.getContext("2d").drawImage(videoRef.current, 0, 0, 150, 150);
    setPhotoPreview(canvasRef.current.toDataURL("image/png"));
    videoRef.current.srcObject?.getTracks().forEach(t => t.stop());
    setIsCameraOpen(false);
  };

  // ── Schedule helpers ────────────────────────────────────────────
  const saveScheduleToServer = async (nextSchedule) => {
    if (!userId) return;
    try {
      await fetch(`${API}/medecin/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, schedule: nextSchedule }),
      });
    } catch {
      // ignore save failure for now
    }
  };

  const updateDay = (index, field, value) => {
    setSchedule(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      if (scheduleStorageKey && typeof window !== "undefined") {
        try {
          localStorage.setItem(scheduleStorageKey, JSON.stringify(next));
          localScheduleLoaded.current = true;
        } catch {
          // ignore storage failure
        }
      }
      saveScheduleToServer(next);
      return next;
    });
  };

  // Generate 30-min slots for next 30 days based on weekly template
  const generateSlots = async () => {
    const idMedecin = user.id_u || user.id;
    if (!idMedecin) return;

    const creneaux = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let offset = 0; offset < 30; offset++) {
      const date = new Date(today);
      date.setDate(today.getDate() + offset);

      const dayIdx = JS_DAY_TO_IDX[date.getDay()]; // 0=Lundi … 6=Dimanche
      const sched  = schedule[dayIdx];
      if (!sched.active) continue;

      const startMin = toMinutes(sched.start);
      const endMin   = toMinutes(sched.end);
      if (startMin >= endMin) continue;

      const brkStart = sched.hasBreak && sched.breakStart ? toMinutes(sched.breakStart) : -1;
      const brkEnd   = sched.hasBreak && sched.breakEnd   ? toMinutes(sched.breakEnd)   : -1;

      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

      for (let t = startMin; t + 30 <= endMin; t += 30) {
        if (brkStart >= 0 && brkEnd > brkStart && t >= brkStart && t < brkEnd) continue;
        creneaux.push({
          date: dateStr,
          heure_debut: `${fromMinutes(t)}:00`,
          heure_fin:   `${fromMinutes(t + 30)}:00`,
        });
      }
    }

    if (creneaux.length === 0) {
      setGenerateMsg({ type: "error", text: "Aucun créneau à générer avec ces paramètres." });
      setTimeout(() => setGenerateMsg(null), 4000);
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch(`${API}/rdv/disponibilites/bulk`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_medecin: idMedecin, creneaux }),
      });
      const data = await res.json();
      setGenerateMsg({ type: "success", text: `✅ ${data.message || `${creneaux.length} créneaux générés pour les 30 prochains jours`}` });
    } catch (err) {
      setGenerateMsg({ type: "error", text: `❌ Erreur : ${err.message}` });
    } finally {
      setGenerating(false);
      setTimeout(() => setGenerateMsg(null), 5000);
    }
  };

  // ── Shared styles ───────────────────────────────────────────────
  const inputStyle = {
    padding: "12px 16px", borderRadius: "8px",
    border: isEditing ? "1px solid #2563EB" : "1px solid #F1F5F9",
    backgroundColor: isEditing ? "#FFFFFF" : "#F8FAFC",
    fontSize: "14px", color: isEditing ? "#0F172A" : "#64748B",
    width: "100%", outline: "none", transition: "all 0.2s ease",
  };
  const labelStyle = { fontWeight: "600", fontSize: "14px", marginBottom: "8px", display: "block", color: "#0F172A" };
  const cardStyle  = { backgroundColor: "#FFFFFF", borderRadius: "24px", padding: "32px", boxShadow: "0 24px 48px -20px rgba(15,23,42,0.25)", marginBottom: "24px" };
  const timeInp    = { padding: "6px 10px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "13px", width: "90px" };

  return (
    <div style={{ backgroundColor: "#F1F5F9", minHeight: "100vh", margin: "-32px", padding: "60px 80px" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "32px", fontWeight: "800", color: "#0F172A", marginBottom: "4px" }}>Mon Profil</h1>
        <p style={{ color: "#64748B", marginBottom: "32px" }}>Gérez vos informations professionnelles</p>

        {/* ── Card: header ── */}
        <div style={{ ...cardStyle, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <div style={{ position: "relative" }}>
              <div style={{
                width: "110px", height: "110px", borderRadius: "50%",
                backgroundColor: "#2563EB", color: "#fff", fontSize: "40px", fontWeight: "700",
                display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
                boxShadow: "0 2px 4px rgba(37,99,235,0.1), 0 8px 24px -4px rgba(37,99,235,0.35)",
              }}>
                {photoPreview ? <img src={photoPreview} alt="Profil" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initiales}
              </div>

              {isEditing && !isCameraOpen && (
                <div style={{ position: "absolute", bottom: 0, right: 0, display: "flex", gap: "4px" }}>
                  <input type="file" accept="image/*" style={{ display: "none" }} id="photoInput"
                    onChange={e => { const f = e.target.files[0]; if (f) { setDoctor(d => ({ ...d, photo: f })); setPhotoPreview(URL.createObjectURL(f)); } }}
                  />
                  <label htmlFor="photoInput" style={{ backgroundColor: "#000", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", border: "3px solid #fff", cursor: "pointer" }}>
                    <Camera size={16} color="#fff" />
                  </label>
                  <button onClick={() => setIsCameraOpen(true)} style={{ backgroundColor: "#000", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", border: "3px solid #fff", cursor: "pointer" }}>
                    📷
                  </button>
                </div>
              )}

              {isCameraOpen && (
                <div style={{ marginTop: "8px" }}>
                  <video ref={videoRef} width="150" height="150" style={{ borderRadius: "16px" }} />
                  <br />
                  <button onClick={capturePhoto} style={{ marginTop: "4px" }}>Capturer</button>
                </div>
              )}
              <canvas ref={canvasRef} width="150" height="150" style={{ display: "none" }} />
            </div>

            <div>
              <h2 style={{ fontSize: "24px", fontWeight: "800", marginBottom: "4px", color: "#0F172A" }}>{doctor.name}</h2>
              <p style={{ color: "#64748B", fontSize: "16px", marginBottom: "16px" }}>{doctor.specialty}</p>
              <div style={{ display: "grid", gridTemplateColumns: "auto auto", gap: "12px 24px", color: "#64748B", fontSize: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><Mail     size={16} /> {doctor.email}</div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><Phone    size={16} /> {doctor.phone}</div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><MapPin   size={16} /> {doctor.address}</div>
              </div>
            </div>
          </div>

          <button
            onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
            disabled={savingProfile}
            style={{
              backgroundColor: isEditing ? "#10B981" : "#0F172A", color: "#fff",
              padding: "12px 24px", borderRadius: "12px", fontWeight: "600",
              border: "none", cursor: savingProfile ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: "8px",
              boxShadow: "0 4px 12px -2px rgba(15,23,42,0.2)",
              opacity: savingProfile ? .7 : 1,
            }}
          >
            {isEditing
              ? savingProfile ? <><Save size={18} /> Enregistrement…</> : <><Save size={18} /> Enregistrer</>
              : <><Edit2 size={18} /> Modifier le profil</>
            }
          </button>
        </div>

        {/* ── Card: personal info ── */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: "18px", fontWeight: "800", marginBottom: "24px", color: "#0F172A" }}>Informations personnelles</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            {[
              { label: "Nom complet",                        name: "name",      col: 1 },
              { label: "Spécialité",                         name: "specialty", col: 1 },
              { label: "Email",                              name: "email",     col: 1 },
              { label: "Téléphone",                          name: "phone",     col: 1 },
              { label: "Adresse",                            name: "address",   col: 2 },
              ].map(({ label, name, col }) => (
              <div key={name} style={col === 2 ? { gridColumn: "span 2" } : {}}>
                <label style={labelStyle}>{label}</label>
                <input
                  name={name}
                  type={name === "tarif" ? "number" : "text"}
                  min={name === "tarif" ? "0" : undefined}
                  step={name === "tarif" ? "10" : undefined}
                  style={inputStyle}
                  value={doctor[name] || ""}
                  onChange={e => setDoctor(d => ({ ...d, [e.target.name]: e.target.value }))}
                  readOnly={!isEditing}
                  disabled={name === "tarif" && !doctor.teleconsult}
                />
                {name === "tarif" && !doctor.teleconsult && (
                  <div style={{ marginTop: "6px", fontSize: "12px", color: "#64748b" }}>
                    Désactivez la téléconsultation pour masquer ce tarif.
                  </div>
                )}
              </div>
            ))}

            <div style={{ gridColumn: "span 2", display: "flex", alignItems: "center", gap: "12px", marginTop: "2px" }}>
              <input
                id="teleconsultToggle"
                type="checkbox"
                checked={doctor.teleconsult}
                disabled={!isEditing}
                onChange={e => setDoctor(d => ({ ...d, teleconsult: e.target.checked }))}
                style={{ width: "18px", height: "18px", accentColor: "#2563EB" }}
              />
              <label htmlFor="teleconsultToggle" style={{ margin: 0, fontWeight: 700, fontSize: "14px", color: "#0F172A" }}>
                Proposer la téléconsultation
              </label>
            </div>

            {doctor.teleconsult && (
              <div style={{ gridColumn: "span 2" }}>
                <label style={labelStyle}>Tarif téléconsultation (DZD)</label>
                <input
                  name="tarif"
                  type="number"
                  min="0"
                  step="10"
                  style={inputStyle}
                  value={doctor.tarif || ""}
                  onChange={e => setDoctor(d => ({ ...d, tarif: e.target.value }))}
                  readOnly={!isEditing}
                />
              </div>
            )}
            {!doctor.teleconsult && (
              <div style={{ gridColumn: "span 2", fontSize: "13px", color: "#64748b", marginTop: "8px" }}>
                Le tarif de téléconsultation sera disponible une fois activée.
              </div>
            )}

            {/* Languages multi-select */}
            <div>
              <label style={labelStyle}>Langues parlées</label>
              {isEditing ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", padding: "10px 0" }}>
                  {LANG_OPTIONS.map(lang => {
                    const active = selectedLangs.includes(lang);
                    return (
                      <button key={lang} type="button" onClick={() => toggleLang(lang)} style={{
                        padding: "6px 14px", borderRadius: "999px", fontSize: "13px", fontWeight: 600,
                        border: active ? "1.5px solid #0072BC" : "1.5px solid #e2e8f0",
                        background: active ? "#eff6ff" : "#f8fafc",
                        color: active ? "#0072BC" : "#64748b",
                        cursor: "pointer", transition: "all .15s",
                      }}>
                        {active ? "✓ " : ""}{lang}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", paddingTop: "6px" }}>
                  {selectedLangs.length === 0
                    ? <span style={{ color: "#94a3b8", fontSize: 14 }}>—</span>
                    : selectedLangs.map(lang => (
                        <span key={lang} style={{
                          background: "#eff6ff", color: "#0072BC",
                          padding: "4px 12px", borderRadius: "999px",
                          fontSize: "13px", fontWeight: 600,
                        }}>
                          {lang}
                        </span>
                      ))
                  }
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Card: weekly schedule ── */}
        <div style={{ ...cardStyle, marginBottom: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
            <div>
              <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0F172A", margin: 0 }}>Horaires de consultation</h3>
              <p style={{ color: "#64748B", fontSize: "13px", marginTop: "4px" }}>
                Définissez votre planning type, puis générez automatiquement vos créneaux pour les 30 prochains jours.
              </p>
            </div>
            <button
              onClick={generateSlots}
              disabled={generating}
              style={{
                backgroundColor: generating ? "#94a3b8" : "#2563EB", color: "#fff",
                padding: "10px 20px", borderRadius: "12px", fontWeight: "600",
                border: "none", cursor: generating ? "not-allowed" : "pointer",
                fontSize: "14px", whiteSpace: "nowrap",
              }}
            >
              {generating ? "⏳ Génération…" : "⚡ Regénérer les créneaux (30 j)"}
            </button>
          </div>

          {generateMsg && (
            <div style={{
              padding: "12px 16px", borderRadius: "10px", marginBottom: "16px", fontWeight: 600,
              background: generateMsg.type === "error" ? "#FEE2E2" : "#DCFCE7",
              color:      generateMsg.type === "error" ? "#991B1B" : "#166534",
            }}>
              {generateMsg.text}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {schedule.map((item, idx) => (
              <div
                key={item.day}
                style={{
                  display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px",
                  padding: "14px 20px", borderRadius: "14px",
                  background: item.active ? "#F0F9FF" : "#F8FAFC",
                  border: `1px solid ${item.active ? "#BAE6FD" : "#E2E8F0"}`,
                  opacity: item.active ? 1 : 0.65,
                }}
              >
                {/* Toggle */}
                <button
                  onClick={() => updateDay(idx, "active", !item.active)}
                  title={item.active ? "Fermer ce jour" : "Ouvrir ce jour"}
                  style={{
                    width: "36px", height: "20px", borderRadius: "999px", border: "none",
                    background: item.active ? "#2563EB" : "#CBD5E1", cursor: "pointer",
                    position: "relative", flexShrink: 0, transition: "background 0.2s",
                  }}
                >
                  <span style={{
                    position: "absolute", top: "2px",
                    left: item.active ? "18px" : "2px",
                    width: "16px", height: "16px",
                    borderRadius: "50%", background: "#fff",
                    transition: "left 0.2s",
                  }} />
                </button>

                {/* Day name */}
                <span style={{ fontWeight: "700", color: "#0F172A", width: "90px", flexShrink: 0 }}>
                  {item.day}
                </span>

                {item.active ? (
                  <>
                    {/* Start / End */}
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <input type="time" value={item.start} style={timeInp} onChange={e => updateDay(idx, "start", e.target.value)} />
                      <span style={{ color: "#64748B", fontSize: "13px" }}>→</span>
                      <input type="time" value={item.end}   style={timeInp} onChange={e => updateDay(idx, "end",   e.target.value)} />
                    </div>

                    {/* Break toggle */}
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#64748B", cursor: "pointer" }}>
                      <input
                        type="checkbox" checked={item.hasBreak}
                        onChange={e => updateDay(idx, "hasBreak", e.target.checked)}
                        style={{ accentColor: "#2563EB" }}
                      />
                      Pause
                    </label>

                    {item.hasBreak && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <input type="time" value={item.breakStart} style={timeInp} onChange={e => updateDay(idx, "breakStart", e.target.value)} />
                        <span style={{ color: "#64748B", fontSize: "13px" }}>→</span>
                        <input type="time" value={item.breakEnd}   style={timeInp} onChange={e => updateDay(idx, "breakEnd",   e.target.value)} />
                      </div>
                    )}
                  </>
                ) : (
                  <span style={{ color: "#94a3b8", fontSize: "14px", fontStyle: "italic" }}>Fermé</span>
                )}
              </div>
            ))}
          </div>

          <p style={{ marginTop: "16px", fontSize: "12px", color: "#94a3b8" }}>
            💡 Régénérer efface tous les créneaux libres à venir et recrée le planning selon ce modèle. Les jours désactivés ne génèrent aucun créneau. Les créneaux déjà réservés par des patients sont conservés.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Profile;