# 📖 Guide de Démarrage - Espace Médecin

## 🚀 Premiers Pas

### 1. Ouvrir l'Application

#### Option 1: Ouverture directe (Recommandée pour commencer)
1. Allez dans le dossier `c:\Users\DELL\Desktop\m\espace-medecin\`
2. Double-cliquez sur `index.html`
3. L'application s'ouvrira dans votre navigateur par défaut

#### Option 2: Serveur Local Python
```powershell
# Ouvrir PowerShell
# Aller dans le dossier du projet
cd "c:\Users\DELL\Desktop\m\espace-medecin"

# Démarrer le serveur
python -m http.server 8000

# Accéder à: http://localhost:8000
```

#### Option 3: Serveur Local Node.js
```powershell
# Vérifier que Node.js est installé
node --version

# Aller dans le dossier
cd "c:\Users\DELL\Desktop\m\espace-medecin"

# Installer http-server (première fois seulement)
npm install -g http-server

# Démarrer le serveur
http-server -p 8000 -o
```

## 📁 Fichiers et Dossiers

```
espace-medecin/
│
├── 📄 index.html              ← PAGE PRINCIPALE (OUVRIR CECI)
├── 📄 README.md               ← Documentation complète
├── 📄 CONFIG.md               ← Configuration et API
│
├── 📁 css/
│   └── styles.css             ← Tous les styles (design)
│
├── 📁 js/
│   └── script.js              ← Fonctionnalités JavaScript
│
├── 📁 pages/                  ← Pages supplémentaires
│   ├── signup.html            ← Créer un compte
│   ├── forgot-password.html   ← Récupérer mot de passe
│   └── dashboard.html         ← Tableau de bord (après connexion)
│
└── 📁 assets/                 ← Ressources
    ├── images/                ← Images (à ajouter)
    └── icons/                 ← Icônes (à ajouter)
```

## 🎯 Fonctionnalités Principales

### ✅ Page de Connexion
- Entrez l'email: `Ahfirsara1@gmail.com`
- Entrez le mot de passe: `test123` (n'importe quel mot de passe)
- Cliquez sur "Se connecter au portail"

### ✅ Créer un Compte
- Cliquez sur "Créer un compte pro"
- Remplissez le formulaire
- Validez

### ✅ Récupérer Mot de Passe
- Cliquez sur "Mot de passe oublié ?"
- Entrez votre email
- Recevez un lien de réinitialisation (simulation)

## 🎨 Personnalisation

### Changer les Couleurs
Éditez `css/styles.css` et modifiez les variables:
```css
:root {
    --primary-blue: #1F5DB0;      ← Couleur principale
    --light-blue: #3B9FD8;        ← Couleur secondaire
    --green: #7FD856;             ← Accent vert
}
```

### Changer le Contenu
Modifiez directement dans `index.html`:
- Le titre "Espace Médecin"
- Le sous-titre
- L'email de démonstration

### Ajouter des Images
1. Créez vos images (PNG, JPG)
2. Placez-les dans `assets/images/`
3. Référencez-les dans le HTML:
```html
<img src="assets/images/ma-image.png" alt="Description">
```

## 🔗 Navigation

| Page | Fichier | Accès |
|------|---------|-------|
| Connexion | `index.html` | Directe |
| Inscription | `pages/signup.html` | Lien "Créer compte" |
| Mot de passe oublié | `pages/forgot-password.html` | Lien "Mot de passe ?" |
| Tableau de bord | `pages/dashboard.html` | Après connexion |

## 💾 Sauvegarder vos Modifications

Après chaque modification:
1. Sauvegardez le fichier (Ctrl+S)
2. Rechargez la page dans le navigateur (F5)

Pour des modifications plus importantes:
- Éditez avec VSCode
- Testez localement
- Puis publiez sur un serveur

## 🐛 Dépannage

### Le fichier ne s'ouvre pas
- Vérifiez que le chemin est correct
- Utilisez un navigateur moderni (Chrome, Firefox, Edge)
- Utilisez un serveur local

### Les styles ne s'affichent pas
- Rechargez la page (Ctrl+Shift+R pour vider le cache)
- Vérifiez que `css/styles.css` existe

### Les icônes ne s'affichent pas
- Vérifiez la connexion internet (Font Awesome est en ligne)
- Vérifiez la console du navigateur (F12)

## 📝 Prochaines Étapes

Pour transformer ceci en une vrai application:

1. **Backend** (Node.js/Python/PHP)
   - Créer une API REST
   - Gérer l'authentification JWT
   
2. **Base de données**
   - MongoDB, PostgreSQL, ou MySQL
   - Stocker les utilisateurs et consultations

3. **Hébergement**
   - Netlify, Vercel, Heroku
   - Domaine personnalisé

4. **Fonctionnalités Avancées**
   - Notifications emails
   - Calendrier de consultations
   - Paiements en ligne
   - Vidéo consultations

## 📞 Besoin d'Aide?

Consultez:
- `README.md` - Documentation complète
- `CONFIG.md` - Configuration technique
- Code source - Les fichiers ont des commentaires

---

**Créé le:** 6 mai 2026
**Version:** 1.0.0
**Statut:** ✅ Prêt pour développement
