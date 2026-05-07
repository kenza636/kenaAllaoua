import { useState, useContext, useEffect, useCallback, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Star, Clock, MapPin, Award, X } from "lucide-react";
import "./DoctorAvailability.css";
import { NotificationsContext } from "./contexts/NotificationsContext";
import UserContext from "./contexts/UserContext";
import Header from "./Header";

// ── Floating toast ────────────────────────────────────────────────
function Toast({ toast, onClose }) {
  const timerRef = useRef(null);
  useEffect(() => {
    if (!toast) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(onClose, 5000);
    return () => clearTimeout(timerRef.current);
  }, [toast]);

  if (!toast) return null;
  const isError   = toast.type === "error";
  const bg        = isError ? "#fef2f2" : "#f0fdf4";
  const color     = isError ? "#991b1b" : "#166534";
  const border    = isError ? "#fecaca" : "#bbf7d0";
  const icon      = isError ? "⚠️" : "✅";

  return (
    <div style={{
      position: "fixed", bottom: "28px", left: "50%", transform: "translateX(-50%)",
      zIndex: 9999, background: bg, color, border: `1.5px solid ${border}`,
      borderRadius: "14px", padding: "14px 20px",
      boxShadow: "0 12px 32px rgba(0,0,0,0.14)",
      display: "flex", alignItems: "center", gap: "10px",
      minWidth: "300px", maxWidth: "480px",
      fontSize: "14px", fontWeight: 600,
      animation: "toastIn 0.3s ease",
    }}>
      <style>{`@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(12px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>
      <span style={{ fontSize: "18px" }}>{icon}</span>
      <span style={{ flex: 1 }}>{toast.message}</span>
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color, padding: "2px", display: "flex" }}>
        <X size={16} />
      </button>
    </div>
  );
}

function StarRow({ value = 0, total = 0, size = 15 }) {
  const full = Math.floor(value), partial = value - full;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ position:"relative", display:"inline-block", lineHeight:1 }}>
          <Star size={size} color="#e2e8f0" fill="#e2e8f0" />
          {i <= full && <span style={{ position:"absolute", inset:0, overflow:"hidden" }}><Star size={size} color="#f59e0b" fill="#f59e0b" /></span>}
          {i === full + 1 && partial > 0 && <span style={{ position:"absolute", inset:0, overflow:"hidden", width:`${partial*100}%` }}><Star size={size} color="#f59e0b" fill="#f59e0b" /></span>}
        </span>
      ))}
      <span style={{ fontSize:"12px", color:"#64748b", marginLeft:"4px" }}>
        {value > 0 ? `${value}/5 (${total} avis)` : "Aucun avis"}
      </span>
    </div>
  );
}

const API_URL = "http://localhost:5000/api";

const DoctorAvailability = () => {
  const notifsData = useContext(NotificationsContext);
  const { id } = useParams();
  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState(null);
  const [creneaux, setCreneaux] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "error") => {
    setToast({ message, type });
  }, []);
  const hideToast = useCallback(() => setToast(null), []);

  const [consultationType, setConsultationType] = useState("presential");
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showConfirmationForm, setShowConfirmationForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");

  const teleconsultEnabled = Boolean(doctor?.teleconsult) && Number(doctor?.price || 0) > 0;

  // Si le médecin ne propose pas la téléconsultation, on bascule automatiquement en présentiel
  useEffect(() => {
    if (!teleconsultEnabled && consultationType === "teleconsult") {
      setConsultationType("presential");
    }
  }, [teleconsultEnabled, consultationType]);

  // ✅ Pré-remplir avec infos user
  useEffect(() => {
    if (user) {
      setContactName(
        `${user.prenom || user.prenom_u || ""} ${user.nom || user.nom_u || ""}`.trim(),
      );
      setContactEmail(user.email || user.email_u || "");
      setContactPhone(user.tel || user.tel_u || "");
    }
  }, [user]);

  // ✅ Charger médecin + créneaux
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [doctorRes, creneauxRes] = await Promise.all([
          fetch(`${API_URL}/medecin/${id}`),
          fetch(`${API_URL}/rdv/disponibilites/${id}`),
        ]);

        if (!doctorRes.ok) throw new Error("Médecin introuvable");
        const doctorData = await doctorRes.json();
        const creneauxData = await creneauxRes.json();

        setDoctor({
          id:                 doctorData.id,
          name:               `Dr. ${doctorData.prenom} ${doctorData.nom}`,
          prenom:             doctorData.prenom,
          nom:                doctorData.nom,
          specialty:          doctorData.specialite || "Médecin",
          city:               doctorData.localisation || "",
          phone:              doctorData.telephone || "",
          price:              doctorData.tarif || 0,
          bio:                doctorData.bio || "",
          annees_experience:  doctorData.annees_experience || 0,
          avg_rating:         doctorData.avg_rating || 0,
          total_reviews:      doctorData.total_reviews || 0,
          teleconsult:        doctorData.teleconsult ?? false,
          languages:          doctorData.languages || "",
          img: `https://randomuser.me/api/portraits/${doctorData.id % 2 === 0 ? "men" : "women"}/${(doctorData.id % 99) + 1}.jpg`,
        });

        setCreneaux(creneauxData);
        setError(null);
      } catch (err) {
        console.error("Erreur:", err);
        setError("Impossible de charger les informations du médecin.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // ✅ Grouper les créneaux par date
  const dates = creneaux.reduce((acc, c) => {
    const dateObj = new Date(c.date);
    const date = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`;
    if (!acc[date]) acc[date] = [];
    acc[date].push(c);
    return acc;
  }, {});

  const dateKeys = Object.keys(dates).sort();

  // ✅ Sélectionner la première date par défaut
  useEffect(() => {
    if (dateKeys.length > 0 && !selectedDate) {
      setSelectedDate(dateKeys[0]);
    }
  }, [dateKeys, selectedDate]);

  const formatDateFull = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatDayShort = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const formatHeure = (heure) => heure?.substring(0, 5) || "";

  const infoText =
    consultationType === "teleconsult"
      ? "Téléconsultation via appel vidéo sécurisé. Le lien vous sera envoyé après la réservation."
      : `Consultation au cabinet médical : ${doctor?.city || ""}`;

  const handleBook = () => {
    if (selectedDate && selectedSlot) {
      setShowConfirmationForm(true);
      setShowPaymentForm(false);
    } else {
      showToast("Veuillez sélectionner une date et un créneau.");
    }
  };

  // ✅ Créer le RDV en BDD
  const createRdv = async () => {
    try {
      const response = await fetch(`${API_URL}/rdv`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_dispo: selectedSlot.id_dispo,
          id_patient: user?.id || user?.id_u,
          id_medecin: doctor.id,
          type_consultation: consultationType === "teleconsult" ? "teleconsultation" : "presentiel",
          motif: "",
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        showToast(data.message || "Erreur lors de la création du rendez-vous");
        return false;
      }
      return true;
    } catch (err) {
      console.error("Erreur création RDV:", err);
      showToast("Erreur serveur — vérifiez votre connexion.");
      return false;
    }
  };

  const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const RE_PHONE = /^(05|06|07)\d{8}$/;

  const handleFinalizeBooking = async () => {
    if (!contactName.trim() || !contactEmail.trim() || !contactPhone.trim()) {
      showToast("Veuillez renseigner votre nom, email et téléphone.");
      return;
    }
    if (!RE_EMAIL.test(contactEmail)) {
      showToast("Adresse email invalide — ex: nom@domaine.com");
      return;
    }
    if (!RE_PHONE.test(contactPhone.replace(/\s/g, ""))) {
      showToast("Téléphone invalide — format algérien requis : 05/06/07XXXXXXXX");
      return;
    }

    // Vérifier que l'utilisateur est connecté
    if (!user?.id && !user?.id_u) {
      showToast("Erreur : utilisateur non connecté. Veuillez vous reconnecter.");
      return;
    }

    if (consultationType === "teleconsult") {
      setShowConfirmationForm(false);
      setShowPaymentForm(true);
      return;
    }

    // Présentiel — créer directement
    const success = await createRdv();
    if (success) {
      notifsData.addNotification(
        "Rdv confirmé ✅",
        `Votre rendez-vous avec ${doctor.name} le ${formatDateFull(selectedDate)} à ${formatHeure(selectedSlot.heure_debut)}`,
      );
      navigate("/appointments");
    }
  };

  const handlePayment = async () => {
    if (!selectedPaymentMethod) {
      showToast("Veuillez choisir une méthode de paiement.");
      return;
    }
    if (
      !cardNumber.trim() ||
      !cardHolder.trim() ||
      !expiryDate.trim() ||
      !cvv.trim()
    ) {
      showToast("Veuillez remplir tous les champs de la carte.");
      return;
    }

    // Vérifier que l'utilisateur est connecté
    if (!user?.id && !user?.id_u) {
      showToast("Erreur : utilisateur non connecté. Veuillez vous reconnecter.");
      return;
    }

    const success = await createRdv();
    if (success) {
      notifsData.addNotification(
        "Rdv confirmé ✅",
        `Téléconsultation avec ${doctor.name} le ${formatDateFull(selectedDate)} à ${formatHeure(selectedSlot.heure_debut)}`,
      );
      navigate("/appointments");
    }
  };

  if (loading)
    return (
      <div className="page-wrapper">
        <Header pageTitle="Chargement..." />
        <div style={{ padding: "40px", textAlign: "center" }}>
          ⏳ Chargement...
        </div>
      </div>
    );

  if (error || !doctor)
    return (
      <div className="page-wrapper">
        <Header pageTitle="Erreur" />
        <div style={{ padding: "40px", textAlign: "center", color: "#ef4444" }}>
          ❌ {error || "Médecin introuvable"}
        </div>
      </div>
    );

  const slotsForSelectedDate = selectedDate ? dates[selectedDate] || [] : [];

  return (
    <div className="page-wrapper availability-page">
      <Toast toast={toast} onClose={hideToast} />
      <Header pageTitle="Votre santé en ligne" />

      <nav className="top-actions">
        <Link to="/" className="tab active">
          <span className="emoji-icon">📅</span>Réserver
        </Link>
        <Link to="/appointments" className="tab">
          <span className="emoji-icon">📌</span>Rendez-vous
        </Link>
        <Link to="/payments" className="tab">
          <span className="emoji-icon">💳</span>Paiements
        </Link>
        <Link to="/notifications" className="tab">
          <span className="emoji-icon">🔔</span>Notifications
        </Link>
      </nav>

      <div className="page-content">
        {!showConfirmationForm && !showPaymentForm && (
          <div className="page-title-block">
            <h1>Choisir un créneau</h1>
            <p>Sélectionnez une date et une heure disponibles</p>
          </div>
        )}

        <div className="availability-card">
          {showConfirmationForm && (
            <div className="card-header-inline">
              <h1>Vos informations</h1>
              <p>Complétez vos informations pour finaliser la réservation</p>
            </div>
          )}
          {!showConfirmationForm && !showPaymentForm && (
            <Link to="/" className="back-link">
              ← Retour à la liste
            </Link>
          )}

          {!showConfirmationForm && !showPaymentForm && (
            <>
              {/* ── Rich doctor profile card ─────────────────────── */}
              <div style={{
                display: "flex", gap: "20px", alignItems: "flex-start",
                padding: "24px", borderRadius: "20px",
                background: "linear-gradient(135deg, #f0f7ff 0%, #eff6ff 100%)",
                border: "1px solid #bfdbfe", marginBottom: "24px",
              }}>
                <img
                  src={doctor.img}
                  alt={doctor.name}
                  style={{ width: "88px", height: "88px", borderRadius: "50%", objectFit: "cover", border: "3px solid #2563eb", flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
                    <div>
                      <h2 style={{ margin: "0 0 2px", fontSize: "20px", fontWeight: 800, color: "#1e3a8a" }}>{doctor.name}</h2>
                      <p style={{ margin: "0 0 6px", fontSize: "14px", color: "#475569", fontWeight: 600 }}>{doctor.specialty}</p>
                      <StarRow value={doctor.avg_rating} total={doctor.total_reviews} />
                    </div>
                    <div className="doctor-price-badge" style={{ flexShrink: 0 }}>
                      {consultationType === "teleconsult" && teleconsultEnabled
                        ? `Téléconsultation ${doctor.price} DA`
                        : "Présentiel"}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "16px", marginTop: "10px", flexWrap: "wrap" }}>
                    {doctor.city && (
                      <span style={{ display:"flex", alignItems:"center", gap:"5px", fontSize:"13px", color:"#64748b" }}>
                        <MapPin size={13} /> {doctor.city}
                      </span>
                    )}
                    {doctor.annees_experience > 0 && (
                      <span style={{ display:"flex", alignItems:"center", gap:"5px", fontSize:"13px", color:"#64748b" }}>
                        <Award size={13} /> {doctor.annees_experience} ans d'expérience
                      </span>
                    )}
                    {doctor.phone && (
                      <span style={{ display:"flex", alignItems:"center", gap:"5px", fontSize:"13px", color:"#64748b" }}>
                        📞 {doctor.phone}
                      </span>
                    )}
                  </div>

                  {doctor.bio && (
                    <p style={{ margin: "10px 0 0", fontSize: "13px", color: "#475569", lineHeight: "1.6" }}>
                      {doctor.bio}
                    </p>
                  )}

                  {doctor.languages && (
                    <div style={{ marginTop: "10px", display: "flex", alignItems: "center", flexWrap: "wrap", gap: "6px" }}>
                      <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 600, marginRight: 4 }}>🗣️ Langues :</span>
                      {doctor.languages.split(",").map(l => l.trim()).filter(Boolean).map(lang => (
                        <span key={lang} style={{
                          background: "#eff6ff", color: "#2563eb",
                          padding: "3px 10px", borderRadius: "999px",
                          fontSize: "12px", fontWeight: 600,
                        }}>
                          {lang}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="consultation-panel">
                <h3>Type de consultation</h3>
                <div className="consultation-options">
                  <button
                    className={`consultation-tab ${consultationType === "presential" ? "active" : ""}`}
                    onClick={() => setConsultationType("presential")}
                  >
                    Présentiel
                  </button>
                  {teleconsultEnabled && (
                    <button
                      className={`consultation-tab ${consultationType === "teleconsult" ? "active" : ""}`}
                      onClick={() => setConsultationType("teleconsult")}
                    >
                      Téléconsultation
                    </button>
                  )}
                </div>
                <p className="consultation-note">{infoText}</p>
              </div>
            </>
          )}

          <div className="availability-container">
            {/* PAIEMENT */}
            {showPaymentForm && (
              <div className="final-confirmation-content">
                <button
                  type="button"
                  className="confirmation-back-link"
                  onClick={() => {
                    setShowPaymentForm(false);
                    setShowConfirmationForm(true);
                  }}
                >
                  ← Retour
                </button>

                <div className="confirmation-card" style={{ maxWidth: "100%" }}>
                  <h2
                    style={{
                      margin: "0 0 8px 0",
                      fontSize: "18px",
                      fontWeight: 700,
                    }}
                  >
                    Paiement sécurisé
                  </h2>
                  <p style={{ margin: "0 0 24px 0", color: "#6b7280" }}>
                    Procédez au paiement sécurisé de votre téléconsultation
                  </p>

                  <div
                    style={{
                      background: "#eff6ff",
                      border: "1px solid #bfdbfe",
                      borderRadius: "12px",
                      padding: "20px",
                      marginBottom: "24px",
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, 1fr)",
                        gap: "16px",
                        fontSize: "13px",
                      }}
                    >
                      <div>
                        <div style={{ color: "#6b7280" }}>Médecin:</div>
                        <div style={{ fontWeight: 600 }}>{doctor.name}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ color: "#6b7280" }}>Date:</div>
                        <div style={{ fontWeight: 600 }}>
                          {formatDateFull(selectedDate)} à{" "}
                          {formatHeure(selectedSlot?.heure_debut)}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: "#6b7280" }}>Type:</div>
                        <div style={{ fontWeight: 600 }}>Téléconsultation</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ color: "#6b7280" }}>Total:</div>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: "16px",
                            color: "#2563eb",
                          }}
                        >
                          {doctor.price} DA
                        </div>
                      </div>
                    </div>
                  </div>

                  <h3
                    style={{
                      margin: "0 0 16px 0",
                      fontSize: "15px",
                      fontWeight: 700,
                    }}
                  >
                    Méthode de paiement
                  </h3>
                  <div
                    style={{
                      display: "grid",
                      gap: "12px",
                      marginBottom: "20px",
                    }}
                  >
                    <div
                      onClick={() => setSelectedPaymentMethod("card")}
                      style={{
                        border:
                          selectedPaymentMethod === "card"
                            ? "2px solid #2563eb"
                            : "2px solid #e5e7eb",
                        borderRadius: "8px",
                        padding: "16px",
                        cursor: "pointer",
                        background: "#fff",
                      }}
                    >
                      💳 Carte bancaire
                    </div>
                    <div
                      onClick={() => setSelectedPaymentMethod("dahabia")}
                      style={{
                        border:
                          selectedPaymentMethod === "dahabia"
                            ? "2px solid #2563eb"
                            : "1px solid #e5e7eb",
                        borderRadius: "8px",
                        padding: "16px",
                        cursor: "pointer",
                      }}
                    >
                      💳 Carte el Dahabia
                    </div>
                  </div>

                  {selectedPaymentMethod && (
                    <div
                      style={{
                        display: "grid",
                        gap: "16px",
                        marginBottom: "24px",
                      }}
                    >
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) =>
                          setCardNumber(
                            e.target.value.replace(/\s/g, "").slice(0, 16),
                          )
                        }
                        placeholder="Numéro de carte"
                        style={{
                          padding: "12px",
                          border: "1px solid #d1d5db",
                          borderRadius: "8px",
                        }}
                      />
                      <input
                        type="text"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        placeholder="Nom du titulaire"
                        style={{
                          padding: "12px",
                          border: "1px solid #d1d5db",
                          borderRadius: "8px",
                        }}
                      />
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "16px",
                        }}
                      >
                        <input
                          type="text"
                          value={expiryDate}
                          onChange={(e) => setExpiryDate(e.target.value)}
                          placeholder="MM/AA"
                          style={{
                            padding: "12px",
                            border: "1px solid #d1d5db",
                            borderRadius: "8px",
                          }}
                        />
                        <input
                          type="text"
                          value={cvv}
                          onChange={(e) => setCvv(e.target.value.slice(0, 3))}
                          placeholder="CVV"
                          style={{
                            padding: "12px",
                            border: "1px solid #d1d5db",
                            borderRadius: "8px",
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handlePayment}
                    style={{
                      width: "100%",
                      padding: "14px",
                      border: "none",
                      borderRadius: "8px",
                      background: "#000",
                      color: "#fff",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    ✓ Payer • {doctor.price} DA
                  </button>
                </div>
              </div>
            )}

            {/* CONFIRMATION INFOS */}
            {showConfirmationForm && !showPaymentForm && (
              <div className="final-confirmation-content">
                <button
                  type="button"
                  className="confirmation-back-link"
                  onClick={() => setShowConfirmationForm(false)}
                >
                  ← Retour
                </button>

                <div className="confirmation-card">
                  <div className="confirmation-card-header">
                    <h3>Confirmer votre rendez-vous</h3>
                    <p>Veuillez vérifier vos informations</p>
                  </div>

                  <div className="confirmation-summary-card">
                    <div className="summary-line">
                      <span className="summary-icon">
                        {consultationType === "presential" ? "📍" : "📹"}
                      </span>
                      <span className="summary-text">
                        {consultationType === "presential"
                          ? "Présentiel"
                          : "Téléconsultation"}
                      </span>
                    </div>
                    <div className="summary-row">
                      <span>Médecin</span> {doctor.name}
                    </div>
                    <div className="summary-row">
                      <span>Spécialité</span> {doctor.specialty}
                    </div>
                    <div className="summary-row">
                      <span>Lieu</span>{" "}
                      {consultationType === "presential"
                        ? doctor.city
                        : "À distance"}
                    </div>
                    <div className="summary-row">
                      <span>Date</span> {formatDateFull(selectedDate)}
                    </div>
                    <div className="summary-row">
                      <span>Heure</span>{" "}
                      {formatHeure(selectedSlot?.heure_debut)}
                    </div>
                  </div>

                  <div className="confirmation-inputs">
                    <div className="field-group">
                      <div className="field-label">
                        <span className="label-icon">👤</span> Nom complet
                      </div>
                      <input
                        type="text"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                      />
                    </div>
                    <div className="field-group">
                      <div className="field-label">
                        <span className="label-icon">✉️</span> Email
                      </div>
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                      />
                    </div>
                    <div className="field-group">
                      <div className="field-label">
                        <span className="label-icon">📞</span> Téléphone
                      </div>
                      <input
                        type="tel"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <button
                    className="confirm-btn finalize-confirm-btn"
                    onClick={handleFinalizeBooking}
                    type="button"
                    disabled={
                      !contactName.trim() ||
                      !contactEmail.trim() ||
                      !contactPhone.trim()
                    }
                  >
                    {consultationType === "teleconsult"
                      ? "Continuer vers le paiement"
                      : "Confirmer le rendez-vous"}
                  </button>
                </div>
              </div>
            )}

            {/* SÉLECTION CRÉNEAU */}
            {!showPaymentForm && !showConfirmationForm && (
              <div className="availability-grid">
                <div className="dates-section">
                  <div className="section-header">📅 Sélectionnez une date</div>
                  <div className="dates-list">
                    {dateKeys.length === 0 ? (
                      <div
                        style={{
                          padding: "20px",
                          color: "#94a3b8",
                          textAlign: "center",
                        }}
                      >
                        Aucun créneau disponible
                      </div>
                    ) : (
                      dateKeys.map((dateKey) => {
                        const dispoCount = dates[dateKey].filter(
                          (c) => !c.reserve,
                        ).length;
                        return (
                          <div
                            key={dateKey}
                            className={`date-card ${selectedDate === dateKey ? "active" : ""}`}
                            onClick={() => {
                              setSelectedDate(dateKey);
                              setSelectedSlot(null);
                            }}
                          >
                            <span className="date-day">
                              {formatDayShort(dateKey)}
                            </span>
                            <span className="date-count">
                              {dispoCount} créneaux
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="slots-section">
                  <div className="section-header">🕒 Créneaux disponibles</div>
                  <div className="slots-container">
                    <div className="slots-panel">
                      <div className="time-slots-grid">
                        {slotsForSelectedDate.map((slot) => {
                          const isReserved =
                            slot.reserve === 1 || slot.statut !== "libre";
                          const isSelected =
                            selectedSlot?.id_dispo === slot.id_dispo;
                          return (
                            <button
                              key={slot.id_dispo}
                              type="button"
                              disabled={isReserved}
                              className={`time-slot ${isSelected ? "time-slot-active" : ""}`}
                              onClick={() =>
                                !isReserved && setSelectedSlot(slot)
                              }
                              style={
                                isReserved
                                  ? {
                                      opacity: 0.4,
                                      cursor: "not-allowed",
                                      background: "#f1f5f9",
                                      color: "#94a3b8",
                                      textDecoration: "line-through",
                                    }
                                  : {}
                              }
                              title={
                                isReserved
                                  ? "Créneau déjà réservé"
                                  : "Cliquer pour sélectionner"
                              }
                            >
                              {formatHeure(slot.heure_debut)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    {selectedSlot && (
                      <div className="light-blue-card">
                        <div className="confirmation-content">
                          <div className="confirmation-icon-type">
                            {consultationType === "presential"
                              ? "🏥 Présentiel"
                              : "📹 Téléconsultation"}
                          </div>
                          <div className="confirmation-datetime">
                            {formatDateFull(selectedDate)} à{" "}
                            {formatHeure(selectedSlot.heure_debut)}
                          </div>
                        </div>
                        <button
                          className="confirm-btn"
                          onClick={handleBook}
                          type="button"
                        >
                          Confirmer
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorAvailability;
