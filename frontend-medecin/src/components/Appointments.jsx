import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar, Video, Plus, Phone, UserCheck, UserX } from "lucide-react";
import { useUser } from "../contexts/UserContext";
import { useAppointments } from "../hooks/useAppointments";
import { API_URL, canJoin, toLocalDateStr, getStatusLabel, formatHeure, formatDate } from "../utils/rdv";
import { getInitiales } from "../contexts/UserContext";
import NewRdvModal from "./NewRdvModal";

function Appointments() {
  const { user }   = useUser();
  const navigate   = useNavigate();
  const { appointments, loading, fetchRdv, doctorId } = useAppointments();

  const [searchTerm,    setSearchTerm]    = useState("");
  const [activeTab,     setActiveTab]     = useState("Tous");
  const [selectedDate,  setSelectedDate]  = useState(new Date());
  const [showModal,     setShowModal]     = useState(false);
  const [followupAppt,  setFollowupAppt]  = useState(null);
  const [markingId,     setMarkingId]     = useState(null);

  const filterDateStr = toLocalDateStr(selectedDate);

  const filteredAppointments = appointments.filter((appt) => {
    const fullName      = `${appt.patient_prenom} ${appt.patient_nom}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase())
      || (appt.patient_tel || "").includes(searchTerm);
    const apptDateStr = toLocalDateStr(appt.date);

    if (activeTab === "Aujourd'hui")       return matchesSearch && apptDateStr === filterDateStr;
    if (activeTab === "À venir")           return matchesSearch && apptDateStr > filterDateStr;
    if (activeTab === "Téléconsultations") return matchesSearch && appt.type_consultation === "teleconsultation";
    return matchesSearch;
  });

  const handleJoinCall = async (appt) => {
    try {
      const res = await fetch(`${API_URL}/teleconsultation/start`, {
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

  const markAttendance = useCallback(async (appt, statut) => {
    if (!window.confirm(
      statut === "termine"
        ? `Marquer ${appt.patient_prenom} ${appt.patient_nom} comme présent(e) ?`
        : `Marquer ${appt.patient_prenom} ${appt.patient_nom} comme absent(e) ?`
    )) return;

    setMarkingId(appt.id_rdv);
    try {
      const res = await fetch(`${API_URL}/rdv/${appt.id_rdv}/statut`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      await fetchRdv();
    } catch (err) {
      alert("Erreur : " + err.message);
    } finally {
      setMarkingId(null);
    }
  }, [fetchRdv]);

  if (loading) {
    return (
      <div className="main-content-bg">
        <div style={{ textAlign: "center", padding: "60px" }}>⏳ Chargement…</div>
      </div>
    );
  }

  return (
    <div className="main-content-bg">
      {showModal && (
        <NewRdvModal
          doctorId={doctorId}
          presetPatient={followupAppt}
          onClose={() => { setShowModal(false); setFollowupAppt(null); }}
          onCreated={fetchRdv}
        />
      )}

      {/* Header */}
      <div className="header-flex-figma">
        <div>
          <h1 className="figma-title">Rendez-vous</h1>
          <p className="figma-subtitle">Gérez vos consultations et rendez-vous</p>
        </div>
        <button className="btn-figma-black" onClick={() => { setFollowupAppt(null); setShowModal(true); }}>
          <Plus size={18} style={{ marginRight: "8px" }} /> Nouveau rendez-vous
        </button>
      </div>

      {/* Search + date */}
      <div className="search-row-figma">
        <div className="search-container-figma">
          <span className="search-icon-figma">🔍</span>
          <input
            type="text"
            className="input-figma"
            placeholder="Rechercher par nom ou téléphone…"
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="date-picker-container-figma">
          <Calendar size={18} color="#2563EB" />
          <DatePicker
            selected={selectedDate}
            onChange={d => setSelectedDate(d)}
            dateFormat="dd MMMM yyyy"
            className="date-picker-input-figma"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-figma">
        {["Tous", "Aujourd'hui", "À venir", "Téléconsultations"].map(tab => (
          <button
            key={tab}
            className={`tab-item-figma ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="list-container-figma">
        {filteredAppointments.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8", background: "#fff", borderRadius: "16px" }}>
            <div style={{ fontSize: "48px", marginBottom: "12px", opacity: 0.4 }}>📅</div>
            <p>Aucun rendez-vous</p>
          </div>
        ) : (
          filteredAppointments.map((a) => {
            const status        = getStatusLabel(a.statut);
            const isTeleconsult = a.type_consultation === "teleconsultation";
            const joinable      = canJoin(a);
            const isTermine     = a.statut === "termine";
            const isConfirme    = a.statut === "confirme";
            const isMarking     = markingId === a.id_rdv;

            return (
              <div key={a.id_rdv} className="card-figma" style={{ flexDirection: "column", padding: "16px 24px" }}>
                {/* Row 1: avatar + info + badges */}
                <div style={{ display: "flex", alignItems: "center", width: "100%", gap: "12px" }}>
                  <div className="avatar-figma">{getInitiales(a.patient_prenom, a.patient_nom)}</div>

                  <div className="card-content-figma" style={{ flex: 1 }}>
                    <div className="card-header-figma">
                      <span className="patient-name-figma">{a.patient_prenom} {a.patient_nom}</span>
                      {isTeleconsult && (
                        <span style={{ background: "#eff6ff", color: "#2563eb", padding: "4px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: 600 }}>
                          📹 Téléconsultation
                        </span>
                      )}
                      <span style={{ background: status.bg, color: status.color, padding: "4px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: 600 }}>
                        {status.text}
                      </span>
                    </div>

                    <div className="card-details-figma">
                      <span>🕒 {formatHeure(a.heure_debut)}</span>
                      <span>📅 {formatDate(a.date)}</span>
                      {a.patient_tel && <span>📞 {a.patient_tel}</span>}
                    </div>

                    {a.motif && <p className="reason-figma"><strong>Motif:</strong> {a.motif}</p>}
                  </div>
                </div>

                {/* Row 2: actions */}
                <div style={{ display: "flex", gap: "8px", marginTop: "12px", paddingLeft: "56px", flexWrap: "wrap" }}>
                  {a.patient_tel && (
                    <a href={`tel:${a.patient_tel}`} style={{ display:"flex", alignItems:"center", gap:"6px", padding:"7px 14px", borderRadius:"8px", background:"#f0fdf4", color:"#16a34a", border:"1px solid #bbf7d0", fontSize:"13px", fontWeight:600, textDecoration:"none" }}>
                      <Phone size={13} /> Appeler
                    </a>
                  )}

                  {a.patient_tel && (
                    <a href={`https://wa.me/${a.patient_tel.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                      style={{ display:"flex", alignItems:"center", gap:"6px", padding:"7px 14px", borderRadius:"8px", background:"#f0fdf4", color:"#16a34a", border:"1px solid #bbf7d0", fontSize:"13px", fontWeight:600, textDecoration:"none" }}>
                      💬 WhatsApp
                    </a>
                  )}

                  {/* Attendance buttons — only for confirmed appointments */}
                  {isConfirme && (
                    <>
                      <button
                        onClick={() => markAttendance(a, "termine")}
                        disabled={isMarking}
                        style={{ display:"flex", alignItems:"center", gap:"6px", padding:"7px 14px", borderRadius:"8px", background:"#f0fdf4", color:"#16a34a", border:"1px solid #bbf7d0", fontSize:"13px", fontWeight:600, cursor:"pointer", opacity: isMarking ? 0.6 : 1 }}
                      >
                        <UserCheck size={13} /> Présent
                      </button>
                      <button
                        onClick={() => markAttendance(a, "no_show")}
                        disabled={isMarking}
                        style={{ display:"flex", alignItems:"center", gap:"6px", padding:"7px 14px", borderRadius:"8px", background:"#fef2f2", color:"#991b1b", border:"1px solid #fecaca", fontSize:"13px", fontWeight:600, cursor:"pointer", opacity: isMarking ? 0.6 : 1 }}
                      >
                        <UserX size={13} /> Absent
                      </button>
                    </>
                  )}

                  {/* Follow-up after completed */}
                  {isTermine && (
                    <button
                      onClick={() => { setFollowupAppt(a); setShowModal(true); }}
                      style={{ display:"flex", alignItems:"center", gap:"6px", padding:"7px 14px", borderRadius:"8px", background:"#eff6ff", color:"#2563eb", border:"1px solid #bfdbfe", fontSize:"13px", fontWeight:600, cursor:"pointer" }}
                    >
                      🔁 Suivi
                    </button>
                  )}

                  {/* Teleconsultation join */}
                  {isTeleconsult && isConfirme && (
                    <button
                      className="btn-figma-black-sm"
                      style={{ display:"flex", alignItems:"center", gap:"6px", opacity: joinable ? 1 : 0.45, cursor: joinable ? "pointer" : "not-allowed" }}
                      disabled={!joinable}
                      title={joinable ? "Rejoindre" : "Disponible 5 min avant le RDV"}
                      onClick={() => joinable && handleJoinCall(a)}
                    >
                      <Video size={14} /> Rejoindre
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default Appointments;
