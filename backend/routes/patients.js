const express = require("express");
const router  = express.Router();
const db      = require("../config/db");

// PUT /api/patients/profil  (UPSERT — crée la ligne si elle n'existe pas encore)
router.put("/profil", async (req, res) => {
  const { id, dateOfBirth, gender, bloodType, address, city, height, weight, emergencyName, emergencyPhone } = req.body;
  const vals = [
    dateOfBirth    || null, gender        || null, bloodType  || null,
    address        || null, city          || null, height     || null,
    weight         || null, emergencyName || null, emergencyPhone || null,
  ];
  try {
    await db.execute(
      `INSERT INTO patients
         (id_u, date_naissance, sexe, groupe_sanguin, adresse, ville, taille, poids, urgence_nom, urgence_tel)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         date_naissance = VALUES(date_naissance),
         sexe           = VALUES(sexe),
         groupe_sanguin = VALUES(groupe_sanguin),
         adresse        = VALUES(adresse),
         ville          = VALUES(ville),
         taille         = VALUES(taille),
         poids          = VALUES(poids),
         urgence_nom    = VALUES(urgence_nom),
         urgence_tel    = VALUES(urgence_tel)`,
      [id, ...vals]
    );
    res.json({ message: "Profil mis à jour" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/patients/update-contact — met à jour email et tel dans utilisateur
router.put("/update-contact", async (req, res) => {
  const { id, email, tel } = req.body;
  if (!id) return res.status(400).json({ message: "ID requis" });
  try {
    await db.execute(
      "UPDATE utilisateur SET email_u = ?, tel_u = ? WHERE id_u = ?",
      [email || null, tel || null, id]
    );
    res.json({ message: "Contact mis à jour" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/patients/medecin/:idMedecin — tous les patients du médecin
router.get("/medecin/:idMedecin", async (req, res) => {
  const { idMedecin } = req.params;
  try {
    const [rows] = await db.execute(
      `SELECT
         u.id_u, u.nom_u, u.prenom_u, u.tel_u, u.email_u,
         p.sexe, p.date_naissance, p.groupe_sanguin,
         p.adresse, p.ville, p.taille, p.poids,
         MAX(d.date)     AS derniere_visite,
         COUNT(r.id_rdv) AS nb_rdv
       FROM rendezvous r
       JOIN utilisateur   u ON u.id_u      = r.id_patient
       LEFT JOIN patients p ON p.id_u      = r.id_patient
       JOIN disponibilites d ON d.id_dispo = r.id_dispo
       WHERE r.id_medecin = ?
       GROUP BY u.id_u, u.nom_u, u.prenom_u, u.tel_u, u.email_u,
                p.sexe, p.date_naissance, p.groupe_sanguin,
                p.adresse, p.ville, p.taille, p.poids
       ORDER BY derniere_visite DESC`,
      [idMedecin]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/patients/:idPatient/rdv/:idMedecin — historique RDV patient/médecin
router.get("/:idPatient/rdv/:idMedecin", async (req, res) => {
  const { idPatient, idMedecin } = req.params;
  try {
    const [rows] = await db.execute(
      `SELECT r.id_rdv, r.type_consultation, r.statut, r.motif,
              d.date, d.heure_debut, d.heure_fin
       FROM rendezvous r
       JOIN disponibilites d ON r.id_dispo = d.id_dispo
       WHERE r.id_patient = ? AND r.id_medecin = ?
       ORDER BY d.date DESC, d.heure_debut DESC`,
      [idPatient, idMedecin]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/patients/search?q=terme
router.get("/search", async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 2) return res.json([]);
  const like = `%${q.trim()}%`;
  try {
    const [rows] = await db.execute(
      `SELECT u.id_u, u.nom_u, u.prenom_u, u.tel_u, u.email_u
       FROM utilisateur u
       JOIN patients p ON p.id_u = u.id_u
       WHERE CONCAT(u.prenom_u, ' ', u.nom_u) LIKE ?
          OR u.tel_u  LIKE ?
          OR u.email_u LIKE ?
       LIMIT 10`,
      [like, like, like]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/patients/:idPatient — profil complet du patient
router.get("/:idPatient", async (req, res) => {
  const { idPatient } = req.params;
  try {
    const [rows] = await db.execute(
      `SELECT u.id_u, u.nom_u, u.prenom_u, u.email_u, u.tel_u,
              p.sexe, p.date_naissance, p.groupe_sanguin,
              p.adresse, p.ville, p.taille, p.poids,
              p.urgence_nom, p.urgence_tel
       FROM utilisateur u
       LEFT JOIN patients p ON p.id_u = u.id_u
       WHERE u.id_u = ?`,
      [idPatient]
    );
    if (rows.length === 0) return res.status(404).json({ message: "Patient introuvable" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
