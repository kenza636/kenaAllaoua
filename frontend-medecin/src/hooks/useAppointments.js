import { useState, useEffect, useCallback } from "react";
import { useUser } from "../contexts/UserContext";
import { API_URL, toLocalDateStr } from "../utils/rdv";

export function useAppointments() {
  const { user } = useUser();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const doctorId = user?.id_u || user?.id;

  const fetchRdv = useCallback(async () => {
    if (!doctorId) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/rdv/medecin/${doctorId}`);
      setAppointments(await res.json());
    } catch (err) {
      console.error("Erreur chargement RDV:", err);
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => { fetchRdv(); }, [fetchRdv]);

  const todayStr        = toLocalDateStr(new Date());
  const todayAppts      = appointments.filter(a => toLocalDateStr(a.date) === todayStr);
  const upcomingCount   = appointments.filter(a => toLocalDateStr(a.date) > todayStr).length;
  const teleconsultCount = appointments.filter(a => a.type_consultation === "teleconsultation").length;

  return { appointments, loading, fetchRdv, doctorId, todayAppts, upcomingCount, teleconsultCount };
}
