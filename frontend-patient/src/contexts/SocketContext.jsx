// frontend-patient/src/contexts/SocketContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useUser } from "./UserContext";
import { useNotifications } from "./NotificationsContext";

const SocketContext = createContext();

// Always use the real ID from the JWT so it matches id_patient in appointments
// (bypasses DEV_MODE in UserContext which hardcodes id=71)
function getPatientIdFromToken() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.id ?? null;
  } catch { return null; }
}

export function SocketProvider({ children }) {
  const { user } = useUser();
  const { addNotification } = useNotifications();
  const [socket, setSocket] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);

  useEffect(() => {
    const patientId = getPatientIdFromToken() ?? user?.id;
    if (!patientId) return;

    const newSocket = io("http://localhost:5000");

    newSocket.on("connect", () => {
      console.log("[Socket patient] Connecte — id:", patientId);
      newSocket.emit("register", { userId: patientId, role: "patient" });
    });

    newSocket.on("incoming-call", (data) => {
      console.log("[Socket] Appel entrant", data);
      setIncomingCall(data);
    });

    // Appel manque envoye par le backend (timeout serveur ou medecin annule)
    newSocket.on("call-missed-self", (data) => {
      console.log("[Socket] Appel manque", data);
      addNotification({
        type: "missed-call",
        title: "Appel manqué",
        message: `${data.doctorName} a essayé de vous joindre`,
      });
      setIncomingCall(null); // ferme la popup au cas ou
    });

    newSocket.on("disconnect", () => {
      console.log("[Socket patient] Deconnecte");
    });

    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, [user]);

  const clearIncomingCall = () => setIncomingCall(null);

  return (
    <SocketContext.Provider value={{ socket, incomingCall, clearIncomingCall }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}

export default SocketContext;
