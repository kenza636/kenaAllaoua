import React, { useState, useContext, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { UserContext } from "./contexts/UserContext";
import { useNotifications } from "./contexts/NotificationsContext";
import logoStatic    from "@shared-assets/logo-static.svg";
import logoAnimated  from "@shared-assets/mediko-logo-cross-ecg-animated.svg";
import MedikoLogoAnimated from "@shared-assets/MedikoLogoAnimated";

const NOTIF_ICONS = {
  booking:       "✅",
  rappel:        "📅",
  rappel_urgent: "⏰",
  info:          "ℹ️",
  error:         "⚠️",
};

function timeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1)  return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  return `il y a ${Math.floor(h / 24)} j`;
}

const Header = ({ pageTitle }) => {
  const [menuOpen,       setMenuOpen]       = useState(false);
  const [notifOpen,      setNotifOpen]      = useState(false);
  const [logoAnimating,  setLogoAnimating]  = useState(false);

  const { user, logout }                  = useContext(UserContext);
  const { notifications, markAsRead, markAllAsRead, clearNotification } = useNotifications();
  const navigate     = useNavigate();
  const menuRef      = useRef(null);
  const notifRef     = useRef(null);
  const animTimer    = useRef(null);

  const unread = notifications.filter(n => !n.read).length;
  const recent = notifications.slice(0, 6);

  const handleLogout = () => { logout(); setMenuOpen(false); navigate("/"); };

  const handleLogoMouseEnter = () => {
    clearTimeout(animTimer.current);
    setLogoAnimating(true);
  };
  const handleLogoMouseLeave = () => {
    animTimer.current = setTimeout(() => setLogoAnimating(false), 4000);
  };

  useEffect(() => () => clearTimeout(animTimer.current), []);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current  && !menuRef.current.contains(e.target))  setMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleNotifClick = (n) => {
    if (!n.read) markAsRead(n.id);
  };

  return (
    <header className="app-header">
      {/* Brand */}
      <div className="brand" style={{ display:"flex", alignItems:"center", gap:"10px" }}>
        <img
          src={logoAnimating ? logoAnimated : logoStatic}
          alt="Logo Mediko"
          onMouseEnter={handleLogoMouseEnter}
          onMouseLeave={handleLogoMouseLeave}
          style={{ width:"90px", height:"90px", objectFit:"contain", cursor:"pointer", transition:"transform 0.2s ease" }}
        />
        <div>
          <MedikoLogoAnimated standalone={false} fontSize={28} />
          <p style={{ fontSize:"12px", color:"#6b7280", margin:0, fontWeight:400 }}>{pageTitle}</p>
        </div>
      </div>

      <div className="header-icons" style={{ position:"relative", display:"flex", alignItems:"center", gap:"10px" }}>

        {/* ── Notification bell ── */}
        <div style={{ position:"relative" }} ref={notifRef}>
          <button
            onClick={() => { setNotifOpen(v => !v); setMenuOpen(false); }}
            style={{
              width:"42px", height:"42px", borderRadius:"50%",
              background: notifOpen ? "#eff6ff" : "#f8fafc",
              border: notifOpen ? "1.5px solid #bfdbfe" : "1.5px solid #e2e8f0",
              cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
              transition:"all 0.15s",
            }}
            title="Notifications"
          >
            <Bell size={18} color={notifOpen ? "#2563eb" : "#64748b"} />
            {unread > 0 && (
              <span style={{
                position:"absolute", top:"-3px", right:"-3px",
                background:"#ef4444", color:"#fff",
                borderRadius:"999px", minWidth:"18px", height:"18px",
                fontSize:"10px", fontWeight:700,
                display:"flex", alignItems:"center", justifyContent:"center",
                padding:"0 4px", border:"2px solid #fff",
                lineHeight:1,
              }}>
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>

          {/* Notification dropdown */}
          {notifOpen && (
            <div style={{
              position:"absolute", top:"50px", right:0,
              width:"340px", maxHeight:"480px",
              background:"#fff", borderRadius:"16px",
              border:"1px solid #e2e8f0",
              boxShadow:"0 20px 50px rgba(15,23,42,0.14)",
              zIndex:1001, overflow:"hidden",
              display:"flex", flexDirection:"column",
            }}>
              {/* Header */}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 16px", borderBottom:"1px solid #f1f5f9" }}>
                <span style={{ fontWeight:700, fontSize:"15px", color:"#0f172a" }}>
                  Notifications
                  {unread > 0 && (
                    <span style={{ marginLeft:"8px", background:"#ef4444", color:"#fff", borderRadius:"999px", padding:"2px 7px", fontSize:"11px", fontWeight:700 }}>
                      {unread}
                    </span>
                  )}
                </span>
                {unread > 0 && (
                  <button onClick={markAllAsRead}
                    style={{ background:"none", border:"none", fontSize:"12px", color:"#2563eb", fontWeight:600, cursor:"pointer" }}>
                    Tout lire ✓
                  </button>
                )}
              </div>

              {/* List */}
              <div style={{ overflowY:"auto", flex:1 }}>
                {recent.length === 0 ? (
                  <div style={{ padding:"32px 16px", textAlign:"center", color:"#94a3b8" }}>
                    <Bell size={28} style={{ opacity:0.3, marginBottom:"8px" }} />
                    <p style={{ margin:0, fontSize:"13px" }}>Aucune notification</p>
                  </div>
                ) : (
                  recent.map(n => (
                    <div
                      key={n.id}
                      onClick={() => handleNotifClick(n)}
                      style={{
                        display:"flex", gap:"12px", padding:"12px 16px",
                        borderBottom:"1px solid #f8fafc", cursor:"pointer",
                        background: n.read ? "#fff" : "#f8fbff",
                        transition:"background 0.15s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f1f5f9"}
                      onMouseLeave={e => e.currentTarget.style.background = n.read ? "#fff" : "#f8fbff"}
                    >
                      <div style={{
                        width:"36px", height:"36px", borderRadius:"50%",
                        background: n.read ? "#f1f5f9" : "#eff6ff",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:"16px", flexShrink:0,
                      }}>
                        {NOTIF_ICONS[n.type] || "🔔"}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:"4px" }}>
                          <p style={{ margin:"0 0 2px", fontSize:"13px", fontWeight: n.read ? 500 : 700, color:"#0f172a", lineHeight:1.3 }}>
                            {n.title}
                          </p>
                          {!n.read && (
                            <span style={{ width:"7px", height:"7px", borderRadius:"50%", background:"#2563eb", flexShrink:0, marginTop:"3px" }} />
                          )}
                        </div>
                        <p style={{ margin:"0 0 4px", fontSize:"12px", color:"#64748b", lineHeight:1.4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                          {n.desc}
                        </p>
                        <p style={{ margin:0, fontSize:"11px", color:"#94a3b8" }}>{timeAgo(n.timestamp)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div style={{ padding:"10px 16px", borderTop:"1px solid #f1f5f9", textAlign:"center" }}>
                <Link
                  to="/notifications"
                  onClick={() => setNotifOpen(false)}
                  style={{ fontSize:"13px", color:"#2563eb", fontWeight:600, textDecoration:"none" }}
                >
                  Voir toutes les notifications →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* ── User avatar / menu ── */}
        <div style={{ position:"relative" }}>
          <button
            onClick={() => { setMenuOpen(v => !v); setNotifOpen(false); }}
            style={{
              width:"42px", height:"42px", borderRadius:"50%",
              background:"linear-gradient(135deg, #00a884, #0072BC)",
              border:"none", cursor:"pointer",
              color:"white", fontSize:"16px", fontWeight:"700",
              display:"flex", alignItems:"center", justifyContent:"center",
            }}
          >
            {user ? `${user.prenom?.[0] || ""}${user.nom?.[0] || ""}`.toUpperCase() : "👤"}
          </button>

          {menuOpen && (
            <div ref={menuRef} style={{
              position:"absolute", top:"50px", right:0,
              background:"#ffffff", border:"1px solid #e5e7eb",
              borderRadius:"12px", minWidth:"220px",
              boxShadow:"0 10px 25px rgba(0,0,0,0.1)",
              zIndex:1000, overflow:"hidden",
            }}>
              <Link to="/profile"
                style={{ display:"flex", alignItems:"center", gap:"12px", padding:"12px 16px", color:"#1f2937", textDecoration:"none", fontSize:"15px", fontWeight:500, borderBottom:"1px solid #e5e7eb", transition:"background 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                onClick={() => setMenuOpen(false)}
              >
                <span>👤</span><span>Mon profil</span>
              </Link>
              <button
                onClick={handleLogout}
                style={{ width:"100%", display:"flex", alignItems:"center", gap:"12px", padding:"12px 16px", background:"transparent", border:"none", textAlign:"left", color:"#ef4444", fontSize:"15px", fontWeight:600, cursor:"pointer", transition:"background 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.background = "#fee2e2"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <span>↪️</span><span>Se déconnecter</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};

export default Header;
