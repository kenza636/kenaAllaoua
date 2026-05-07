// mon-projet-sante/src/pages/Login.jsx
// Exemple de formulaire de connexion avec redirection vers patient ou medecin

import { useState } from "react";

// Configuration des URLs des frontends
const FRONTEND_URLS = {
  patient: "http://localhost:5174",
  medecin: "http://localhost:5175",
};

const API_URL = "http://localhost:5000/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur("");
    setChargement(true);

    try {
      // 1. Envoyer les identifiants au backend
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        throw new Error("Identifiants incorrects");
      }

      const data = await res.json();
      // data attendu : { token: "...", user: { id, nom, role: "patient" | "medecin" } }

      // 2. Determiner la destination selon le role
      const destination = FRONTEND_URLS[data.user.role];
      if (!destination) {
        throw new Error("Role utilisateur inconnu");
      }

      // 3. Passer le token via l'URL (le frontend cible le lira et le stockera)
      const tokenEncode = encodeURIComponent(data.token);
      window.location.href = `${destination}?token=${tokenEncode}`;

    } catch (err) {
      setErreur(err.message);
      setChargement(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "50px auto", padding: 20 }}>
      <h2>Connexion</h2>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 15 }}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: "100%", padding: 8 }}
          />
        </div>

        <div style={{ marginBottom: 15 }}>
          <label>Mot de passe</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: "100%", padding: 8 }}
          />
        </div>

        {erreur && (
          <div style={{ color: "red", marginBottom: 15 }}>{erreur}</div>
        )}

        <button
          type="submit"
          disabled={chargement}
          style={{ width: "100%", padding: 10 }}
        >
          {chargement ? "Connexion..." : "Se connecter"}
        </button>
      </form>
    </div>
  );
}
