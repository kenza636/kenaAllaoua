import React, { useState } from "react";

const API_URL = "http://localhost:5000/api/auth/login";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Veuillez remplir tous les champs.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim(), password, role: "admin" }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || (data.errors && data.errors.join(" ")) || "Erreur de connexion.");
        return;
      }

      localStorage.setItem("admin_token", data.token);
      localStorage.setItem("admin_user", JSON.stringify(data.user));
      onLogin?.();
    } catch (err) {
      setError("Impossible de contacter le serveur. Vérifiez que le backend est démarré.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-logo">M</div>
          <div>
            <h1>Bon retour !</h1>
            <p>Connectez-vous pour accéder à l’administration Mediko.</p>
          </div>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="login-email">Adresse email *</label>
            <div className="input-wrapper">
              <span className="input-icon">✉️</span>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="votre.email@mediko.dz"
                autoComplete="username"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Mot de passe *</label>
            <div className="input-wrapper">
              <span className="input-icon">🔒</span>
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showPassword ? "👁️" : "👁"}
              </button>
            </div>
          </div>

          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <p className="login-hint">
          Utilisez votre email et mot de passe enregistrés dans la base de données Mediko.
        </p>
      </div>
    </div>
  );
}

export default Login;
