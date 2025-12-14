// Contrôleur Commentaires
// - getChallengeComments: liste les commentaires d'un challenge
// - postChallengeComment: ajoute un commentaire et émet 'comment:new'
import { getCommentsForChallenge, addComment } from "../models/commentModel.mjs";

// GET /challenges/:id/comments
export function getChallengeComments(req, res) {
  try {
    const id = Number(req.params.id);
    const rows = getCommentsForChallenge(id);
    return res.status(200).json(rows);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// POST /challenges/:id/comments
export function postChallengeComment(req, res) {
  try {
    const id = Number(req.params.id);
    const userId = req.userId;
    const text = (req.body?.text || "").trim();
    if (!text) return res.status(400).json({ message: "Contenu requis" });
    if (text.length > 500) return res.status(400).json({ message: "Contenu trop long" });
    const commentId = addComment(id, userId, text);
    const io = req.app?.get('io');
    const payload = { id: commentId, challengeId: id, text, author: req.user?.username };
    io?.emit('comment:new', payload);
    return res.status(201).json({ id: commentId });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
