const express = require("express");
const router  = express.Router();
const multer  = require("multer");
const path    = require("path");
const fs      = require("fs");
const db      = require("../config/db");

// ── Multer config ─────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/prescriptions"),
  filename:    (req, file, cb) => {
    const safe = `rx_${Date.now()}_${Math.round(Math.random() * 1e5)}`;
    cb(null, safe + path.extname(file.originalname).toLowerCase());
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (req, file, cb) => {
    const ok = /pdf|jpe?g|png|webp/i.test(path.extname(file.originalname));
    cb(ok ? null : new Error("Seuls PDF, JPG, PNG et WEBP sont acceptés"), ok);
  },
});

// Auto-create table on startup
db.execute(`
  CREATE TABLE IF NOT EXISTS prescriptions (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    id_rdv     INT          NOT NULL,
    id_medecin INT          NOT NULL,
    id_patient INT          NOT NULL,
    file_path  VARCHAR(500) NOT NULL,
    created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_rdv     (id_rdv),
    INDEX idx_patient (id_patient)
  )
`).catch(err => console.error("[prescriptions] Table init error:", err.message));

// POST /api/prescriptions  — doctor uploads scan/photo (multipart)
router.post("/", upload.single("file"), async (req, res) => {
  if (!req.file)
    return res.status(400).json({ message: "Fichier manquant (field: file)" });

  const { id_rdv, id_medecin, id_patient } = req.body;
  if (!id_rdv || !id_medecin || !id_patient) {
    fs.unlink(req.file.path, () => {});
    return res.status(400).json({ message: "id_rdv, id_medecin et id_patient sont requis" });
  }

  const filePath = req.file.path.replace(/\\/g, "/");

  try {
    // Replace existing prescription for this rdv
    const [existing] = await db.execute(
      "SELECT id, file_path FROM prescriptions WHERE id_rdv = ?", [id_rdv]
    );
    if (existing.length) {
      // Delete old file
      fs.unlink(existing[0].file_path, () => {});
      await db.execute(
        "UPDATE prescriptions SET file_path = ? WHERE id_rdv = ?",
        [filePath, id_rdv]
      );
      return res.json({ id: existing[0].id, updated: true });
    }

    const [result] = await db.execute(
      "INSERT INTO prescriptions (id_rdv, id_medecin, id_patient, file_path) VALUES (?,?,?,?)",
      [id_rdv, id_medecin, id_patient, filePath]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    fs.unlink(req.file.path, () => {});
    console.error("[POST prescriptions]", err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/prescriptions/rdv/:idRdv
router.get("/rdv/:idRdv", async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT * FROM prescriptions WHERE id_rdv = ? LIMIT 1",
      [req.params.idRdv]
    );
    if (!rows.length) return res.status(404).json({ message: "Aucune ordonnance" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/prescriptions/medecin-patient/:idMedecin/:idPatient
router.get("/medecin-patient/:idMedecin/:idPatient", async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT p.*, d.date AS rdv_date, d.heure_debut
       FROM prescriptions p
       JOIN rendezvous     r ON r.id_rdv   = p.id_rdv
       JOIN disponibilites d ON d.id_dispo = r.id_dispo
       WHERE p.id_medecin = ? AND p.id_patient = ?
       ORDER BY p.created_at DESC`,
      [req.params.idMedecin, req.params.idPatient]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/prescriptions/patient/:idPatient
router.get("/patient/:idPatient", async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT p.*, d.date AS rdv_date, d.heure_debut,
        m.nom      AS medecin_nom,
        m.prenom   AS medecin_prenom,
        m.specialite
       FROM prescriptions p
       JOIN rendezvous     r ON r.id_rdv   = p.id_rdv
       JOIN disponibilites d ON d.id_dispo = r.id_dispo
       JOIN medecins       m ON m.id       = p.id_medecin
       WHERE p.id_patient = ?
       ORDER BY p.created_at DESC`,
      [req.params.idPatient]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
