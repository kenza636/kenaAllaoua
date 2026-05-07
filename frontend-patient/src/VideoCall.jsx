import React, { useEffect, useRef, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PhoneOff } from "lucide-react";
import { UserContext } from "./contexts/UserContext";

function VideoCall() {
  const { roomId }  = useParams();
  const navigate    = useNavigate();
  const { user }    = useContext(UserContext);
  const jitsiContainerRef = useRef(null);
  const [api, setApi]           = useState(null);
  const [doctorInfo, setDoctorInfo] = useState(null);

  const patientName = user ? `${user.prenom} ${user.nom}` : "Patient";

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

      // Recuperer les infos de la salle depuis le backend
      try {
        const res = await fetch(`http://localhost:5000/api/teleconsultation/room/${roomId}`);
        if (res.ok) {
          const data = await res.json();
          setDoctorInfo(data.doctor);
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
          displayName: patientName,
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
            "fullscreen", "hangup", "chat",
            "raisehand", "videoquality", "filmstrip", "tileview",
          ],
        },
      };

      const jitsiApi = new window.JitsiMeetExternalAPI(domain, options);
      setApi(jitsiApi);

      jitsiApi.addEventListener("readyToClose", () => {
        handleEndCall(jitsiApi);
      });
    };

    startJitsi();

    return () => {
      if (api) api.dispose();
    };
  }, [roomId]);

  const handleEndCall = (apiToUse = api) => {
    if (apiToUse) apiToUse.dispose();
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
        <div>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>
            Consultation en cours
          </h3>
          <p style={{ margin: 0, fontSize: "13px", color: "#64748B" }}>
            {doctorInfo ? `Avec ${doctorInfo.name}` : "Connexion au médecin..."}
          </p>
        </div>

        <button
          onClick={() => handleEndCall()}
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
          }}
        >
          <PhoneOff size={18} /> Quitter
        </button>
      </div>

      <div ref={jitsiContainerRef} style={{ flex: 1, background: "#000" }} />
    </div>
  );
}

export default VideoCall;
