// Modèle Commentaires
// - getCommentsForChallenge/addComment/deleteCommentById
// - listRecentComments/countComments
import db from "../config/database.mjs";
// Récupère les commentaires pour un défi donné
export function getCommentsForChallenge(challengeId) {
  const stmt = db.prepare(
    "SELECT c.id, c.content as text, c.created_at, u.username as author, u.id as user_id FROM comments c JOIN users u ON u.id = c.user_id WHERE c.challenge_id = ? ORDER BY c.created_at DESC"
  );
  return stmt.all(challengeId);
}
// Ajoute un commentaire à un défi donné
export function addComment(challengeId, userId, content) {
  const stmt = db.prepare(
    "INSERT INTO comments (challenge_id, user_id, content) VALUES (?,?,?)"
  );
  const res = stmt.run(challengeId, userId, content);
  return res.lastInsertRowid;
}
// Supprime un commentaire par son ID
export function deleteCommentById(id) {
  db.prepare("DELETE FROM likes WHERE target_type = 'comment' AND target_id = ?").run(id);
  const stmt = db.prepare("DELETE FROM comments WHERE id = ?");
  const res = stmt.run(id);
  return res.changes;
}
// Liste les commentaires récents avec pagination
export function listRecentComments(limit = 50, offset = 0) {
  const stmt = db.prepare(
    "SELECT c.id, c.content as text, c.created_at, c.challenge_id, u.username as author FROM comments c JOIN users u ON u.id = c.user_id ORDER BY c.created_at DESC LIMIT ? OFFSET ?"
  );
  return stmt.all(limit, offset);
}
// Compte le nombre total de commentaires
export function countComments() {
  const row = db.prepare("SELECT COUNT(*) AS total FROM comments").get();
  return row?.total || 0;
}
// Récupère un commentaire par son ID
export function getCommentById(id) {
  const stmt = db.prepare("SELECT * FROM comments WHERE id = ?");
  return stmt.get(id);
}
