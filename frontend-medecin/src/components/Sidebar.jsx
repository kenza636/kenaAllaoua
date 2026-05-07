import { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { useUser, getInitiales } from "../contexts/UserContext";
import { useNotifications } from "../contexts/NotificationsContext";
import logoStatic   from "@shared-assets/logo-static.svg";
import logoAnimated from "@shared-assets/mediko-logo-cross-ecg-hover.svg";
import MedikoLogoAnimated from "@shared-assets/MedikoLogoAnimated";

const STATUS_BADGE = {
  en_attente: { label: "En attente d'approbation", bg: "#fef3c7", color: "#92400e", dot: "#f59e0b" },
  approuvé:   { label: "Approuvé",                 bg: "#d1fae5", color: "#065f46", dot: "#10b981" },
  rejeté:     { label: "Rejeté",                   bg: "#fee2e2", color: "#991b1b", dot: "#ef4444" },
};

function timeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1)  return "À l'instant";
  if (m < 60) return `Il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Il y a ${h} h`;
  return `Il y a ${Math.floor(h / 24)} j`;
}

function Sidebar() {
  const { user, setUser } = useUser();
  const navigate          = useNavigate();
  const initiales  = getInitiales(user.prenom, user.nom);
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotif } = useNotifications();
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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
    const elapsed       = Date.now() - (animStartRef.current ?? Date.now());
    const timeInCycle   = elapsed % CYCLE_MS;
    const remaining     = CYCLE_MS - timeInCycle;
    animTimer.current   = setTimeout(() => setLogoAnimating(false), remaining + 3 * CYCLE_MS);
  };

  useEffect(() => () => clearTimeout(animTimer.current), []);
  const nomAffiche = `Dr. ${user.prenom}`;
  const statut     = user.statut || "en_attente";
  const isPending  = statut === "en_attente";
  const isRejected = statut === "rejeté";
  const badge      = STATUS_BADGE[statut] || STATUS_BADGE.en_attente;

  const handleLogout = () => {
    localStorage.removeItem("medecin_user");
    localStorage.removeItem("medecin_token");
    localStorage.removeItem("token");
    window.location.replace("http://localhost:5173");
  };

  const navItem = (to, icon, label, locked = false, end = false) => {
    if (locked) {
      return (
        <div
          key={to}
          className="nav-item"
          style={{ opacity: 0.4, cursor: "not-allowed", userSelect: "none" }}
          title="Fonctionnalité disponible après approbation"
        >
          <span className="icon">{icon}</span> {label}
          <span style={{ marginLeft: "auto", fontSize: "10px", color: "#94a3b8" }}>🔒</span>
        </div>
      );
    }
    return (
      <NavLink
        key={to}
        to={to}
        end={end}
        className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
      >
        <span className="icon">{icon}</span> {label}
      </NavLink>
    );
  };

  return (
    <div className="sidebar">
      <div className="logo-section" style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "12px", marginTop: "-8px" }}>
        <img
          src={logoAnimating ? logoAnimated : logoStatic}
          alt="Logo Mediko"
          onMouseEnter={handleLogoMouseEnter}
          onMouseLeave={handleLogoMouseLeave}
          style={{ width: "120px", height: "auto", cursor: "pointer" }}
        />
        <MedikoLogoAnimated standalone={false} fontSize={26} />
      </div>

      {/* Doctor card */}
      <NavLink
        to="/profile"
        className={({ isActive }) => isActive ? "user-card-link active" : "user-card-link"}
        style={{ marginBottom: "8px" }}
      >
        <div className="avatar-blue">{initiales}</div>
        <div className="user-details">
          <p className="user-name">{nomAffiche}</p>
          <p className="user-role">{user.specialite}</p>
        </div>
      </NavLink>

      {/* Status badge */}
      <div style={{
        display: "flex", alignItems: "center", gap: "6px",
        background: badge.bg, color: badge.color,
        borderRadius: "20px", padding: "5px 12px",
        fontSize: "11px", fontWeight: "600",
        margin: "0 0 20px",
      }}>
        <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: badge.dot, flexShrink: 0 }} />
        {badge.label}
      </div>

      {/* Rejection notice */}
      {isRejected && user.rejection_reason && (
        <div style={{
          background: "#fef2f2", border: "1px solid #fecaca",
          borderRadius: "10px", padding: "10px 12px", marginBottom: "16px",
          fontSize: "12px", color: "#7f1d1d",
        }}>
          <strong>Motif :</strong> {user.rejection_reason}
        </div>
      )}

      <nav className="nav-menu" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {navItem("/", "📅", "Rendez-vous", false, true)}
        {navItem("/disponibilites", "🕐", "Disponibilités", isPending || isRejected)}
        {navItem("/patients",       "👥", "Patients",       isPending || isRejected)}
      </nav>

      {/* ── Notification bell ── */}
      <div ref={notifRef} style={{ position: "relative", margin: "0 0 10px" }}>
        <button
          onClick={() => setNotifOpen(v => !v)}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: "10px",
            padding: "10px 14px", borderRadius: "12px",
            background: notifOpen ? "#eff6ff" : "transparent",
            border: "1px solid",
            borderColor: notifOpen ? "#bfdbfe" : "transparent",
            cursor: "pointer", transition: "all .15s", position: "relative",
          }}
        >
          <Bell size={18} color={notifOpen ? "#2563eb" : "#64748b"} />
          <span style={{ fontSize: "14px", fontWeight: 600, color: notifOpen ? "#2563eb" : "#475569" }}>
            Notifications
          </span>
          {unreadCount > 0 && (
            <span style={{
              marginLeft: "auto", background: "#ef4444", color: "#fff",
              borderRadius: "999px", minWidth: "20px", height: "20px",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "11px", fontWeight: 700, padding: "0 5px",
            }}>
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {notifOpen && (
          <div style={{
            position: "fixed", bottom: "120px", left: "220px",
            width: "320px", maxHeight: "420px",
            background: "#fff", borderRadius: "16px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 20px 50px rgba(15,23,42,0.18)",
            zIndex: 9999, overflow: "hidden",
            display: "flex", flexDirection: "column",
          }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderBottom: "1px solid #f1f5f9" }}>
              <span style={{ fontWeight: 700, fontSize: "15px", color: "#0f172a" }}>
                Notifications
                {unreadCount > 0 && (
                  <span style={{ marginLeft: "8px", background: "#ef4444", color: "#fff", borderRadius: "999px", padding: "2px 7px", fontSize: "11px", fontWeight: 700 }}>
                    {unreadCount}
                  </span>
                )}
              </span>
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} style={{ background: "none", border: "none", fontSize: "12px", color: "#2563eb", fontWeight: 600, cursor: "pointer" }}>
                  Tout lire ✓
                </button>
              )}
            </div>

            {/* List */}
            <div style={{ overflowY: "auto", flex: 1 }}>
              {notifications.length === 0 ? (
                <div style={{ padding: "32px 16px", textAlign: "center", color: "#94a3b8" }}>
                  <Bell size={28} style={{ opacity: .3, marginBottom: "8px" }} />
                  <p style={{ margin: 0, fontSize: "13px" }}>Aucune notification</p>
                </div>
              ) : notifications.slice(0, 15).map(n => (
                <div
                  key={n.id}
                  onClick={() => markAsRead(n.id)}
                  style={{
                    display: "flex", gap: "10px", padding: "12px 14px",
                    borderBottom: "1px solid #f8fafc", cursor: "pointer",
                    background: n.is_read ? "#fff" : "#f8fbff",
                    transition: "background .15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f1f5f9"}
                  onMouseLeave={e => e.currentTarget.style.background = n.is_read ? "#fff" : "#f8fbff"}
                >
                  <div style={{
                    width: "34px", height: "34px", borderRadius: "50%", flexShrink: 0,
                    background: n.is_read ? "#f1f5f9" : "#eff6ff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "15px",
                  }}>
                    {n.type === "booking" ? "📅" : "ℹ️"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: "0 0 2px", fontSize: "13px", fontWeight: n.is_read ? 500 : 700, color: "#0f172a", lineHeight: 1.3 }}>
                      {n.title}
                    </p>
                    <p style={{ margin: "0 0 3px", fontSize: "12px", color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {n.message}
                    </p>
                    <p style={{ margin: 0, fontSize: "11px", color: "#94a3b8" }}>{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.is_read && <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#2563eb", flexShrink: 0, marginTop: "4px" }} />}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="sidebar-footer">
        <button className="logout-btn-full" onClick={handleLogout}>
          <span className="icon">🚪</span> Déconnexion
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
