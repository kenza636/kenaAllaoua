import { Link } from "react-router-dom";
import { useState, useContext, useEffect, useRef } from "react";
import { Star, Sparkles, X, AlertTriangle, Activity, Info } from "lucide-react";
import { symptomMap, urgencyMap, analyzeSymptoms } from "./utils/symptomMap.js";
import { NotificationsContext } from "./contexts/NotificationsContext";
import Header from "./Header";
import api from "./services/api";

// ── Star display ──────────────────────────────────────────────────
function Stars({ value = 0, total = 0 }) {
  const full = Math.floor(value), partial = value - full;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"3px", marginTop:"4px" }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ position:"relative", display:"inline-block", lineHeight:1 }}>
          <Star size={13} color="#e2e8f0" fill="#e2e8f0" />
          {i <= full && <span style={{ position:"absolute", inset:0, overflow:"hidden" }}><Star size={13} color="#f59e0b" fill="#f59e0b" /></span>}
          {i === full + 1 && partial > 0 && <span style={{ position:"absolute", inset:0, overflow:"hidden", width:`${partial*100}%` }}><Star size={13} color="#f59e0b" fill="#f59e0b" /></span>}
        </span>
      ))}
      <span style={{ fontSize:"11px", color:"#64748b", marginLeft:"4px" }}>
        {value > 0 ? `${value} (${total})` : "Nouveau"}
      </span>
    </div>
  );
}

// ── Urgency badge ─────────────────────────────────────────────────
const URGENCY_CONFIG = {
  urgent: { label: "Urgent",  bg: "#fef2f2", color: "#991b1b", dot: "#ef4444",  icon: <AlertTriangle size={13} /> },
  moyen:  { label: "Moyen",   bg: "#fefce8", color: "#854d0e", dot: "#f59e0b",  icon: <Activity size={13} /> },
  faible: { label: "Faible",  bg: "#f0fdf4", color: "#166534", dot: "#22c55e",  icon: <Info size={13} /> },
};

function UrgencyBadge({ level }) {
  const cfg = URGENCY_CONFIG[level] || URGENCY_CONFIG.faible;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:"5px", background:cfg.bg, color:cfg.color, borderRadius:"999px", padding:"5px 12px", fontSize:"12px", fontWeight:700 }}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

const ALL_SYMPTOMS = Object.keys(symptomMap);

