# Challenge – Mini réseau social de défis (MVP)

Challenge est un mini réseau social de défis pour étudiants. Le MVP livré inclut l’authentification, la création et l’interaction autour des défis, le chat en temps réel, les likes (défis et commentaires) et une interface d’administration pour la validation des comptes.

---

## Fonctionnalités

- Authentification JWT avec restriction d’email `@laplateforme.io`, vérification d’email et validation manuelle par admin
- Profils utilisateurs: pseudo, ville, promo, avatar, édition de profil
- Défis: liste avec filtres, tri (récents/likés/commentés), détail, création avec upload image/vidéo
- Interactions: commentaires, participations, likes sur défis et commentaires (gestion optimiste + temps réel)
- Chat: canal public et messages privés (DM) en temps réel avec indicateurs de saisie et statut en ligne
- Administration: validation de comptes, modération de contenus (challenges, commentaires, participations)

---

## Stack Technique

- Frontend: React + Vite, TailwindCSS, DaisyUI, Axios
- Backend: Node.js, Express, Socket.io
- Base de données: SQLite (better‑sqlite3)

---

## Structure du Projet

- `backend/` serveur Express + routes API
  - `app.mjs` point d’entrée du serveur
  - `config/database.mjs` initialisation SQLite + chargement du schéma
  - `database/schema.sql` schéma complet (users, challenges, comments, participations, likes, messages, channels)
  - `routes/*.mjs` routes par domaine (auth, challenges, likes, chat, direct, admin, me, directory)
  - `controllers/*.mjs` logique API et intégration Socket.io
  - `models/*.mjs` accès aux données
  - `scripts/seed-demo.mjs` jeu de données de démonstration
- `frontend/` application React
  - Pages: `ChallengeList.jsx`, `ChallengeDetail.jsx`, `ChallengeCreate.jsx`, `Login.jsx`, `Register.jsx`, `Profile.jsx`, `Admin.jsx`, `Chat.jsx`, `Users.jsx`, `Leaderboard.jsx`
  - Composants: `LikeButton.jsx`, `ChallengeCard.jsx`, `ThemeSidebar.jsx`, `DMTray.jsx`, `Toast.jsx`
  - `src/services/socket.js` client Socket.io
  - `vite.config.js` proxy dev vers le backend

---

## Installation & Démarrage

### Backend
- `cd backend`
- `npm install`
- Créer `.env` (optionnel mais recommandé):
  - `PORT=5000`
  - `CORS_ORIGIN=http://localhost:5173`
  - `PRIVATE_JWT_KEY=dev-secret` (ou `JWT_SECRET`)
  - `DATABASE_PATH=backend/database/database.sqlite` (optionnel)
  - `ALLOW_UNVERIFIED_LOGIN=true` (dev: autoriser la connexion avant validation)
- Démarrer: `node app.mjs`

### Frontend
- `cd frontend`
- `npm install`
- Démarrer: `npm run dev`
- Accès: `http://localhost:5173/`

Le proxy Vite est déjà configuré pour rediriger `'/api'`, `'/uploads'` et `'/socket.io'` vers `http://localhost:5000`.

### Données de Démo (optionnel)
- Exécuter: `node backend/scripts/seed-demo.mjs`
- Créé des utilisateurs, défis, messages, likes, participations pour tester.

---

## Routes Backend (Résumé)

- Auth (`/api/auth`)
  - `POST /register`, `POST /login`, `POST /logout`, `POST /verify-email`, `GET /get/:id`
- Utilisateur courant (`/api/users/me`)
  - `GET /users/me`, `PUT /users/me`, `PUT /users/me/avatar`, `GET /users/me/stats`, `PUT /users/me/password`
- Challenges (`/api/challenges`)
  - `GET /challenges`, `GET /challenges/:id`, `POST /challenges` (upload image/vidéo)
  - `GET /challenges/:id/comments`, `POST /challenges/:id/comments`
  - `GET /challenges/:id/participations/count`, `GET /challenges/:id/participations/me`, `PUT /challenges/:id/participations/me`, `POST /challenges/:id/participations`
