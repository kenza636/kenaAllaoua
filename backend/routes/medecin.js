const express = require("express");
const db      = require("../config/db");
const router  = express.Router();

// Ensure languages column exists (ER_DUP_FIELDNAME = already exists, safe to ignore)
db.execute(`ALTER TABLE medecins ADD COLUMN languages VARCHAR(255) DEFAULT NULL`)
  .catch(err => { if (err.code !== 'ER_DUP_FIELDNAME') console.error('[medecin] migration:', err.message); });

// Ensure schedule column exists
db.execute(`ALTER TABLE medecins ADD COLUMN schedule TEXT DEFAULT NULL`)
  .catch(err => { if (err.code !== 'ER_DUP_FIELDNAME') console.error('[medecin] migration:', err.message); });

// Ensure teleconsult flag exists
db.execute(`ALTER TABLE medecins ADD COLUMN teleconsult TINYINT(1) DEFAULT 1`)
  .catch(err => { if (err.code !== 'ER_DUP_FIELDNAME') console.error('[medecin] migration:', err.message); });

// ── GET /api/medecin  — public doctor list ───────────────────────
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        m.id,
        CONCAT('Dr. ', m.prenom, ' ', m.nom) AS name,
        m.nom,
        m.prenom,
        m.specialite                          AS specialty,
        m.localisation                        AS city,
        m.telephone                           AS phone,
        m.tarif                               AS price,
        m.email,
        m.bio,
        m.annees_experience,
        m.languages,
        m.teleconsult,
        ROUND(AVG(r.note), 1)                 AS avg_rating,
        COUNT(r.id_rating)                    AS total_reviews
      FROM medecins m
      LEFT JOIN ratings r ON r.id_medecin = m.id
      WHERE m.statut = 'approuvé'
      GROUP BY m.id, m.nom, m.prenom, m.specialite, m.localisation,
               m.telephone, m.tarif, m.email, m.bio, m.annees_experience, m.languages, m.teleconsult
      ORDER BY m.specialite, m.nom`
    );

    const doctorsWithImages = rows.map((doc, i) => ({
      ...doc,
      avg_rating:    doc.avg_rating    || 0,
      total_reviews: doc.total_reviews || 0,
      img: `https://randomuser.me/api/portraits/${i % 2 === 0 ? "men" : "women"}/${(i % 99) + 1}.jpg`,
    }));

    res.json(doctorsWithImages);
  } catch (err) {
    console.error("Erreur /api/medecin:", err);
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/medecin/specialites ─────────────────────────────────
// Specialties are now stored as plain text in medecins.specialite
router.get("/specialites", async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT DISTINCT specialite AS nom FROM medecins
       WHERE statut = 'approuvé' AND specialite IS NOT NULL
       ORDER BY specialite`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/medecin/profile/:id  — for medecin frontend own profile
router.get("/profile/:id", async (req, res) => {
  try {
    const [[m]] = await db.execute(
      `SELECT id, nom, prenom, email, telephone, rpps, specialite,
              adresse, code_postal, wilaya, statut, rejection_reason,
              languages, tarif, bio, annees_experience, localisation, teleconsult, created_at,
              schedule
       FROM medecins WHERE id = ?`,
      [req.params.id]
    );
    if (!m) return res.status(404).json({ message: "Médecin introuvable" });

    if (m.schedule) {
      try {
        m.schedule = JSON.parse(m.schedule);
      } catch {
        m.schedule = null;
      }
    }
    res.json(m);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/medecin/:id  — public doctor detail ─────────────────
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        m.id,
        m.nom,
        m.prenom,
        m.email,
        m.telephone,
        m.specialite,
        m.localisation,
        m.tarif,
        m.bio,
        m.annees_experience,
        m.languages,
        m.teleconsult,
        ROUND(AVG(r.note), 1) AS avg_rating,
        COUNT(r.id_rating)    AS total_reviews
      FROM medecins m
      LEFT JOIN ratings r ON r.id_medecin = m.id
      WHERE m.id = ?
      GROUP BY m.id, m.nom, m.prenom, m.email, m.telephone, m.specialite,
               m.localisation, m.tarif, m.bio, m.annees_experience, m.languages, m.teleconsult`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: "Médecin introuvable" });
    const doc = rows[0];
    res.json({ ...doc, avg_rating: doc.avg_rating || 0, total_reviews: doc.total_reviews || 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PUT /api/medecin/profile  — doctor updates own profile ───────
router.put("/profile", async (req, res) => {
  const { id, languages, bio, localisation, tarif, annees_experience, teleconsult, schedule } = req.body;
  if (!id) return res.status(400).json({ message: "id requis" });
  try {
    const scheduleString = schedule ? JSON.stringify(schedule) : null;
    await db.execute(
      `UPDATE medecins
       SET languages        = COALESCE(?, languages),
           bio              = COALESCE(?, bio),
           localisation     = COALESCE(?, localisation),
           tarif            = COALESCE(?, tarif),
           teleconsult      = COALESCE(?, teleconsult),
           annees_experience= COALESCE(?, annees_experience),
           schedule         = COALESCE(?, schedule)
       WHERE id = ?`,
      [languages ?? null, bio ?? null, localisation ?? null,
       tarif ?? null, teleconsult ?? null, annees_experience ?? null, scheduleString, id]
    );
    res.json({ message: "Profil mis à jour" });
  } catch (err) {
    console.error("[PUT medecin/profile]", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