const DoctorSearch = () => {
  const [doctors,           setDoctors]           = useState([]);
  const [loading,           setLoading]           = useState(true);
  const [error,             setError]             = useState(null);
  const [activeTab,         setActiveTab]         = useState("specialty");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [locationInput,     setLocationInput]     = useState("");
  const [searchName,        setSearchName]        = useState("");
  const [sortBy,            setSortBy]            = useState("default");

  // Multi-symptom
  const [selectedSymptoms,  setSelectedSymptoms]  = useState([]);

  // AI assistant
  const [aiText,            setAiText]            = useState("");
  const [aiResult,          setAiResult]          = useState(null);
  const [aiLoading,         setAiLoading]         = useState(false);
  const aiTimerRef = useRef(null);

  const notifsData = useContext(NotificationsContext);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/medecin");
        setDoctors(data);
      } catch {
        setError("Impossible de charger les médecins. Vérifie que le backend tourne sur le port 5000.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── AI: auto-analyze as user types (debounced 600ms) ─────────────
  useEffect(() => {
    clearTimeout(aiTimerRef.current);
    if (!aiText.trim()) { setAiResult(null); return; }
    setAiLoading(true);
    aiTimerRef.current = setTimeout(() => {
      const result = analyzeSymptoms(aiText);
      setAiResult(result);
      setAiLoading(false);
    }, 600);
    return () => clearTimeout(aiTimerRef.current);
  }, [aiText]);

  // ── Toggle symptom chip ───────────────────────────────────────────
  const toggleSymptom = (s) => {
    setSelectedSymptoms(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  };

  const clearSymptoms = () => setSelectedSymptoms([]);

  // ── Apply AI suggestion ───────────────────────────────────────────
  const applyAiSuggestion = () => {
    if (!aiResult?.specialty) return;
    const matching = ALL_SYMPTOMS.filter(s => symptomMap[s] === aiResult.specialty);
    setSelectedSymptoms(matching.slice(0, 3));
    setActiveTab("symptom");
    setAiText("");
    setAiResult(null);
  };

  // ── Scoring for multi-symptom ─────────────────────────────────────
  const getScore = (doc) => {
    if (!selectedSymptoms.length) return 0;
    return selectedSymptoms.filter(s => symptomMap[s] === doc.specialty).length;
  };

  const specialties = [...new Set(doctors.map(d => d.specialty))].filter(Boolean);

  // ── Filter + sort ─────────────────────────────────────────────────
  let filtered = doctors.filter(d => {
    if (activeTab === "name")     return searchName ? d.name?.toLowerCase().includes(searchName.toLowerCase()) : true;
    if (activeTab === "specialty") return selectedSpecialty ? d.specialty === selectedSpecialty : true;
    if (activeTab === "location") {
      const loc  = locationInput ? d.city?.toLowerCase().includes(locationInput.toLowerCase()) : true;
      const spec = selectedSpecialty ? d.specialty === selectedSpecialty : false;
      return loc && spec;
    }
    if (activeTab === "symptom") {
      if (!selectedSymptoms.length) return true;
      return selectedSymptoms.some(s => symptomMap[s] === d.specialty);
    }
    return true;
  });

  // Sort within symptom tab by matching symptom count, or by rating
  if (activeTab === "symptom" && selectedSymptoms.length > 0) {
    filtered = [...filtered].sort((a, b) => getScore(b) - getScore(a));
  } else if (sortBy === "rating") {
    filtered = [...filtered].sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
  }

  const tabs = [
    { id: "specialty", label: "Spécialité", icon: "🩺" },
    { id: "location",  label: "Localisation", icon: "📍" },
    { id: "symptom",   label: "Symptômes", icon: "😷" },
    { id: "name",      label: "Nom", icon: "🔎" },
  ];

  return (
    <div className="page-wrapper">
      <Header pageTitle="Votre santé en ligne" />

      <nav className="top-actions">
        <Link to="/" className="tab active"><span className="emoji-icon">📅</span> Réserver</Link>
        <Link to="/appointments" className="tab"><span className="emoji-icon">📌</span> Rendez-vous</Link>
        <Link to="/payments" className="tab"><span className="emoji-icon">💳</span> Paiements</Link>
        <Link to="/notifications" className="tab"><span className="emoji-icon">🔔</span> Notifications</Link>
      </nav>

      <div className="card">
        <h1 className="card-title">Sélectionner un médecin</h1>
        <p className="card-subtitle">Recherchez par spécialité, symptômes ou utilisez l'assistant IA</p>

        <div className="tabs">
          {tabs.map(tab => (
            <button key={tab.id} className={`tab ${activeTab === tab.id ? "active" : ""}`} onClick={() => setActiveTab(tab.id)}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ── Specialty tab ── */}
        {activeTab === "specialty" && (
          <>
            <p className="filter-label">Choisissez une spécialité</p>
            <div className="select-wrapper">
              <select value={selectedSpecialty} onChange={e => setSelectedSpecialty(e.target.value)}>
                <option value="">Toutes spécialités</option>
                {specialties.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <span className="select-arrow">⌄</span>
            </div>
          </>
        )}

        {/* ── Location tab ── */}
        {activeTab === "location" && (
          <>
            <p className="filter-label">Spécialité + Ville</p>
            <div className="select-wrapper">
              <select value={selectedSpecialty} onChange={e => setSelectedSpecialty(e.target.value)}>
                <option value="">Choisir spécialité</option>
                {specialties.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <span className="select-arrow">⌄</span>
            </div>
            {selectedSpecialty && (
              <>
                <p className="filter-label">Ville</p>
                <input className="text-input" type="text" placeholder="Béjaïa, Alger, Oran..."
                  value={locationInput} onChange={e => setLocationInput(e.target.value)} />
              </>
            )}
            {!selectedSpecialty && <p className="hint">Choisissez une spécialité d'abord</p>}
          </>
        )}

        {/* ── Symptom tab — chips + AI ── */}
        {activeTab === "symptom" && (
          <>
            {/* AI free-text assistant */}
            <div style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:"14px", padding:"16px", marginBottom:"20px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"10px" }}>
                <Sparkles size={16} color="#8b5cf6" />
                <span style={{ fontWeight:700, fontSize:"14px", color:"#0f172a" }}>Assistant IA</span>
                <span style={{ fontSize:"12px", color:"#64748b" }}>— décrivez vos symptômes en français</span>
              </div>
              <div style={{ position:"relative" }}>
                <input
                  type="text"
                  value={aiText}
                  onChange={e => setAiText(e.target.value)}
                  placeholder="Ex: j'ai mal à la tête et de la fièvre depuis 2 jours…"
                  style={{ width:"100%", boxSizing:"border-box", padding:"12px 36px 12px 14px", border:"1.5px solid #ddd8fe", borderRadius:"10px", fontSize:"14px", fontFamily:"inherit", outline:"none", background:"#fff", color:"#0f172a" }}
                />
                {aiText && (
                  <button onClick={() => { setAiText(""); setAiResult(null); }}
                    style={{ position:"absolute", right:"10px", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#94a3b8", display:"flex" }}>
                    <X size={15} />
                  </button>
                )}
              </div>

              {/* AI result */}
              {aiLoading && (
                <p style={{ margin:"10px 0 0", fontSize:"13px", color:"#8b5cf6" }}>⏳ Analyse en cours…</p>
              )}
              {!aiLoading && aiResult && (
                <div style={{ marginTop:"12px", background:"#fff", border:"1px solid #ddd8fe", borderRadius:"12px", padding:"14px" }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:"8px", flexWrap:"wrap" }}>
                    <div>
                      <p style={{ margin:"0 0 6px", fontSize:"13px", color:"#64748b", fontWeight:600 }}>Spécialité recommandée</p>
                      <p style={{ margin:"0 0 8px", fontSize:"16px", fontWeight:800, color:"#0f172a" }}>🩺 {aiResult.specialty}</p>
                      <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                        <span style={{ fontSize:"12px", color:"#64748b" }}>Niveau d'urgence :</span>
                        <UrgencyBadge level={aiResult.urgency} />
                      </div>
                      {aiResult.urgency === "urgent" && (
                        <p style={{ margin:"8px 0 0", fontSize:"12px", color:"#991b1b", background:"#fef2f2", borderRadius:"8px", padding:"6px 10px" }}>
                          ⚠️ Symptômes possiblement urgents — consultez rapidement ou appelez le 15
                        </p>
                      )}
                    </div>
                    <button
                      onClick={applyAiSuggestion}
                      style={{ padding:"10px 16px", background:"#8b5cf6", color:"#fff", border:"none", borderRadius:"10px", fontWeight:700, fontSize:"13px", cursor:"pointer", whiteSpace:"nowrap" }}
                    >
                      Voir ces médecins →
                    </button>
                  </div>
                </div>
              )}
              {!aiLoading && aiText.trim() && !aiResult && (
                <p style={{ margin:"10px 0 0", fontSize:"13px", color:"#94a3b8" }}>Aucun symptôme reconnu. Essayez les chips ci-dessous.</p>
              )}
            </div>

            {/* Symptom chips */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"10px" }}>
              <p className="filter-label" style={{ margin:0 }}>
                Ou choisissez vos symptômes
                {selectedSymptoms.length > 0 && (
                  <span style={{ marginLeft:"8px", background:"#2563eb", color:"#fff", borderRadius:"999px", padding:"2px 8px", fontSize:"11px", fontWeight:700 }}>
                    {selectedSymptoms.length} sélectionné{selectedSymptoms.length > 1 ? "s" : ""}
                  </span>
                )}
              </p>
              {selectedSymptoms.length > 0 && (
                <button onClick={clearSymptoms}
                  style={{ background:"none", border:"none", color:"#64748b", fontSize:"12px", cursor:"pointer", display:"flex", alignItems:"center", gap:"4px" }}>
                  <X size={12} /> Effacer tout
                </button>
              )}
            </div>

            <div style={{ display:"flex", flexWrap:"wrap", gap:"8px", marginBottom:"8px" }}>
              {ALL_SYMPTOMS.map(s => {
                const active  = selectedSymptoms.includes(s);
                const urgency = urgencyMap[s] || "faible";
                const dotColor = urgency === "urgent" ? "#ef4444" : urgency === "moyen" ? "#f59e0b" : "#22c55e";
                return (
                  <button
                    key={s}
                    onClick={() => toggleSymptom(s)}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: "6px",
                      padding: "6px 12px", borderRadius: "999px", fontSize: "13px", fontWeight: 600,
                      cursor: "pointer", transition: "all 0.15s",
                      background: active ? "#0f172a" : "#f1f5f9",
                      color:      active ? "#fff"     : "#334155",
                      border:     active ? "1.5px solid #0f172a" : "1.5px solid #e2e8f0",
                      boxShadow:  active ? "0 2px 8px rgba(15,23,42,0.2)" : "none",
                    }}
                  >
                    <span style={{ width:"6px", height:"6px", borderRadius:"50%", background: active ? "#fff" : dotColor, flexShrink:0 }} />
                    {s}
                    {active && <X size={11} style={{ marginLeft:"2px" }} />}
                  </button>
                );
              })}
            </div>

            {selectedSymptoms.length > 0 && (
              <div style={{ marginTop:"8px", background:"#eff6ff", borderRadius:"10px", padding:"10px 14px", fontSize:"13px", color:"#1e40af" }}>
                💡 Les médecins correspondant à <strong>{selectedSymptoms.length} symptôme{selectedSymptoms.length > 1 ? "s" : ""}</strong> apparaissent en premier
              </div>
            )}
          </>
        )}

        {/* ── Name tab ── */}
        {activeTab === "name" && (
          <>
            <p className="filter-label">Nom du médecin</p>
            <input className="text-input" type="text" placeholder="Ex: Bellouze, Khoudi..."
              value={searchName} onChange={e => setSearchName(e.target.value)} autoFocus />
          </>
        )}

        {/* Results */}
        {loading && <p className="results-count" style={{ textAlign:"center", padding:"20px" }}>⏳ Chargement des médecins...</p>}
        {error && <div style={{ padding:"20px", background:"#fee", color:"#c33", borderRadius:"8px", margin:"20px 0" }}>❌ {error}</div>}

        {!loading && !error && (
          <>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px" }}>
              <p className="results-count" style={{ margin:0 }}>
                {filtered.length} médecin{filtered.length !== 1 ? "s" : ""} trouvé{filtered.length !== 1 ? "s" : ""}
              </p>
              {activeTab !== "symptom" && (
                <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                  <Star size={14} color="#f59e0b" fill="#f59e0b" />
                  <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                    style={{ border:"1px solid #e2e8f0", borderRadius:"8px", padding:"6px 10px", fontSize:"13px", background:"#fff", cursor:"pointer" }}>
                    <option value="default">Tri par défaut</option>
                    <option value="rating">Mieux notés en premier</option>
                  </select>
                </div>
              )}
            </div>

            <div className="doctors-grid">
              {filtered.length === 0 ? (
                <div className="empty">Aucun médecin trouvé</div>
              ) : (
                filtered.map((doc, idx) => {
                  const score = getScore(doc);
                  const teleconsultEnabled = doc.teleconsult === true || doc.teleconsult === 1 || doc.teleconsult === "1";
                  const teleconsultPrice = Number(doc.tarif ?? doc.price ?? 0);
                  return (
                    <div key={doc.id} className="doctor-card" style={{ position:"relative" }}>
                      {/* Match score badge (symptom tab only) */}
                      {activeTab === "symptom" && score > 0 && (
                        <div style={{ position:"absolute", top:"-8px", right:"12px", background:"#2563eb", color:"#fff", borderRadius:"999px", padding:"3px 10px", fontSize:"11px", fontWeight:700, zIndex:1 }}>
                          {score} symptôme{score > 1 ? "s" : ""} correspondant{score > 1 ? "s" : ""}
                        </div>
                      )}
                      <div className="doctor-left">
                        <img src={doc.img} alt={doc.name} className="doctor-avatar" />
                      </div>
                      <div className="doctor-right">
                        <div className="doctor-info">
                          <span className="doctor-name">{doc.name}</span>
                          <span className="doctor-specialty">{doc.specialty}</span>
                          <Stars value={doc.avg_rating || 0} total={doc.total_reviews || 0} />
                          {(teleconsultEnabled && teleconsultPrice > 0) && (
                            <span className="teleconsult-badge">Téléconsult {teleconsultPrice} DA</span>
                          )}
                        </div>
                        <div className="doctor-meta">
                          <div className="meta-row"><span className="meta-icon">📍</span>{doc.city}</div>
                          <div className="meta-row"><span className="meta-icon">📞</span>{doc.phone}</div>
                          {doc.annees_experience > 0 && (
                            <div className="meta-row"><span className="meta-icon">🏅</span>{doc.annees_experience} ans d'expérience</div>
                          )}
                        </div>
                        <Link to={`/doctor/${doc.id}`} className="btn-disponibilites">Voir disponibilités</Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DoctorSearch;
