# 🎯 Challenge

> Un réseau social de défis pour étudiants de La Plateforme_

**Challenge** est une plateforme collaborative où les étudiants peuvent créer, partager et participer à des défis créatifs. Échangez en temps réel, gagnez des points et grimpez dans le classement !

![Stack](https://img.shields.io/badge/Stack-React%20%7C%20Node.js%20%7C%20SQLite-blue)
![Status](https://img.shields.io/badge/Status-MVP-success)

---

## ✨ Fonctionnalités

### 🔐 Authentification & Profils
- Inscription avec email `@laplateforme.io` uniquement
- Vérification d'email et validation manuelle par administrateur
- Profils personnalisables : pseudo, ville, promotion, avatar
- Édition de profil et changement de mot de passe

### 🎮 Défis
- **Création** : texte, images, vidéos avec catégorisation
- **Découverte** : filtres par catégorie, tri par popularité/récence
- **Interaction** : commentaires, participations avec preuve photo/vidéo
- **Réactions** : système de likes sur défis et commentaires

### 💬 Chat en Temps Réel
- Canal public pour toute la communauté
- Messages privés (DM) entre utilisateurs
- Indicateurs de saisie et statut en ligne
- Notifications sonores configurables

### 🏆 Gamification
- Points pour création et participation
- Classement global (points & reconnaissance)
- Badges de réalisation
- Statistiques personnelles détaillées

### 👨‍💼 Administration
- Validation des nouveaux comptes
- Modération de contenus (défis, commentaires, participations)
- Tableau de bord de supervision

---

## 🛠 Stack Technique

| Couche | Technologies |
|--------|-------------|
| **Frontend** | React 18, Vite, TailwindCSS, DaisyUI |
| **Backend** | Node.js v22.12.0, Express, Socket.io |
| **Base de données** | SQLite (better-sqlite3) |
| **Authentification** | JWT (cookies + headers) |
| **Temps réel** | WebSocket (Socket.io) |
| **Upload** | Multer (images/vidéos) |

---

## 🚀 Installation

### Prérequis
- Node.js 18+ 
- npm ou yarn

### 1️⃣ Cloner le projet
```bash
git clone https://github.com/votre-username/challenge.git
cd challenge
```

### 2️⃣ Backend

```bash
cd backend
npm install
```

Créer un fichier `.env` :
```env
PORT=5000
CORS_ORIGIN=http://localhost:5173
PRIVATE_JWT_KEY=votre-secret-super-securise
ALLOW_UNVERIFIED_LOGIN=true  # Dev uniquement
```

Démarrer le serveur :
```bash
node app.mjs
```

Le serveur démarre sur `http://localhost:5000`

### 3️⃣ Frontend

```bash
cd frontend
npm install
npm run dev
```

L'application est accessible sur `http://localhost:5173`

### 4️⃣ Données de démo (optionnel)

```bash
node backend/scripts/seed-demo.mjs
```

Génère des utilisateurs, défis et interactions de test.

---

## 📁 Structure du Projet

```
challenge/
├── backend/
│   ├── app.mjs                 # Point d'entrée serveur
│   ├── config/
│   │   └── database.mjs        # Configuration SQLite
│   ├── database/
│   │   ├── schema.sql          # Schéma de la base
│   │   └── database.sqlite     # Base de données
│   ├── controllers/            # Logique métier
│   ├── models/                 # Accès aux données
│   ├── routes/                 # Routes API
│   └── scripts/
│       └── seed-demo.mjs       # Jeu de données
│
└── frontend/
    ├── src/
    │   ├── components/         # Composants React
    │   ├── pages/              # Pages principales
    │   ├── services/           # API & Socket.io
    │   └── App.jsx
    └── vite.config.js          # Config Vite + proxy
```

---

## 🔌 API Endpoints

### Authentification (`/api/auth`)
```
POST   /register              # Inscription
POST   /login                 # Connexion
POST   /logout                # Déconnexion
POST   /verify-email          # Vérification email
GET    /get/:id               # Info utilisateur public
```

### Utilisateur (`/api/users/me`)
```
GET    /users/me              # Profil utilisateur
PUT    /users/me              # Modifier profil
PUT    /users/me/avatar       # Upload avatar
GET    /users/me/stats        # Statistiques
PUT    /users/me/password     # Changer mot de passe
```

### Défis (`/api/challenges`)
```
GET    /challenges            # Liste des défis
POST   /challenges            # Créer un défi
GET    /challenges/:id        # Détail d'un défi
GET    /challenges/:id/comments          # Commentaires
POST   /challenges/:id/comments          # Ajouter commentaire
GET    /challenges/:id/participations    # Participations
POST   /challenges/:id/participations    # Participer
```

### Likes (`/api/likes`)
```
POST   /likes                 # Ajouter un like
DELETE /likes/:id             # Retirer un like
GET    /challenges/:id/likes  # Likes d'un défi
GET    /comments/:id/likes    # Likes d'un commentaire
```

### Chat (`/api/chat`)
```
GET    /chat/messages                     # Messages publics
POST   /chat/messages                     # Envoyer message
GET    /chat/direct/:userId/messages      # Historique DM
POST   /chat/direct/:userId/messages      # Envoyer DM
```

### Autres
```
GET    /directory/users       # Annuaire étudiants
GET    /users/online          # Utilisateurs en ligne
GET    /leaderboard           # Classement
```

### Administration (`/api/admin`)
```
GET    /admin/users/pending              # Comptes en attente
PUT    /admin/users/:id/validate         # Valider compte
GET    /admin/content/challenges         # Défis à modérer
DELETE /admin/challenges/:id             # Supprimer défi
GET    /admin/content/comments           # Commentaires signalés
DELETE /admin/comments/:id               # Supprimer commentaire
GET    /admin/participations             # Participations
```

---

## 🔄 Événements Socket.io

### Connexions
- `user:online` - Utilisateur connecté
- `user:offline` - Utilisateur déconnecté

### Chat
- `message:receive` - Nouveau message public
- `dm:receive` - Nouveau message privé
- `typing:start` / `typing:stop` - Indicateurs de saisie
- `dm:typing:start` / `dm:typing:stop` - Saisie en DM

### Contenus
- `challenge:new` - Nouveau défi publié
- `comment:new` - Nouveau commentaire
- `like:added` / `like:removed` - Likes en temps réel

### Authentification
- `user:registered` - Nouvel utilisateur
- `user:validated` - Compte validé par admin

---

## 🎨 Configuration Frontend

Variables d'environnement optionnelles (`.env`) :

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_TINYMCE_LICENSE_KEY=gpl
```

### Préférences utilisateur (localStorage)
- `pref:chatSound` - Sons de chat (true/false)
- `pref:notifySound` - Sons de notifications (true/false)
- `pref:chatSoundVol` - Volume chat (0-100)
- `pref:notifySoundVol` - Volume notifications (0-100)

---

## 🔒 Sécurité

- ✅ Mots de passe hachés avec bcrypt
- ✅ Authentification JWT (cookies + headers)
- ✅ Validation stricte des entrées
- ✅ Protection CORS configurée
- ✅ Restriction email `@laplateforme.io`
- ✅ Validation manuelle par administrateur
- ✅ Rate limiting sur les endpoints sensibles

---

## 📱 Pages Disponibles

| Route | Description |
|-------|-------------|
| `/` | Page d'accueil |
| `/connexion` | Connexion |
| `/inscription` | Inscription |
| `/defis` | Liste des défis |
| `/defis/nouveau` | Créer un défi |
| `/defis/:id` | Détail d'un défi |
| `/profil` | Profil utilisateur |
| `/admin` | Interface administration |
| `/chat` | Chat public |
| `/chat/direct/:userId` | Messages privés |
| `/etudiants` | Annuaire |
| `/classements` | Leaderboard |

---

## 🐛 Debug & Développement

### Activer les sons en dev
```javascript
// Dans la console navigateur
localStorage.setItem('pref:chatSound', 'true');
localStorage.setItem('pref:notifySound', 'true');
```

### Logs Socket.io
```javascript
// Côté frontend (src/services/socket.js)
const socket = io(SOCKET_URL, { 
  debug: true  // Ajouter cette option
});
```

### Scripts utiles
```bash
# Frontend
npm run dev       # Mode développement
npm run build     # Build production
npm run preview   # Prévisualiser build
npm run lint      # Linter

# Backend
node app.mjs      # Démarrer serveur
node backend/scripts/seed-demo.mjs  # Charger données demo
```

---

## 🚢 Déploiement

### Frontend
```bash
cd frontend
npm run build
# Déployer le dossier dist/ sur votre hébergeur
```

### Backend
1. Configurer les variables d'environnement :
```env
PORT=5000
CORS_ORIGIN=https://votre-domaine.com
PRIVATE_JWT_KEY=secret-production-ultra-securise
ALLOW_UNVERIFIED_LOGIN=false
NODE_ENV=production
```

2. Utiliser un gestionnaire de processus (PM2, systemd, Docker)

3. Configurer un reverse proxy (Nginx, Caddy)

4. Persister `database.sqlite` sur un volume

---
