import React, { useState, useEffect, useRef } from "react";
import DoctorCard from "./DoctorCard";
import DoctorDetails from "./DoctorDetails";
import "./AdminDashboard.css";
import { Users, Clock, CheckCircle, XCircle, TrendingUp } from "lucide-react";
import logoStatic   from "@shared-assets/logo-static.svg";
import logoAnimated from "@shared-assets/mediko-logo-cross-ecg-hover.svg";
import MedikoLogoAnimated from "@shared-assets/MedikoLogoAnimated";

const API = "http://localhost:5000/api/admin";

// ── Build last N days array (YYYY-MM-DD) ──────────────────────────
function lastNDays(n) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1 - i));
    return d.toISOString().split("T")[0];
  });
}

// ── Minimal SVG bar chart ─────────────────────────────────────────
function BarChart({ data, color, label }) {
  const days  = lastNDays(14);
  const vals  = days.map(d => ({ day: d, count: data.find(r => r.day?.startsWith(d))?.count || 0 }));
  const max   = Math.max(...vals.map(v => v.count), 1);
  const W = 560, H = 120;
  const pad   = { t: 16, r: 12, b: 28, l: 28 };
  const cW    = W - pad.l - pad.r;
  const cH    = H - pad.t - pad.b;
  const bW    = (cW / vals.length) * 0.6;
  const step  = cW / vals.length;

  const fmt = d => {
    const [, m, dd] = d.split("-");
    return `${dd}/${m}`;
  };

  return (
    <div>
      <p style={{ margin: "0 0 8px", fontSize: "12px", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</p>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", overflow: "visible" }}>
        {/* Horizontal grid */}
        {[0, 0.5, 1].map((p, i) => (
          <g key={i}>
            <line x1={pad.l} x2={W - pad.r} y1={pad.t + cH * (1 - p)} y2={pad.t + cH * (1 - p)} stroke="#f1f5f9" strokeWidth="1" />
            <text x={pad.l - 4} y={pad.t + cH * (1 - p) + 4} fontSize="9" fill="#94a3b8" textAnchor="end">
              {Math.round(max * p)}
            </text>
          </g>
        ))}

        {vals.map((v, i) => {
          const barH  = Math.max((v.count / max) * cH, v.count > 0 ? 3 : 0);
          const x     = pad.l + i * step + (step - bW) / 2;
          const y     = pad.t + cH - barH;
          const show  = i % 2 === 0;
          return (
            <g key={i}>
              <rect x={x} y={y} width={bW} height={barH} fill={color} rx="3" opacity="0.85" />
              {v.count > 0 && (
                <text x={x + bW / 2} y={y - 4} fontSize="9" fill={color} textAnchor="middle" fontWeight="700">
                  {v.count}
                </text>
              )}
              {show && (
                <text x={x + bW / 2} y={H - 4} fontSize="8.5" fill="#94a3b8" textAnchor="middle">
                  {fmt(v.day)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

const colorMap = {
  blue: { bg: "#EFF6FF", text: "#2563eb" },
  green: { bg: "#f0fdf4", text: "#16a34a" },
  orange: { bg: "#fff7ed", text: "#ea580c" },
  red: { bg: "#fef2f2", text: "#ef4444" },
};

function AdminDashboard() {
  const CYCLE_MS = 6000;
  const [logoAnimating, setLogoAnimating] = useState(false);
  const animTimer    = useRef(null);
  const animStartRef = useRef(null);

  const handleLogoMouseEnter = () => {
    clearTimeout(animTimer.current);
    if (!logoAnimating) animStartRef.current = Date.now();
    setLogoAnimating(true);
  };
  const handleLogoMouseLeave = () => {
    const elapsed     = Date.now() - (animStartRef.current ?? Date.now());
    const timeInCycle = elapsed % CYCLE_MS;
    const remaining   = CYCLE_MS - timeInCycle;
    animTimer.current = setTimeout(() => setLogoAnimating(false), remaining + 3 * CYCLE_MS);
  };

  useEffect(() => () => clearTimeout(animTimer.current), []);

  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [currentFilter, setCurrentFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredStat,   setHoveredStat]   = useState(null);
  const [activityOpen,  setActivityOpen]  = useState(false);
  const [activity,    setActivity]    = useState({ appointments: [], doctors: [] });

  useEffect(() => {
    fetchDoctors();
    fetch(`${API}/stats/activity`)
      .then(r => r.json())
      .then(data => setActivity(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    applyFilter();
  }, [doctors, currentFilter, searchQuery]);

  const fetchDoctors = async () => {
    try {
      const res = await fetch(`${API}/medecins`);
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      setDoctors(data.map(normalize));
    } catch (err) {
      setError(
        "Impossible de charger les médecins. Le serveur est-il démarré ?",
      );
    } finally {
      setLoading(false);
    }
  };

  const normalize = (d) => ({
    ...d,
    displayName: `Dr. ${d.prenom} ${d.nom}`,
    status:
      d.statut === "en_attente"
        ? "En attente"
        : d.statut === "approuvé"
          ? "Approuvé"
          : "Rejeté",
    submissionDate: new Date(d.created_at).toLocaleDateString("fr-FR"),
    submissionFull: new Date(d.created_at).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
  });

  const applyFilter = () => {
    let filtered = [...doctors];

    if (currentFilter === "pending")
      filtered = filtered.filter((d) => d.status === "En attente");
    if (currentFilter === "approved")
      filtered = filtered.filter((d) => d.status === "Approuvé");
    if (currentFilter === "rejected")
      filtered = filtered.filter((d) => d.status === "Rejeté");

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.displayName.toLowerCase().includes(q) ||
          d.specialite.toLowerCase().includes(q) ||
          d.rpps.toLowerCase().includes(q),
      );
    }

    setFilteredDoctors(filtered);

    if (selectedDoctor && !filtered.find((d) => d.id === selectedDoctor.id)) {
      setSelectedDoctor(filtered[0] ?? null);
    }
  };

  const updateStatus = async (doctorId, statut, rejectionReason = "") => {
    try {
      const res = await fetch(`${API}/medecins/${doctorId}/statut`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut, rejection_reason: rejectionReason }),
      });
      if (!res.ok) throw new Error("Erreur serveur");

      const displayStatus = statut === "approuvé" ? "Approuvé" : "Rejeté";
      const update = (d) =>
        d.id === doctorId
          ? { ...d, statut, status: displayStatus, rejection_reason: rejectionReason }
          : d;

      setDoctors((prev) => prev.map(update));
      if (selectedDoctor?.id === doctorId) {
        setSelectedDoctor((prev) => update(prev));
      }
    } catch (err) {
      alert("Erreur lors de la mise à jour : " + err.message);
    }
  };

  const stats = {
    total: doctors.length,
    pending: doctors.filter((d) => d.status === "En attente").length,
    approved: doctors.filter((d) => d.status === "Approuvé").length,
    rejected: doctors.filter((d) => d.status === "Rejeté").length,
  };

  const statsConfig = [
    { key: "total", label: "Total médecins", icon: Users, color: "blue" },
    { key: "pending", label: "En attente", icon: Clock, color: "orange" },
    { key: "approved", label: "Approuvés", icon: CheckCircle, color: "green" },
    { key: "rejected", label: "Rejetés", icon: XCircle, color: "red" },
  ];

  const FILTERS = [
    { key: "all", label: "Tous" },
    { key: "pending", label: `En attente (${stats.pending})` },
    { key: "approved", label: `Approuvés (${stats.approved})` },
    { key: "rejected", label: `Rejetés (${stats.rejected})` },
  ];

  return (
    <div className="admin-container">
      <div className="admin-header">
        <div className="header-left">
          <img
            src={logoAnimating ? logoAnimated : logoStatic}
            alt="Mediko"
            className="admin-logo"
            onMouseEnter={handleLogoMouseEnter}
            onMouseLeave={handleLogoMouseLeave}
            style={{ cursor: "pointer" }}
          />
          <div>
            <MedikoLogoAnimated standalone={false} fontSize={34} />
            <h1 className="admin-title">Administration Médicale</h1>
            <p className="admin-subtitle">
              Vérification et validation des médecins
            </p>
          </div>
        </div>
        <div className="header-right">
          <span className="admin-badge">👨‍⚕️ Admin</span>
          <span className="admin-badge">
            📅 {new Date().toLocaleDateString("fr-FR")}
          </span>
          <button
            onClick={() => {
              localStorage.removeItem("admin_token");
              localStorage.removeItem("admin_user");
              localStorage.removeItem("token");
              window.location.replace("http://localhost:5173");
            }}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "8px 16px", borderRadius: "10px",
              border: "1px solid #fecaca", background: "#fef2f2",
              color: "#ef4444", fontWeight: 600, fontSize: "13px", cursor: "pointer",
            }}
          >
            🚪 Déconnexion
          </button>
        </div>
      </div>

      <div
        className="stats-row"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "20px",
        }}
      >
        {statsConfig.map((s, i) => {
          const isActive =
            currentFilter === s.key ||
            (s.key === "total" && currentFilter === "all");
          const isHovered = hoveredStat === i;
          const cfg = colorMap[s.color];
          const Icon = s.icon;

          return (
            <div
              key={i}
              onClick={() =>
                setCurrentFilter(s.key === "total" ? "all" : s.key)
              }
              onMouseEnter={() => setHoveredStat(i)}
              onMouseLeave={() => setHoveredStat(null)}
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: "20px",
                borderRadius: "24px",
                minHeight: "148px",
                cursor: "pointer",

                background: isActive
                  ? "#0f172a"
                  : isHovered
                    ? "#f1f5f9"
                    : "#fff",

                border: isActive
                  ? "2px solid #0f172a"
                  : "2px solid transparent",

                boxShadow: isActive
                  ? "0 8px 24px -8px rgba(15,23,42,0.4)"
                  : isHovered
                    ? "0 4px 12px rgba(15,23,42,0.08)"
                    : "0 24px 48px -20px rgba(15,23,42,0.25)",

                transform: isHovered ? "translateY(-2px)" : "translateY(0)",
                transition: "all 0.2s ease",
              }}
            >
              {/* HEADER */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontWeight: "600",
                    color: isActive ? "#fff" : "#64748b",
                  }}
                >
                  {s.label}
                </span>

                {/* ICON */}
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "14px",
                    background: isActive ? "rgba(255,255,255,0.12)" : cfg.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon size={20} color={isActive ? "#fff" : cfg.text} />
                </div>
              </div>

              {/* VALUE */}
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: "800",
                  color: isActive ? "#fff" : cfg.text,
                }}
              >
                {stats[s.key]}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Activity chart ─────────────────────────────────────── */}
      <div style={{
        background: "#fff", borderRadius: "20px",
        boxShadow: "0 24px 48px -20px rgba(15,23,42,0.15)",
        overflow: "hidden",
      }}>
        <div
          onClick={() => setActivityOpen(o => !o)}
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "22px 24px", cursor: "pointer",
            borderBottom: activityOpen ? "1px solid #f1f5f9" : "none",
            transition: "background 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
          onMouseLeave={e => e.currentTarget.style.background = "#fff"}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <TrendingUp size={18} color="#2563eb" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>Activité de la plateforme</h3>
              <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>14 derniers jours</p>
            </div>
          </div>
          <span style={{
            fontSize: "18px", color: "#64748b", lineHeight: 1,
            transform: activityOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.25s ease",
            display: "inline-block",
          }}>▾</span>
        </div>
        {activityOpen && (
          <div style={{ padding: "22px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px" }}>
            <BarChart data={activity.appointments} color="#2563eb" label="Rendez-vous bookés / jour" />
            <BarChart data={activity.doctors}      color="#16a34a" label="Nouvelles inscriptions médecins / jour" />
          </div>
        )}
      </div>

      <div className="toolbar">
        <div className="search-box">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Rechercher par nom, spécialité ou RPPS…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filter-tabs">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              className={`filter-btn ${currentFilter === key ? "active" : ""}`}
              onClick={() => setCurrentFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="main-content">
        <div className="doctors-list">
          {loading && <div className="state-msg">Chargement…</div>}
          {error && <div className="state-msg error">{error}</div>}
          {!loading && !error && filteredDoctors.length === 0 && (
            <div className="state-msg">Aucun médecin trouvé</div>
          )}
          {filteredDoctors.map((doctor) => (
            <DoctorCard
              key={doctor.id}
              doctor={doctor}
              isSelected={selectedDoctor?.id === doctor.id}
              onSelect={setSelectedDoctor}
            />
          ))}
        </div>

        <div className="details-panel">
          <DoctorDetails
            doctor={selectedDoctor}
            onApprove={(id) => updateStatus(id, "approuvé")}
            onReject={(id, reason) => updateStatus(id, "rejeté", reason)}
          />
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
