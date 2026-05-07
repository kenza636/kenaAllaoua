import { useState, useContext } from "react";
import { Link } from "react-router-dom";
import {
  Bell, Calendar, Clock, Video, Phone,
  CheckCircle2, Trash2, Check, BellOff,
  AlertTriangle, Info,
} from "lucide-react";
import { NotificationsContext } from "./contexts/NotificationsContext";
import Header from "./Header";
import "./DoctorSearch.css";

// ── Type config ────────────────────────────────────────────────────
const TYPE_CFG = {
  booking:       { icon: Calendar,      bg: "#f0fdf4", color: "#16a34a", label: "Rendez-vous" },
  rappel:        { icon: Calendar,      bg: "#eff6ff", color: "#2563eb", label: "Rappel"       },
  rappel_urgent: { icon: AlertTriangle, bg: "#fff7ed", color: "#ea580c", label: "Urgent"       },
  "missed-call": { icon: Phone,         bg: "#fef2f2", color: "#dc2626", label: "Appel manqué" },
  teleconsult:   { icon: Video,         bg: "#f5f3ff", color: "#7c3aed", label: "Téléconsult"  },
  info:          { icon: Info,          bg: "#f8fafc", color: "#475569", label: "Info"         },
  error:         { icon: AlertTriangle, bg: "#fef2f2", color: "#dc2626", label: "Erreur"       },
};

function getTypeCfg(type) {
  return TYPE_CFG[type] || TYPE_CFG.info;
}

function timeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1)  return "À l'instant";
  if (m < 60) return `Il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Il y a ${h} h`;
  const d = Math.floor(h / 24);
  if (d === 1) return "Hier";
  if (d < 7)  return `Il y a ${d} jours`;
  return new Date(ts).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

