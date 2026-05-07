import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Users, Clock, Video, Plus, Phone } from "lucide-react";
import { useUser } from "../contexts/UserContext";
import { useAppointments } from "../hooks/useAppointments";
import { canJoin, toLocalDateStr, getStatusLabel, formatHeure, formatDate } from "../utils/rdv";
import { getInitiales } from "../contexts/UserContext";
import NewRdvModal from "./NewRdvModal";

function Dashboard() {
  const navigate  = useNavigate();
  const { user }  = useUser();
  const { appointments, loading, fetchRdv, doctorId, todayAppts, upcomingCount, teleconsultCount } =
    useAppointments();

  const [activeFilter, setActiveFilter] = useState("Tous");
  const [searchTerm,   setSearchTerm]   = useState("");
  const [showModal,    setShowModal]    = useState(false);
  const [followupAppt, setFollowupAppt] = useState(null);
  const [hoveredStat,  setHoveredStat]  = useState(null);
  const [cancelAppt,   setCancelAppt]   = useState(null); // appt being cancelled
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling,   setCancelling]   = useState(false);

  const CANCEL_REASONS = [
    "Urgence médicale",
    "Problème personnel",
    "Conflit d'horaire",
    "Problème technique",
  ];

  const colorConfig = {
    blue:   { bg: "#EFF6FF", text: "#2563eb", shadow: "rgba(37,99,235,0.15)"   },
    green:  { bg: "#f0fdf4", text: "#16a34a", shadow: "rgba(22,163,74,0.15)"   },
    orange: { bg: "#fff7ed", text: "#ea580c", shadow: "rgba(234,88,12,0.15)"   },
    purple: { bg: "#faf5ff", text: "#9333ea", shadow: "rgba(147,51,234,0.15)"  },
  };

  const today         = new Date();
  const todayStr      = toLocalDateStr(today);
  const formattedDate = today.toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    timeZone: "Africa/Algiers",
  });
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
  const day   = today.toLocaleDateString("fr-FR", { day: "numeric", timeZone: "Africa/Algiers" });
  const month = today.toLocaleDateString("fr-FR", { month: "short",  timeZone: "Africa/Algiers" });

  // ── Stats — chacune est un filtre cliquable ──────────────────────
  const stats = [
    {
      label: "Rendez-vous aujourd'hui", value: todayAppts.length,
      icon: <Calendar size={22} />, color: "blue", isDate: true,
      filter: "Aujourd'hui",
    },
    {
      label: "Total rendez-vous", value: appointments.length,
      icon: <Users size={22} />, color: "green",
      filter: "Tous",
    },
    {
      label: "À venir", value: upcomingCount,
      icon: <Clock size={22} />, color: "orange",
      filter: "À venir",
    },
    {
      label: "Téléconsultations", value: teleconsultCount,
      icon: <Video size={22} />, color: "purple",
      filter: "Téléconsultations",
    },
  ];

  // ── Filtrage ─────────────────────────────────────────────────────
  const filteredAppointments = appointments.filter((appt) => {
    const fullName      = `${appt.patient_prenom} ${appt.patient_nom}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase())
      || (appt.patient_tel || "").includes(searchTerm);
    const apptDateStr = toLocalDateStr(appt.date);

    if (activeFilter === "Aujourd'hui")       return matchesSearch && apptDateStr === todayStr;
    if (activeFilter === "À venir")           return matchesSearch && apptDateStr > todayStr;
    if (activeFilter === "Téléconsultations") return matchesSearch && appt.type_consultation === "teleconsultation";
    return matchesSearch;
  }).sort((a, b) => {
    const toMs = (appt) => {
      const d = new Date(appt.date);
      const [h, m] = (appt.heure_debut || "00:00").split(":").map(Number);
      d.setHours(h, m, 0, 0);
      return d.getTime();
    };
    return toMs(a) - toMs(b);
  });

  const sectionTitle = {
    "Tous":              "Tous les rendez-vous",
    "Aujourd'hui":       "Rendez-vous du jour",
    "À venir":           "Rendez-vous à venir",
    "Téléconsultations": "Téléconsultations",
  }[activeFilter];

  // ── Cancel with reason ──────────────────────────────────────────
  const handleCancelConfirm = async () => {
    if (!cancelAppt || !cancelReason) return;
    setCancelling(true);
    try {
      const res = await fetch(`http://localhost:5000/api/rdv/${cancelAppt.id_rdv}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "medecin", reason: cancelReason }),
      });
      if (res.ok) {
        fetchRdv();
        setCancelAppt(null);
        setCancelReason("");
      }
    } catch { /* ignore */ }
    setCancelling(false);
  };

  // ── Téléconsultation ─────────────────────────────────────────────
  const handleJoinCall = async (appt) => {
    try {
      const res = await fetch("http://localhost:5000/api/teleconsultation/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: appt.id_rdv,
          patientId:     appt.id_patient,
          patientName:   `${appt.patient_prenom} ${appt.patient_nom}`,
          doctorId,
          doctorName:    `Dr. ${user?.prenom} ${user?.nom}`,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      navigate(`/teleconsultation/${data.roomId}`);
    } catch {
      navigate(`/teleconsultation/mediko-local-${appt.id_rdv}-${Date.now()}`);
    }
  };

  const statut     = user?.statut || "approuvé";
  const isPending  = statut === "en_attente";
  const isRejected = statut === "rejeté";

  return (
    <div className="main-content-bg">

      {/* ── Verification banner ─────────────────────────────────── */}
      {isPending && (
        <div style={{
          display: "flex", alignItems: "flex-start", gap: "14px",
          background: "#fffbeb", border: "1px solid #fde68a",
          borderRadius: "14px", padding: "16px 20px", marginBottom: "20px",
        }}>
          <span style={{ fontSize: "24px", flexShrink: 0 }}>⏳</span>
          <div>
            <p style={{ margin: "0 0 4px", fontWeight: "700", color: "#92400e", fontSize: "15px" }}>
              Compte en attente d'approbation
            </p>
            <p style={{ margin: 0, color: "#78350f", fontSize: "13px" }}>
              Votre dossier est en cours de vérification par notre équipe (24-48h).
              Certaines fonctionnalités sont temporairement désactivées.
            </p>
          </div>
        </div>
      )}

      {isRejected && (
        <div style={{
          display: "flex", alignItems: "flex-start", gap: "14px",
          background: "#fef2f2", border: "1px solid #fecaca",
          borderRadius: "14px", padding: "16px 20px", marginBottom: "20px",
        }}>
          <span style={{ fontSize: "24px", flexShrink: 0 }}>❌</span>
          <div>
            <p style={{ margin: "0 0 4px", fontWeight: "700", color: "#991b1b", fontSize: "15px" }}>
              Demande rejetée
            </p>
            <p style={{ margin: 0, color: "#7f1d1d", fontSize: "13px" }}>
              {user.rejection_reason
                ? <>Motif : <strong>{user.rejection_reason}</strong></>
                : "Votre demande d'inscription a été rejetée. Contactez le support pour plus d'informations."}
            </p>
          </div>
        </div>
      )}

      {/* Modal nouveau / suivi RDV */}
      {showModal && (
        <NewRdvModal
          doctorId={doctorId}
          presetPatient={followupAppt}
          onClose={() => { setShowModal(false); setFollowupAppt(null); }}
          onCreated={fetchRdv}
        />
      )}

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="header-flex-figma">
        <div>
          <h1 className="figma-title">Rendez-vous</h1>
          <p className="figma-subtitle">
            Bienvenue Dr. {user?.prenom} — {capitalizedDate}
          </p>
        </div>
        <button className="btn-figma-black" onClick={() => { setFollowupAppt(null); setShowModal(true); }}>
          <Plus size={18} style={{ marginRight: "8px" }} /> Nouveau rendez-vous
        </button>
      </header>

      {/* ── Stats cliquables (filtres) ──────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "20px", marginBottom: "32px" }}>
        {stats.map((s, i) => {
          const isActive  = activeFilter === s.filter;
          const isHovered = hoveredStat === i && !isActive;
          const cfg       = colorConfig[s.color];

          return (
            <div
              key={i}
              onClick={() => setActiveFilter(s.filter)}
              onMouseEnter={() => setHoveredStat(i)}
              onMouseLeave={() => setHoveredStat(null)}
              style={{
                display: "flex", flexDirection: "column", justifyContent: "space-between",
                padding: "20px", borderRadius: "24px", minHeight: "148px",
                cursor: "pointer",
                background: isActive ? "#0f172a" : isHovered ? "#f1f5f9" : "#fff",
                border:     isActive ? "2px solid #0f172a" : "2px solid transparent",
                boxShadow:  isActive
                  ? "0 8px 24px -8px rgba(15,23,42,0.4)"
                  : isHovered
                  ? "0 4px 12px rgba(15,23,42,0.08)"
                  : "0 24px 48px -20px rgba(15,23,42,0.25)",
                transform:  isHovered ? "translateY(-2px)" : "translateY(0)",
                transition: "all 0.2s ease",
              }}
            >
              {/* Ligne haute : label + icône */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                <p style={{
                  color: isActive ? "rgba(255,255,255,0.65)" : "#64748B",
                  fontSize: "13px", fontWeight: "500", lineHeight: "1.4",
                  margin: 0, flex: 1,
                }}>
                  {s.label}
                </p>
                <div style={{
                  width: "36px", height: "36px", borderRadius: "10px", flexShrink: 0,
                  background: isActive ? "rgba(255,255,255,0.12)" : cfg.bg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: isActive ? "#fff" : cfg.text,
                  transition: "all 0.2s ease",
                }}>
                  {s.icon}
                </div>
              </div>

              {/* Ligne basse : boîte valeur identique pour les 4 */}
              <div style={{
                width: "60px", height: "60px", borderRadius: "16px",
                background: isActive ? "rgba(255,255,255,0.12)" : cfg.bg,
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                fontWeight: "800",
                color: isActive ? "#fff" : cfg.text,
                boxShadow: isActive ? "none" : `0 4px 10px ${cfg.shadow}`,
                transition: "all 0.2s ease",
              }}>
                {s.isDate ? (
                  <>
                    <span style={{ fontSize: "20px", lineHeight: "1" }}>{day}</span>
                    <small style={{
                      fontSize: "11px",
                      color: isActive ? "rgba(255,255,255,0.6)" : "#64748B",
                    }}>{month}</small>
                  </>
                ) : (
                  <span style={{ fontSize: "22px", lineHeight: "1" }}>
                    {loading ? "—" : s.value}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Recherche ───────────────────────────────────────────── */}
      <div className="search-row-figma" style={{ marginBottom: "28px" }}>
        <div className="search-container-figma">
          <span className="search-icon-figma">🔍</span>
          <input
            type="text"
            className="input-figma"
            placeholder="Rechercher par nom ou téléphone…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* ── Liste ───────────────────────────────────────────────── */}
      <section className="appointments-section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#0F172A" }}>
            {sectionTitle}{!loading && ` (${filteredAppointments.length})`}
          </h2>
          {activeFilter !== "Tous" && (
            <button
              onClick={() => setActiveFilter("Tous")}
              className="link-figma-blue"
              style={{ background: "none", border: "none", cursor: "pointer" }}
            >
              Voir tout
            </button>
          )}
        </div>

        <div className="appointment-list">
          {loading && (
            <p style={{ textAlign: "center", color: "#64748B", padding: "40px" }}>⏳ Chargement…</p>
          )}

          {!loading && filteredAppointments.length === 0 && (
            <div style={{
              textAlign: "center", padding: "60px 20px", color: "#94a3b8",
              background: "#fff", borderRadius: "16px",
            }}>
              <div style={{ fontSize: "48px", marginBottom: "12px", opacity: 0.4 }}>📅</div>
              <p>Aucun rendez-vous</p>
            </div>
          )}

          {filteredAppointments.map((appt) => {
            const status        = getStatusLabel(appt.statut);
            const isTeleconsult = appt.type_consultation === "teleconsultation";
            const joinable      = canJoin(appt);
            const isTermine     = appt.statut === "termine";

            return (
              <div key={appt.id_rdv} className="card-figma" style={{ flexDirection: "column", padding: "16px 24px" }}>
                {/* Ligne 1 : avatar + infos + badges */}
                <div style={{ display: "flex", alignItems: "center", width: "100%", gap: "12px" }}>
                  <div className="avatar-figma">
                    {getInitiales(appt.patient_prenom, appt.patient_nom)}
                  </div>

                  <div className="card-content-figma" style={{ flex: 1 }}>
                    <div className="card-header-figma">
                      <span className="patient-name-figma">
                        {appt.patient_prenom} {appt.patient_nom}
                      </span>
                      {isTeleconsult && (
                        <span style={{
                          background: "#eff6ff", color: "#2563eb",
                          padding: "4px 10px", borderRadius: "999px",
                          fontSize: "12px", fontWeight: 600,
                        }}>
                          📹 Téléconsultation
                        </span>
                      )}
                      <span style={{
                        background: status.bg, color: status.color,
                        padding: "4px 10px", borderRadius: "999px",
                        fontSize: "12px", fontWeight: 600,
                      }}>
                        {status.text}
                      </span>
                    </div>

                    <div className="card-details-figma">
                      <span>🕒 {formatHeure(appt.heure_debut)}</span>
                      <span>📅 {formatDate(appt.date)}</span>
                      {appt.patient_tel && <span>📞 {appt.patient_tel}</span>}
                    </div>

                    {appt.motif && (
                      <p className="reason-figma">
                        <strong>Motif:</strong> {appt.motif}
                      </p>
                    )}
                  </div>
                </div>

                {/* Ligne 2 : actions */}
                <div style={{ display: "flex", gap: "8px", marginTop: "12px", paddingLeft: "56px" }}>
                  {appt.patient_tel && (
                    <a
                      href={`tel:${appt.patient_tel}`}
                      style={{
                        display: "flex", alignItems: "center", gap: "6px",
                        padding: "7px 14px", borderRadius: "8px",
                        background: "#f0fdf4", color: "#16a34a",
                        border: "1px solid #bbf7d0",
                        fontSize: "13px", fontWeight: 600, textDecoration: "none",
                      }}
                    >
                      <Phone size={13} /> Appeler
                    </a>
                  )}

                  {appt.patient_tel && (
                    <a
                      href={`https://wa.me/${appt.patient_tel.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "flex", alignItems: "center", gap: "6px",
                        padding: "7px 14px", borderRadius: "8px",
                        background: "#f0fdf4", color: "#16a34a",
                        border: "1px solid #bbf7d0",
                        fontSize: "13px", fontWeight: 600, textDecoration: "none",
                      }}
                    >
                      💬 WhatsApp
                    </a>
                  )}

                  {isTermine && (
                    <button
                      onClick={() => { setFollowupAppt(appt); setShowModal(true); }}
                      style={{
                        display: "flex", alignItems: "center", gap: "6px",
                        padding: "7px 14px", borderRadius: "8px",
                        background: "#eff6ff", color: "#2563eb",
                        border: "1px solid #bfdbfe",
                        fontSize: "13px", fontWeight: 600, cursor: "pointer",
                      }}
                    >
                      🔁 Suivi
                    </button>
                  )}

                  {isTeleconsult && (
                    <button
                      className="btn-figma-black-sm"
                      style={{
                        display: "flex", alignItems: "center", gap: "6px",
                        opacity: joinable ? 1 : 0.45,
                        cursor: joinable ? "pointer" : "not-allowed",
                      }}
                      disabled={!joinable}
                      title={joinable ? "Rejoindre la téléconsultation" : "Disponible 30 min avant le RDV"}
                      onClick={() => joinable && handleJoinCall(appt)}
                    >
                      <Video size={14} /> Rejoindre
                    </button>
                  )}

                  {["confirme","en_attente"].includes(appt.statut) && (
                    <button
                      onClick={() => { setCancelAppt(appt); setCancelReason(""); }}
                      style={{
                        display: "flex", alignItems: "center", gap: "6px",
                        padding: "7px 14px", borderRadius: "8px",
                        border: "1px solid #fecaca", background: "#fef2f2",
                        color: "#ef4444", fontSize: "13px", fontWeight: 600, cursor: "pointer",
                      }}
                    >
                      ✕ Annuler
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Cancel with reason modal ── */}
      {cancelAppt && (
        <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:"16px" }}
          onClick={() => setCancelAppt(null)}>
          <div style={{ background:"#fff", borderRadius:"20px", width:"100%", maxWidth:"420px", padding:"28px 32px", boxShadow:"0 32px 64px rgba(0,0,0,0.18)" }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ margin:"0 0 6px", fontSize:"18px", fontWeight:700 }}>Annuler le rendez-vous</h3>
            <p style={{ margin:"0 0 20px", fontSize:"13px", color:"#64748b" }}>
              {cancelAppt.patient_prenom} {cancelAppt.patient_nom} · {formatDate(cancelAppt.date)} à {formatHeure(cancelAppt.heure_debut)}
            </p>
            <p style={{ margin:"0 0 10px", fontSize:"13px", fontWeight:600, color:"#0f172a" }}>Motif d'annulation *</p>
            <div style={{ display:"flex", flexDirection:"column", gap:"8px", marginBottom:"20px" }}>
              {CANCEL_REASONS.map(r => (
                <label key={r} style={{ display:"flex", alignItems:"center", gap:"10px", padding:"10px 14px", borderRadius:"10px", border:`1.5px solid ${cancelReason===r?"#0072BC":"#e2e8f0"}`, background:cancelReason===r?"#eff6ff":"#f8fafc", cursor:"pointer", fontSize:"14px", fontWeight:cancelReason===r?600:400 }}>
                  <input type="radio" name="cancelReason" value={r} checked={cancelReason===r} onChange={() => setCancelReason(r)} style={{ accentColor:"#0072BC" }} />
                  {r}
                </label>
              ))}
            </div>
            <div style={{ display:"flex", gap:"10px" }}>
              <button onClick={() => setCancelAppt(null)} style={{ flex:1, padding:"11px", borderRadius:"10px", border:"1px solid #e2e8f0", background:"#f8fafc", fontWeight:600, cursor:"pointer" }}>
                Retour
              </button>
              <button
                onClick={handleCancelConfirm}
                disabled={!cancelReason || cancelling}
                style={{ flex:2, padding:"11px", borderRadius:"10px", border:"none", background:(!cancelReason||cancelling)?"#94a3b8":"#ef4444", color:"#fff", fontWeight:700, cursor:(!cancelReason||cancelling)?"not-allowed":"pointer" }}>
                {cancelling ? "Annulation…" : "Confirmer l'annulation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
