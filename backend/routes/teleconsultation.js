// backend/routes/teleconsultation.js
const express = require("express");
const router = express.Router();
const db = require('../config/db');

const activeRooms = new Map();
const appointmentToRoom = new Map();
const pendingCallbacks = new Map();
const missedCalls = new Map();

function generateRoomId() {
  return `mediko-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
}

// Helper : enregistrer un appel manque chez le patient
function registerMissedCall(patientId, appointmentId, doctorName) {
  const list = missedCalls.get(patientId) || [];
  list.push({
    appointmentId,
    doctorName,
    timestamp: new Date().toISOString(),
  });
  missedCalls.set(patientId, list);
}

// ============================================
// POST /start - Medecin lance l'appel
// ============================================
router.post("/start", (req, res) => {
  const { appointmentId, patientId, patientName, doctorId, doctorName } = req.body;

  if (!appointmentId) {
    return res.status(400).json({ error: "appointmentId requis" });
  }

  let roomId = appointmentToRoom.get(appointmentId);
  if (roomId && activeRooms.has(roomId)) {
    return res.json({ roomId, existing: true });
  }

  roomId = generateRoomId();
  const roomData = {
    appointmentId,
    patientId,
    patient: { id: patientId, name: patientName || "Patient" },
    doctor: { id: doctorId, name: doctorName || "Medecin" },
    status: "ringing",
    createdAt: new Date().toISOString(),
  };

  activeRooms.set(roomId, roomData);
  appointmentToRoom.set(appointmentId, roomId);
  console.log(`[Teleconsult] Salle creee : ${roomId}`);

  const io = req.app.get("io");
  const activeSockets = req.app.get("activeSockets");
  const patientSocketId = activeSockets.patients.get(patientId);

  if (patientSocketId) {
    io.to(patientSocketId).emit("incoming-call", {
      roomId,
      appointmentId,
      doctor: roomData.doctor,
    });
    console.log(`[Teleconsult] Notif envoyee au patient ${patientId}`);
  }

  res.json({ roomId, existing: false });
});

// ============================================
// GET /room/:roomId
// ============================================
router.get("/room/:roomId", (req, res) => {
  const room = activeRooms.get(req.params.roomId);
  if (!room) return res.status(404).json({ error: "Salle introuvable" });
  res.json(room);
});

// ============================================
// POST /accept - Patient accepte
// ============================================
router.post("/accept", (req, res) => {
  const { roomId } = req.body;
  const room = activeRooms.get(roomId);
  if (!room) return res.status(404).json({ error: "Salle introuvable" });

  room.status = "active";

  const io = req.app.get("io");
  const activeSockets = req.app.get("activeSockets");
  const medecinSocketId = activeSockets.medecins.get(room.doctor.id);
  if (medecinSocketId) {
    io.to(medecinSocketId).emit("call-accepted", {
      roomId,
      appointmentId: room.appointmentId,
    });
  }

  res.json({ success: true });
});

// ============================================
// POST /reject - Patient refuse
// ============================================
router.post("/reject", (req, res) => {
  const { roomId } = req.body;
  const room = activeRooms.get(roomId);
  if (!room) return res.status(404).json({ error: "Salle introuvable" });

  room.status = "rejected";
  appointmentToRoom.delete(room.appointmentId);

  const io = req.app.get("io");
  const activeSockets = req.app.get("activeSockets");
  const medecinSocketId = activeSockets.medecins.get(room.doctor.id);
  if (medecinSocketId) {
    io.to(medecinSocketId).emit("call-rejected", {
      appointmentId: room.appointmentId,
      patientName: room.patient.name,
    });
  }

  console.log(`[Teleconsult] Refuse : ${roomId}`);
  res.json({ success: true });
});

// ============================================
// POST /postpone - Patient reporte
// ============================================
router.post("/postpone", (req, res) => {
  const { roomId, minutes } = req.body;
  const room = activeRooms.get(roomId);
  if (!room) return res.status(404).json({ error: "Salle introuvable" });

  const delayMin = parseInt(minutes) || 5;
  const scheduledAt = new Date(Date.now() + delayMin * 60 * 1000);

  pendingCallbacks.set(room.appointmentId, {
    scheduledAt: scheduledAt.toISOString(),
    minutes: delayMin,
    roomId,
    patient: room.patient,
    doctor: room.doctor,
  });

  room.status = "postponed";
  appointmentToRoom.delete(room.appointmentId);

  const io = req.app.get("io");
  const activeSockets = req.app.get("activeSockets");
  const medecinSocketId = activeSockets.medecins.get(room.doctor.id);
  if (medecinSocketId) {
    io.to(medecinSocketId).emit("call-postponed", {
      appointmentId: room.appointmentId,
      patientName: room.patient.name,
      minutes: delayMin,
      scheduledAt: scheduledAt.toISOString(),
    });
  }

  console.log(`[Teleconsult] Reporte ${delayMin}min : ${roomId}`);
  res.json({ success: true, scheduledAt });
});

// ============================================
// POST /missed - Timeout cote patient (30s sans reponse)
// ============================================
router.post("/missed", (req, res) => {
  const { roomId } = req.body;
  const room = activeRooms.get(roomId);
  if (!room) return res.status(404).json({ error: "Salle introuvable" });

  if (room.status !== "ringing") {
    return res.json({ success: false, message: "Appel deja repondu" });
  }

  room.status = "missed";
  appointmentToRoom.delete(room.appointmentId);

  // Enregistrer cote backend
  registerMissedCall(room.patient.id, room.appointmentId, room.doctor.name);

  const io = req.app.get("io");
  const activeSockets = req.app.get("activeSockets");

  // Notifier le medecin
  const medecinSocketId = activeSockets.medecins.get(room.doctor.id);
  if (medecinSocketId) {
    io.to(medecinSocketId).emit("call-missed", {
      appointmentId: room.appointmentId,
      patientName: room.patient.name,
    });
  }

  // Notifier le patient (pour ajouter a sa liste de notifs)
  const patientSocketId = activeSockets.patients.get(room.patient.id);
  if (patientSocketId) {
    io.to(patientSocketId).emit("call-missed-self", {
      appointmentId: room.appointmentId,
      doctorName: room.doctor.name,
    });
  }

  console.log(`[Teleconsult] Manque : ${roomId}`);
  res.json({ success: true });
});

// ============================================
// POST /cancel - Medecin annule l'appel avant reponse patient
// (utilise quand le medecin raccroche pendant que ca sonne encore)
// ============================================
router.post("/cancel", (req, res) => {
  const { roomId } = req.body;
  const room = activeRooms.get(roomId);
  if (!room) return res.json({ success: true, message: "Salle deja fermee" });

  // Si le patient n'avait pas encore repondu, c'est un appel manque
  const wasRinging = room.status === "ringing";

  room.status = "cancelled";
  appointmentToRoom.delete(room.appointmentId);

  const io = req.app.get("io");
  const activeSockets = req.app.get("activeSockets");

  // Fermer la popup chez le patient
  const patientSocketId = activeSockets.patients.get(room.patient.id);
  if (patientSocketId) {
    io.to(patientSocketId).emit("call-cancelled", {
      roomId,
      appointmentId: room.appointmentId,
      doctorName: room.doctor.name,
      wasMissed: wasRinging, // si le patient n'avait pas vu, c'est manque
    });

    // Si c'etait un appel manque, l'enregistrer aussi
    if (wasRinging) {
      registerMissedCall(room.patient.id, room.appointmentId, room.doctor.name);
    }
  }

  console.log(`[Teleconsult] Annule par medecin : ${roomId}`);
  res.json({ success: true });
});

// ============================================
// POST /end - Fin d'appel normal
// ============================================
router.post("/end/:roomId", (req, res) => {
  const { roomId } = req.params;
  const room = activeRooms.get(roomId);
  if (room) {
    room.status = "ended";
    appointmentToRoom.delete(room.appointmentId);
    console.log(`[Teleconsult] Termine : ${roomId}`);
  }
  res.json({ success: true });
});

// ============================================
// GET /missed/:patientId
// ============================================
router.get("/missed/:patientId", (req, res) => {
  const patientId = parseInt(req.params.patientId);
  res.json(missedCalls.get(patientId) || []);
});

// ============================================
// POST /missed/:patientId/clear
// ============================================
router.post("/missed/:patientId/clear", (req, res) => {
  const patientId = parseInt(req.params.patientId);
  missedCalls.delete(patientId);
  res.json({ success: true });
});

// ============================================
// GET /pending-callbacks/:doctorId
// ============================================
router.get("/pending-callbacks/:doctorId", (req, res) => {
  const doctorId = parseInt(req.params.doctorId);
  const list = Array.from(pendingCallbacks.entries())
    .filter(([_, cb]) => cb.doctor.id === doctorId)
    .map(([appointmentId, cb]) => ({ appointmentId, ...cb }));
  res.json(list);
});

module.exports = router;