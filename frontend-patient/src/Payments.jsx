import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "./Header";
import "./DoctorSearch.css";

/* ── Hardcoded demo payment ─────────────────────────────────────── */
const DEMO_PAYMENT = {
  id: "demo-001",
  doctor: "Dr. Karim Benali",
  specialty: "Médecin généraliste",
  date: "Jeudi 8 mai 2026",
  time: "10:30",
  amount: 1500,
  currency: "DA",
  transactionId: "PAY-MED-2026-7X4K9",
};

/* ── Animated checkmark SVG ─────────────────────────────────────── */
function Checkmark() {
  return (
    <svg viewBox="0 0 52 52" style={{ width: 72, height: 72 }}>
      <style>{`
        .chk-circle {
          stroke-dasharray: 166;
          stroke-dashoffset: 166;
          animation: chk-stroke 0.6s cubic-bezier(0.65,0,0.45,1) forwards;
        }
        .chk-tick {
          stroke-dasharray: 48;
          stroke-dashoffset: 48;
          animation: chk-stroke 0.3s cubic-bezier(0.65,0,0.45,1) 0.6s forwards;
        }
        @keyframes chk-stroke {
          100% { stroke-dashoffset: 0; }
        }
      `}</style>
      <circle className="chk-circle" cx="26" cy="26" r="25"
        fill="none" stroke="#22c55e" strokeWidth="2" />
      <polyline className="chk-tick" fill="none" stroke="#22c55e"
        strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
        points="14,27 22,35 38,18" />
    </svg>
  );
}

/* ── Card visual ────────────────────────────────────────────────── */
function CreditCard({ number, expiry, name }) {
  return (
    <div style={{
      width: "100%", maxWidth: 340, height: 200,
      borderRadius: 20,
      background: "linear-gradient(135deg,#1e3a5f 0%,#0072BC 60%,#41AD49 100%)",
      color: "#fff", padding: "28px 28px 24px",
      boxSizing: "border-box",
      boxShadow: "0 20px 40px rgba(0,114,188,0.35)",
      display: "flex", flexDirection: "column", justifyContent: "space-between",
      position: "relative", overflow: "hidden",
      margin: "0 auto 24px",
    }}>
      {/* shine */}
      <div style={{
        position: "absolute", top: -60, right: -40,
        width: 180, height: 180, borderRadius: "50%",
        background: "rgba(255,255,255,0.08)",
      }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: 1, opacity: .8 }}>MEDIKO PAY</span>
        <span style={{ fontSize: 22 }}>💳</span>
      </div>
      <div style={{ fontSize: 20, letterSpacing: 4, fontWeight: 700, fontFamily: "monospace" }}>
        {number}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontSize: 10, opacity: .7, marginBottom: 2 }}>TITULAIRE</div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{name}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, opacity: .7, marginBottom: 2 }}>EXPIRE</div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{expiry}</div>
        </div>
      </div>
    </div>
  );
}

