export const API_URL = "http://localhost:5000/api";

export function canJoin(appt) {
  if (appt.type_consultation !== "teleconsultation") return false;
  if (!["confirme", "en_attente"].includes(appt.statut)) return false;
  return true; // TODO: restore time-window check before production
}

export function toLocalDateStr(d) {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

export function getStatusLabel(statut) {
  const map = {
    confirme:       { text: "Confirmé",       color: "#16a34a", bg: "#dcfce7" },
    en_attente:     { text: "En attente",      color: "#d97706", bg: "#fef3c7" },
    annule_patient: { text: "Annulé patient",  color: "#991b1b", bg: "#fee2e2" },
    annule_medecin: { text: "Annulé par moi",  color: "#991b1b", bg: "#fee2e2" },
    termine:        { text: "Terminé",            color: "#16a34a", bg: "#dcfce7" },
    no_show:        { text: "Absent (no-show)",  color: "#991b1b", bg: "#fee2e2" },
  };
  return map[statut] || { text: statut, color: "#475569", bg: "#f1f5f9" };
}

export const formatHeure = (h) => h?.substring(0, 5) || "";
export const formatDate  = (d) =>
  new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
