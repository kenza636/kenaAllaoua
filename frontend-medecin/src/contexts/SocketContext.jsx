// frontend-medecin/src/contexts/SocketContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useUser } from "./UserContext";

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const { user } = useUser();
  const [socket, setSocket] = useState(null);
  const [toast, setToast] = useState(null); // { type, title, message }

  useEffect(() => {
    const medecinId = user?.id;
    if (!medecinId) return;

    const newSocket = io("http://localhost:5000");

    newSocket.on("connect", () => {
      console.log("[Socket medecin] Connecte");
      newSocket.emit("register", { userId: medecinId, role: "medecin" });
    });

    // Patient a rejoint
    newSocket.on("call-accepted", (data) => {
      setToast({
        type: "success",
        title: "Patient en ligne",
        message: "Le patient a rejoint la consultation",
      });
    });

    // Patient a refuse
    newSocket.on("call-rejected", (data) => {
      setToast({
        type: "error",
        title: "Appel refusé",
        message: `${data.patientName} a refusé l'appel`,
      });
    });

    // Patient a reporte
    newSocket.on("call-postponed", (data) => {
      setToast({
        type: "warning",
        title: `Appel reporté de ${data.minutes} min`,
        message: `${data.patientName} vous rappellera dans ${data.minutes} minutes`,
        appointmentId: data.appointmentId,
        scheduledAt: data.scheduledAt,
      });
    });

    // Patient n'a pas répondu (timeout 30 s)
    newSocket.on("call-missed", (data) => {
      setToast({
        type: "error",
        title: "Appel manqué",
        message: `${data.patientName} n'a pas répondu`,
      });
    });

    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, [user]);

  const clearToast = () => setToast(null);

  return (
    <SocketContext.Provider value={{ socket, toast, clearToast }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
