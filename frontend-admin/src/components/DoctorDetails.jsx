import React, { useState, useEffect } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import "./DoctorDetails.css";

const API = "http://localhost:5000/api/admin";

function relativeTime(dateStr) {
  if (!dateStr) return "";
  const diff  = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60_000);
  if (mins < 1)  return "Soumis à l'instant";
  if (mins < 60) return `Soumis il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs  < 24) return `Soumis il y a ${hrs} h`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `Soumis il y a ${days} j`;
  return `Soumis il y a ${Math.floor(days / 30)} mois`;
}

function DoctorDetails({ doctor, onApprove, onReject }) {
  const [rejectionReason, setRejectionReason] = useState("");
  const [relative, setRelative]               = useState("");

  useEffect(() => {
    if (!doctor) return;
    setRejectionReason("");
    setRelative(relativeTime(doctor.created_at || doctor.submissionFull));
    const timer = setInterval(
      () => setRelative(relativeTime(doctor.created_at || doctor.submissionFull)),
      60_000
    );
    return () => clearInterval(timer);
  }, [doctor]);

  if (!doctor) {
    return (
      <div className="empty-state">
        <p>Sélectionnez un médecin pour voir ses détails</p>
      </div>
    );
  }

  const isPending  = doctor.status === "En attente";
  const isApproved = doctor.status === "Approuvé";
  const isRejected = doctor.status === "Rejeté";

  const diplomaUrl = doctor.diploma_file_path
    ? `${API}/medecins/${doctor.id}/diploma`
    : null;

  const isPdf = doctor.diploma_file_path?.toLowerCase().endsWith(".pdf");

  return (
    <div className="doctor-details">
      <div className="details-header">
        <h2 className="details-name">{doctor.displayName}</h2>
        <p className="details-specialty">{doctor.specialite}</p>
      </div>

      <div className="details-content">
        {/* Info rows */}
        {[
          { label: "Email",        value: doctor.email },
          { label: "Téléphone",    value: doctor.telephone || "—" },
          { label: "Numéro RPPS",  value: doctor.rpps },
          { label: "Wilaya",       value: doctor.wilaya || "—" },
          { label: "Adresse",      value: doctor.adresse || "—" },
        ].map(({ label, value }) => (
          <div className="info-row" key={label}>
            <span className="info-label">{label}</span>
            <span className="info-value">{value}</span>
          </div>
        ))}

        {/* Submission date + relative time */}
        <div className="info-row">
          <span className="info-label">Date de soumission</span>
          <span className="info-value">
            {doctor.submissionFull}
            {relative && (
              <span style={{
                marginLeft: "8px",
                fontSize: "11px",
                fontWeight: "500",
                color: "#fff",
                background: "#64748b",
                borderRadius: "20px",
                padding: "2px 8px",
              }}>
                {relative}
              </span>
            )}
          </span>
        </div>

        <hr />

        {/* Diploma viewer */}
        <div className="upload-section">
          <label className="upload-label">📎 Document justificatif</label>
          {diplomaUrl ? (
            <div style={{ marginTop: "10px" }}>
              {isPdf ? (
                <iframe
                  src={diplomaUrl}
                  title="Diplôme"
                  style={{ width: "100%", height: "300px", border: "1px solid #e2e8f0", borderRadius: "10px" }}
                />
              ) : (
                <img
                  src={diplomaUrl}
                  alt="Diplôme"
                  style={{ width: "100%", maxHeight: "300px", objectFit: "contain", borderRadius: "10px", border: "1px solid #e2e8f0" }}
                />
              )}
              <a
                href={diplomaUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  marginTop: "8px", fontSize: "13px", color: "#2563eb", fontWeight: "600",
                  textDecoration: "none",
                }}
              >
                ⬇️ Télécharger le document
              </a>
            </div>
          ) : (
            <p style={{ color: "#94a3b8", fontSize: "13px", marginTop: "8px" }}>
              Aucun document soumis
            </p>
          )}
        </div>

        <hr />

        {/* Rejection reason (shown when already rejected) */}
        {isRejected && doctor.rejection_reason && (
          <div style={{ background: "#fef2f2", borderRadius: "10px", padding: "12px 16px", marginBottom: "12px" }}>
            <p style={{ fontSize: "12px", fontWeight: "600", color: "#991b1b", margin: "0 0 4px" }}>Motif de rejet</p>
            <p style={{ fontSize: "13px", color: "#7f1d1d", margin: 0 }}>{doctor.rejection_reason}</p>
          </div>
        )}

        {/* Rejection reason textarea — only shown for pending doctors */}
        {isPending && (
          <div className="upload-section">
            <label className="upload-label">📝 Motif de rejet (optionnel)</label>
            <textarea
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              className="message-textarea"
              placeholder="Précisez la raison du rejet pour informer le médecin…"
              rows="3"
            />
          </div>
        )}

        {/* Action buttons */}
        <div className="action-buttons">
          <button
            className="btn-approve"
            onClick={() => onApprove(doctor.id)}
            disabled={isApproved}
            title={isApproved ? "Déjà approuvé" : "Approuver ce médecin"}
          >
            <CheckCircle size={16} /> Approuver
          </button>
          <button
            className="btn-reject"
            onClick={() => onReject(doctor.id, rejectionReason)}
            disabled={isApproved}
            title={isApproved ? "Déjà approuvé" : "Rejeter ce médecin"}
          >
            <XCircle size={16} /> Rejeter
          </button>
        </div>

        {isApproved && <p className="status-message approved">✅ Médecin approuvé</p>}
        {isRejected && <p className="status-message rejected">❌ Demande rejetée</p>}
      </div>
    </div>
  );
}

export default DoctorDetails;
