import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "./UserContext";

const NotificationsContext = createContext();
const API = "http://localhost:5000/api";

export function NotificationsProvider({ children }) {
  const { user } = useUser();
  const [notifications, setNotifications] = useState([]);
  const syncedIds = useRef(new Set());

  const doctorId = user?.id || user?.id_u;

  const fetchNotifs = useCallback(async () => {
    if (!doctorId) return;
    try {
      const res  = await fetch(`${API}/notifications/${doctorId}?role=medecin`);
      if (!res.ok) return;
      const rows = await res.json();
      setNotifications(prev => {
        const newOnes = rows
          .filter(r => !syncedIds.current.has(r.id))
          .map(r => { syncedIds.current.add(r.id); return r; });
        if (!newOnes.length) {
          // Still refresh read states
          return prev.map(n => {
            const fresh = rows.find(r => r.id === n.id);
            return fresh ? { ...n, is_read: fresh.is_read } : n;
          });
        }
        const merged = [...rows.map(r => ({ ...r }))];
        merged.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        return merged;
      });
    } catch { /* non-blocking */ }
  }, [doctorId]);

  // Initial fetch + 30-sec poll
  useEffect(() => {
    fetchNotifs();
    const iv = setInterval(fetchNotifs, 30_000);
    return () => clearInterval(iv);
  }, [fetchNotifs]);

  const markAsRead = useCallback((id) => {
    fetch(`${API}/notifications/${id}/read`, { method: "PUT" }).catch(() => {});
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
  }, []);

  const markAllAsRead = useCallback(() => {
    if (!doctorId) return;
    fetch(`${API}/notifications/all-read/bulk`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_user: doctorId, user_role: "medecin" }),
    }).catch(() => {});
    setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
  }, [doctorId]);

  const clearNotif = useCallback((id) => {
    fetch(`${API}/notifications/${id}`, { method: "DELETE" }).catch(() => {});
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, clearNotif, fetchNotifs }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}
