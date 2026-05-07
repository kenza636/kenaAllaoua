import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

export const NotificationsContext = createContext();

const API_URL = "http://localhost:5000/api";

function getStoredUser() {
  try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
}

export function NotificationsProvider({ children }) {
  const [notifications, setNotifications] = useState(() => {
    try {
      const stored = localStorage.getItem("notifications");
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  const syncedDbIds = useRef(new Set()); // track which DB ids we've already merged

  // Persist local notifications
  useEffect(() => {
    localStorage.setItem("notifications", JSON.stringify(notifications));
  }, [notifications]);

  // ── Merge DB rows into state (deduplicate by dbId) ───────────────
  const mergeDbNotifications = useCallback((rows) => {
    if (!rows.length) return;
    setNotifications(prev => {
      const newOnes = rows
        .filter(r => !syncedDbIds.current.has(r.id))
        .map(r => {
          syncedDbIds.current.add(r.id);
          return {
            id:        `db_${r.id}`,
            dbId:      r.id,
            title:     r.title,
            desc:      r.message,
            type:      r.type,
            read:      !!r.is_read,
            timestamp: r.created_at,
            source:    "db",
          };
        });
      if (!newOnes.length) return prev;
      // Merge: DB notifications first, then local ones, sorted by timestamp
      const merged = [...newOnes, ...prev].sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );
      return merged;
    });
  }, []);

  // ── Fetch from DB ────────────────────────────────────────────────
  const fetchDbNotifications = useCallback(async (userId) => {
    if (!userId) return;
    try {
      const res  = await fetch(`${API_URL}/notifications/${userId}?role=patient`);
      if (!res.ok) return;
      const rows = await res.json();
      mergeDbNotifications(rows);
      // Sync read states back from DB
      setNotifications(prev =>
        prev.map(n => {
          if (!n.dbId) return n;
          const dbRow = rows.find(r => r.id === n.dbId);
          return dbRow ? { ...n, read: !!dbRow.is_read } : n;
        })
      );
    } catch { /* non-blocking */ }
  }, [mergeDbNotifications]);

  // ── On mount: initial fetch + polling ────────────────────────────
  useEffect(() => {
    const user = getStoredUser();
    if (!user?.id) return;
    fetchDbNotifications(user.id);
    const interval = setInterval(() => fetchDbNotifications(user.id), 60_000);
    return () => clearInterval(interval);
  }, [fetchDbNotifications]);

  // ── addNotification ───────────────────────────────────────────────
  const addNotification = useCallback((titleOrObj, desc) => {
    const notif = typeof titleOrObj === "string" ? { title: titleOrObj, desc } : titleOrObj;
    setNotifications(prev => {
      const isDuplicate = prev.some(
        n => n.title === notif.title && n.desc === notif.desc
          && Date.now() - new Date(n.timestamp).getTime() < 5000
      );
      if (isDuplicate) return prev;
      return [{
        id: Date.now(), timestamp: new Date().toISOString(),
        read: false, source: "local", ...notif,
      }, ...prev];
    });
  }, []);

  // ── markAsRead ────────────────────────────────────────────────────
  const markAsRead = useCallback((id) => {
    setNotifications(prev => {
      const notif = prev.find(n => n.id === id);
      if (notif?.dbId) {
        fetch(`${API_URL}/notifications/${notif.dbId}/read`, { method: "PUT" }).catch(() => {});
      }
      return prev.map(n => n.id === id ? { ...n, read: true } : n);
    });
  }, []);

  // ── markAllAsRead ─────────────────────────────────────────────────
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    const user = getStoredUser();
    if (user?.id) {
      fetch(`${API_URL}/notifications/all-read/bulk`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_user: user.id, user_role: "patient" }),
      }).catch(() => {});
    }
  }, []);

  // ── clearNotification ─────────────────────────────────────────────
  const clearNotification = useCallback((id) => {
    setNotifications(prev => {
      const notif = prev.find(n => n.id === id);
      if (notif?.dbId) {
        fetch(`${API_URL}/notifications/${notif.dbId}`, { method: "DELETE" }).catch(() => {});
      }
      return prev.filter(n => n.id !== id);
    });
  }, []);

  const removeNotification = clearNotification;

  // ── clearAll ──────────────────────────────────────────────────────
  const clearAll = useCallback(() => {
    setNotifications(prev => {
      prev.forEach(n => {
        if (n.dbId) {
          fetch(`${API_URL}/notifications/${n.dbId}`, { method: "DELETE" }).catch(() => {});
        }
      });
      return [];
    });
    localStorage.removeItem("notifications");
  }, []);

  // ── Appointment reminders (unchanged logic) ───────────────────────
  const checkUpcomingRdv = useCallback(async (userId) => {
    if (!userId) return;
    try {
      const res  = await fetch(`${API_URL}/rdv/patient/${userId}`);
      const rdvs = await res.json();
      const now  = new Date();

      rdvs.forEach(rdv => {
        if (rdv.statut !== "confirme") return;
        const localDay = (iso) => { const d = new Date(iso); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
        const rdvDate = new Date(`${localDay(rdv.date)}T${rdv.heure_debut}`);
        const diffH   = (rdvDate - now) / 3_600_000;
        const dateStr = rdvDate.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
        const heureStr = rdv.heure_debut.substring(0, 5);
        const docName  = `Dr. ${rdv.medecin_prenom} ${rdv.medecin_nom}`;

        if (diffH > 0 && diffH <= 48) {
          const key = `rappel_j1_${rdv.id_rdv}`;
          if (!localStorage.getItem(key)) {
            addNotification({ title: "📅 Rendez-vous demain", desc: `Votre RDV avec ${docName} est le ${dateStr} à ${heureStr}`, type: "rappel" });
            localStorage.setItem(key, Date.now().toString());
          }
        }
        if (diffH > 0 && diffH <= 2) {
          const key = `rappel_h1_${rdv.id_rdv}`;
          if (!localStorage.getItem(key)) {
            addNotification({
              title: "⏰ Rendez-vous dans 1 heure",
              desc: `Votre RDV avec ${docName} commence à ${heureStr}. ${rdv.type_consultation === "teleconsultation" ? "Le lien vidéo va arriver." : `Adresse: ${rdv.lieu}`}`,
              type: "rappel_urgent",
            });
            localStorage.setItem(key, Date.now().toString());
          }
        }
      });
    } catch (err) {
      console.error("Erreur vérification rappels:", err);
    }
  }, [addNotification]);

  useEffect(() => {
    const user = getStoredUser();
    if (!user) return;
    checkUpcomingRdv(user.id);
    const interval = setInterval(() => checkUpcomingRdv(user.id), 60_000);
    return () => clearInterval(interval);
  }, [checkUpcomingRdv]);

  return (
    <NotificationsContext.Provider value={{
      notifications, setNotifications,
      addNotification, markAsRead, markAllAsRead,
      clearNotification, removeNotification, clearAll, checkUpcomingRdv,
    }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}

export default NotificationsContext;
