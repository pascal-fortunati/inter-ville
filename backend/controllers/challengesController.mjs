// Contrôleur Challenges
// - Liste, détail, création (avec upload image/vidéo) et suppression
// - Émet des évènements temps réel lors de la création
import { listChallengesAdvanced, countChallengesAdvanced, getChallengeById, createChallenge, deleteChallengeById } from "../models/challengeModel.mjs";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
// Récupère la liste des challenges avec filtres, tri et pagination
export function getChallenges(req, res) {
  try {
    const categoriesQ = req.query?.categories || null;
    const sort = req.query?.sort || 'recent';
    const page = Number(req.query?.page || 1);
    const pageSize = Number(req.query?.pageSize || 9);
    const categories = categoriesQ ? String(categoriesQ).split(',').map(s => s.trim()).filter(Boolean) : [];
    const items = listChallengesAdvanced(categories, sort, page, pageSize);
    const total = countChallengesAdvanced(categories);
    return res.status(200).json({ items, total, page, pageSize });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
// Récupère le détail d'un challenge par son ID
export function getChallenge(req, res) {
  try {
    const id = Number(req.params.id);
    const ch = getChallengeById(id);
    if (!ch) return res.status(404).json({ message: "Challenge introuvable" });
    return res.status(200).json(ch);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
// Configuration Multer pour l'upload des fichiers
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const challengeUploadDir = path.join(__dirname, '..', 'uploads', 'challenge');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (!fs.existsSync(challengeUploadDir)) fs.mkdirSync(challengeUploadDir, { recursive: true });
    cb(null, challengeUploadDir);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  }
});
// Middleware Multer pour gérer les uploads (image et vidéo)
export const upload = multer({ storage });
// Création d'un nouveau challenge avec upload image/vidéo
export function postChallenge(req, res) {
  try {
    const userId = req.userId;
    const { title, description, category } = req.body;
    const t = String(title || '').trim();
    const d = String(description || '').trim();
    const c = String(category || '').trim();
    if (!t || !d || !c) return res.status(400).json({ message: 'Champs requis' });
    if (t.length < 3 || t.length > 100) return res.status(400).json({ message: 'Titre invalide' });
    if (d.length < 20 || d.length > 1000) return res.status(400).json({ message: 'Description invalide' });
    const allowed = ['Code', 'Cuisine', 'Gaming', 'Sport', 'Vidéo', 'Musique', 'Photo', 'Art', 'Culture', 'DIY'];
    if (!allowed.includes(c)) return res.status(400).json({ message: 'Catégorie invalide' });
    const imageUrl = req.files?.image?.[0]?.filename ? `/uploads/challenge/${req.files.image[0].filename}` : null;
    const videoUrl = req.files?.video?.[0]?.filename ? `/uploads/challenge/${req.files.video[0].filename}` : null;
    const id = createChallenge(userId, t, d, c, imageUrl, videoUrl);
    const io = req.app?.get('io');
    io?.emit('challenge:new', { id, title, description, category, image_url: imageUrl, video_url: videoUrl });
    return res.status(201).json({ id });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
// Suppression d'un challenge par son ID
export function deleteChallenge(req, res) {
  try {
    const id = Number(req.params.id);
    const changes = deleteChallengeById(id);
    if (!changes) return res.status(404).json({ message: 'Challenge introuvable' });
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
// Upload image pour les challenges
export function postUploadImage(req, res) {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ message: 'Fichier requis' });
    const location = `/uploads/challenge/${file.filename}`;
    return res.status(201).json({ location });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
// Upload vidéo pour les challenges
export function postUploadVideo(req, res) {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ message: 'Fichier requis' });
    const location = `/uploads/challenge/${file.filename}`;
    return res.status(201).json({ location });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}