- Likes (`/api/likes`)
  - `POST /likes`, `DELETE /likes/:id`
  - `GET /challenges/:id/likes`, `GET /comments/:id/likes`
  - `GET /likes/user/:userId?targetType=challenge|comment&targetId=...` (auth requis)
- Chat public (`/api/chat`)
  - `GET /chat/messages`, `POST /chat/messages`
- Messages privés (`/api/chat/direct`)
  - `GET /chat/direct/:userId/messages`, `POST /chat/direct/:userId/messages`
- Annuaire & Classement (`/api`)
  - `GET /directory/users`, `GET /users/online`, `GET /leaderboard?metric=points|recognition&page=&pageSize=`
- Administration (`/api/admin`)
  - `GET /admin/users/pending`, `GET /admin/users/unverified-email`
  - `PUT /admin/users/:id/validate`, `PUT /admin/users/:id/verify-email`
  - `GET /admin/content/challenges`, `DELETE /admin/challenges/:id`
  - `GET /admin/content/comments`, `DELETE /admin/comments/:id`
  - `GET /admin/participations?status=pending|approved|rejected|all`

---

## Événements Socket.io (Temps réel)

- Connexions: `user:online`, `user:offline`
- Chat général: `message:receive`, `typing:start`, `typing:stop`
- Messages privés: `dm:receive`, `dm:typing:start`, `dm:typing:stop`
- Défis: `challenge:new`
- Commentaires: `comment:new`
- Likes: `like:added`, `like:removed`
- Auth: `user:registered`, `user:login_unvalidated`, `user:validated`

---

## Sons & Notifications

- Sons intégrés pour chats/notifications côté frontend.
- Fichier: `frontend/src/services/sound.js` expose `playChatSound` et `playNotificationSound`.
- Préférences via `localStorage`:
  - `pref:chatSound` (true/false), `pref:notifySound` (true/false)
  - `pref:chatSoundVol` (0–100), `pref:notifySoundVol` (0–100)
- Les DMs jouent un son à la réception (voir `frontend/src/components/Chat/DMTray.jsx`), déclenché sur l’événement `dm:receive`.
- Exemple d’activation rapide (dans la console navigateur):
  - `localStorage.setItem('pref:chatSound','true')`
  - `localStorage.setItem('pref:notifySound','true')`

---

## Configuration Frontend

- Variables d’environnement optionnelles:
  - `VITE_API_URL` pour forcer la base des appels API (sinon proxy `'/api'`)
  - `VITE_SOCKET_URL` pour pointer le client Socket.io (sinon `window.location.origin`)
  - `VITE_TINYMCE_LICENSE_KEY` (par défaut `gpl`) pour l’éditeur de description des défis
- Le proxy Vite gère `'/api'`, `'/uploads'` et `'/socket.io'` en dev.

---

## Pages Frontend (Routes)

- `/` Accueil
- `/connexion`, `/inscription`
- `/defis`, `/defis/nouveau`, `/defis/:id`
- `/profil`
- `/admin`
- `/chat`, `/chat/direct/:userId`
- `/etudiants` (annuaire), `/classements` (leaderboard)

La UI utilise DaisyUI et TailwindCSS, avec composants réutilisables (`LikeButton`, `CategoryBadge`, `Toast`, etc.).

---

## Notes de Sécurité

- Mots de passe hachés (`bcrypt`)
- JWT stocké via cookie + header Authorization
- Validation stricte des entrées côté serveur
- Restriction emails `@laplateforme.io`, validation admin

---

## Scripts Utiles

- Frontend: `npm run dev`, `npm run build`, `npm run preview`, `npm run lint`
- Backend: démarrage `node app.mjs` (prévoir un script `start` si besoin)
- Seed: `node backend/scripts/seed-demo.mjs`

---

## Déploiement (aperçu)

- Servir le frontend compilé (`npm run build`) derrière un serveur web
- Exposer l’API Express (`PORT` par défaut 5000)
- Configurer `CORS_ORIGIN` et les variables JWT
- Utiliser un volume persistant pour `database.sqlite`

---

## État du MVP

- Les fonctionnalités obligatoires sont en place (auth, défis, interactions, chat, admin)
- Le système de likes complet est implémenté (backend + frontend + Socket.io)
- Prêt pour démo live et présentation (architecture, choix techniques, difficultés)
