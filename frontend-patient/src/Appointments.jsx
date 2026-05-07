import React, { useContext, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Star, Calendar, Clock, MapPin, Video, Phone,
  FileText, ChevronRight, AlertCircle, CheckCircle2,
  XCircle, Download,
} from 'lucide-react';
import { UserContext } from './contexts/UserContext';
import { NotificationsContext } from './contexts/NotificationsContext';
import Header from './Header';
import "./DoctorSearch.css";

const API_URL = 'http://localhost:5000/api';

// ── Star picker ───────────────────────────────────────────────────
function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: "flex", gap: "6px" }}>
      {[1,2,3,4,5].map(n => {
        const active = n <= (hovered || value);
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            style={{ background: "none", border: "none", padding: "2px", cursor: "pointer",
              transform: hovered === n ? "scale(1.25)" : "scale(1)", transition: "transform 0.15s" }}
          >
            <Star size={28} color="#f59e0b" fill={active ? "#f59e0b" : "none"} />
          </button>
        );
      })}
    </div>
  );
}

// ── Rating modal ──────────────────────────────────────────────────
function RatingModal({ rdv, patientId, onClose, onRated }) {
  const [note,        setNote]        = useState(0);
  const [commentaire, setCommentaire] = useState("");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");

  const handleSubmit = async () => {
    if (!note) { setError("Veuillez choisir une note."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/ratings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_rdv: rdv.id_rdv, id_patient: patientId, id_medecin: rdv.id_medecin, note, commentaire }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      onRated(rdv.id_rdv);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const LABELS = { 1: "Médiocre", 2: "Insuffisant", 3: "Correct", 4: "Bien", 5: "Excellent" };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:"20px" }}>
      <div style={{ background:"#fff", borderRadius:"20px", padding:"32px", maxWidth:"440px", width:"100%", boxShadow:"0 24px 64px rgba(0,0,0,0.18)" }}>
        <h2 style={{ margin:"0 0 4px", fontSize:"20px", fontWeight:700, color:"#0f172a" }}>Évaluer le médecin</h2>
        <p style={{ margin:"0 0 24px", color:"#64748b", fontSize:"14px" }}>
          Dr. {rdv.medecin_prenom} {rdv.medecin_nom} — {rdv.specialite}
        </p>

        <div style={{ textAlign:"center", marginBottom:"20px" }}>
          <StarPicker value={note} onChange={setNote} />
          {note > 0 && (
            <p style={{ margin:"8px 0 0", fontSize:"14px", fontWeight:600, color:"#f59e0b" }}>{LABELS[note]}</p>
          )}
        </div>

        <textarea
          value={commentaire}
          onChange={e => setCommentaire(e.target.value)}
          placeholder="Partagez votre expérience (optionnel)…"
          rows={3}
          style={{ width:"100%", boxSizing:"border-box", padding:"12px", border:"1px solid #e2e8f0", borderRadius:"12px", fontSize:"14px", resize:"vertical", fontFamily:"inherit", outline:"none" }}
        />

        {error && <p style={{ color:"#ef4444", fontSize:"13px", marginTop:"8px" }}>⚠️ {error}</p>}

        <div style={{ display:"flex", gap:"10px", marginTop:"20px" }}>
          <button onClick={onClose} style={{ flex:1, padding:"12px", border:"1px solid #e2e8f0", borderRadius:"10px", background:"#f8fafc", color:"#0f172a", fontWeight:600, cursor:"pointer", fontSize:"14px" }}>
            Annuler
          </button>
          <button onClick={handleSubmit} disabled={loading || !note} style={{ flex:2, padding:"12px", border:"none", borderRadius:"10px", background: loading || !note ? "#94a3b8" : "#2563eb", color:"#fff", fontWeight:700, cursor: loading || !note ? "not-allowed" : "pointer", fontSize:"14px" }}>
            {loading ? "Envoi…" : "Envoyer mon avis ⭐"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Status badge helpers ──────────────────────────────────────────
const STATUS = {
  confirme:       { label: "✓ Confirmé",            bg: "#d1fae5", color: "#065f46" },
  en_attente:     { label: "En attente",             bg: "#fef3c7", color: "#92400e" },
  termine:        { label: "✅ Consultation effectuée", bg: "#dcfce7", color: "#166534" },
  no_show:        { label: "❌ Consultation manquée", bg: "#fee2e2", color: "#991b1b" },
  annule_patient: { label: "Annulé",                 bg: "#f1f5f9", color: "#64748b" },
  annule_medecin: { label: "Annulé par le médecin",  bg: "#f1f5f9", color: "#64748b" },
};


// ── Main component ────────────────────────────────────────────────
const Appointments = () => {
  const { user }    = useContext(UserContext);
  const notifsData  = useContext(NotificationsContext);

  const [bookings,     setBookings]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [ratedIds,     setRatedIds]     = useState(new Set());
  const [ratingRdv,    setRatingRdv]    = useState(null);
  const [downloadingRx, setDownloadingRx] = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        setLoading(true);
        const res  = await fetch(`${API_URL}/rdv/patient/${user.id}`);
        const data = await res.json();
        setBookings(data);

        // Check which termine RDVs are already rated
        const termine = data.filter(b => b.statut === "termine");
        const checks  = await Promise.all(
          termine.map(b => fetch(`${API_URL}/ratings/check/${b.id_rdv}`).then(r => r.json()))
        );
        const alreadyRated = new Set(
          termine.filter((b, i) => checks[i]?.rated).map(b => b.id_rdv)
        );
        setRatedIds(alreadyRated);
      } catch (err) {
        console.error('Erreur chargement RDV:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  const handleCancel = async (idRdv) => {
    if (!confirm("Confirmer l'annulation ?")) return;
    try {
      const res = await fetch(`${API_URL}/rdv/${idRdv}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'patient' }),
      });
      if (res.ok) {
        setBookings(prev => prev.map(b => b.id_rdv === idRdv ? { ...b, statut: 'annule_patient' } : b));
        notifsData.addNotification('RDV annulé ❌', 'Votre rendez-vous a été annulé');
      }
    } catch { alert("Erreur lors de l'annulation"); }
  };

  const handleRated = useCallback((idRdv) => {
    setRatedIds(prev => new Set([...prev, idRdv]));
  }, []);

  const handleDownloadPrescription = async (b) => {
    setDownloadingRx(b.id_rdv);
    try {
      const res  = await fetch(`${API_URL}/prescriptions/rdv/${b.id_rdv}`);
      if (!res.ok) { alert("Aucune ordonnance disponible pour cette consultation."); return; }
      const data = await res.json();
      window.open(`http://localhost:5000/${data.file_path}`, "_blank");
    } catch {
      alert("Erreur lors du téléchargement de l'ordonnance.");
    } finally {
      setDownloadingRx(null);
    }
  };

  // Extract local YYYY-MM-DD to avoid UTC day-shift in UTC+1 timezone
  const localDay = (iso) => { const d = new Date(iso); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
  const formatDate  = d => new Date(d).toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  const formatHeure = h => h?.substring(0, 5) || '';

  const now      = new Date();
  const upcoming = bookings.filter(b => {
    const dt = new Date(`${localDay(b.date)}T${b.heure_debut}`);
    return dt >= now && !['annule_patient','annule_medecin'].includes(b.statut);
  });
  const past = bookings.filter(b => {
    const dt = new Date(`${localDay(b.date)}T${b.heure_debut}`);
    return dt < now || ['termine','no_show','annule_patient','annule_medecin'].includes(b.statut);
  });

  if (loading) return (
    <div className="page-wrapper">
      <Header pageTitle="Mes rendez-vous" />
      <div style={{ padding: '40px', textAlign: 'center' }}>⏳ Chargement...</div>
    </div>
  );

  /* ── Card ────────────────────────────────────────────────────── */
  const renderCard = (b, isPast) => {
    const st           = STATUS[b.statut] || STATUS.confirme;
    const isTele       = (b.type_consultation || '').toLowerCase().includes('tele');
    const isNoShow     = b.statut === 'no_show';
    const isTermine    = b.statut === 'termine';
    const isCancelled  = ['annule_patient','annule_medecin'].includes(b.statut);
    const canRate      = isTermine && !ratedIds.has(b.id_rdv);
    const alreadyRated = isTermine && ratedIds.has(b.id_rdv);

    return (
      <div key={b.id_rdv} style={{
        borderRadius: '18px',
        marginBottom: '14px',
        overflow: 'hidden',
        opacity: isNoShow || isCancelled ? 0.72 : 1,
        background: isTele ? '#f5f3ff' : '#fff',
        border: isTele ? '1.5px solid #c4b5fd' : '1px solid #e8edf5',
        boxShadow: isPast ? 'none' : isTele
          ? '0 4px 20px rgba(124,58,237,0.10)'
          : '0 4px 20px rgba(0,114,188,0.07)',
      }}>
        {/* Top accent bar */}
        <div style={{ height: '4px', background: isCancelled || isNoShow
          ? '#e2e8f0'
          : isTele
            ? 'linear-gradient(90deg,#7c3aed,#41AD49)'
            : 'linear-gradient(90deg,#0072BC,#41AD49)' }} />

        {/* Teleconsultation header banner */}
        {isTele && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: '10px', padding: '10px 20px',
            background: 'linear-gradient(90deg,#7c3aed15,#6d28d915)',
            borderBottom: '1px solid #c4b5fd55',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              <Video size={15} color="#7c3aed" />
              <span style={{ fontWeight:700, fontSize:'13px', color:'#7c3aed', letterSpacing:'.02em' }}>
                TÉLÉCONSULTATION VIDÉO
              </span>
            </div>
            {!isPast && !isCancelled && !isTermine && (
              <span style={{ fontSize:'12px', color:'#6d28d9', fontWeight:500 }}>
                Lien actif 30 min avant
              </span>
            )}
          </div>
        )}

        <div style={{ padding: '16px 20px' }}>
          {/* Row 1 — doctor + status */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'12px', gap:'12px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
              <div style={{
                width: '46px', height: '46px', borderRadius: '13px', flexShrink: 0,
                background: isTele ? '#ede9fe' : '#eff6ff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: '16px',
                color: isTele ? '#7c3aed' : '#0072BC',
              }}>
                {isTele ? <Video size={20} color="#7c3aed" /> : (b.medecin_prenom?.[0] || 'D')}
              </div>
              <div>
                <p style={{ margin:0, fontWeight:700, fontSize:'15px', color:'#0f172a' }}>
                  Dr. {b.medecin_prenom} {b.medecin_nom}
                </p>
                <p style={{ margin:'2px 0 0', fontSize:'13px', color:'#64748b' }}>{b.specialite}</p>
              </div>
            </div>
            <span style={{ background:st.bg, color:st.color, padding:'4px 12px', borderRadius:'999px', fontSize:'12px', fontWeight:700, whiteSpace:'nowrap', flexShrink:0 }}>
              {st.label}
            </span>
          </div>

          {/* Row 2 — date / time / location */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:'8px 20px', marginBottom:'12px' }}>
            <span style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'13px', color:'#475569' }}>
              <Calendar size={13} color="#94a3b8" /> {formatDate(b.date)}
            </span>
            <span style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'13px', color:'#475569' }}>
              <Clock size={13} color="#94a3b8" /> {formatHeure(b.heure_debut)} – {formatHeure(b.heure_fin)}
            </span>
            <span style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'13px', color: isTele ? '#7c3aed' : '#475569' }}>
              {isTele ? <Video size={13} color="#7c3aed" /> : <MapPin size={13} color="#94a3b8" />}
              {isTele ? 'Consultation à distance' : (b.lieu || 'Cabinet')}
            </span>
            {b.prix && (
              <span style={{ fontSize:'13px', fontWeight:700, color:'#0f172a' }}>{b.prix} DA</span>
            )}
          </div>

          {b.motif && (
            <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'8px', padding:'4px 10px', fontSize:'12px', color:'#64748b', marginBottom:'10px' }}>
              <FileText size={11} /> {b.motif}
            </div>
          )}

          {isNoShow && (
            <div style={{ display:'flex', alignItems:'center', gap:'8px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'10px', padding:'9px 14px', fontSize:'13px', color:'#991b1b', marginBottom:'10px' }}>
              <AlertCircle size={13} /> Vous n'étiez pas présent à cette consultation.
            </div>
          )}

          {/* Action row */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', paddingTop:'12px', borderTop: isTele ? '1px solid #c4b5fd55' : '1px solid #f1f5f9', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
              {!isPast && !isCancelled && (
                <button onClick={() => handleCancel(b.id_rdv)} style={{ display:'flex', alignItems:'center', gap:'6px', padding:'7px 14px', borderRadius:'8px', border:'1px solid #fecaca', background:'#fef2f2', color:'#ef4444', fontWeight:600, fontSize:'13px', cursor:'pointer' }}>
                  <XCircle size={13} /> Annuler
                </button>
              )}
              {isTermine && (
                <button onClick={() => handleDownloadPrescription(b)} disabled={downloadingRx === b.id_rdv}
                  style={{ display:'flex', alignItems:'center', gap:'6px', padding:'7px 14px', borderRadius:'8px', border:'1px solid #bfdbfe', background:'#eff6ff', color:'#2563eb', fontWeight:600, fontSize:'13px', cursor: downloadingRx === b.id_rdv ? 'not-allowed' : 'pointer', opacity: downloadingRx === b.id_rdv ? .6 : 1 }}>
                  <Download size={13} /> {downloadingRx === b.id_rdv ? 'Chargement…' : 'Ordonnance'}
                </button>
              )}
            </div>
            <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
              {canRate && (
                <button onClick={() => setRatingRdv(b)} style={{ display:'flex', alignItems:'center', gap:'6px', padding:'7px 14px', border:'none', borderRadius:'8px', background:'#fef3c7', color:'#92400e', fontWeight:700, cursor:'pointer', fontSize:'13px' }}>
                  <Star size={13} fill="#f59e0b" color="#f59e0b" /> Évaluer
                </button>
              )}
              {alreadyRated && (
                <span style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'13px', color:'#16a34a' }}>
                  <CheckCircle2 size={13} /> Évalué
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ── Page layout ──────────────────────────────────────────────── */
  // Sort upcoming: closest first; sort past: most recent first
  const upcomingSorted = [...upcoming].sort((a, b) => {
    const t = x => new Date(`${localDay(x.date)}T${x.heure_debut}`).getTime();
    return t(a) - t(b);
  });
  const pastSorted = [...past].sort((a, b) => {
    const t = x => new Date(`${localDay(x.date)}T${x.heure_debut}`).getTime();
    return t(b) - t(a);
  });

  return (
    <div className="page-wrapper">
      <Header pageTitle="Mes rendez-vous" />

      {ratingRdv && (
        <RatingModal
          rdv={ratingRdv}
          patientId={user?.id}
          onClose={() => setRatingRdv(null)}
          onRated={handleRated}
        />
      )}

      <nav className="top-actions">
        <Link to="/" className="tab"><span className="emoji-icon">📅</span> Réserver</Link>
        <button className="tab active"><span className="emoji-icon">📌</span> Rendez-vous</button>
        <Link to="/payments" className="tab"><span className="emoji-icon">💳</span> Paiements</Link>
        <Link to="/notifications" className="tab"><span className="emoji-icon">🔔</span> Notifications</Link>
      </nav>

      <div style={{ margin:'20px', marginBottom:'40px', padding:'0 20px' }}>
        <main className="notifications-card" style={{ minHeight:'600px' }}>

          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px' }}>
            <div>
              <h1 className="card-title">Mes rendez-vous</h1>
              <p className="card-subtitle">{bookings.length} consultation{bookings.length !== 1 ? 's' : ''} au total</p>
            </div>
            <Link to="/" style={{ display:'flex', alignItems:'center', gap:'6px', padding:'10px 18px', borderRadius:'10px', background:'linear-gradient(90deg,#41AD49,#0072BC)', color:'#fff', fontWeight:700, fontSize:'14px', textDecoration:'none' }}>
              <Calendar size={15} /> Nouveau RDV
            </Link>
          </div>

          {loading ? (
            <div style={{ padding:'60px 0', textAlign:'center', color:'#94a3b8' }}>⏳ Chargement...</div>
          ) : bookings.length === 0 ? (
            <div style={{ textAlign:'center', padding:'60px 0' }}>
              <Calendar size={56} style={{ color:'#e2e8f0', marginBottom:'16px' }} />
              <h2 style={{ fontSize:'20px', fontWeight:600, color:'#1f2937', margin:'0 0 8px' }}>Aucun rendez-vous</h2>
              <p style={{ color:'#6b7280', fontSize:'14px', margin:0 }}>Vous n'avez pas encore de rendez-vous planifié</p>
            </div>
          ) : (
            <>
              {upcomingSorted.length > 0 && (
                <>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'14px' }}>
                    <Clock size={16} color="#0072BC" />
                    <h2 style={{ margin:0, fontSize:'16px', fontWeight:700, color:'#0f172a' }}>
                      À venir <span style={{ color:'#64748b', fontWeight:500, fontSize:'14px' }}>({upcomingSorted.length})</span>
                    </h2>
                  </div>
                  {upcomingSorted.map(b => renderCard(b, false))}
                </>
              )}

              {pastSorted.length > 0 && (
                <>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', margin:'28px 0 14px', paddingTop: upcomingSorted.length > 0 ? '20px' : 0, borderTop: upcomingSorted.length > 0 ? '1px solid #f1f5f9' : 'none' }}>
                    <CheckCircle2 size={16} color="#64748b" />
                    <h2 style={{ margin:0, fontSize:'16px', fontWeight:700, color:'#64748b' }}>
                      Historique <span style={{ fontWeight:500, fontSize:'14px' }}>({pastSorted.length})</span>
                    </h2>
                  </div>
                  {pastSorted.map(b => renderCard(b, true))}
                </>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Appointments;
