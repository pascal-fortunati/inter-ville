// Routes Administration
// - validation des comptes utilisateurs et vérification des emails
// - listing/modération des challenges et commentaires
import express from "express";
import { isAdmin } from "../middlewares/isAdmin.mjs";
import { listPendingUsers, listUnverifiedEmailUsers, setUserValidatedByAdmin, updateUserProfile } from "../models/userModel.mjs";
import { listChallengesAdvanced, countChallengesAdvanced, deleteChallengeById } from "../models/challengeModel.mjs";
import { listRecentComments, countComments, deleteCommentById } from "../models/commentModel.mjs";
import { listParticipationsAdmin, countParticipationsAdmin } from "../models/participationModel.mjs";
// Initialisation du routeur
const router = express.Router();
// Liste des utilisateurs en attente de validation
router.get('/admin/users/pending', isAdmin(), (req, res) => {
  const rows = listPendingUsers();
  return res.status(200).json(rows);
});
// Liste des utilisateurs avec email non vérifié
router.get('/admin/users/unverified-email', isAdmin(), (req, res) => {
  const rows = listUnverifiedEmailUsers();
  return res.status(200).json(rows);
});
// Valider un utilisateur
router.put('/admin/users/:id/validate', isAdmin(), (req, res) => {
  const id = Number(req.params.id);
  const changes = setUserValidatedByAdmin(id);
  if (!changes) return res.status(400).json({ message: 'Aucune modification' });
  try {
    const io = req.app?.get('io');
    io?.emit('user:validated', { id, byAdminId: req.userId });
  } catch {}
  return res.status(200).json({ ok: true });
});
// Marquer l'email d'un utilisateur comme vérifié
router.put('/admin/users/:id/verify-email', isAdmin(), (req, res) => {
  const id = Number(req.params.id);
  const changes = updateUserProfile(id, { is_email_verified: 1 });
  if (!changes) return res.status(400).json({ message: 'Aucune modification' });
  return res.status(200).json({ ok: true });
});
// Liste des challenges pour l'administration
router.get('/admin/content/challenges', isAdmin(), (req, res) => {
  const page = Number(req.query.page || 1);
  const pageSize = Number(req.query.pageSize || 10);
  const rows = listChallengesAdvanced([], 'recent', page, pageSize);
  const total = countChallengesAdvanced([]);
  return res.status(200).json({ items: rows, total, page, pageSize });
});
// Supprimer un challenge
router.delete('/admin/challenges/:id', isAdmin(), (req, res) => {
  const id = Number(req.params.id);
  const changes = deleteChallengeById(id);
  if (!changes) return res.status(404).json({ message: 'Challenge introuvable' });
  return res.status(200).json({ ok: true });
});
// Liste des commentaires récents
router.get('/admin/content/comments', isAdmin(), (req, res) => {
  const page = Number(req.query.page || 1);
  const pageSize = Number(req.query.pageSize || 20);
  const offset = (Math.max(1, page) - 1) * pageSize;
  const rows = listRecentComments(pageSize, offset);
  const total = countComments();
  return res.status(200).json({ items: rows, total, page, pageSize });
});
// Supprimer un commentaire
router.delete('/admin/comments/:id', isAdmin(), (req, res) => {
  const id = Number(req.params.id);
  const changes = deleteCommentById(id);
  if (!changes) return res.status(404).json({ message: 'Commentaire introuvable' });
  return res.status(200).json({ ok: true });
});
// Liste des participations pour l'administration
router.get('/admin/participations', isAdmin(), (req, res) => {
  const page = Number(req.query.page || 1);
  const pageSize = Number(req.query.pageSize || 20);
  const status = String(req.query.status || 'pending');
  const offset = (Math.max(1, page) - 1) * pageSize;
  const rows = listParticipationsAdmin(status, pageSize, offset);
  const total = countParticipationsAdmin(status);
  return res.status(200).json({ items: rows, total, page, pageSize, status });
});

export default router;
