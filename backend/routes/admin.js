const express = require("express");
const path    = require("path");
const fs      = require("fs");
const db      = require("../config/db");
const router  = express.Router();

// GET /api/admin/medecins
router.get("/medecins", async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT id, nom, prenom, email, telephone, rpps, specialite,
              adresse, code_postal, wilaya, statut,
              diploma_file_path, rejection_reason, created_at
       FROM medecins ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error("Erreur GET /api/admin/medecins:", err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/medecins/:id/diploma  — serve the uploaded file
router.get("/medecins/:id/diploma", async (req, res) => {
  try {
    const [[row]] = await db.execute(
      "SELECT diploma_file_path FROM medecins WHERE id = ?", [req.params.id]
    );
    if (!row || !row.diploma_file_path)
      return res.status(404).json({ message: "Aucun document trouvé" });

    const abs = path.resolve(row.diploma_file_path);
    if (!fs.existsSync(abs))
      return res.status(404).json({ message: "Fichier introuvable sur le serveur" });

    res.sendFile(abs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/admin/medecins/:id/statut
router.put("/medecins/:id/statut", async (req, res) => {
  const { statut, rejection_reason } = req.body;
  if (!["approuvé", "rejeté"].includes(statut))
    return res.status(400).json({ message: "Statut invalide" });

  try {
    const [result] = await db.execute(
      `UPDATE medecins SET statut = ?, rejection_reason = ? WHERE id = ?`,
      [statut, rejection_reason || null, req.params.id]
    );
    if (!result.affectedRows)
      return res.status(404).json({ message: "Médecin introuvable" });
    res.json({ message: `Statut mis à jour : ${statut}` });
  } catch (err) {
    console.error("Erreur PUT /api/admin/medecins/:id/statut:", err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/stats/activity — daily counts, last 30 days
router.get("/stats/activity", async (req, res) => {
  try {
    const [appointments] = await db.execute(`
      SELECT DATE(r.created_at) AS day, COUNT(*) AS count
      FROM rendezvous r
      WHERE r.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        AND r.statut NOT IN ('annule_patient','annule_medecin')
      GROUP BY DATE(r.created_at)
      ORDER BY day
    `);

    const [doctors] = await db.execute(`
      SELECT DATE(created_at) AS day, COUNT(*) AS count
      FROM medecins
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY day
    `);

    res.json({ appointments, doctors });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
