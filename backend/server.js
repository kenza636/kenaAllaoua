const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const medecinRoutes = require("./routes/medecin");
const patientsRoutes = require("./routes/patients");
const rdvRoutes = require("./routes/rendezvous");
const teleconsultationRoutes = require("./routes/teleconsultation");
const adminRoutes   = require("./routes/admin");
const ratingsRoutes        = require("./routes/ratings");
const notificationsRoutes  = require("./routes/notifications");
const prescriptionsRoutes  = require("./routes/prescriptions");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://localhost:5176",
    ],
  },
});

const activeSockets = {
  patients: new Map(),
  medecins: new Map(),
};

io.on("connection", (socket) => {
  console.log(`[Socket] Nouvelle connexion : ${socket.id}`);
  socket.on("register", ({ userId, role }) => {
    if (role === "patient") activeSockets.patients.set(userId, socket.id);
    else if (role === "medecin") activeSockets.medecins.set(userId, socket.id);
  });
  socket.on("disconnect", () => {
    for (const [id, sid] of activeSockets.patients.entries()) {
      if (sid === socket.id) activeSockets.patients.delete(id);
    }
    for (const [id, sid] of activeSockets.medecins.entries()) {
      if (sid === socket.id) activeSockets.medecins.delete(id);
    }
  });
});

app.set("io", io);
app.set("activeSockets", activeSockets);

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://localhost:5176",
    ],
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

// ✅ Routes — une seule fois
app.use("/api/auth", authRoutes);
app.use("/api/medecin", medecinRoutes);
app.use("/api/patients", patientsRoutes);
app.use("/api/rdv", rdvRoutes);
app.use("/api/teleconsultation", teleconsultationRoutes);
app.use("/api/admin",   adminRoutes);
app.use("/api/ratings",        ratingsRoutes);
app.use("/api/notifications",  notificationsRoutes);
app.use("/api/prescriptions",  prescriptionsRoutes);
app.get("/", (req, res) =>
  res.json({ message: "✅ API Mediko en ligne", status: "ok" }),
);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 Serveur Mediko démarré sur http://localhost:${PORT}`);
  console.log(`   POST http://localhost:${PORT}/api/auth/login`);
  console.log(`   POST http://localhost:${PORT}/api/auth/register/patient`);
  console.log(`   POST http://localhost:${PORT}/api/auth/register/medecin`);
});
