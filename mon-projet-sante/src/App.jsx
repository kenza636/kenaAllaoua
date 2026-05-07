import React, { useState, useEffect } from "react";
import PatientRegister from "./pages/PatientRegister";
import DoctorRegister from "./pages/DoctorRegister";
import ConnecterMedecin from "./pages/ConnecterMedecin";
import PatientLogin from "./pages/PatientLogin";

// ✅ PLUS d'import InterfacePage — inutile !

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [currentPage, setCurrentPage] = useState("home");

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 3500);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) return <SplashScreen />;
  if (currentPage === "patientRegister")
    return <PatientRegister setPage={setCurrentPage} />;
  if (currentPage === "connecterPatient")
    return <PatientLogin setPage={setCurrentPage} />;
  if (currentPage === "doctorRegister")
    return <DoctorRegister setPage={setCurrentPage} />;
  if (currentPage === "connecterMedecin")
    return <ConnecterMedecin setPage={setCurrentPage} />;

  // ✅ PAS de patientDashboard ici — la redirection se fait via window.location dans PatientLogin

  return <HomePage setPage={setCurrentPage} />;
}

const SplashScreen = () => (
  <div
    style={{
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      background:
        "linear-gradient(135deg, #41AD49 0%, #00a884 40%, #0072BC 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Montserrat', sans-serif",
    }}
  >
    <style>{`
      @keyframes splashFadeIn {
        from { opacity: 0; transform: translateY(24px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes splashFloat {
        0%, 100% { transform: translateY(0px); }
        50%       { transform: translateY(-12px); }
      }
      @keyframes ecgSplash {
        0%   { stroke-dashoffset: 500; opacity: 1; }
        45%  { stroke-dashoffset: 0;   opacity: 1; }
        55%  { stroke-dashoffset: 0;   opacity: 1; }
        100% { stroke-dashoffset: -500; opacity: 1; }
      }
      @keyframes splashLoader {
        to { transform: rotate(360deg); }
      }
      .splash-logo { animation: splashFloat 3s ease-in-out infinite; }
      .splash-title { animation: splashFadeIn .7s .3s both; opacity: 0; }
      .splash-sub   { animation: splashFadeIn .7s .6s both; opacity: 0; }
      .splash-load  { animation: splashFadeIn .7s .9s both; opacity: 0; }
      .ecg-splash {
        stroke-dasharray: 500;
        stroke-dashoffset: 500;
        animation: ecgSplash 6s ease-in-out infinite;
      }
    `}</style>

    {/* LOGO flottant */}
    <div className="splash-logo" style={{ marginBottom: "24px" }}>
      <svg width="160" height="145" viewBox="0 0 220 200">
        <defs>
          <mask id="cutSplash">
            <path
              d="M110 178 C65 150, 16 122, 16 76 C16 50, 35 28, 60 28 C76 28, 90 37, 110 54 C130 37, 144 28, 160 28 C185 28, 204 50, 204 76 C204 122, 155 150, 110 178 Z"
              fill="white"
            />
            <rect x="101" y="70" width="19" height="62" rx="4" fill="black" />
            <rect x="79" y="91" width="63" height="19" rx="4" fill="black" />
            <polyline
              points="16,101 44,101 50,101 56,68 61,101 66,134 72,101 77,101 101,101 120,101 144,101 149,101 154,68 159,101 164,130 170,101 175,101 204,101"
              fill="none"
              stroke="black"
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="500"
              strokeDashoffset="500"
              className="ecg-splash"
            />
          </mask>
        </defs>
        <path
          d="M110 178 C65 150, 16 122, 16 76 C16 50, 35 28, 60 28 C76 28, 90 37, 110 54 C130 37, 144 28, 160 28 C185 28, 204 50, 204 76 C204 122, 155 150, 110 178 Z"
          fill="white"
          opacity=".25"
          mask="url(#cutSplash)"
        />
        <path
          d="M110 178 C65 150, 16 122, 16 76 C16 50, 35 28, 60 28 C76 28, 90 37, 110 54 C130 37, 144 28, 160 28 C185 28, 204 50, 204 76 C204 122, 155 150, 110 178 Z"
          fill="white"
          opacity=".9"
          mask="url(#cutSplash)"
        />
      </svg>
    </div>

    {/* MEDIKO */}
    <div
      className="splash-title"
      style={{
        fontSize: "3.2rem",
        fontWeight: "900",
        letterSpacing: "0px",
        color: "white",
        marginBottom: "12px",
      }}
    >
      Medi<span style={{ opacity: ".85" }}>ko</span>
    </div>

    {/* Sous-titre */}
    <p
      className="splash-sub"
      style={{
        fontSize: "1rem",
        color: "rgba(255,255,255,0.8)",
        marginBottom: "40px",
        textAlign: "center",
        maxWidth: "300px",
        lineHeight: "1.6",
      }}
    >
      Votre santé en ligne, simplifiée
    </p>

    {/* Loader */}
    <div className="splash-load">
      <svg width="44" height="44" viewBox="0 0 44 44">
        <circle
          cx="22"
          cy="22"
          r="18"
          fill="none"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="3"
        />
        <circle
          cx="22"
          cy="22"
          r="18"
          fill="none"
          stroke="white"
          strokeWidth="3"
          strokeDasharray="36 76"
          strokeLinecap="round"
          style={{
            transformOrigin: "22px 22px",
            animation: "splashLoader .9s linear infinite",
          }}
        />
      </svg>
    </div>
  </div>
);

