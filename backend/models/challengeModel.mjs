// Modèle Challenges
// - listChallengesAdvanced/countChallengesAdvanced: pagination, tri et filtres
// - getChallengeById/createChallenge/deleteChallengeById
import db from "../config/database.mjs";
// - liste les challenges avec options de filtre, tri et pagination
export function listChallengesAdvanced(categories = null, sort = 'recent', page = 1, perPage = 9) {
  const where = [];
  const params = [];
  if (categories && categories.length) {
    where.push(`category IN (${categories.map(() => '?').join(',')})`);
    params.push(...categories);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const base = `SELECT c.*, 
    (SELECT COUNT(*) FROM likes l WHERE l.target_type = 'challenge' AND l.target_id = c.id) AS likes_count,
    (SELECT COUNT(*) FROM comments cm WHERE cm.challenge_id = c.id) AS comments_count,
    (SELECT COUNT(*) FROM participations p WHERE p.challenge_id = c.id AND p.status = 'approved') AS participations_count
    FROM challenges c ${whereSql}`;
  let orderBy = 'ORDER BY c.created_at DESC';
  if (sort === 'likes') orderBy = 'ORDER BY likes_count DESC, c.created_at DESC';
  if (sort === 'comments') orderBy = 'ORDER BY comments_count DESC, c.created_at DESC';
  const limit = Math.max(1, Number(perPage) || 9);
  const offset = Math.max(0, (Math.max(1, Number(page) || 1) - 1) * limit);
  const stmt = db.prepare(`${base} ${orderBy} LIMIT ? OFFSET ?`);
  return stmt.all(...params, limit, offset);
}
// - compte les challenges avec options de filtre
export function countChallengesAdvanced(categories = null) {
  const where = [];
  const params = [];
  if (categories && categories.length) {
    where.push(`category IN (${categories.map(() => '?').join(',')})`);
    params.push(...categories);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const row = db.prepare(`SELECT COUNT(*) AS total FROM challenges c ${whereSql}`).get(...params);
  return row?.total || 0;
}
// - récupère un challenge par son ID
export function getChallengeById(id) {
  const stmt = db.prepare("SELECT * FROM challenges WHERE id = ?");
  return stmt.get(id);
}
// - crée un nouveau challenge
export function createChallenge(userId, title, description, category, imageUrl = null, videoUrl = null) {
  const stmt = db.prepare(
    "INSERT INTO challenges (user_id, title, description, category, image_url, video_url) VALUES (?,?,?,?,?,?)"
  );
  const res = stmt.run(userId, title, description, category, imageUrl, videoUrl);
  return res.lastInsertRowid;
}
// - supprime un challenge par son ID
export function deleteChallengeById(id) {
  db.prepare("DELETE FROM likes WHERE target_type = 'comment' AND target_id IN (SELECT id FROM comments WHERE challenge_id = ?)").run(id);
  db.prepare("DELETE FROM likes WHERE target_type = 'challenge' AND target_id = ?").run(id);
  const stmt = db.prepare("DELETE FROM challenges WHERE id = ?");
  const res = stmt.run(id);
  return res.changes;
}
