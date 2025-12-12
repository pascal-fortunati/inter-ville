# Inter-Ville – Mini réseau social de défis

Projet étudiant pour les étudiants CDPI de La Plateforme.
Chaque utilisateur peut proposer des challenges, voir et commenter ceux des autres, participer, chatter et gérer un profil simple.

---

## 🚀 Stack technique

- Frontend : React, TailwindCSS, DaisyUI, Axios
- Backend : Node.js, Express, Socket.io
- Base de données : SQLite

---

## 📁 Structure du projet

- inter-ville/
  - backend/       : Serveur Express + routes API
  - frontend/      : Application React
  - .gitignore     : Ignorer node_modules et fichiers sensibles

---

## 🧑‍💻 Organisation Git / Workflow équipe

### Branches recommandées

| Branche            | Responsable    | Contenu                                |
|-------------------|----------------|---------------------------------------|
| feature/frontend   | Antoine / Pascal  | Pages React, composants UI             |
| feature/backend    | John           | Routes Express, logique API, chat     |
| feature/database   | Josselin       | SQLite, tables, requêtes               |
| feature/chat       | John / Pascal     | Socket.io + intégration chat           |

### Comment travailler sur une branche

1. Récupérer les dernières branches :  
   `git fetch`

2. Passer sur sa branche :  
   `git checkout feature/frontend`   # exemple pour Antoine

3. Pull pour être à jour :  
   `git pull origin feature/frontend`

4. Travailler sur les fichiers, puis ajouter et committer les changements :  
   `git add .`  
   `git commit -m "Description du travail"`

5. Pousser sur GitHub :  
   `git push origin feature/frontend`

### Fusionner dans main

- Créer une Pull Request sur GitHub depuis la branche vers `main`.  
- Une fois validée et testée, fusionner pour mettre à jour `main`.  
- Ne jamais push directement sur `main`.

---

## 💻 Lancer le projet

### Backend

`cd backend`  
`npm install`  
`node index.js`   # ou npm start si configuré

### Frontend

`cd frontend`  
`npm install`  
`npm start`

- Frontend accessible sur `http://localhost:3000`  
- Backend sur le port défini dans Express (ex: 5000)
