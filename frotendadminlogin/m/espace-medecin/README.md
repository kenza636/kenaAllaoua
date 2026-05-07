# 🏥 Espace Médecin - Application de Gestion des Consultations

Interface moderne et professionnelle pour la gestion des consultations médicales.

## 📁 Structure du Projet

```
espace-medecin/
├── index.html              # Page de connexion (page principale)
├── css/
│   └── styles.css          # Tous les styles de l'application
├── js/
│   └── script.js           # Logique JavaScript
├── pages/
│   ├── signup.html         # Page d'inscription
│   ├── forgot-password.html # Page de récupération de mot de passe
│   └── dashboard.html      # (À créer) Tableau de bord médecin
├── assets/
│   ├── images/             # Images et photos
│   └── icons/              # Icônes personnalisées
└── README.md               # Ce fichier
```

## 🎨 Fonctionnalités

### Page de Connexion (index.html)
- ✅ Design épuré et professionnel
- ✅ Champ email avec validation
- ✅ Champ mot de passe avec toggle visibilité
- ✅ Lien "Mot de passe oublié"
- ✅ Lien "Créer un compte pro"
- ✅ Animations fluides
- ✅ Responsive (mobile, tablet, desktop)

### Page d'Inscription (pages/signup.html)
- ✅ Formulaire complet
- ✅ Validation des données
- ✅ Confirmation du mot de passe
- ✅ Conditions d'utilisation

### Page Récupération Mot de Passe (pages/forgot-password.html)
- ✅ Formulaire simple et efficace
- ✅ Validation email

## 🎯 Couleurs Utilisées

| Couleur | Code | Utilisation |
|---------|------|-------------|
| Bleu Principal | `#1F5DB0` | Boutons, accents |
| Bleu Clair | `#3B9FD8` | Secondaire, liens |
| Vert | `#7FD856` | Accents graphiques |
| Gris Clair | `#f0f4f9` | Fond des inputs |

## 🚀 Comment Utiliser

### 1. Ouverture en Local
- Double-cliquez sur `index.html` pour ouvrir dans le navigateur
- Ou utilisez un serveur local (Python, Node.js, etc.)

### 2. Serveur Local Python
```bash
cd espace-medecin
python -m http.server 8000
# Puis accédez à: http://localhost:8000
```

### 3. Serveur Local Node.js
```bash
cd espace-medecin
npx http-server
```

## 📱 Responsive Design

L'application est entièrement responsive avec des breakpoints pour:
- **Desktop** (1024px+)
- **Tablet** (768px - 1023px)
- **Mobile** (480px - 767px)
- **Small Mobile** (< 480px)

## 🔧 Technologies

- **HTML5** - Structure
- **CSS3** - Design et animations
- **JavaScript (Vanilla)** - Interactivité
- **Font Awesome** - Icônes
- **SVG** - Logo personnalisé

## 💡 Points Clés

### Logo Personnalisé
Le logo SVG représente:
- Un cœur (symbole médical)
- Une ligne ECG (fréquence cardiaque)
- Une croix médicale
- Gradient vert/bleu

### Animations
- Bouton retour avec effet au survol
- Logo qui flotte
- Transitions fluides sur tous les éléments
- Messages animés

### Sécurité
- Validation email côté client
- Toggle pour afficher/masquer le mot de passe
- Gestion appropriée des données sensibles

## 📝 Détails des Fichiers

### index.html
- Page principale de connexion
- Formulaire de login
- Intégration des assets

### css/styles.css
- Styles globaux avec variables CSS
- Design responsive
- Animations et transitions
- Dark mode friendly

### js/script.js
- Validation des formulaires
- Toggle mot de passe
- Gestion des events
- Feedback utilisateur

## 🎁 Options d'Extension

Vous pouvez ajouter:
- Backend avec Node.js/Express
- Base de données (MongoDB, PostgreSQL)
- Authentification JWT
- Page tableau de bord
- Historique consultations
- Système de notifications
- Profil utilisateur

## ⚠️ Notes Importantes

1. **Validation**: La validation actuelle est côté client. Ajoutez une validation côté serveur en production.
2. **Stockage**: Les données ne sont pas persistées. Connectez à une base de données.
3. **Sécurité**: Pour la production, utilisez HTTPS et des tokens JWT.

## 📞 Support

Pour toute question ou modification, consultez les commentaires dans:
- `index.html`
- `css/styles.css`
- `js/script.js`

---

Créé avec ❤️ pour les professionnels de santé
