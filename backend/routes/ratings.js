const express = require("express");
const router  = express.Router();
const db      = require("../config/db");

// GET /api/ratings/medecin/:id  — avg rating + total reviews
router.get("/medecin/:id", async (req, res) => {
  try {
    const [[row]] = await db.execute(
      `SELECT
         ROUND(AVG(note), 1) AS avg_rating,
         COUNT(*)            AS total_reviews
       FROM ratings WHERE id_medecin = ?`,
      [req.params.id]
    );
    res.json({ avg_rating: row.avg_rating || 0, total_reviews: row.total_reviews || 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/ratings/check/:idRdv  — has this rdv been rated?
router.get("/check/:idRdv", async (req, res) => {
  try {
    const [[row]] = await db.execute(
      "SELECT id_rating FROM ratings WHERE id_rdv = ?", [req.params.idRdv]
    );
    res.json({ rated: !!row });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/ratings  — submit rating (one per completed rdv)
router.post("/", async (req, res) => {
  const { id_rdv, id_patient, id_medecin, note, commentaire } = req.body;
  if (!id_rdv || !id_patient || !id_medecin || !note)
    return res.status(400).json({ message: "Champs obligatoires manquants" });
  if (note < 1 || note > 5)
    return res.status(400).json({ message: "La note doit être entre 1 et 5" });

  try {
    // Verify the rdv is completed and belongs to this patient
    const [[rdv]] = await db.execute(
      `SELECT id_rdv FROM rendezvous
       WHERE id_rdv = ? AND id_patient = ? AND id_medecin = ? AND statut = 'termine'`,
      [id_rdv, id_patient, id_medecin]
    );
    if (!rdv) return res.status(403).json({ message: "RDV introuvable ou non terminé" });

    await db.execute(
      `INSERT INTO ratings (id_rdv, id_patient, id_medecin, note, commentaire)
       VALUES (?, ?, ?, ?, ?)`,
      [id_rdv, id_patient, id_medecin, note, commentaire || null]
    );
    res.status(201).json({ message: "Avis enregistré" });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY")
      return res.status(409).json({ message: "Vous avez déjà noté ce médecin pour ce RDV" });
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
