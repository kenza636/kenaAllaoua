// frontend-patient/src/components/IncomingCallModal.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, PhoneOff, Clock, Video } from "lucide-react";
import { useSocket } from "../contexts/SocketContext";
import { useNotifications } from "../contexts/NotificationsContext";

const RING_TIMEOUT_SECONDS = 30; // l'appel sonne 30 secondes max

function IncomingCallModal() {
  const { incomingCall, clearIncomingCall, socket } = useSocket();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  const [showPostponeMenu, setShowPostponeMenu] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RING_TIMEOUT_SECONDS);

  // Reset le timer quand un nouvel appel arrive
  useEffect(() => {
    if (incomingCall) {
      setSecondsLeft(RING_TIMEOUT_SECONDS);
      setShowPostponeMenu(false);
    }
  }, [incomingCall]);

  // Decompte 30 -> 0  (handleTimeout défini ici pour éviter le stale closure)
  useEffect(() => {
    if (!incomingCall) return;

    const currentCall = incomingCall; // snapshot stable pour ce cycle

    const doTimeout = async () => {
      try {
        await fetch("http://localhost:5000/api/teleconsultation/missed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId: currentCall.roomId }),
        });
      } catch { /* non-blocking */ }
      addNotification({
        type: "missed-call",
        title: "Appel manqué",
        message: `${currentCall.doctor.name} a essayé de vous joindre`,
      });
      clearIncomingCall();
    };

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          doTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [incomingCall]); // eslint-disable-line react-hooks/exhaustive-deps

  // Ecouter "call-cancelled" : le medecin a raccroche avant qu'on reponde
  useEffect(() => {
    if (!socket) return;

    const handleCancelled = (data) => {
      console.log("[Modal] Appel annule par le medecin", data);

      // Si c'etait un appel manque, ajouter une notification
      if (data.wasMissed) {
        addNotification({
          type: "missed-call",
          title: "Appel manqué",
          message: `${data.doctorName} a essayé de vous joindre`,
        });
      }

      clearIncomingCall();
    };

    socket.on("call-cancelled", handleCancelled);
    return () => socket.off("call-cancelled", handleCancelled);
  }, [socket]);

  if (!incomingCall) return null;

  const handleAccept = async () => {
    try {
      await fetch("http://localhost:5000/api/teleconsultation/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: incomingCall.roomId }),
      });
    } catch (err) {
      console.warn("Backend indisponible");
    }
    const roomId = incomingCall.roomId;
    clearIncomingCall();
    navigate(`/teleconsultation/${roomId}`);
  };

  const handleReject = async () => {
    try {
      await fetch("http://localhost:5000/api/teleconsultation/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: incomingCall.roomId }),
      });
    } catch (err) {
      console.warn("Backend indisponible");
    }
    addNotification({
      type: "call-rejected",
      title: "Appel refusé",
      message: `Vous avez refusé l'appel de ${incomingCall.doctor.name}`,
    });
    clearIncomingCall();
  };

  const handlePostpone = async (minutes) => {
    try {
      await fetch("http://localhost:5000/api/teleconsultation/postpone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: incomingCall.roomId, minutes }),
      });
    } catch (err) {
      console.warn("Backend indisponible");
    }
    addNotification({
      type: "call-postponed",
      title: `Appel reporté de ${minutes} min`,
      message: `${incomingCall.doctor.name} sera notifié.`,
    });
    clearIncomingCall();
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(15, 23, 42, 0.85)",
      backdropFilter: "blur(8px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 10000,
      animation: "fadeIn 0.3s ease",
    }}>
      <div style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "32px",
        padding: "40px 32px",
        width: "min(400px, 90%)",
        textAlign: "center",
        boxShadow: "0 40px 80px -20px rgba(15, 23, 42, 0.5)",
        animation: "slideUp 0.4s ease",
      }}>
        {/* Indicateur + countdown */}
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "6px 14px",
          borderRadius: "20px",
          background: "#DBEAFE",
          color: "#2563EB",
          fontSize: "13px",
          fontWeight: "700",
          marginBottom: "24px",
          animation: "pulse 1.5s infinite",
        }}>
          <Video size={14} />
          APPEL ENTRANT · {secondsLeft}s
        </div>

        <div style={{
          width: "100px",
          height: "100px",
          borderRadius: "50%",
          backgroundColor: "#2563EB",
          color: "#FFFFFF",
          fontSize: "40px",
          fontWeight: "800",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 16px",
          boxShadow: "0 8px 24px -4px rgba(37, 99, 235, 0.5)",
          animation: "ringPulse 1.5s infinite",
        }}>
          {incomingCall.doctor.name.split(" ").map(w => w.charAt(0)).join("").substring(0, 2).toUpperCase()}
        </div>

        <h2 style={{
          fontSize: "24px",
          fontWeight: "800",
          color: "#0F172A",
          marginBottom: "6px",
        }}>
          {incomingCall.doctor.name}
        </h2>
        <p style={{ color: "#64748B", fontSize: "14px", marginBottom: "32px" }}>
          Téléconsultation
        </p>

        {!showPostponeMenu ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <button onClick={handleAccept} style={btnAccept}>
              <Phone size={18} /> Rejoindre
            </button>
            <button onClick={() => setShowPostponeMenu(true)} style={btnPostpone}>
              <Clock size={18} /> Reporter
            </button>
            <button onClick={handleReject} style={btnReject}>
              <PhoneOff size={18} /> Refuser
            </button>
          </div>
        ) : (
          <>
            <p style={{ color: "#64748B", fontSize: "14px", marginBottom: "16px" }}>
              Reporter l'appel de :
            </p>
            <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
              <button onClick={() => handlePostpone(5)} style={btnPostponeChoice}>
                <Clock size={16} /> 5 minutes
              </button>
              <button onClick={() => handlePostpone(10)} style={btnPostponeChoice}>
                <Clock size={16} /> 10 minutes
              </button>
            </div>
            <button onClick={() => setShowPostponeMenu(false)} style={btnBack}>
              ← Retour
            </button>
          </>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes ringPulse {
          0%, 100% { box-shadow: 0 8px 24px -4px rgba(37, 99, 235, 0.5), 0 0 0 0 rgba(37, 99, 235, 0.5); }
          50% { box-shadow: 0 8px 24px -4px rgba(37, 99, 235, 0.5), 0 0 0 20px rgba(37, 99, 235, 0); }
        }
      `}</style>
    </div>
  );
}

const btnBase = {
  padding: "14px 20px",
  borderRadius: "16px",
  border: "none",
  fontWeight: "700",
  fontSize: "15px",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "10px",
  transition: "all 0.2s ease",
  width: "100%",
};

const btnAccept = { ...btnBase, background: "#10B981", color: "#FFFFFF", boxShadow: "0 8px 20px -4px rgba(16, 185, 129, 0.5)" };
const btnPostpone = { ...btnBase, background: "#F59E0B", color: "#FFFFFF", boxShadow: "0 8px 20px -4px rgba(245, 158, 11, 0.4)" };
const btnReject = { ...btnBase, background: "#EF4444", color: "#FFFFFF", boxShadow: "0 8px 20px -4px rgba(239, 68, 68, 0.4)" };
const btnPostponeChoice = { ...btnBase, background: "#F1F5F9", color: "#0F172A", flex: 1 };
const btnBack = { background: "none", border: "none", color: "#64748B", cursor: "pointer", fontSize: "14px", padding: "8px" };

export default IncomingCallModal;
