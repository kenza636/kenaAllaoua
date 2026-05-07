const express = require("express");
const router  = express.Router();
const db      = require("../config/db");

// GET /api/notifications/:userId?role=patient
router.get("/:userId", async (req, res) => {
  const role = req.query.role || "patient";
  try {
    const [rows] = await db.execute(
      `SELECT id, title, message, type, is_read, created_at
       FROM notifications
       WHERE id_user = ? AND user_role = ?
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.params.userId, role]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/notifications
router.post("/", async (req, res) => {
  const { id_user, user_role = "patient", title, message, type = "info" } = req.body;
  if (!id_user || !title || !message)
    return res.status(400).json({ message: "Champs manquants" });
  try {
    const [r] = await db.execute(
      `INSERT INTO notifications (id_user, user_role, title, message, type) VALUES (?, ?, ?, ?, ?)`,
      [id_user, user_role, title, message, type]
    );
    res.status(201).json({ id: r.insertId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/notifications/:id/read
router.put("/:id/read", async (req, res) => {
  try {
    await db.execute("UPDATE notifications SET is_read = 1 WHERE id = ?", [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/notifications/all-read  (body: { id_user, user_role })
router.put("/all-read/bulk", async (req, res) => {
  const { id_user, user_role = "patient" } = req.body;
  if (!id_user) return res.status(400).json({ message: "id_user requis" });
  try {
    await db.execute(
      "UPDATE notifications SET is_read = 1 WHERE id_user = ? AND user_role = ?",
      [id_user, user_role]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/notifications/:id
router.delete("/:id", async (req, res) => {
  try {
    await db.execute("DELETE FROM notifications WHERE id = ?", [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
