// Modèle Likes (SQLite via better-sqlite3)
// - addLike/removeLikeById/getLikeByComposite/countLikes/hasUserLiked
import db from "../config/database.mjs";
// Ajoute un like à une cible (commentaire ou autre)
export function addLike(userId, targetType, targetId) {
  const stmt = db.prepare(
    "INSERT INTO likes (user_id, target_type, target_id) VALUES (?,?,?)"
  );
  const res = stmt.run(userId, targetType, targetId);
  return res.lastInsertRowid;
}
// Supprime un like par son ID
export function removeLikeById(id) {
  const stmt = db.prepare("DELETE FROM likes WHERE id = ?");
  const res = stmt.run(id);
  return res.changes;
}
// Récupère un like par la combinaison utilisateur/cible
export function getLikeByComposite(userId, targetType, targetId) {
  const stmt = db.prepare(
    "SELECT * FROM likes WHERE user_id = ? AND target_type = ? AND target_id = ?"
  );
  return stmt.get(userId, targetType, targetId);
}
// Compte le nombre de likes pour une cible donnée
export function countLikes(targetType, targetId) {
  const stmt = db.prepare(
    "SELECT COUNT(*) AS count FROM likes WHERE target_type = ? AND target_id = ?"
  );
  const row = stmt.get(targetType, targetId);
  return row?.count || 0;
}
// Vérifie si un utilisateur a liké une cible donnée
export function hasUserLiked(userId, targetType, targetId) {
  const row = getLikeByComposite(userId, targetType, targetId);
  return !!row;
}
