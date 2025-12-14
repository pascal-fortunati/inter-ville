// Modèle Participations
// - addParticipation/countParticipations/hasParticipation
// - listParticipationsByChallenge/getParticipationById/updateParticipationStatus
import db from "../config/database.mjs";
// Ajoute une participation à un défi
export function addParticipation(challengeId, userId, proofUrl = null) {
  const stmt = db.prepare(
    "INSERT INTO participations (challenge_id, user_id, proof_url) VALUES (?,?,?)"
  );
  const res = stmt.run(challengeId, userId, proofUrl);
  return res.lastInsertRowid;
}
// Compte le nombre de participations approuvées pour un défi donné
export function countParticipations(challengeId) {
  const stmt = db.prepare("SELECT COUNT(*) AS count FROM participations WHERE challenge_id = ? AND status = 'approved'");
  const row = stmt.get(challengeId);
  return row?.count || 0;
}
// Vérifie si un utilisateur a déjà une participation à un défi donné
export function hasParticipation(challengeId, userId) {
  const stmt = db.prepare("SELECT 1 FROM participations WHERE challenge_id = ? AND user_id = ?");
  const row = stmt.get(challengeId, userId);
  return !!row;
}
// Récupère une participation par défi et utilisateur
export function getParticipationByChallengeUser(challengeId, userId) {
  const stmt = db.prepare("SELECT * FROM participations WHERE challenge_id = ? AND user_id = ?");
  return stmt.get(challengeId, userId);
}
// Liste les participations pour un défi donné
export function listParticipationsByChallenge(challengeId) {
  const stmt = db.prepare(
    "SELECT p.id, p.user_id, p.proof_url, p.status, p.created_at, u.username FROM participations p JOIN users u ON u.id = p.user_id WHERE p.challenge_id = ? ORDER BY p.created_at DESC"
  );
  return stmt.all(challengeId);
}
// Récupère une participation par son ID
export function getParticipationById(id) {
  const stmt = db.prepare("SELECT * FROM participations WHERE id = ?");
  return stmt.get(id);
}
// Met à jour le statut d'une participation
export function updateParticipationStatus(id, status) {
  const stmt = db.prepare("UPDATE participations SET status = ? WHERE id = ?");
  const res = stmt.run(status, id);
  return res.changes;
}
// Met à jour la preuve d'une participation par défi et utilisateur
export function updateParticipationProofByChallengeUser(challengeId, userId, proofUrl) {
  const stmt = db.prepare("UPDATE participations SET proof_url = ? WHERE challenge_id = ? AND user_id = ?");
  const res = stmt.run(proofUrl, challengeId, userId);
  return res.changes;
}
// Liste les participations pour l'administration avec pagination et filtre par statut
export function listParticipationsAdmin(status = 'pending', limit = 20, offset = 0) {
  const hasFilter = status && status !== 'all';
  const whereSql = hasFilter ? 'WHERE p.status = ?' : '';
  const params = hasFilter ? [status, limit, offset] : [limit, offset];
  const stmt = db.prepare(
    `SELECT p.id, p.challenge_id, p.user_id, p.proof_url, p.status, p.created_at,
            u.username, c.title AS challenge_title
     FROM participations p
     JOIN users u ON u.id = p.user_id
     JOIN challenges c ON c.id = p.challenge_id
     ${whereSql}
     ORDER BY p.created_at DESC
     LIMIT ? OFFSET ?`
  );
  return stmt.all(...params);
}
// Compte le nombre total de participations pour l'administration avec filtre par statut
export function countParticipationsAdmin(status = 'pending') {
  const hasFilter = status && status !== 'all';
  const whereSql = hasFilter ? 'WHERE status = ?' : '';
  const params = hasFilter ? [status] : [];
  const row = db.prepare(`SELECT COUNT(*) AS total FROM participations ${whereSql}`).get(...params);
  return row?.total || 0;
}