const ROTATING_TEXTS = [
  "Prenez rendez-vous avec un médecin en quelques clics, 24H/7J.",
  "Accédez à vos ordonnances et résultats d'analyses en ligne.",
  "Des médecins vérifiés et disponibles près de chez vous.",
  "Votre dossier médical sécurisé, accessible partout et à tout moment.",
  "Simplifiez la gestion de votre santé au quotidien avec Mediko.",
  "Accédez aux soins plus facilement — réservez des consultations vidéo ou en présentiel, et recevez des rappels pour ne jamais les manquer.",
  "Bénéficiez de soins personnalisés — échangez avec vos soignants par message et obtenez des conseils préventifs quand vous en avez besoin.",
  "Gérez votre santé — rassemblez toutes vos informations médicales et celles de vos proches en un seul endroit sécurisé.",
];

const HomePage = ({ setPage }) => {
  const [textIndex, setTextIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setTextIndex((i) => (i + 1) % ROTATING_TEXTS.length);
        setFade(true);
      }, 400);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        background: "#fbfdfd",
        fontFamily: "'Segoe UI', Roboto, sans-serif",
        overflowX: "hidden",
      }}
    >
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body, html { margin: 0; padding: 0; background: #fff; overflow-x: hidden; }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes floatChar {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-14px); }
        }
        @keyframes bounceArrow {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(8px); }
        }
        @keyframes countUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ecgDraw {
      
  0%   { stroke-dashoffset: 500; opacity: 1; }
  45%  { stroke-dashoffset: 0;   opacity: 1; }
  55%  { stroke-dashoffset: 0;   opacity: 1; }
  100% { stroke-dashoffset: -500; opacity: 1; }
}

        .stat-item { animation: countUp .6s both; opacity: 0; }
        .stat-item:nth-child(1) { animation-delay: 1s; }
        .stat-item:nth-child(2) { animation-delay: 2s; }
        .stat-item:nth-child(3) { animation-delay: 3s; }

        .card-hover { transition: transform .25s, box-shadow .25s; }
        .card-hover:hover { transform: translateY(-6px); box-shadow: 0 20px 50px rgba(0,0,0,0.08) !important; }
        .btn-green { transition: all .2s; }
        .btn-green:hover { filter: brightness(1.1); transform: translateY(-2px); }
        .btn-blue { transition: all .2s; }
        .btn-blue:hover { filter: brightness(1.1); transform: translateY(-2px); }

        .ecg-line {
          stroke-dasharray: 500;
          stroke-dashoffset: 500;
          animation: ecgDraw 6s ease-in-out infinite;
        }
      `}</style>

      {/* ── HERO ── */}
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 4vw",
          position: "relative",
          gap: "20px",
        }}
      >
        {/* COLONNE GAUCHE — vide pour l'instant */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1,
          }}
        >
          {" "}
          {/* À remplir plus tard */}
        </div>
        {/* Cercles décoratifs subtils */}
        <div
          style={{
            position: "absolute",
            top: "-80px",
            right: "-80px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(65,173,73,0.06) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-60px",
            left: "-60px",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(0,114,188,0.06) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* COLONNE CENTRE — logo, mediko, titre, stats... */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            zIndex: 1,
            animation: "fadeInUp .7s .1s both",
            opacity: 0,
          }}
        >
          {/* LOGO + MEDIKO empilés */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginBottom: "8px",
              gap: "4px",
            }}
          >
            <svg width="200" height="180" viewBox="0 0 220 200">
              <defs>
                <linearGradient id="hgHome" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#92ce31" />
                  <stop offset="40%" stopColor="#5ab87e" />
                  <stop offset="70%" stopColor="#1477d4" />
                </linearGradient>
                <mask id="cutHome">
                  <path
                    d="M110 178 C65 150, 16 122, 16 76 C16 50, 35 28, 60 28 C76 28, 90 37, 110 54 C130 37, 144 28, 160 28 C185 28, 204 50, 204 76 C204 122, 155 150, 110 178 Z"
                    fill="white"
                  />
                  <rect
                    x="101"
                    y="70"
                    width="19"
                    height="62"
                    rx="4"
                    fill="black"
                  />
                  <rect
                    x="79"
                    y="91"
                    width="63"
                    height="19"
                    rx="4"
                    fill="black"
                  />
                  <polyline
                    points="16,101 44,101 50,101 56,68 61,101 66,134 72,101 77,101 101,101 120,101 144,101 149,101 154,68 159,101 164,130 170,101 175,101 204,101"
                    fill="none"
                    stroke="black"
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="500"
                    strokeDashoffset="500"
                    className="ecg-line"
                  />
                </mask>
              </defs>
              <path
                d="M110 178 C65 150, 16 122, 16 76 C16 50, 35 28, 60 28 C76 28, 90 37, 110 54 C130 37, 144 28, 160 28 C185 28, 204 50, 204 76 C204 122, 155 150, 110 178 Z"
                fill="url(#hgHome)"
                mask="url(#cutHome)"
              />
            </svg>

            <div
              style={{
                fontSize: "2.8rem",
                fontWeight: "900",
                letterSpacing: "0px",
                fontFamily: "'Montserrat', sans-serif",
              }}
            >
              <span style={{ color: "#000000" }}>Medi</span>
              <span
                style={{
                  background: "linear-gradient(135deg, #92ce31, #1477d4)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                ko
              </span>
            </div>
          </div>

          {/* Grand titre */}
          <h1
            style={{
              fontSize: "clamp(1.8rem, 3vw, 2.6rem)",
              fontWeight: "800",
              lineHeight: 1.1,
              marginBottom: "12px",
              background: "linear-gradient(135deg, #10b981 0%, #0072BC 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Bienvenue sur
            <br />
            votre santé en ligne
          </h1>

          {/* Texte rotatif */}
          <div
            style={{
              minHeight: "60px",
              padding: "14px 20px",
              background:
                "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(0,114,188,0.08))",
              borderRadius: "14px",
              borderLeft: "3px solid #10b981",
              marginBottom: "20px",
              transition: "opacity .4s ease",
              opacity: fade ? 1 : 0,
            }}
          >
            <p
              style={{
                fontSize: "1rem",
                color: "#4b5563",
                lineHeight: "1.6",
                margin: 0,
              }}
            >
              {ROTATING_TEXTS[textIndex]}
            </p>
          </div>

          {/* Stats */}
          <div
            style={{
              display: "flex",
              gap: "28px",
              flexWrap: "wrap",
              marginBottom: "24px",
              justifyContent: "center",
            }}
          >
            {[
              {
                icon: (
                  <svg width="40" height="40" viewBox="0 0 46 46">
                    <circle
                      cx="23"
                      cy="23"
                      r="22"
                      fill="#e6f1fb"
                      stroke="#378add"
                      strokeWidth=".8"
                    />
                    <circle cx="23" cy="16" r="7" fill="#378add" />
                    <path
                      d="M8 40 Q8 28 23 28 Q38 28 38 40"
                      fill="#378add"
                      opacity=".8"
                    />
                  </svg>
                ),
                val: "10k+",
                lbl: "Patients",
              },
              {
                icon: (
                  <svg width="40" height="40" viewBox="0 0 46 46">
                    <circle
                      cx="23"
                      cy="23"
                      r="22"
                      fill="#e1f5ee"
                      stroke="#1d9e75"
                      strokeWidth=".8"
                    />
                    <circle
                      cx="23"
                      cy="30"
                      r="7"
                      fill="none"
                      stroke="#1d9e75"
                      strokeWidth="3"
                    />
                    <path
                      d="M16 30 Q14 20 18 16 Q23 12 28 16 Q32 20 30 30"
                      fill="none"
                      stroke="#1d9e75"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <circle cx="30" cy="30" r="3" fill="#1d9e75" />
                  </svg>
                ),
                val: "500+",
                lbl: "Médecins",
              },
              {
                icon: (
                  <svg width="40" height="40" viewBox="0 0 46 46">
                    <circle
                      cx="23"
                      cy="23"
                      r="22"
                      fill="#faeeda"
                      stroke="#ba7517"
                      strokeWidth=".8"
                    />
                    <rect
                      x="10"
                      y="16"
                      width="26"
                      height="20"
                      rx="3"
                      fill="none"
                      stroke="#ba7517"
                      strokeWidth="2"
                    />
                    <line
                      x1="10"
                      y1="23"
                      x2="36"
                      y2="23"
                      stroke="#ba7517"
                      strokeWidth="1.5"
                    />
                    <line
                      x1="17"
                      y1="11"
                      x2="17"
                      y2="19"
                      stroke="#ba7517"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <line
                      x1="29"
                      y1="11"
                      x2="29"
                      y2="19"
                      stroke="#ba7517"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <circle cx="17" cy="28" r="2" fill="#ba7517" />
                    <circle cx="23" cy="28" r="2" fill="#ba7517" />
                    <circle cx="29" cy="28" r="2" fill="#ba7517" />
                  </svg>
                ),
                val: "50k+",
                lbl: "RDV / mois",
              },
            ].map((s) => (
              <div
                key={s.lbl}
                className="stat-item"
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                {s.icon}
                <div>
                  <strong
                    style={{
                      display: "block",
                      fontSize: "20px",
                      color: "#1a202c",
                      lineHeight: 1,
                    }}
                  >
                    {s.val}
                  </strong>
                  <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                    {s.lbl}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Bouton Choisissez votre compte → scroll vers connexion */}
          <a
            href="#connexion"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "14px 32px",
              borderRadius: "9999px",
              background: "linear-gradient(135deg, #20c997, #0d9488)",
              color: "#fff",
              fontWeight: "600",
              fontSize: "1rem",
              textDecoration: "none",
              boxShadow: "0 4px 18px rgba(13,148,136,0.35)",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow =
                "0 8px 24px rgba(13,148,136,0.45)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 4px 18px rgba(13,148,136,0.35)";
            }}
          >
            Choisissez votre compte
            <span style={{ fontSize: "1.1rem" }}>↓</span>
          </a>
        </div>

        {/* COLONNE DROITE — vidéo personnage */}
        <div
          style={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1,
          }}
        >
          <video
            src="/vv.mp4"
            autoPlay
            loop
            muted
            playsInline
            style={{
              width: "clamp(180px, 15vw, 320px)",
              height: "auto",
              objectFit: "contain",
              display: "block",
            }}
          />
        </div>
      </div>

      {/* ── SECTION CARTES ── */}
      <section id="connexion">
        <div
          style={{
            padding: "60px 6vw 80px",
            display: "flex",
            gap: "28px",
            justifyContent: "center",
            flexWrap: "wrap",
            background: "#f8fafc",
            borderTop: "1px solid #e2e8f0",
          }}
        >
          {/* CARTE PATIENT */}
          <div
            className="card-hover"
            style={{
              flex: "1",
              minWidth: "280px",
              maxWidth: "460px",
              background: "#fff",
              borderRadius: "28px",
              padding: "36px 28px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.05)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              borderTop: "4px solid #059669",
            }}
          >
            <svg
              width="52"
              height="52"
              viewBox="0 0 52 52"
              style={{ marginBottom: "16px" }}
            >
              <circle cx="26" cy="26" r="25" fill="#e6f1fb" />
              <circle cx="26" cy="18" r="9" fill="#378add" />
              <path
                d="M6 50 Q6 34 26 34 Q46 34 46 50"
                fill="#378add"
                opacity=".8"
              />
            </svg>
            <h2
              style={{
                fontSize: "22px",
                fontWeight: "700",
                marginBottom: "18px",
                color: "#1a202c",
              }}
            >
              Je suis patient
            </h2>
            {[
              "📅 Recherchez un médecin par spécialité",
              "🕒 Réservez en ligne 24h/24",
              "❤️ Gérez votre historique médical",
              "🛡️ Données sécurisées RGPD",
            ].map((t) => (
              <div
                key={t}
                style={{
                  width: "100%",
                  padding: "13px 16px",
                  borderRadius: "12px",
                  background: "#f8fafc",
                  border: "1px solid #f1f5f9",
                  marginBottom: "8px",
                  fontSize: "14px",
                  color: "#4b5563",
                  textAlign: "left",
                }}
              >
                {t}
              </div>
            ))}
            <button
              className="btn-green"
              onClick={() => setPage("patientRegister")}
              style={{
                width: "100%",
                padding: "16px",
                marginTop: "18px",
                borderRadius: "12px",
                border: "none",
                background: "#059669",
                color: "#fff",
                fontWeight: "700",
                fontSize: "15px",
                cursor: "pointer",
              }}
            >
              Créer mon compte patient →
            </button>
            <button
              onClick={() => setPage("connecterPatient")}
              style={{
                width: "100%",
                padding: "14px",
                marginTop: "10px",
                borderRadius: "12px",
                border: "2px solid #059669",
                background: "transparent",
                color: "#059669",
                fontWeight: "600",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              Déjà inscrit ? Se connecter
            </button>
          </div>

          {/* CARTE MÉDECIN */}
          <div
            className="card-hover"
            style={{
              flex: "1",
              minWidth: "280px",
              maxWidth: "460px",
              background: "#fff",
              borderRadius: "28px",
              padding: "36px 28px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.05)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              borderTop: "4px solid #2563eb",
            }}
          >
            <svg
              width="52"
              height="52"
              viewBox="0 0 52 52"
              style={{ marginBottom: "16px" }}
            >
              <circle cx="26" cy="26" r="25" fill="#e1f5ee" />
              <circle
                cx="26"
                cy="32"
                r="9"
                fill="none"
                stroke="#1d9e75"
                strokeWidth="3.5"
              />
              <path
                d="M17 32 Q14 20 19 15 Q26 9 33 15 Q38 20 35 32"
                fill="none"
                stroke="#1d9e75"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <circle cx="35" cy="32" r="4" fill="#1d9e75" />
            </svg>
            <h2
              style={{
                fontSize: "22px",
                fontWeight: "700",
                marginBottom: "18px",
                color: "#1a202c",
              }}
            >
              Je suis médecin
            </h2>
            {[
              "📅 Agenda en ligne synchronisé",
              "🕒 Réduisez les absences",
              "💙 Gestion des dossiers patients",
              "⭐ Visibilité accrue",
            ].map((t) => (
              <div
                key={t}
                style={{
                  width: "100%",
                  padding: "13px 16px",
                  borderRadius: "12px",
                  background: "#f8fafc",
                  border: "1px solid #f1f5f9",
                  marginBottom: "8px",
                  fontSize: "14px",
                  color: "#4b5563",
                  textAlign: "left",
                }}
              >
                {t}
              </div>
            ))}
            <button
              className="btn-blue"
              onClick={() => setPage("doctorRegister")}
              style={{
                width: "100%",
                padding: "16px",
                marginTop: "18px",
                borderRadius: "12px",
                border: "none",
                background: "#2563eb",
                color: "#fff",
                fontWeight: "700",
                fontSize: "15px",
                cursor: "pointer",
              }}
            >
              Créer mon compte médecin →
            </button>
            <button
              onClick={() => setPage("connecterMedecin")}
              style={{
                width: "100%",
                padding: "14px",
                marginTop: "10px",
                borderRadius: "12px",
                border: "2px solid #2563eb",
                background: "transparent",
                color: "#2563eb",
                fontWeight: "600",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              Espace professionnel : Connexion
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default App;
