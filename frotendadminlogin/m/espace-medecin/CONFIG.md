# Configuration pour Espace Médecin

## Serveur Web

### Python 3
```bash
python -m http.server 8000
```

### Node.js
```bash
npx http-server -p 8000
```

### PHP
```bash
php -S localhost:8000
```

## Paramètres API (À implémenter)

```javascript
const API_CONFIG = {
  BASE_URL: 'http://localhost:5000/api',
  ENDPOINTS: {
    LOGIN: '/auth/login',
    SIGNUP: '/auth/signup',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password'
  },
  TIMEOUT: 5000
};
```

## Variables d'Environnement

```env
API_URL=http://localhost:5000/api
ENV=development
DEBUG=true
```

## Base de Données (Exemple)

### MongoDB
```javascript
{
  "users": {
    "email": "string",
    "password": "hashed",
    "name": "string",
    "created_at": "date"
  }
}
```

### PostgreSQL
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Authentification

- Utiliser JWT pour les tokens
- Expiration: 24 heures
- Refresh token: 7 jours

## CORS Configuration

```javascript
app.use(cors({
  origin: 'http://localhost:8000',
  credentials: true
}));
```