/* ── Payment modal ──────────────────────────────────────────────── */
function PaymentModal({ onClose, onSuccess }) {
  const [step,    setStep]    = useState("form");  // "form" | "loading" | "success"
  const [card,    setCard]    = useState({ number: "4242 4242 4242 4242", expiry: "12/28", cvv: "123", name: "Mohamed Ali" });
  const [focused, setFocused] = useState(null);

  const handlePay = () => {
    setStep("loading");
    setTimeout(() => setStep("success"), 2200);
  };

  const handleDone = () => {
    onSuccess();
    onClose();
  };

  const field = (label, key, placeholder, maxLen, type = "text") => (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 6, letterSpacing: ".03em" }}>
        {label}
      </label>
      <input
        type={type}
        value={card[key]}
        maxLength={maxLen}
        onFocus={() => setFocused(key)}
        onBlur={() => setFocused(null)}
        onChange={e => setCard(p => ({ ...p, [key]: e.target.value }))}
        style={{
          width: "100%", boxSizing: "border-box",
          padding: "12px 14px", borderRadius: 10, fontSize: 15,
          border: focused === key ? "2px solid #0072BC" : "1.5px solid #e2e8f0",
          outline: "none", background: "#f8fafc",
          transition: "border 0.15s",
          fontFamily: key === "number" || key === "cvv" ? "monospace" : "inherit",
        }}
        placeholder={placeholder}
      />
    </div>
  );

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, padding: 16,
    }}
      onClick={step === "form" ? onClose : undefined}
    >
      <div
        style={{
          background: "#fff", borderRadius: 24, width: "100%", maxWidth: 420,
          padding: 32, boxShadow: "0 32px 64px rgba(0,0,0,0.18)",
          maxHeight: "90vh", overflowY: "auto",
        }}
        onClick={e => e.stopPropagation()}
      >

        {/* ── Form step ── */}
        {step === "form" && <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Payer la consultation</h2>
            <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>✕</button>
          </div>

          <CreditCard number={card.number} expiry={card.expiry} name={card.name} />

          <div style={{ background: "#f8fafc", borderRadius: 12, padding: "14px 16px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, color: "#64748b" }}>{DEMO_PAYMENT.doctor}</div>
              <div style={{ fontSize: 13, color: "#64748b" }}>{DEMO_PAYMENT.date} · {DEMO_PAYMENT.time}</div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#0f172a" }}>
              {DEMO_PAYMENT.amount} {DEMO_PAYMENT.currency}
            </div>
          </div>

          {field("Numéro de carte",   "number", "•••• •••• •••• ••••", 19)}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {field("Date d'expiration", "expiry", "MM/AA", 5)}
            {field("CVV", "cvv", "•••", 4, "password")}
          </div>
          {field("Nom du titulaire", "name", "Prénom Nom", 40)}

          <button
            onClick={handlePay}
            style={{
              width: "100%", padding: "15px 0", borderRadius: 12, border: "none",
              background: "linear-gradient(90deg,#41AD49,#0072BC)",
              color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer",
              marginTop: 8, letterSpacing: ".02em",
              boxShadow: "0 6px 20px rgba(0,114,188,0.3)",
            }}
          >
            Confirmer le paiement · {DEMO_PAYMENT.amount} {DEMO_PAYMENT.currency}
          </button>
          <p style={{ textAlign: "center", fontSize: 12, color: "#94a3b8", marginTop: 12 }}>
            🔒 Paiement sécurisé · Chiffrement SSL
          </p>
        </>}

        {/* ── Loading step ── */}
        {step === "loading" && (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%", margin: "0 auto 24px",
              border: "4px solid #e2e8f0", borderTopColor: "#0072BC",
              animation: "spin 0.8s linear infinite",
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ fontSize: 16, fontWeight: 600, color: "#0f172a", margin: "0 0 8px" }}>
              Traitement en cours…
            </p>
            <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
              Veuillez ne pas fermer cette fenêtre
            </p>
          </div>
        )}

        {/* ── Success step ── */}
        {step === "success" && (
          <div style={{ textAlign: "center", padding: "32px 20px" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
              <Checkmark />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: "0 0 8px" }}>
              Paiement accepté !
            </h2>
            <p style={{ color: "#64748b", fontSize: 14, margin: "0 0 24px" }}>
              Votre paiement a été traité avec succès
            </p>

            <div style={{
              background: "#f0fdf4", border: "1px solid #bbf7d0",
              borderRadius: 14, padding: "16px 20px", marginBottom: 24, textAlign: "left",
            }}>
              {[
                ["Médecin",       DEMO_PAYMENT.doctor],
                ["Date",          `${DEMO_PAYMENT.date} · ${DEMO_PAYMENT.time}`],
                ["Montant",       `${DEMO_PAYMENT.amount} ${DEMO_PAYMENT.currency}`],
                ["ID transaction",DEMO_PAYMENT.transactionId],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13 }}>
                  <span style={{ color: "#64748b" }}>{k}</span>
                  <span style={{ fontWeight: 600, color: "#0f172a" }}>{v}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleDone}
              style={{
                width: "100%", padding: "14px 0", borderRadius: 12, border: "none",
                background: "linear-gradient(90deg,#41AD49,#0072BC)",
                color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer",
              }}
            >
              Voir mon reçu
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main page ──────────────────────────────────────────────────── */
export default function Payments() {
  const [paid,        setPaid]        = useState(false);
  const [modalOpen,   setModalOpen]   = useState(false);

  return (
    <div className="page-wrapper">
      <Header pageTitle="Mes paiements" />

      <nav className="top-actions">
        <Link to="/"             className="tab"><span className="emoji-icon">📅</span> Réserver</Link>
        <Link to="/appointments" className="tab"><span className="emoji-icon">📌</span> Rendez-vous</Link>
        <button className="tab active"><span className="emoji-icon">💳</span> Paiements</button>
        <Link to="/notifications" className="tab"><span className="emoji-icon">🔔</span> Notifications</Link>
      </nav>

      <div style={{ marginTop: 20, marginBottom: 40, paddingInline: 20 }}>
        <main className="notifications-card" style={{ minHeight: 500 }}>
          <div className="notifications-card-header">
            <div>
              <h1 className="card-title">Mes paiements</h1>
              <p className="card-subtitle">Consultations et transactions</p>
            </div>
          </div>

          {/* ── Pending payment ── */}
          {!paid && (
            <section style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: "0 0 12px" }}>
                En attente de paiement
              </h2>
              <div style={{
                borderRadius: 16, border: "1.5px solid #fde68a",
                background: "#fffbeb", padding: "20px 24px",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                gap: 16, flexWrap: "wrap",
              }}>
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 22, flexShrink: 0,
                  }}>🏥</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>{DEMO_PAYMENT.doctor}</div>
                    <div style={{ fontSize: 13, color: "#64748b" }}>{DEMO_PAYMENT.specialty}</div>
                    <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
                      📅 {DEMO_PAYMENT.date} · 🕙 {DEMO_PAYMENT.time}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                  <span style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>
                    {DEMO_PAYMENT.amount} {DEMO_PAYMENT.currency}
                  </span>
                  <button
                    onClick={() => setModalOpen(true)}
                    style={{
                      padding: "10px 22px", borderRadius: 10, border: "none",
                      background: "linear-gradient(90deg,#41AD49,#0072BC)",
                      color: "#fff", fontWeight: 700, fontSize: 14,
                      cursor: "pointer", whiteSpace: "nowrap",
                      boxShadow: "0 4px 14px rgba(0,114,188,0.25)",
                    }}
                  >
                    💳 Payer maintenant
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* ── Paid history ── */}
          {paid && (
            <section>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: "0 0 12px" }}>
                Historique des transactions
              </h2>
              <div style={{
                background: "#f0fdf4", border: "1px solid #bbf7d0",
                borderRadius: 16, padding: "20px 24px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ fontSize: 24 }}>💳</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{DEMO_PAYMENT.doctor}</div>
                      <div style={{ fontSize: 13, color: "#64748b" }}>{DEMO_PAYMENT.date} · {DEMO_PAYMENT.time}</div>
                    </div>
                  </div>
                  <span style={{
                    background: "#dcfce7", color: "#166534",
                    padding: "5px 12px", borderRadius: 999,
                    fontSize: 12, fontWeight: 700,
                  }}>✓ Payé</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #dcfce7", paddingTop: 14, flexWrap: "wrap", gap: 8 }}>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>
                    ID : {DEMO_PAYMENT.transactionId}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>
                    {DEMO_PAYMENT.amount} {DEMO_PAYMENT.currency}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Empty state when nothing pending and no history yet */}
          {!paid && false && (
            <div style={{ textAlign: "center", padding: "60px 20px", opacity: .5 }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>💳</div>
              <p style={{ fontSize: 16, color: "#64748b" }}>Aucun paiement en attente</p>
            </div>
          )}
        </main>
      </div>

      {modalOpen && (
        <PaymentModal
          onClose={() => setModalOpen(false)}
          onSuccess={() => setPaid(true)}
        />
      )}
    </div>
  );
}
