// ===== TOGGLE PASSWORD VISIBILITY =====
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleBtn = document.querySelector('.toggle-password');

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleBtn.innerHTML = '<i class="fas fa-eye-slash"></i>';
    } else {
        passwordInput.type = 'password';
        toggleBtn.innerHTML = '<i class="fas fa-eye"></i>';
    }
}

// ===== FORM SUBMISSION =====
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();

    // Récupérer les valeurs
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    // Validation simple
    if (!email || !password) {
        showMessage('Veuillez remplir tous les champs', 'error');
        return;
    }

    // Validation email
    if (!isValidEmail(email)) {
        showMessage('Veuillez entrer une adresse email valide', 'error');
        return;
    }

    // Validation mot de passe
    if (password.length < 6) {
        showMessage('Le mot de passe doit contenir au moins 6 caractères', 'error');
        return;
    }

    // Simulation de connexion
    showMessage('Connexion en cours...', 'info');
    
    // Simuler une requête serveur
    setTimeout(() => {
        showMessage('Connexion réussie! Redirection...', 'success');
        console.log('Email:', email);
        console.log('Connexion acceptée');
        
        // Redirection après 2 secondes
        setTimeout(() => {
            window.location.href = 'pages/dashboard.html';
        }, 2000);
    }, 1500);
});

// ===== FONCTION VALIDATION EMAIL =====
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// ===== FONCTION AFFICHAGE MESSAGE =====
function showMessage(message, type) {
    // Supprimer les messages existants
    const existingMessage = document.querySelector('.form-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    // Créer nouveau message
    const messageDiv = document.createElement('div');
    messageDiv.className = `form-message ${type}`;
    messageDiv.innerHTML = `
        <span>${message}</span>
        <button type="button" class="form-message-close" aria-label="Fermer le message">&times;</button>
    `;

    // Insérer après le titre
    const header = document.querySelector('.header');
    header.insertAdjacentElement('afterend', messageDiv);

    // Fermer manuellement
    const closeBtn = messageDiv.querySelector('.form-message-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            hideMessage();
        });
    }

    // Auto-supprimer après 5 secondes
    setTimeout(() => {
        hideMessage();
    }, 5000);
}

// ===== CACHER LE MESSAGE =====
function hideMessage() {
    const existingMessage = document.querySelector('.form-message');
    if (existingMessage) {
        existingMessage.remove();
    }
}

// ===== TOGGLE PASSWORD BUTTON =====
const togglePasswordBtn = document.querySelector('.toggle-password');
if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener('click', function(e) {
        e.preventDefault();
        togglePassword();
    });
}

// ===== BOUTON RETOUR =====
const backButton = document.querySelector('.back-button');
if (backButton) {
    backButton.addEventListener('click', function(e) {
        e.preventDefault();
        if (window.history.length > 1) {
            window.history.back();
        } else {
            window.location.href = 'index.html';
        }
    });
}

// ===== CLEAR PASSWORD ON PAGE LOAD =====
window.addEventListener('load', function() {
    // Optionnel: effacer le mot de passe au chargement pour la sécurité
    // document.getElementById('password').value = '';
});

// ===== GESTION CLAVIER =====
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && document.activeElement.tagName !== 'TEXTAREA') {
        const form = document.getElementById('loginForm');
        if (form && document.activeElement === document.getElementById('password')) {
            form.dispatchEvent(new Event('submit'));
        }
    }
});
