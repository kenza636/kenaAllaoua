import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar, X } from "lucide-react";
import { API_URL, toLocalDateStr } from "../utils/rdv";

function NewRdvModal({ doctorId, presetPatient, onClose, onCreated }) {
  const [patientQuery,   setPatientQuery]   = useState(presetPatient ? `${presetPatient.patient_prenom} ${presetPatient.patient_nom}` : "");
  const [patientResults, setPatientResults] = useState([]);
  const [patient,        setPatient]        = useState(presetPatient || null);
  const [slotDate,       setSlotDate]       = useState(new Date());
  const [slots,          setSlots]          = useState([]);
  const [selectedSlot,   setSelectedSlot]   = useState(null);
  const [type,           setType]           = useState("presentiel");
  const [motif,          setMotif]          = useState(presetPatient ? "Suivi" : "");
  const [submitting,     setSubmitting]     = useState(false);
  const [msg,            setMsg]            = useState(null);

  useEffect(() => {
    if (presetPatient) return;
    if (patientQuery.length < 2) { setPatientResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/patients/search?q=${encodeURIComponent(patientQuery)}`);
        setPatientResults(await res.json());
      } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [patientQuery, presetPatient]);

  useEffect(() => {
    const dateStr = toLocalDateStr(slotDate);
    setSelectedSlot(null);
    fetch(`${API_URL}/rdv/disponibilites/${doctorId}?date=${dateStr}`)
      .then(r => r.json())
      .then(data => setSlots(data.filter(s => s.reserve !== 1)))
      .catch(() => setSlots([]));
  }, [slotDate, doctorId]);

  const handleSubmit = async () => {
    if (!patient) return setMsg("Sélectionnez un patient.");
    if (!selectedSlot) return setMsg("Sélectionnez un créneau.");
    setSubmitting(true);
    setMsg(null);
    try {
      const res = await fetch(`${API_URL}/rdv`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_dispo:          selectedSlot.id_dispo,
          id_patient:        patient.id_u,
          id_medecin:        doctorId,
          type_consultation: type,
          motif,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
      onCreated();
      onClose();
    } catch (err) {
      setMsg("❌ " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const inp = {
    width: "100%", padding: "10px 14px", borderRadius: "10px",
    border: "1px solid #e2e8f0", fontSize: "14px", outline: "none",
  };
  const lbl = { fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px", display: "block" };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
    }}>
      <div style={{
        background: "#fff", borderRadius: "20px", padding: "32px",
        width: "520px", maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 24px 60px -12px rgba(0,0,0,0.35)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
            {presetPatient ? "Rendez-vous de suivi" : "Nouveau rendez-vous"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
            <X size={20} />
          </button>
        </div>

        {/* Patient */}
        <div style={{ marginBottom: "20px" }}>
          <label style={lbl}>Patient</label>
          {presetPatient ? (
            <div style={{ ...inp, background: "#f8fafc", color: "#0f172a" }}>
              {presetPatient.patient_prenom} {presetPatient.patient_nom}
            </div>
          ) : (
            <div style={{ position: "relative" }}>
              <input
                style={inp}
                placeholder="Nom, téléphone ou email…"
                value={patientQuery}
                onChange={e => { setPatientQuery(e.target.value); setPatient(null); }}
              />
              {patientResults.length > 0 && !patient && (
                <div style={{
                  position: "absolute", top: "100%", left: 0, right: 0,
                  background: "#fff", border: "1px solid #e2e8f0",
                  borderRadius: "10px", zIndex: 10, boxShadow: "0 8px 24px -4px rgba(0,0,0,0.12)",
                  maxHeight: "180px", overflowY: "auto",
                }}>
                  {patientResults.map(p => (
                    <div
                      key={p.id_u}
                      onClick={() => { setPatient(p); setPatientQuery(`${p.prenom_u} ${p.nom_u}`); setPatientResults([]); }}
                      style={{ padding: "10px 14px", cursor: "pointer", fontSize: "14px", borderBottom: "1px solid #f1f5f9" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                      onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                    >
                      <strong>{p.prenom_u} {p.nom_u}</strong>
                      {p.tel_u && <span style={{ color: "#64748b", marginLeft: "8px" }}>{p.tel_u}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Date */}
        <div style={{ marginBottom: "20px" }}>
          <label style={lbl}>Date du rendez-vous</label>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", ...inp, width: "auto" }}>
            <Calendar size={16} color="#2563eb" />
            <DatePicker
              selected={slotDate}
              onChange={d => setSlotDate(d)}
              dateFormat="dd/MM/yyyy"
              minDate={new Date()}
              className="date-picker-input-figma"
            />
          </div>
        </div>

        {/* Créneaux */}
        <div style={{ marginBottom: "20px" }}>
          <label style={lbl}>Créneau disponible</label>
          {slots.length === 0 ? (
            <p style={{ fontSize: "13px", color: "#94a3b8" }}>Aucun créneau disponible ce jour</p>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {slots.map(s => (
                <button
                  key={s.id_dispo}
                  onClick={() => setSelectedSlot(s)}
                  style={{
                    padding: "8px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: "600",
                    border: selectedSlot?.id_dispo === s.id_dispo ? "2px solid #2563eb" : "1px solid #e2e8f0",
                    background: selectedSlot?.id_dispo === s.id_dispo ? "#eff6ff" : "#fff",
                    color: selectedSlot?.id_dispo === s.id_dispo ? "#2563eb" : "#334155",
                    cursor: "pointer",
                  }}
                >
                  {s.heure_debut?.substring(0, 5)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Type */}
        <div style={{ marginBottom: "20px" }}>
          <label style={lbl}>Type</label>
          <select value={type} onChange={e => setType(e.target.value)} style={inp}>
            <option value="presentiel">Présentiel</option>
            <option value="teleconsultation">Téléconsultation</option>
          </select>
        </div>

        {/* Motif */}
        <div style={{ marginBottom: "24px" }}>
          <label style={lbl}>Motif (optionnel)</label>
          <input
            style={inp}
            placeholder="Ex: Suivi, douleur abdominale…"
            value={motif}
            onChange={e => setMotif(e.target.value)}
          />
        </div>

        {msg && <p style={{ color: "#dc2626", fontSize: "13px", marginBottom: "12px" }}>{msg}</p>}

        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: "12px", borderRadius: "12px",
              border: "1px solid #e2e8f0", background: "#fff",
              fontWeight: "600", cursor: "pointer",
            }}
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              flex: 1, padding: "12px", borderRadius: "12px",
              background: "#0f172a", color: "#fff",
              border: "none", fontWeight: "600", cursor: "pointer",
              opacity: submitting ? 0.6 : 1,
            }}
          >
            {submitting ? "Création…" : "Confirmer le RDV"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default NewRdvModal;
