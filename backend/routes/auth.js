const express = require("express");
const router  = express.Router();
const bcrypt  = require("bcryptjs");
const jwt     = require("jsonwebtoken");
const multer  = require("multer");
const path    = require("path");
const db      = require("../config/db");

// ── Multer config for diploma uploads ─────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/diplomas"),
  filename:    (req, file, cb) => {
    const safe = Date.now() + "-" + Math.round(Math.random() * 1e6);
    cb(null, safe + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const ok = /pdf|jpe?g|png/i.test(path.extname(file.originalname));
    cb(ok ? null : new Error("Seuls PDF, JPG et PNG sont acceptés"), ok);
  },
});

// ── POST /api/auth/login ───────────────────────────────────────────
router.post("/login", async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Email et mot de passe requis" });

  try {
    if (role === "admin") {
      const [rows] = await db.execute(
        "SELECT * FROM administrateur WHERE email = ? LIMIT 1",
        [email]
      );
      if (!rows.length)
        return res.status(401).json({ message: "Email ou mot de passe incorrect" });

      const admin = rows[0];
      const isMatch = await bcrypt.compare(password, admin.mot_de_passe);
      if (!isMatch)
        return res.status(401).json({ message: "Email ou mot de passe incorrect" });

      const token = jwt.sign(
        { id: admin.id, email: admin.email, role: "admin" },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );
      return res.json({
        message: "Connexion réussie",
        token,
        user: {
          id: admin.id,
          email: admin.email,
          role: "admin",
        },
      });
    }

    if (role === "medecin") {
      const [rows] = await db.execute(
        "SELECT * FROM medecins WHERE email = ? LIMIT 1",
        [email]
      );
      if (!rows.length)
        return res.status(401).json({ message: "Email ou mot de passe incorrect" });

      const medecin = rows[0];
      const isMatch = await bcrypt.compare(password, medecin.mot_de_passe || medecin.password);
      if (!isMatch)
        return res.status(401).json({ message: "Email ou mot de passe incorrect" });

      if (medecin.statut !== 'approuvé') {
        return res.status(403).json({ message: "Votre compte est en attente d'approbation par l'administrateur." });
      }

      const token = jwt.sign(
        { id: medecin.id, email: medecin.email, role, nom: medecin.nom, prenom: medecin.prenom, statut: medecin.statut },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );
      return res.json({
        message: "Connexion réussie",
        token,
        user: {
          id:        medecin.id,
          nom:       medecin.nom,
          prenom:    medecin.prenom,
          email:     medecin.email,
          specialite: medecin.specialite,
          statut:    medecin.statut,
          rejection_reason: medecin.rejection_reason || null,
          languages: medecin.languages || null,
          role,
        },
      });
    }

    // ── Patient login ──────────────────────────────────────────────
    const [rows] = await db.execute(
      `SELECT u.id_u, u.nom_u, u.prenom_u, u.email_u, u.motDePasse_u, u.tel_u,
              p.num_secu_p, p.date_naissance, p.sexe, p.groupe_sanguin,
              p.condition_actuelle, p.adresse, p.ville,
              p.taille, p.poids, p.urgence_nom, p.urgence_tel, p.photo_profil
       FROM utilisateur u
       INNER JOIN patients p ON p.id_u = u.id_u
       WHERE u.email_u = ? LIMIT 1`,
      [email]
    );
    if (!rows.length)
      return res.status(401).json({ message: "Email ou mot de passe incorrect" });

    const user    = rows[0];
    const isMatch = await bcrypt.compare(password, user.motDePasse_u);
    if (!isMatch)
      return res.status(401).json({ message: "Email ou mot de passe incorrect" });

    const token = jwt.sign(
      { id: user.id_u, email: user.email_u, role: "patient", nom: user.nom_u, prenom: user.prenom_u },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    return res.json({
      message: "Connexion réussie",
      token,
      user: {
        id:             user.id_u,
        nom:            user.nom_u,
        prenom:         user.prenom_u,
        email:          user.email_u,
        tel:            user.tel_u,
        age:            user.date_naissance,
        gender:         user.sexe,
        bloodType:      user.groupe_sanguin,
        address:        user.adresse,
        city:           user.ville,
        height:         user.taille,
        weight:         user.poids,
        emergencyName:  user.urgence_nom,
        emergencyPhone: user.urgence_tel,
        role: "patient",
      },
    });
  } catch (err) {
    console.error("[LOGIN ERROR]", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// ── POST /api/auth/register/patient ───────────────────────────────
router.post("/register/patient", async (req, res) => {
  const { nom, prenom, dateNaissance, telephone, email, password } = req.body;
  const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
  const EMAIL_RULE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const errors = [];

  if (!nom || !prenom || !email || !password) {
    errors.push("Champs obligatoires manquants");
  }
  if (email && !EMAIL_RULE.test(email)) {
    errors.push("Adresse email invalide");
  }
  if (!PASSWORD_RULE.test(password)) {
    errors.push("Le mot de passe doit contenir au moins 8 caractères, dont des lettres et des chiffres.");
  }
  if (dateNaissance) {
    const birthDate = new Date(dateNaissance);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    if (age < 18) {
      errors.push("Vous devez avoir au moins 18 ans pour vous inscrire.");
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  try {
    const [existing] = await db.execute(
      "SELECT id_u FROM utilisateur WHERE email_u = ?", [email]
    );
    if (existing.length) {
      return res.status(409).json({ errors: ["Email déjà utilisé"] });
    }

    const hashed = await bcrypt.hash(password, 12);
    const [resultUser] = await db.execute(
      "INSERT INTO utilisateur (nom_u, prenom_u, email_u, motDePasse_u, tel_u) VALUES (?, ?, ?, ?, ?)",
      [nom, prenom, email, hashed, telephone || null]
    );
    await db.execute(
      "INSERT INTO patients (id_u, date_naissance) VALUES (?, ?)",
      [resultUser.insertId, dateNaissance || null]
    );
    const token = jwt.sign(
      { id: resultUser.insertId, email, role: "patient", nom, prenom },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.status(201).json({
      message: "Compte créé avec succès",
      token,
      user: { id: resultUser.insertId, nom, prenom, email, role: "patient" },
    });
  } catch (err) {
    console.error("[REGISTER PATIENT ERROR]", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// ── POST /api/auth/register/medecin ───────────────────────────────
router.post("/register/medecin", upload.single("diploma"), async (req, res) => {
  const { nom, prenom, rpps, specialite, adresse, codePostal, wilaya, email, telephone, password, languages } = req.body;
  const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
  const errors = [];

  if (!nom || !prenom || !email || !password || !rpps || !specialite) {
    errors.push("Champs obligatoires manquants");
  }
  if (!PASSWORD_RULE.test(password)) {
    errors.push("Le mot de passe doit contenir au moins 8 caractères, dont des lettres et des chiffres.");
  }
  if (!req.file) {
    errors.push("Le justificatif de diplôme est obligatoire.");
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  try {
    const [existing] = await db.execute(
      "SELECT id FROM medecins WHERE email = ? OR rpps = ?", [email, rpps]
    );
    if (existing.length) {
      return res.status(409).json({ errors: ["Email ou RPPS déjà utilisé"] });
    }

    const hashed      = await bcrypt.hash(password, 12);
    const diplomaPath = req.file ? req.file.path.replace(/\\/g, "/") : null;
    const langStr     = Array.isArray(languages) ? languages.join(", ") : (languages || null);


    const [result] = await db.execute(
      `INSERT INTO medecins
        (nom, prenom, rpps, specialite, adresse, code_postal, wilaya, email, telephone, mot_de_passe, statut, diploma_file_path, languages, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'en_attente', ?, ?, NOW())`,
      [nom, prenom, rpps, specialite, adresse || null, codePostal || null, wilaya || null,
       email, telephone || null, hashed, diplomaPath, langStr]
    );
    res.status(201).json({
      message: "Inscription envoyée. Vérification sous 24-48h.",
      userId: result.insertId,
    });
  } catch (err) {
    console.error("[REGISTER MEDECIN ERROR]", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

module.exports = router;
