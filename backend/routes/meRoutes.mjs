// Routes Utilisateur courant
// - GET/PUT /users/me: informations et édition du profil
// - PUT /users/me/avatar: upload avatar
// - GET /users/me/stats: statistiques & points
import express from "express";
import { isLoggedInJWT } from "../middlewares/isLoggedInJwt.mjs";
import { getUserById, updateUserProfile, countChallengesByUser, countApprovedParticipationsByUser, countCommentsByUser, countLikesOnChallengesByUser, countLikesOnCommentsByUser, computeUserPoints } from "../models/userModel.mjs";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt";
// Initialisation du routeur
const router = express.Router();
// Configuration de multer pour l'upload des avatars
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const avatarsDir = path.join(__dirname, '..', 'uploads', 'avatars');
// Configuration du stockage des fichiers
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (!fs.existsSync(avatarsDir)) fs.mkdirSync(avatarsDir, { recursive: true });
    cb(null, avatarsDir);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  }
});
// Initialisation de l'upload middleware
const upload = multer({ storage });
// Récupération des informations de l'utilisateur courant
router.get('/users/me', isLoggedInJWT(), (req, res) => {
  const user = getUserById(req.userId);
  if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
  const { password, ...safe } = user;
  return res.status(200).json(safe);
});
// Edition du profil utilisateur
router.put('/users/me', isLoggedInJWT(), (req, res) => {
  const { pseudo, ville, promo } = req.body;
  const changes = updateUserProfile(req.userId, {
    username: pseudo,
    town: ville,
    promo,
  });
  if (!changes) return res.status(400).json({ message: 'Aucune modification' });
  const user = getUserById(req.userId);
  const { password, ...safe } = user;
  return res.status(200).json(safe);
});
// Upload de l'avatar utilisateur
router.put('/users/me/avatar', isLoggedInJWT(), upload.single('avatar'), (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ message: 'Fichier requis' });
  const avatar = `/uploads/avatars/${file.filename}`;
  const changes = updateUserProfile(req.userId, { avatar });
  if (!changes) return res.status(400).json({ message: 'Aucune modification' });
  const user = getUserById(req.userId);
  const { password, ...safe } = user;
  return res.status(200).json(safe);
});
// Récupération des statistiques de l'utilisateur courant
router.get('/users/me/stats', isLoggedInJWT(), (req, res) => {
  const userId = req.userId;
  const stats = {
    challenges: countChallengesByUser(userId),
    comments: countCommentsByUser(userId),
    participations_approved: countApprovedParticipationsByUser(userId),
    likes_on_challenges: countLikesOnChallengesByUser(userId),
    likes_on_comments: countLikesOnCommentsByUser(userId),
    points: computeUserPoints(userId),
  };
  return res.status(200).json(stats);
});

// Changement de mot de passe
router.put('/users/me/password', isLoggedInJWT(), async (req, res) => {
  try {
    const { current_password, new_password } = req.body || {};
    if (!current_password || !new_password) {
      return res.status(400).json({ message: 'Champs requis' });
    }
    if (String(new_password).length < 8) {
      return res.status(400).json({ message: 'Mot de passe trop court' });
    }
    const user = getUserById(req.userId);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    const ok = await bcrypt.compare(String(current_password), String(user.password));
    if (!ok) return res.status(401).json({ message: 'Mot de passe actuel incorrect' });
    const hashed = await bcrypt.hash(String(new_password), 10);
    const changes = updateUserProfile(req.userId, { password: hashed });
    if (!changes) return res.status(400).json({ message: 'Aucune modification' });
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

export default router;
