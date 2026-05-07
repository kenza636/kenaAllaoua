// frontend-medecin/src/components/Toast.jsx
import { useEffect } from "react";
import { CheckCircle, XCircle, Clock, X } from "lucide-react";
import { useSocket } from "../contexts/SocketContext";

function Toast() {
  const { toast, clearToast } = useSocket();

  useEffect(() => {
    if (toast) {
      // Auto-fermeture apres 5 secondes
      const timer = setTimeout(() => clearToast(), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  if (!toast) return null;

  const config = {
    success: { color: "#10B981", icon: <CheckCircle size={24} /> },
    error:   { color: "#EF4444", icon: <XCircle size={24} /> },
    warning: { color: "#F59E0B", icon: <Clock size={24} /> },
  };

  const { color, icon } = config[toast.type] || config.success;

  return (
    <div style={{
      position: "fixed",
      top: "24px",
      right: "24px",
      zIndex: 9999,
      background: "#FFFFFF",
      borderRadius: "16px",
      padding: "16px 20px",
      boxShadow: "0 20px 40px -12px rgba(15, 23, 42, 0.25)",
      display: "flex",
      alignItems: "flex-start",
      gap: "14px",
      minWidth: "320px",
      maxWidth: "420px",
      borderLeft: `4px solid ${color}`,
      animation: "slideInRight 0.3s ease",
    }}>
      <div style={{ color, flexShrink: 0, marginTop: "2px" }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#0F172A" }}>
          {toast.title}
        </h4>
        <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#64748B" }}>
          {toast.message}
        </p>
      </div>
      <button
        onClick={clearToast}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#94A3B8",
          padding: 0,
        }}
      >
        <X size={18} />
      </button>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default Toast;
