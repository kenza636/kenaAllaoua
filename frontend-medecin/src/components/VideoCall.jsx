// frontend-medecin/src/components/VideoCall.jsx
import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PhoneOff, User } from "lucide-react";
import { useUser } from "../contexts/UserContext";
import { useSocket } from "../contexts/SocketContext";

function VideoCall() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const { socket } = useSocket();
  const jitsiContainerRef = useRef(null);
  const apiRef = useRef(null);
  const [patientInfo, setPatientInfo] = useState(null);
  const [patientJoined, setPatientJoined] = useState(false);

  useEffect(() => {
    const loadJitsiScript = () => {
      return new Promise((resolve) => {
        if (window.JitsiMeetExternalAPI) {
          resolve();
          return;
        }
        const script = document.createElement("script");
        script.src = "https://meet.jit.si/external_api.js";
        script.async = true;
        script.onload = () => resolve();
        document.body.appendChild(script);
      });
    };

    const startJitsi = async () => {
      await loadJitsiScript();

      try {
        const res = await fetch(`http://localhost:5000/api/teleconsultation/room/${roomId}`);
        if (res.ok) {
          const data = await res.json();
          setPatientInfo(data.patient);
        }
      } catch (err) {
        console.warn("Pas d'infos backend");
      }

      const domain = "meet.jit.si";
      const options = {
        roomName: roomId,
        width: "100%",
        height: "100%",
        parentNode: jitsiContainerRef.current,
        userInfo: {
          displayName: `Dr. ${user.prenom} ${user.nom}`,
          email: user.email,
        },
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          TOOLBAR_BUTTONS: [
            "microphone", "camera", "closedcaptions", "desktop",
            "fullscreen", "hangup", "chat", "recording",
            "raisehand", "videoquality", "filmstrip", "tileview",
          ],
        },
      };

      const jitsiApi = new window.JitsiMeetExternalAPI(domain, options);
      apiRef.current = jitsiApi;

      // Detecter quand le patient rejoint
      jitsiApi.addEventListener("participantJoined", (participant) => {
        console.log("[Jitsi] Participant rejoint :", participant);
        setPatientJoined(true);
      });

      jitsiApi.addEventListener("readyToClose", () => {
        handleEndCall();
      });
    };

    startJitsi();

    return () => {
      if (apiRef.current) apiRef.current.dispose();
    };
  }, [roomId]);

  // Ecouter les evenements Socket.io
  useEffect(() => {
    if (!socket) return;

    const handleAccepted = () => {
      console.log("[VideoCall] Patient a accepte");
      setPatientJoined(true);
    };

    socket.on("call-accepted", handleAccepted);
    return () => socket.off("call-accepted", handleAccepted);
  }, [socket]);

  const handleEndCall = async () => {
    if (apiRef.current) {
      apiRef.current.dispose();
      apiRef.current = null;
    }

    try {
      // Si le patient n'a pas rejoint, on ANNULE (= appel manque pour lui)
      // Sinon c'est juste une fin d'appel normale
      if (patientJoined) {
        await fetch(`http://localhost:5000/api/teleconsultation/end/${roomId}`, {
          method: "POST",
        });
      } else {
        await fetch(`http://localhost:5000/api/teleconsultation/cancel`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId }),
        });
      }
    } catch (err) {
      console.warn("Impossible de notifier le backend");
    }

    navigate("/");
  };

  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "#0F172A",
      display: "flex",
      flexDirection: "column",
      zIndex: 9999,
    }}>
      <div style={{
        background: "#FFFFFF",
        padding: "16px 32px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "44px", height: "44px", borderRadius: "50%",
            background: "#DBEAFE", color: "#2563EB",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: "800",
          }}>
            {patientInfo ? patientInfo.name.charAt(0) : <User size={20} />}
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>
              {patientJoined ? "Téléconsultation en cours" : "En attente du patient..."}
            </h3>
            <p style={{ margin: 0, fontSize: "13px", color: "#64748B" }}>
              {patientInfo
                ? `Avec ${patientInfo.name}`
                : "Connexion..."}
            </p>
          </div>
        </div>

        <button
          onClick={handleEndCall}
          style={{
            background: "#EF4444",
            color: "#FFFFFF",
            border: "none",
            padding: "10px 20px",
            borderRadius: "12px",
            fontWeight: "600",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
          }}
        >
          <PhoneOff size={18} /> {patientJoined ? "Terminer" : "Annuler"}
        </button>
      </div>

      <div ref={jitsiContainerRef} style={{ flex: 1, background: "#000" }} />
    </div>
  );
}

export default VideoCall;
