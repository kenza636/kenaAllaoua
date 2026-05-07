const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Ensure payment_status column exists
db.execute(`ALTER TABLE rendezvous ADD COLUMN payment_status VARCHAR(20) DEFAULT NULL`)
  .catch(err => { if (err.code !== "ER_DUP_FIELDNAME") console.error("[rdv] migration:", err.message); });

// Helper — push a notification (non-blocking)
async function pushNotif(id_user, user_role, title, message, type = "info") {
  try {
    await db.execute(
      `INSERT INTO notifications (id_user, user_role, title, message, type) VALUES (?, ?, ?, ?, ?)`,
      [id_user, user_role, title, message, type]
    );
  } catch { /* non-blocking */ }
}

// GET /api/rdv/disponibilites/:idMedecin
router.get("/disponibilites/:idMedecin", async (req, res) => {
  const { idMedecin } = req.params;
  const { date, debut, fin } = req.query;

  try {
    let query = `
      SELECT
        d.id_dispo, d.date, d.heure_debut, d.heure_fin, d.statut,
        CASE WHEN r.id_rdv IS NOT NULL THEN 1 ELSE 0 END AS reserve,
        u.prenom_u  AS patient_prenom,
        u.nom_u     AS patient_nom,
        u.tel_u     AS patient_tel,
        p.sexe      AS patient_sexe,
        p.date_naissance AS patient_ddn
      FROM disponibilites d
      LEFT JOIN rendezvous r  ON r.id_dispo  = d.id_dispo
        AND r.statut IN ('confirme', 'en_attente')
      LEFT JOIN utilisateur u ON u.id_u = r.id_patient
      LEFT JOIN patients    p ON p.id_u = r.id_patient
      WHERE d.id_medecin = ?
    `;
    const params = [idMedecin];

    if (date) {
      query += ` AND d.date = ?`;
      params.push(date);
    } else if (debut && fin) {
      query += ` AND d.date BETWEEN ? AND ?`;
      params.push(debut, fin);
    }

    query += ` ORDER BY d.date, d.heure_debut`;

    const [rows] = await db.execute(query, params);
    res.json(rows);
  } catch (err) {
    console.error("[GET DISPOS ERROR]", err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/rdv → créer un RDV
router.post("/", async (req, res) => {
  const { id_dispo, id_patient, id_medecin, type_consultation, motif } = req.body;
  if (!id_dispo || !id_patient || !id_medecin) {
    return res.status(400).json({ message: "Champs obligatoires manquants" });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [dispoRows] = await conn.execute(
      `SELECT statut, date, heure_debut, heure_fin FROM disponibilites WHERE id_dispo = ? FOR UPDATE`,
      [id_dispo]
    );
    if (dispoRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: "Créneau introuvable" });
    }
    if (dispoRows[0].statut !== "libre") {
      await conn.rollback();
      return res.status(409).json({ message: "Ce créneau est déjà réservé par un autre patient" });
    }

    const { date, heure_debut, heure_fin } = dispoRows[0];

    // ── Check: patient doesn't have an overlapping appointment ────
    const [patientConflict] = await conn.execute(
      `SELECT r.id_rdv FROM rendezvous r
       JOIN disponibilites d ON r.id_dispo = d.id_dispo
       WHERE r.id_patient = ?
         AND d.date = ?
         AND d.heure_debut < ?
         AND d.heure_fin   > ?
         AND r.statut IN ('confirme','en_attente')
       LIMIT 1`,
      [id_patient, date, heure_fin, heure_debut]
    );
    if (patientConflict.length) {
      await conn.rollback();
      return res.status(409).json({ message: "Vous avez déjà un rendez-vous à cette heure" });
    }

    // ── Check: doctor doesn't have another slot booked at the same time ─
    const [doctorConflict] = await conn.execute(
      `SELECT r.id_rdv FROM rendezvous r
       JOIN disponibilites d ON r.id_dispo = d.id_dispo
       WHERE r.id_medecin = ?
         AND d.date = ?
         AND d.heure_debut < ?
         AND d.heure_fin   > ?
         AND r.statut IN ('confirme','en_attente')
         AND r.id_dispo != ?
       LIMIT 1`,
      [id_medecin, date, heure_fin, heure_debut, id_dispo]
    );
    if (doctorConflict.length) {
      await conn.rollback();
      return res.status(409).json({ message: "Ce médecin a déjà une consultation à cette heure" });
    }

    await conn.execute(
      `UPDATE disponibilites SET statut = 'reserve' WHERE id_dispo = ?`,
      [id_dispo]
    );

    const isTele      = (type_consultation || "").includes("tele");
    const payStatus   = isTele ? "pending" : null;

    const [result] = await conn.execute(
      `INSERT INTO rendezvous (id_dispo, id_patient, id_medecin, type_consultation, motif, statut, payment_status)
       VALUES (?, ?, ?, ?, ?, 'confirme', ?)`,
      [id_dispo, id_patient, id_medecin, type_consultation || "presentiel", motif || null, payStatus]
    );

    await conn.commit();

    // ── Notifications (non-blocking) ─────────────────────────────
    try {
      const [[pat]]  = await db.execute(`SELECT nom_u, prenom_u FROM utilisateur WHERE id_u = ?`, [id_patient]);
      const [[doc]]  = await db.execute(`SELECT nom, prenom FROM medecins WHERE id = ?`, [id_medecin]);
      const dateStr  = new Date(date).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
      const heureStr = heure_debut.substring(0, 5);
      const typeLabel = isTele ? "téléconsultation" : "présentiel";

      if (doc) {
        // → patient
        await pushNotif(id_patient, "patient",
          "✅ Rendez-vous confirmé",
          `Votre RDV (${typeLabel}) avec Dr. ${doc.prenom} ${doc.nom} le ${dateStr} à ${heureStr} a été confirmé.`,
          "booking"
        );
      }
      if (pat) {
        // → doctor
        await pushNotif(id_medecin, "medecin",
          "📅 Nouveau rendez-vous",
          `${pat.prenom_u} ${pat.nom_u} a réservé un RDV (${typeLabel}) le ${dateStr} à ${heureStr}.`,
          "booking"
        );
      }
    } catch { /* non-blocking */ }

    res.status(201).json({ message: "RDV confirmé", id_rdv: result.insertId });
  } catch (err) {
    await conn.rollback();
    console.error("[CREATE RDV ERROR]", err);
    res.status(500).json({ message: err.message });
  } finally {
    conn.release();
  }
});

// GET /api/rdv/patient/:idPatient
router.get("/patient/:idPatient", async (req, res) => {
  const { idPatient } = req.params;
  try {
    const [rows] = await db.execute(
      `SELECT r.id_rdv, r.id_medecin, r.type_consultation, r.statut, r.motif,
              r.created_at, r.payment_status,
              d.date, d.heure_debut, d.heure_fin,
              m.nom      AS medecin_nom,
              m.prenom   AS medecin_prenom,
              m.specialite,
              m.localisation AS lieu,
              m.tarif        AS prix
       FROM rendezvous r
       JOIN disponibilites d ON r.id_dispo   = d.id_dispo
       JOIN medecins       m ON m.id         = r.id_medecin
       WHERE r.id_patient = ?
       ORDER BY d.date DESC, d.heure_debut DESC`,
      [idPatient]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/rdv/medecin/:idMedecin
router.get("/medecin/:idMedecin", async (req, res) => {
  const { idMedecin } = req.params;
  try {
    const [rows] = await db.execute(
      `SELECT r.id_rdv, r.id_patient, r.type_consultation, r.statut, r.motif, r.created_at,
              d.date, d.heure_debut, d.heure_fin,
              u.nom_u AS patient_nom, u.prenom_u AS patient_prenom,
              u.tel_u AS patient_tel, u.email_u AS patient_email
       FROM rendezvous r
       JOIN disponibilites d ON r.id_dispo = d.id_dispo
       JOIN utilisateur u ON r.id_patient = u.id_u
       WHERE r.id_medecin = ?
       ORDER BY d.date DESC, d.heure_debut DESC`,
      [idMedecin]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/rdv/:idRdv → annuler un RDV
router.delete("/:idRdv", async (req, res) => {
  const { idRdv } = req.params;
  const { role, reason } = req.body;   // reason: doctor cancellation motive

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [rdvRows] = await conn.execute(
      `SELECT r.id_dispo, r.id_patient, r.id_medecin, r.type_consultation,
              d.date, d.heure_debut
       FROM rendezvous r JOIN disponibilites d ON d.id_dispo = r.id_dispo
       WHERE r.id_rdv = ?`,
      [idRdv]
    );
    if (rdvRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: "RDV introuvable" });
    }

    const rdv              = rdvRows[0];
    const statutAnnulation = role === "medecin" ? "annule_medecin" : "annule_patient";
    await conn.execute(`UPDATE rendezvous SET statut = ? WHERE id_rdv = ?`, [statutAnnulation, idRdv]);
    await conn.execute(`UPDATE disponibilites SET statut = 'libre' WHERE id_dispo = ?`, [rdv.id_dispo]);
    await conn.commit();

    // ── Notifications (non-blocking) ────────────────────────────
    try {
      const dateStr  = new Date(rdv.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
      const heureStr = rdv.heure_debut.substring(0, 5);

      if (role === "medecin") {
        // Notify patient with the doctor's reason
        const reasonText = reason || "raison personnelle";
        await pushNotif(rdv.id_patient, "patient",
          "❌ Rendez-vous annulé par le médecin",
          `Votre RDV du ${dateStr} à ${heureStr} a été annulé par le médecin. Motif : ${reasonText}.`,
          "info"
        );
      } else {
        // Notify doctor when patient cancels
        const [[pat]] = await db.execute(`SELECT nom_u, prenom_u FROM utilisateur WHERE id_u = ?`, [rdv.id_patient]);
        if (pat) {
          await pushNotif(rdv.id_medecin, "medecin",
            "❌ Rendez-vous annulé",
            `${pat.prenom_u} ${pat.nom_u} a annulé son RDV du ${dateStr} à ${heureStr}.`,
            "info"
          );
        }
      }
    } catch { /* non-blocking */ }

    res.json({ message: "RDV annulé, créneau libéré" });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: err.message });
  } finally {
    conn.release();
  }
});

// PUT /api/rdv/:idRdv/payment  — mark teleconsultation as paid
router.put("/:idRdv/payment", async (req, res) => {
  const { status = "paid" } = req.body;
  if (!["paid", "failed", "pending"].includes(status))
    return res.status(400).json({ message: "Statut invalide" });
  try {
    await db.execute(`UPDATE rendezvous SET payment_status = ? WHERE id_rdv = ?`, [status, req.params.idRdv]);

    if (status === "paid") {
      // Notify patient of payment confirmation
      const [[rdv]] = await db.execute(
        `SELECT r.id_patient, d.date, d.heure_debut FROM rendezvous r
         JOIN disponibilites d ON d.id_dispo = r.id_dispo WHERE r.id_rdv = ?`,
        [req.params.idRdv]
      );
      if (rdv) {
        const dateStr  = new Date(rdv.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
        const heureStr = rdv.heure_debut.substring(0, 5);
        await pushNotif(rdv.id_patient, "patient",
          "💳 Paiement confirmé",
          `Votre paiement pour la téléconsultation du ${dateStr} à ${heureStr} a été accepté.`,
          "booking"
        );
      }
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/rdv/:idRdv/statut  — doctor marks attendance
router.put("/:idRdv/statut", async (req, res) => {
  const { statut } = req.body;
  if (!["termine", "no_show"].includes(statut))
    return res.status(400).json({ message: "Statut invalide — 'termine' ou 'no_show'" });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.execute(
      "SELECT id_dispo FROM rendezvous WHERE id_rdv = ?", [req.params.idRdv]
    );
    if (!rows.length) { await conn.rollback(); return res.status(404).json({ message: "RDV introuvable" }); }

    await conn.execute("UPDATE rendezvous SET statut = ? WHERE id_rdv = ?", [statut, req.params.idRdv]);

    if (statut === "no_show") {
      await conn.execute("UPDATE disponibilites SET statut = 'libre' WHERE id_dispo = ?", [rows[0].id_dispo]);
    }

    await conn.commit();
    res.json({ message: "Statut mis à jour" });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: err.message });
  } finally {
    conn.release();
  }
});

// POST /api/rdv/disponibilites
router.post("/disponibilites", async (req, res) => {
  const { id_medecin, date, heure_debut, heure_fin } = req.body;
  if (!id_medecin || !date || !heure_debut || !heure_fin) {
    return res.status(400).json({ message: "Champs manquants" });
  }
  try {
    const [result] = await db.execute(
      `INSERT INTO disponibilites (id_medecin, date, heure_debut, heure_fin)
       VALUES (?, ?, ?, ?)`,
      [id_medecin, date, heure_debut, heure_fin]
    );
    res.status(201).json({ id_dispo: result.insertId });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Créneau déjà existant" });
    }
    console.error("[ADD DISPO ERROR]", err);
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/rdv/disponibilites/:idDispo
router.delete("/disponibilites/:idDispo", async (req, res) => {
  const { idDispo } = req.params;
  try {
    const [rdvs] = await db.execute(
      `SELECT id_rdv FROM rendezvous 
       WHERE id_dispo = ? AND statut IN ('confirme', 'en_attente')`,
      [idDispo]
    );
    if (rdvs.length > 0) {
      return res.status(409).json({ 
        message: "Impossible de supprimer — un RDV est lié à ce créneau" 
      });
    }
    await db.execute(`DELETE FROM disponibilites WHERE id_dispo = ?`, [idDispo]);
    res.json({ message: "Créneau supprimé" });
  } catch (err) {
    console.error("[DELETE DISPO ERROR]", err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/rdv/disponibilites/bulk
router.post("/disponibilites/bulk", async (req, res) => {
  const { id_medecin, creneaux } = req.body;
  if (!id_medecin || !Array.isArray(creneaux) || creneaux.length === 0) {
    return res.status(400).json({ message: "Données invalides" });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Delete all free future slots (slots with active bookings are preserved)
    const [del] = await conn.execute(
      `DELETE d FROM disponibilites d
       LEFT JOIN rendezvous r
         ON r.id_dispo = d.id_dispo AND r.statut IN ('confirme','en_attente')
       WHERE d.id_medecin = ?
         AND d.date >= CURDATE()
         AND r.id_rdv IS NULL`,
      [id_medecin]
    );

    // Insert new slots
    const values       = creneaux.map((c) => [id_medecin, c.date, c.heure_debut, c.heure_fin]);
    const placeholders = values.map(() => "(?, ?, ?, ?)").join(", ");
    await conn.query(
      `INSERT IGNORE INTO disponibilites (id_medecin, date, heure_debut, heure_fin)
       VALUES ${placeholders}`,
      values.flat()
    );

    await conn.commit();
    res.status(201).json({
      message: `Planning régénéré : ${del.affectedRows} ancien(s) créneau(x) supprimé(s), ${creneaux.length} nouveau(x) créé(s)`,
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: err.message });
  } finally {
    conn.release();
  }
});

module.exports = router;