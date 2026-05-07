import React from "react";

const STATUS_MAP = {
  "En attente": { cls: "status-pending",  label: "En attente" },
  "Approuvé":   { cls: "status-approved", label: "Approuvé"   },
  "Rejeté":     { cls: "status-rejected", label: "Rejeté"     },
};

function DoctorCard({ doctor, isSelected, onSelect }) {
  const { cls, label } = STATUS_MAP[doctor.status] ?? STATUS_MAP["En attente"];

  return (
    <div
      className={`doctor-card ${isSelected ? "selected" : ""}`}
      onClick={() => onSelect(doctor)}
    >
      <div className="card-top">
        <div className="doctor-avatar">
          {doctor.prenom?.[0]?.toUpperCase() ?? "?"}
        </div>
        <div className="card-info">
          <p className="card-name">{doctor.displayName}</p>
          <p className="card-specialty">{doctor.specialite}</p>
          <p className="card-rpps">{doctor.rpps}</p>
        </div>
        <span className={`status-badge ${cls}`}>{label}</span>
      </div>
      <div className="card-bottom">
        <span>📅 {doctor.submissionDate}</span>
        {doctor.wilaya && <span>📍 {doctor.wilaya}</span>}
      </div>
    </div>
  );
}

export default DoctorCard;