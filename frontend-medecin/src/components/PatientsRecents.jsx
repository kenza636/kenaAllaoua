import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Phone, Mail, FileText, Download, Paperclip,
  Calendar, Droplet, AlertCircle, Edit2, Save,
} from "lucide-react";
import { useUser, getInitiales } from "../contexts/UserContext";

const API_URL = "http://localhost:5000/api";

function calcAge(ddn) {
  if (!ddn) return null;
  const birth = new Date(ddn);
  const now   = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

function fmtDate(d) {
  if (!d) return "—";
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}/${dt.getFullYear()}`;
}

function sexeLabel(s) {
  if (s === "M") return "Homme";
  if (s === "F") return "Femme";
  return null;
}

const typeConsultLabel = { presentiel: "Consultation", teleconsultation: "Téléconsultation" };

function PatientsRecents() {
  const { user } = useUser();
  const doctorId = user?.id_u || user?.id;

  const [patients,       setPatients]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [searchTerm,     setSearchTerm]     = useState("");
  const [selectedId,     setSelectedId]     = useState(null);
  const [history,        setHistory]        = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [activeTab,            setActiveTab]            = useState("Historique");
  const [documents,            setDocuments]            = useState([]);
  const [prescriptions,        setPrescriptions]        = useState([]);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);
  const [uploadingRdvId,       setUploadingRdvId]       = useState(null);
  const fileInputRef    = useRef(null);
  const rxFileInputRef  = useRef(null);
  const pendingRdvRef   = useRef(null); // which rdv is waiting for the file picker

  // ── Upload prescription scan ─────────────────────────────────────
  const handleRxFileChange = async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file || !pendingRdvRef.current) return;
    const rdv = pendingRdvRef.current;
    pendingRdvRef.current = null;
    setUploadingRdvId(rdv.id_rdv);
    try {
      const form = new FormData();
      form.append("file",       file);
      form.append("id_rdv",     rdv.id_rdv);
      form.append("id_medecin", doctorId);
      form.append("id_patient", selectedId);
      const res = await fetch(`${API_URL}/prescriptions`, { method: "POST", body: form });
      if (!res.ok) throw new Error((await res.json()).message);
      const refreshed = await fetch(`${API_URL}/prescriptions/medecin-patient/${doctorId}/${selectedId}`);
      setPrescriptions(await refreshed.json());
    } catch (err) {
      alert("Erreur upload : " + err.message);
    } finally {
      setUploadingRdvId(null);
    }
  };

  // ── Fetch patients ──────────────────────────────────────────────
  const fetchPatients = useCallback(async () => {
    if (!doctorId) return;
    try {
      setLoading(true);
      const res  = await fetch(`${API_URL}/patients/medecin/${doctorId}`);
      const data = await res.json();
      setPatients(data);
      if (data.length > 0) setSelectedId(data[0].id_u);
    } catch (err) {
      console.error("Erreur patients:", err);
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  // ── Fetch historique quand patient sélectionné ──────────────────
  useEffect(() => {
    if (!selectedId || !doctorId) return;
    setLoadingHistory(true);
    setHistory([]);
    fetch(`${API_URL}/patients/${selectedId}/rdv/${doctorId}`)
      .then(r => r.json())
      .then(data => setHistory(data))
      .catch(() => setHistory([]))
      .finally(() => setLoadingHistory(false));
    setActiveTab("Historique");
    setDocuments([]);
    setPrescriptions([]);
    // Fetch prescriptions for this patient from this doctor
    setLoadingPrescriptions(true);
    fetch(`${API_URL}/prescriptions/medecin-patient/${doctorId}/${selectedId}`)
      .then(r => r.json())
      .then(data => setPrescriptions(Array.isArray(data) ? data : []))
      .catch(() => setPrescriptions([]))
      .finally(() => setLoadingPrescriptions(false));
  }, [selectedId, doctorId]);

  const pat = patients.find(p => p.id_u === selectedId);

  const filtered = patients.filter(p => {
    const full = `${p.prenom_u} ${p.nom_u}`.toLowerCase();
    return full.includes(searchTerm.toLowerCase()) || (p.tel_u || "").includes(searchTerm);
  });

  const handleFileUpload = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setDocuments(prev => [{
      id: Date.now(), title: f.name,
      date: new Date().toLocaleDateString("fr-FR"),
      size: (f.size / 1024 / 1024).toFixed(1) + " MB",
    }, ...prev]);
  };

  // ── Shared styles ────────────────────────────────────────────────
  const sectionCard = { backgroundColor: "#F8FAFC", borderRadius: "16px", padding: "20px", marginBottom: "16px" };
  const sectionTitle = { fontSize: "13px", fontWeight: "700", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" };
  const infoRow = { display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" };
  const iconBox = { width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563EB", flexShrink: 0 };

  if (loading) return (
    <div className="patients-page-container">
      <div style={{ textAlign: "center", padding: "80px", color: "#64748b" }}>⏳ Chargement des patients…</div>
    </div>
  );

  return (
    <div className="patients-page-container">

      {/* ── Header ── */}
      <div className="header-flex-figma">
        <div>
          <h1 className="figma-title">Patients</h1>
          <p className="figma-subtitle">
            {patients.length} patient{patients.length !== 1 ? "s" : ""} suivis
          </p>
        </div>
      </div>

      <div className="patients-main-layout">

        {/* ── Liste gauche ── */}
        <div className="sidebar-list">
          <div className="search-row-figma" style={{ marginBottom: "12px" }}>
            <div className="search-container-figma">
              <span className="search-icon-figma">🔍</span>
              <input
                type="text"
                className="input-figma"
                placeholder="Nom ou téléphone…"
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="patients-scroll-area">
            {filtered.length === 0 && (
              <p style={{ color: "#94a3b8", textAlign: "center", padding: "20px", fontSize: "14px" }}>
                Aucun patient trouvé
              </p>
            )}
            {filtered.map(p => (
              <div
                key={p.id_u}
                className={`patient-list-item ${selectedId === p.id_u ? "active" : ""}`}
                onClick={() => setSelectedId(p.id_u)}
              >
                <div className="patient-list-avatar">
                  {getInitiales(p.prenom_u, p.nom_u)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ fontSize: "15px", fontWeight: "700", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {p.prenom_u} {p.nom_u}
                  </h4>
                  <span style={{ fontSize: "13px", opacity: 0.7 }}>
                    {calcAge(p.date_naissance) ? `${calcAge(p.date_naissance)} ans` : ""}
                    {calcAge(p.date_naissance) && sexeLabel(p.sexe) ? " · " : ""}
                    {sexeLabel(p.sexe) || ""}
                  </span>
                </div>
                <span style={{ fontSize: "11px", opacity: 0.5, flexShrink: 0 }}>{p.nb_rdv} RDV</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Détail droite ── */}
        <div className="details-panel">
          {!pat ? (
            <div className="empty-view">Sélectionnez un patient</div>
          ) : (
            <>
              {/* En-tête */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div style={{
                    width: "70px", height: "70px", borderRadius: "50%",
                    backgroundColor: "#DBEAFE", color: "#2563EB",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: "800", fontSize: "28px",
                    boxShadow: "0 2px 4px rgba(37,99,235,0.1), 0 8px 24px -4px rgba(37,99,235,0.25)",
                  }}>
                    {getInitiales(pat.prenom_u, pat.nom_u)}
                  </div>
                  <div>
                    <p style={{ fontSize: "22px", fontWeight: "800", margin: 0, color: "#0F172A" }}>
                      {pat.prenom_u} {pat.nom_u}
                    </p>
                    <p style={{ margin: "4px 0 0 0", color: "#64748B", fontSize: "14px" }}>
                      {calcAge(pat.date_naissance) ? `${calcAge(pat.date_naissance)} ans` : ""}
                      {calcAge(pat.date_naissance) && sexeLabel(pat.sexe) ? " · " : ""}
                      {sexeLabel(pat.sexe) || ""}
                      {pat.ville ? ` · ${pat.ville}` : ""}
                    </p>
                    <p style={{ margin: "2px 0 0 0", color: "#94a3b8", fontSize: "13px" }}>
                      Dernière visite : {fmtDate(pat.derniere_visite)} · {pat.nb_rdv} consultation{pat.nb_rdv > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                {/* Actions rapides */}
                <div style={{ display: "flex", gap: "8px" }}>
                  {pat.tel_u && (
                    <a href={`tel:${pat.tel_u}`} style={{
                      display: "flex", alignItems: "center", gap: "6px",
                      padding: "8px 14px", borderRadius: "10px",
                      background: "#f0fdf4", color: "#16a34a",
                      border: "1px solid #bbf7d0", fontSize: "13px", fontWeight: 600,
                      textDecoration: "none",
                    }}>
                      <Phone size={13} /> Appeler
                    </a>
                  )}
                  {pat.tel_u && (
                    <a href={`https://wa.me/${pat.tel_u.replace(/\D/g, "")}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{
                        display: "flex", alignItems: "center", gap: "6px",
                        padding: "8px 14px", borderRadius: "10px",
                        background: "#f0fdf4", color: "#16a34a",
                        border: "1px solid #bbf7d0", fontSize: "13px", fontWeight: 600,
                        textDecoration: "none",
                      }}>
                      💬 WhatsApp
                    </a>
                  )}
                </div>
              </div>

              {/* Coordonnées */}
              <div style={sectionCard}>
                <h3 style={sectionTitle}>Coordonnées</h3>
                {pat.tel_u && (
                  <div style={infoRow}>
                    <div style={iconBox}><Phone size={16} /></div>
                    <div>
                      <p style={{ fontSize: "12px", color: "#64748B", margin: 0 }}>Téléphone</p>
                      <p style={{ fontWeight: "600", margin: 0, fontSize: "15px", color: "#0F172A" }}>{pat.tel_u}</p>
                    </div>
                  </div>
                )}
                {pat.email_u && (
                  <div style={{ ...infoRow, marginBottom: 0 }}>
                    <div style={iconBox}><Mail size={16} /></div>
                    <div>
                      <p style={{ fontSize: "12px", color: "#64748B", margin: 0 }}>Email</p>
                      <p style={{ fontWeight: "600", margin: 0, fontSize: "15px", color: "#0F172A" }}>{pat.email_u}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Informations personnelles */}
              <div style={sectionCard}>
                <h3 style={sectionTitle}>Informations personnelles</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  {pat.groupe_sanguin && (
                    <div style={infoRow}>
                      <div style={iconBox}><Droplet size={16} color="#DC2626" /></div>
                      <div>
                        <p style={{ fontSize: "12px", color: "#64748B", margin: 0 }}>Groupe sanguin</p>
                        <p style={{ fontWeight: "700", margin: 0, fontSize: "15px", color: "#0F172A" }}>{pat.groupe_sanguin}</p>
                      </div>
                    </div>
                  )}
                  {pat.date_naissance && (
                    <div style={infoRow}>
                      <div style={iconBox}><Calendar size={16} /></div>
                      <div>
                        <p style={{ fontSize: "12px", color: "#64748B", margin: 0 }}>Date de naissance</p>
                        <p style={{ fontWeight: "600", margin: 0, fontSize: "15px", color: "#0F172A" }}>{fmtDate(pat.date_naissance)}</p>
                      </div>
                    </div>
                  )}
                  {pat.sexe && (
                    <div style={infoRow}>
                      <div style={iconBox}>
                        <span style={{ fontSize: "16px", fontWeight: 900, color: pat.sexe === "M" ? "#2563eb" : "#db2777" }}>
                          {pat.sexe === "M" ? "♂" : "♀"}
                        </span>
                      </div>
                      <div>
                        <p style={{ fontSize: "12px", color: "#64748B", margin: 0 }}>Sexe</p>
                        <p style={{ fontWeight: "600", margin: 0, fontSize: "15px", color: "#0F172A" }}>{sexeLabel(pat.sexe)}</p>
                      </div>
                    </div>
                  )}
                  {(pat.taille || pat.poids) && (
                    <div style={infoRow}>
                      <div style={iconBox}><Edit2 size={16} /></div>
                      <div>
                        <p style={{ fontSize: "12px", color: "#64748B", margin: 0 }}>Morphologie</p>
                        <p style={{ fontWeight: "600", margin: 0, fontSize: "15px", color: "#0F172A" }}>
                          {pat.taille ? `${pat.taille} cm` : ""}
                          {pat.taille && pat.poids ? " · " : ""}
                          {pat.poids ? `${pat.poids} kg` : ""}
                        </p>
                      </div>
                    </div>
                  )}
                  {pat.ville && (
                    <div style={infoRow}>
                      <div style={iconBox}>📍</div>
                      <div>
                        <p style={{ fontSize: "12px", color: "#64748B", margin: 0 }}>Ville</p>
                        <p style={{ fontWeight: "600", margin: 0, fontSize: "15px", color: "#0F172A" }}>{pat.ville}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Informations médicales */}
              <div style={sectionCard}>
                <h3 style={sectionTitle}>Informations médicales</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <p style={{ fontSize: "12px", color: "#64748B", margin: "0 0 6px 0", fontWeight: "600" }}>
                      Motif récent
                    </p>
                    <div style={{
                      backgroundColor: "#0F172A", color: "#FFFFFF",
                      padding: "8px 14px", borderRadius: "10px",
                      fontWeight: "600", fontSize: "14px",
                    }}>
                      {loadingHistory ? "…" : (history[0]?.motif || "—")}
                    </div>
                  </div>
                  <div>
                    <p style={{ fontSize: "12px", color: "#64748B", margin: "0 0 6px 0", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}>
                      <AlertCircle size={12} /> Allergies
                    </p>
                    <div style={{
                      backgroundColor: "#F87171", color: "#FFFFFF",
                      padding: "8px 14px", borderRadius: "10px",
                      fontWeight: "600", fontSize: "14px",
                    }}>
                      {pat.allergies || "Non renseigné"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div style={{ marginTop: "24px" }}>
                <div className="tabs-bar" style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                  {["Historique", "Ordonnances", "Documents"].map(tab => (
                    <button key={tab} className={activeTab === tab ? "active" : ""} onClick={() => setActiveTab(tab)}>
                      {tab}{tab === "Ordonnances" && prescriptions.length > 0 ? ` (${prescriptions.length})` : ""}
                    </button>
                  ))}
                </div>

                {/* Historique RDV */}
                {activeTab === "Historique" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {loadingHistory && (
                      <p style={{ color: "#94a3b8", padding: "20px", textAlign: "center" }}>⏳ Chargement…</p>
                    )}
                    {!loadingHistory && history.length === 0 && (
                      <div className="empty-view">Aucune consultation enregistrée</div>
                    )}
                    {history.map((h) => (
                      <div key={h.id_rdv} style={{
                        borderLeft: "3px solid #2563EB", padding: "10px 16px",
                        background: "#F8FAFC", borderRadius: "8px",
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <h4 style={{ margin: 0, fontSize: "14px", color: "#0F172A", fontWeight: 700 }}>
                            {typeConsultLabel[h.type_consultation] || "Consultation"} · {fmtDate(h.date)}
                          </h4>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{
                              fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "999px",
                              background: h.statut === "termine" ? "#f1f5f9" : "#dcfce7",
                              color:      h.statut === "termine" ? "#475569" : "#16a34a",
                            }}>
                              {h.statut === "termine" ? "Terminé" : h.statut === "confirme" ? "Confirmé" : h.statut}
                            </span>
                            <button
                              disabled={uploadingRdvId === h.id_rdv}
                              onClick={() => {
                                pendingRdvRef.current = h;
                                rxFileInputRef.current?.click();
                              }}
                              style={{
                                display: "flex", alignItems: "center", gap: "4px",
                                padding: "3px 10px", borderRadius: "8px", border: "1px solid #bfdbfe",
                                background: uploadingRdvId === h.id_rdv ? "#f1f5f9" : "#eff6ff",
                                color: uploadingRdvId === h.id_rdv ? "#94a3b8" : "#2563eb",
                                fontSize: "11px", fontWeight: 600,
                                cursor: uploadingRdvId === h.id_rdv ? "not-allowed" : "pointer",
                              }}
                            >
                              <Paperclip size={11} />
                              {uploadingRdvId === h.id_rdv ? "Upload…" : "Joindre ordonnance"}
                            </button>
                          </div>
                        </div>
                        <p style={{ margin: "4px 0 0 0", color: "#64748B", fontSize: "13px" }}>
                          🕒 {h.heure_debut?.substring(0, 5)}
                          {h.motif ? ` · ${h.motif}` : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Ordonnances */}
                {activeTab === "Ordonnances" && (
                  <div>
                    {loadingPrescriptions && (
                      <p style={{ color: "#94a3b8", padding: "20px", textAlign: "center" }}>⏳ Chargement…</p>
                    )}
                    {!loadingPrescriptions && prescriptions.length === 0 && (
                      <div className="empty-view">
                        <FileText size={32} style={{ opacity: .3, marginBottom: 8 }} />
                        <p style={{ margin: 0, fontSize: 14 }}>Aucune ordonnance pour ce patient</p>
                        <p style={{ margin: "4px 0 0", fontSize: 12, color: "#94a3b8" }}>
                          Ouvrez l'onglet Historique et cliquez sur "Ordonnance" pour en créer une
                        </p>
                      </div>
                    )}
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {prescriptions.map((rx) => {
                        const fileUrl  = `http://localhost:5000/${rx.file_path}`;
                        const isPdf    = rx.file_path?.endsWith(".pdf");
                        const dateStr  = new Date(rx.rdv_date || rx.created_at).toLocaleDateString("fr-FR");
                        return (
                          <div key={rx.id} style={{
                            padding: "14px 16px", background: "#f0fdf4",
                            border: "1px solid #bbf7d0", borderRadius: "12px",
                            display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <div style={{ fontSize: 28 }}>{isPdf ? "📄" : "🖼️"}</div>
                              <div>
                                <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#0f172a" }}>
                                  Ordonnance du {dateStr}
                                </p>
                                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>
                                  {isPdf ? "Document PDF" : "Image"}
                                </p>
                              </div>
                            </div>
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: "flex", alignItems: "center", gap: 5,
                                padding: "6px 14px", borderRadius: "8px",
                                background: "#fff", border: "1px solid #bbf7d0",
                                color: "#16a34a", fontSize: "12px", fontWeight: 600,
                                textDecoration: "none", whiteSpace: "nowrap",
                              }}
                            >
                              <Download size={12} /> Ouvrir
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Documents */}
                {activeTab === "Documents" && (
                  <div>
                    <input type="file" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileUpload} />
                    <button
                      className="btn-figma-black"
                      style={{ marginBottom: "16px", padding: "8px 16px", fontSize: "13px" }}
                      onClick={() => fileInputRef.current.click()}
                    >
                      <Paperclip size={14} /> Joindre un fichier
                    </button>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {documents.length === 0 ? (
                        <div className="empty-view">Aucun document joint</div>
                      ) : documents.map((d) => (
                        <div key={d.id} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px", background: "#F8FAFC", borderRadius: "12px" }}>
                          <div style={iconBox}><FileText size={18} /></div>
                          <div style={{ flex: 1 }}>
                            <h4 style={{ margin: 0, fontSize: "14px", color: "#0F172A" }}>{d.title}</h4>
                            <span style={{ fontSize: "12px", color: "#64748B" }}>{d.date} · {d.size}</span>
                          </div>
                          <Download size={18} style={{ color: "#64748B", cursor: "pointer" }} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Hidden file input for prescription uploads */}
      <input
        ref={rxFileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        style={{ display: "none" }}
        onChange={handleRxFileChange}
      />
    </div>
  );
}

export default PatientsRecents;
