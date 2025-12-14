// Contrôleur Likes
// - postLike: ajoute un like et diffuse 'like:added'
// - deleteLike: supprime un like et diffuse 'like:removed'
// - getChallengeLikes/getCommentLikes: renvoie le compteur
// - getUserLiked: vérifie si l'utilisateur a liké une cible
import { addLike, removeLikeById, countLikes, getLikeByComposite, hasUserLiked } from "../models/likeModel.mjs";
import db from "../config/database.mjs";
import { getChallengeById } from "../models/challengeModel.mjs";
import { getCommentById } from "../models/commentModel.mjs";
// POST /likes
export function postLike(io) {
  return (req, res) => {
    try {
      const userId = req.userId;
      const { targetType, targetId } = req.body;
      if (!userId || !targetType || !targetId) {
        return res.status(400).json({ message: "Paramètres manquants" });
      }
      if (!['challenge', 'comment'].includes(targetType)) {
        return res.status(400).json({ message: "Type non supporté" });
      }
      const tid = Number(targetId);
      if (!Number.isFinite(tid) || tid <= 0) {
        return res.status(400).json({ message: "ID cible invalide" });
      }
      if (targetType === 'challenge') {
        const exists = getChallengeById(tid);
        if (!exists) return res.status(404).json({ message: "Challenge introuvable" });
      } else {
        const exists = getCommentById(tid);
        if (!exists) return res.status(404).json({ message: "Commentaire introuvable" });
      }

      const existing = getLikeByComposite(userId, targetType, tid);
      if (existing) {
        return res.status(409).json({ message: "Déjà liké", id: existing.id });
      }

      const id = addLike(userId, targetType, tid);
      const count = countLikes(targetType, tid);
      io?.emit('like:added', { targetType, targetId: tid, count });
      return res.status(201).json({ id, count });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  };
}
// DELETE /likes/:id
export function deleteLike(io) {
  return (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(400).json({ message: "ID manquant" });
      // Récupérer le like avant suppression pour émettre l'événement avec les bonnes infos
      const likeRow = db.prepare("SELECT target_type, target_id FROM likes WHERE id = ?").get(id);
      const changes = removeLikeById(id);
      if (!changes) return res.status(404).json({ message: "Like introuvable" });
      if (likeRow) {
        const { target_type, target_id } = likeRow;
        const count = countLikes(target_type, Number(target_id));
        io?.emit('like:removed', { targetType: target_type, targetId: Number(target_id), count });
      } else {
        io?.emit('like:removed', { id });
      }
      return res.status(200).json({ ok: true });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  };
}
// GET /challenges/:id/likes
export function getChallengeLikes(req, res) {
  try {
    const id = Number(req.params.id);
    const count = countLikes('challenge', id);
    return res.status(200).json({ count });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
// GET /comments/:id/likes
export function getCommentLikes(req, res) {
  try {
    const id = Number(req.params.id);
    const count = countLikes('comment', id);
    return res.status(200).json({ count });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
// GET /users/:userId/liked?targetType=...&targetId=...
export function getUserLiked(req, res) {
  try {
    const userId = Number(req.params.userId);
    const targetType = req.query.targetType;
    const targetId = Number(req.query.targetId);
    if (!userId || !targetType || !targetId) {
      return res.status(400).json({ message: "Paramètres manquants" });
    }
    if (!req.userId || req.userId !== userId) {
      return res.status(403).json({ message: "Accès refusé" });
    }
    const like = getLikeByComposite(userId, targetType, targetId);
    return res.status(200).json({ liked: !!like, likeId: like?.id || null });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
