import React, { useState, useEffect } from "react";
import { useUser, getInitiales } from "../contexts/UserContext";

const API_URL = "http://localhost:5000/api";

const HEURES = [];
for (let h = 8; h < 18; h++) {
  HEURES.push(`${String(h).padStart(2, "0")}:00`);
  HEURES.push(`${String(h).padStart(2, "0")}:30`);
}

const JOURS_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function calcAge(ddn) {
  if (!ddn) return null;
  const birth = new Date(ddn);
  const now   = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

// Extract local YYYY-MM-DD from a UTC ISO string (avoids UTC-offset day shift)
function localDay(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isPastSlot(dateStr, heure) {
  const now = new Date();
  const [h, m] = heure.split(":").map(Number);
  const d = new Date(dateStr);
  d.setHours(h, m + 30, 0, 0);
  return d < now;
}

function Disponibilites() {
  const { user } = useUser();
  const [weekStart, setWeekStart] = useState(getMonday(new Date()));
  const [creneaux,  setCreneaux]  = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [message,   setMessage]   = useState(null);
  const [tooltip,   setTooltip]   = useState(null); // { x, y, creneau }

  function getMonday(date) {
    const d   = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setHours(0, 0, 0, 0);
    d.setDate(diff);
    return d;
  }

  const joursSemaine = JOURS_LABELS.map((label, i) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    return {
      label,
      date,
      dateStr:  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
      jourMois: `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`,
    };
  });

  const loadCreneaux = async () => {
    if (!user?.id_u && !user?.id) return;
    const idMedecin = user.id_u || user.id;
    try {
      setLoading(true);
      const debut = joursSemaine[0].dateStr;
      const fin   = joursSemaine[6].dateStr;
      const res   = await fetch(`${API_URL}/rdv/disponibilites/${idMedecin}?debut=${debut}&fin=${fin}`);
      const data  = await res.json();
      const filtered = data.filter((c) => {
        const d = localDay(c.date);
        return d >= debut && d <= fin;
      });
      setCreneaux(filtered);
    } catch (err) {
      console.error("Erreur chargement créneaux:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCreneaux(); }, [weekStart, user]);

  const findCreneau = (dateStr, heure) => {
    return creneaux.find((c) => {
      const cDateStr = localDay(c.date);
      const cHeure   = c.heure_debut.substring(0, 5);
      return cDateStr === dateStr && cHeure === heure;
    });
  };

  const handleClick = async (dateStr, heure) => {
    const idMedecin = user.id_u || user.id;
    if (!idMedecin) return;
    const existing = findCreneau(dateStr, heure);

    if (existing?.reserve === 1) {
      setMessage({ type: "error", text: "❌ Ce créneau est réservé par un patient" });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    if (isPastSlot(dateStr, heure)) {
      setMessage({ type: "error", text: "❌ Impossible de modifier un créneau passé" });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    try {
      if (existing) {
        const res = await fetch(`${API_URL}/rdv/disponibilites/${existing.id_dispo}`, { method: "DELETE" });
        if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
        setMessage({ type: "success", text: "✅ Créneau supprimé" });
      } else {
        const [h, m] = heure.split(":").map(Number);
        let heureFinH = h, heureFinM = m + 30;
        if (heureFinM >= 60) { heureFinH += 1; heureFinM -= 60; }
        const heureFin = `${String(heureFinH).padStart(2, "0")}:${String(heureFinM).padStart(2, "0")}:00`;

        const res = await fetch(`${API_URL}/rdv/disponibilites`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id_medecin: idMedecin, date: dateStr, heure_debut: `${heure}:00`, heure_fin: heureFin }),
        });
        if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
        setMessage({ type: "success", text: "✅ Créneau ajouté" });
      }
      await loadCreneaux();
      setTimeout(() => setMessage(null), 2000);
    } catch (err) {
      setMessage({ type: "error", text: `❌ ${err.message}` });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const previousWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d); };
  const nextWeek     = () => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d); };

  const getCellStyle = (status, past) => {
    const base = {
      width: "100%", padding: "8px", borderRadius: "8px", border: "none",
      cursor: "pointer", fontSize: "14px", fontWeight: 600, transition: "all 0.2s",
    };
    if (past && status !== "reserve") return {
      ...base,
      background: "#f1f5f9", color: "#cbd5e1",
      border: "1px dashed #e2e8f0", cursor: "not-allowed", opacity: 0.55,
    };
    if (status === "vide")    return { ...base, background: "#F8FAFC", color: "#94A3B8", border: "1px dashed #CBD5E1" };
    if (status === "libre")   return { ...base, background: "#DCFCE7", color: "#166534", border: "1px solid #86EFAC" };
    if (status === "reserve") return { ...base, background: "#FEE2E2", color: "#991B1B", border: "1px solid #FCA5A5", cursor: "default" };
    return base;
  };

  const formatWeekRange = () => {
    const fin = new Date(weekStart); fin.setDate(fin.getDate() + 6);
    return `${weekStart.getDate()} ${weekStart.toLocaleDateString("fr-FR", { month: "short" })} - ${fin.getDate()} ${fin.toLocaleDateString("fr-FR", { month: "short", year: "numeric" })}`;
  };

  const showTooltip = (e, creneau) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.right + 12;
    const y = rect.top;
    setTooltip({ x, y, creneau });
  };

  return (
    <div className="main-content-bg">
      {/* Tooltip flottant */}
      {tooltip && (
        <div
          onMouseEnter={() => setTooltip(null)}
          style={{
            position: "fixed", top: tooltip.y, left: tooltip.x,
            zIndex: 9999, pointerEvents: "none",
            background: "#fff", borderRadius: "16px", padding: "16px 20px",
            boxShadow: "0 12px 40px -8px rgba(15,23,42,0.25)",
            minWidth: "210px", border: "1px solid #e2e8f0",
          }}
        >
          {/* Avatar + nom */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
            <div style={{
              width: "44px", height: "44px", borderRadius: "50%",
              background: "#eff6ff", color: "#2563eb",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: "800", fontSize: "18px", flexShrink: 0,
            }}>
              {getInitiales(tooltip.creneau.patient_prenom, tooltip.creneau.patient_nom)}
            </div>
            <div>
              <p style={{ fontWeight: "700", color: "#0f172a", margin: 0, fontSize: "14px" }}>
                {tooltip.creneau.patient_prenom} {tooltip.creneau.patient_nom}
              </p>
              <p style={{ color: "#64748b", fontSize: "12px", margin: 0 }}>Patient réservé</p>
            </div>
          </div>

          {/* Infos */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {tooltip.creneau.patient_tel && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#334155" }}>
                <span>📞</span> {tooltip.creneau.patient_tel}
              </div>
            )}
            {tooltip.creneau.patient_sexe && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#334155" }}>
                <span style={{ fontSize: "17px", fontWeight: 900, color: tooltip.creneau.patient_sexe === "M" ? "#2563eb" : "#db2777" }}>
                  {tooltip.creneau.patient_sexe === "M" ? "♂" : "♀"}
                </span>
                {tooltip.creneau.patient_sexe === "M" ? "Homme" : "Femme"}
              </div>
            )}
            {tooltip.creneau.patient_ddn && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#334155" }}>
                <span>🎂</span> {calcAge(tooltip.creneau.patient_ddn)} ans
              </div>
            )}
          </div>
        </div>
      )}

      <div className="header-flex-figma">
        <div>
          <h1 className="figma-title">Mes Disponibilités</h1>
          <p className="figma-subtitle">Cliquez sur les créneaux pour les ouvrir ou les fermer</p>
        </div>
      </div>

      {/* Navigation semaines */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        background: "#fff", padding: "16px 24px", borderRadius: "16px",
        marginBottom: "20px", boxShadow: "0 4px 12px -2px rgba(15,23,42,0.08)",
      }}>
        <button onClick={previousWeek} style={{ padding: "10px 20px", borderRadius: "10px", border: "1px solid #E2E8F0", background: "#fff", cursor: "pointer", fontWeight: 600 }}>
          ← Semaine précédente
        </button>
        <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#0F172A" }}>
          📅 {formatWeekRange()}
        </h2>
        <button onClick={nextWeek} style={{ padding: "10px 20px", borderRadius: "10px", border: "1px solid #E2E8F0", background: "#fff", cursor: "pointer", fontWeight: 600 }}>
          Semaine suivante →
        </button>
      </div>

      {message && (
        <div style={{
          padding: "12px 16px", borderRadius: "10px", marginBottom: "16px", fontWeight: 600,
          background: message.type === "error" ? "#FEE2E2" : "#DCFCE7",
          color:      message.type === "error" ? "#991B1B" : "#166534",
        }}>
          {message.text}
        </div>
      )}

      {/* Légende */}
      <div style={{
        display: "flex", gap: "20px", marginBottom: "20px", padding: "12px 16px",
        background: "#fff", borderRadius: "12px", fontSize: "14px",
        boxShadow: "0 4px 12px -2px rgba(15,23,42,0.06)",
      }}>
        {[
          { bg: "#F8FAFC", border: "1px dashed #CBD5E1", label: "Vide (cliquez pour ouvrir)" },
          { bg: "#DCFCE7", border: "1px solid #86EFAC",  label: "Disponible (cliquez pour fermer)" },
          { bg: "#FEE2E2", border: "1px solid #FCA5A5",  label: "Réservé — survolez pour voir le patient" },
          { bg: "#f1f5f9", border: "1px dashed #e2e8f0", label: "Passé (lecture seule)", opacity: 0.55 },
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "20px", height: "20px", borderRadius: "4px", background: item.bg, border: item.border, opacity: item.opacity }} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Grille */}
      <div style={{ background: "#fff", borderRadius: "16px", padding: "20px", boxShadow: "0 4px 12px -2px rgba(15,23,42,0.08)", overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "4px" }}>
          <thead>
            <tr>
              <th style={{ width: "80px", padding: "12px", textAlign: "left", fontSize: "13px", color: "#64748B", fontWeight: 700 }}>Heure</th>
              {joursSemaine.map((j) => (
                <th key={j.dateStr} style={{ padding: "12px", textAlign: "center", fontSize: "13px", color: "#0F172A", fontWeight: 700 }}>
                  <div>{j.label}</div>
                  <div style={{ fontSize: "12px", color: "#64748B", fontWeight: 500 }}>{j.jourMois}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HEURES.map((heure) => (
              <tr key={heure}>
                <td style={{ padding: "8px", fontSize: "13px", color: "#64748B", fontWeight: 600 }}>{heure}</td>
                {joursSemaine.map((j) => {
                  const c    = findCreneau(j.dateStr, heure);
                  const past = isPastSlot(j.dateStr, heure);
                  let status = "vide";
                  if (c) status = c.reserve === 1 ? "reserve" : "libre";

                  return (
                    <td
                      key={j.dateStr + heure}
                      style={{ padding: "2px" }}
                      onMouseEnter={(e) => { if (status === "reserve" && c) showTooltip(e, c); }}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      <button
                        onClick={() => {
                          if (status === "reserve" || past) return;
                          handleClick(j.dateStr, heure);
                        }}
                        style={getCellStyle(status, past)}
                        title={
                          status === "reserve" ? "Réservé — survolez pour voir le patient"
                          : past              ? "Créneau passé"
                          : status === "libre"? "Cliquer pour fermer"
                          :                    "Cliquer pour ouvrir"
                        }
                      >
                        {past && status !== "reserve" ? "—" : status === "vide" ? "+" : status === "libre" ? "✓" : "🔴"}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {loading && <div style={{ textAlign: "center", padding: "20px", color: "#64748B" }}>⏳ Chargement...</div>}
    </div>
  );
}

export default Disponibilites;
