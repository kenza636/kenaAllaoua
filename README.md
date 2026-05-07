# Projet Sante - Architecture

## Structure du projet

\\\
projet app/
|
|-- backend/              # API Node.js/Express (unique, partagee)
|                           Port : 5000
|
|-- mon-projet-sante/     # Application d'entree
|                           Splash screen + formulaires de connexion
|                           Redirige vers patient ou medecin
|                           Port : 5173
|
|-- frontend-patient/     # Interface patient (apres connexion)
|                           Port : 5174
|
|-- frontend-medecin/     # Interface medecin (apres connexion)
                            Port : 5175
\\\

## Flux utilisateur

1. L'utilisateur ouvre **mon-projet-sante** (splash screen)
2. Il remplit le formulaire de connexion (role : patient ou medecin)
3. Le backend verifie les identifiants et renvoie un token + role
4. mon-projet-sante redirige vers :
   - **frontend-patient** si role = patient
   - **frontend-medecin** si role = medecin

## Demarrage rapide

### Tout lancer d'un coup (recommande)
\\\powershell
.\start-all.ps1
\\\

### Lancer chaque service manuellement
\\\powershell
# Terminal 1 - Backend
cd backend
npm install
npm run dev

# Terminal 2 - App d'entree
cd mon-projet-sante
npm install
npm run dev

# Terminal 3 - Frontend patient
cd frontend-patient
npm install
npm run dev

# Terminal 4 - Frontend medecin
cd frontend-medecin
npm install
npm run dev
\\\

## Configuration des ports

Pour eviter les conflits, configurer chaque frontend sur un port different.
Modifier \ite.config.js\ dans chaque dossier frontend :

\\\js
// mon-projet-sante/vite.config.js
server: { port: 5173 }

// frontend-patient/vite.config.js
server: { port: 5174 }

// frontend-medecin/vite.config.js
server: { port: 5175 }
\\\

## Redirection apres connexion

Dans **mon-projet-sante**, apres login reussi :

\\\js
if (user.role === "patient") {
  window.location.href = "http://localhost:5174";
} else if (user.role === "medecin") {
  window.location.href = "http://localhost:5175";
}
\\\

Penser a passer le token (via URL, localStorage partage impossible entre ports
differents, ou cookie sur domaine commun en production).
