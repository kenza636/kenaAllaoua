import React from "react";

function QuickActions() {
  const actions = [
    { 
      title: "Nouveau rendez-vous", 
      description: "Planifier une consultation physique", 
      icon: "📅", 
      color: "blue-bg" 
    },
    { 
      title: "Ajouter un patient", 
      description: "Créer un nouveau dossier médical", 
      icon: "👤", 
      color: "green-bg" 
    },
    { 
      title: "Démarrer téléconsultation", 
      description: "Lancer un appel vidéo sécurisé", 
      icon: "📹", 
      color: "purple-bg" 
    }
  ];

  return (
    <div className="quick-actions-container">
      <h3 className="section-title">Actions rapides</h3>
      <div className="actions-grid">
        {actions.map((action, index) => (
          <div key={index} className="action-card-item">
            <div className={`action-icon-circle ${action.color}`}>
              {action.icon}
            </div>
            <div className="action-text">
              <h4>{action.title}</h4>
              <p>{action.description}</p>
            </div>
            <span className="arrow-right">→</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default QuickActions;