const Notifications = () => {
  const {
    notifications,
    markAsRead, markAllAsRead,
    clearNotification, clearAll,
  } = useContext(NotificationsContext);

  const [filter,    setFilter]    = useState("all"); // "all" | "unread"
  const [clearConfirm, setClearConfirm] = useState(false);

  const unread = notifications.filter(n => !n.read);
  const shown  = filter === "unread" ? unread : notifications;

  const handleClearAll = () => {
    if (!clearConfirm) { setClearConfirm(true); return; }
    clearAll();
    setClearConfirm(false);
  };

  return (
    <div className="page-wrapper">
      <Header pageTitle="Notifications" />

      <nav className="top-actions">
        <Link to="/"             className="tab"><span className="emoji-icon">📅</span> Réserver</Link>
        <Link to="/appointments" className="tab"><span className="emoji-icon">📌</span> Rendez-vous</Link>
        <Link to="/payments"     className="tab"><span className="emoji-icon">💳</span> Paiements</Link>
        <Link to="/notifications" className="tab active"><span className="emoji-icon">🔔</span> Notifications</Link>
      </nav>

      <div style={{ margin: "20px", marginBottom: "40px", padding: "0 20px" }}>
        <main className="notifications-card" style={{ minHeight: "600px" }}>

          {/* ── Header ── */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", gap: "16px", flexWrap: "wrap" }}>
            <div>
              <h1 className="card-title">Notifications</h1>
              <p className="card-subtitle">
                {unread.length > 0
                  ? `${unread.length} non lue${unread.length > 1 ? "s" : ""} · ${notifications.length} au total`
                  : `${notifications.length} notification${notifications.length !== 1 ? "s" : ""}`}
              </p>
            </div>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {unread.length > 0 && (
                <button
                  onClick={markAllAsRead}
                  style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    padding: "9px 16px", borderRadius: "10px",
                    border: "1px solid #bbf7d0", background: "#f0fdf4",
                    color: "#16a34a", fontWeight: 600, fontSize: "13px", cursor: "pointer",
                  }}
                >
                  <Check size={14} /> Tout marquer lu
                </button>
              )}

              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  onBlur={() => setClearConfirm(false)}
                  style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    padding: "9px 16px", borderRadius: "10px",
                    border: clearConfirm ? "1px solid #fca5a5" : "1px solid #fecaca",
                    background: clearConfirm ? "#fef2f2" : "#fff5f5",
                    color: "#ef4444", fontWeight: 600, fontSize: "13px", cursor: "pointer",
                    transition: "all .15s",
                  }}
                >
                  <Trash2 size={14} />
                  {clearConfirm ? "Confirmer ?" : "Tout effacer"}
                </button>
              )}
            </div>
          </div>

          {/* ── Filter tabs ── */}
          {notifications.length > 0 && (
            <div style={{ display: "flex", gap: "6px", marginBottom: "20px" }}>
              {[["all", "Toutes", notifications.length], ["unread", "Non lues", unread.length]].map(([key, label, count]) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  style={{
                    padding: "6px 14px", borderRadius: "999px", fontSize: "13px", fontWeight: 600,
                    border: filter === key ? "1.5px solid #0072BC" : "1.5px solid #e2e8f0",
                    background: filter === key ? "#eff6ff" : "#f8fafc",
                    color: filter === key ? "#0072BC" : "#64748b",
                    cursor: "pointer", transition: "all .15s",
                  }}
                >
                  {label}
                  {count > 0 && (
                    <span style={{
                      marginLeft: "6px", background: filter === key ? "#0072BC" : "#e2e8f0",
                      color: filter === key ? "#fff" : "#64748b",
                      borderRadius: "999px", padding: "1px 7px", fontSize: "11px",
                    }}>
                      {count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* ── Empty state ── */}
          {shown.length === 0 && (
            <div style={{ textAlign: "center", padding: "80px 20px" }}>
              <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 80, height: 80, borderRadius: "50%", background: "#f1f5f9", marginBottom: "20px" }}>
                <BellOff size={36} color="#94a3b8" />
              </div>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#1f2937", margin: "0 0 8px" }}>
                {filter === "unread" ? "Aucune notification non lue" : "Aucune notification"}
              </h2>
              <p style={{ color: "#6b7280", fontSize: "14px", margin: 0 }}>
                {filter === "unread"
                  ? "Vous êtes à jour !"
                  : "Vos notifications apparaîtront ici"}
              </p>
            </div>
          )}

          {/* ── Notification list ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {shown.map(notif => {
              const cfg  = getTypeCfg(notif.type);
              const Icon = cfg.icon;

              return (
                <div
                  key={notif.id}
                  onClick={() => !notif.read && markAsRead(notif.id)}
                  style={{
                    display: "flex", gap: "14px", alignItems: "flex-start",
                    padding: "16px 18px", borderRadius: "14px",
                    border: notif.read ? "1px solid #f1f5f9" : "1px solid #bfdbfe",
                    background: notif.read ? "#fafafa" : "#fff",
                    cursor: notif.read ? "default" : "pointer",
                    transition: "all .15s",
                    position: "relative",
                  }}
                  onMouseEnter={e => { if (!notif.read) e.currentTarget.style.background = "#f8fbff"; }}
                  onMouseLeave={e => { if (!notif.read) e.currentTarget.style.background = "#fff"; }}
                >
                  {/* Unread dot */}
                  {!notif.read && (
                    <span style={{
                      position: "absolute", top: "16px", right: "16px",
                      width: "8px", height: "8px", borderRadius: "50%",
                      background: "#0072BC",
                    }} />
                  )}

                  {/* Icon */}
                  <div style={{
                    width: "42px", height: "42px", borderRadius: "12px",
                    background: cfg.bg, display: "flex", alignItems: "center",
                    justifyContent: "center", flexShrink: 0,
                  }}>
                    <Icon size={18} color={cfg.color} />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "4px" }}>
                      <p style={{ margin: 0, fontWeight: notif.read ? 500 : 700, fontSize: "14px", color: "#0f172a", lineHeight: 1.4 }}>
                        {notif.title}
                      </p>
                      <span style={{ fontSize: "11px", color: "#94a3b8", whiteSpace: "nowrap", flexShrink: 0 }}>
                        {timeAgo(notif.timestamp)}
                      </span>
                    </div>

                    {notif.desc && (
                      <p style={{ margin: "0 0 8px", fontSize: "13px", color: "#64748b", lineHeight: 1.5 }}>
                        {notif.desc}
                      </p>
                    )}

                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <span style={{
                        fontSize: "11px", fontWeight: 600, padding: "2px 8px",
                        borderRadius: "999px", background: cfg.bg, color: cfg.color,
                      }}>
                        {cfg.label}
                      </span>

                      {!notif.read && (
                        <button
                          onClick={e => { e.stopPropagation(); markAsRead(notif.id); }}
                          style={{
                            display: "flex", alignItems: "center", gap: "4px",
                            background: "none", border: "none", fontSize: "12px",
                            color: "#0072BC", fontWeight: 600, cursor: "pointer", padding: 0,
                          }}
                        >
                          <CheckCircle2 size={12} /> Marquer lu
                        </button>
                      )}

                      <button
                        onClick={e => { e.stopPropagation(); clearNotification(notif.id); }}
                        style={{
                          display: "flex", alignItems: "center", gap: "4px",
                          background: "none", border: "none", fontSize: "12px",
                          color: "#94a3b8", cursor: "pointer", padding: 0,
                          marginLeft: "auto",
                        }}
                      >
                        <Trash2 size={12} /> Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </main>
      </div>
    </div>
  );
};

export default Notifications;
