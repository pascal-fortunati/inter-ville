// Modèle Utilisateurs
// - création, lecture, mise à jour et suppression
// - vérification email, validation admin
// - calcul de statistiques (points, reconnaissance, likes, participations)
import db from "../config/database.mjs"
// Crée un nouvel utilisateur
export function createUser(username, email, password, town, promo) {
    const query = "INSERT INTO users (username,email,password,town,promo,email_verification_token) VALUES (?,?,?,?,?,?)";
    const token = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    const stmt = db.prepare(query);
    const result = stmt.run(username, email, password, town, promo, token);
    return result
}
// Récupère tous les utilisateurs
export function getAllUsers() {
    const query = "SELECT * FROM users";
    const stmt = db.prepare(query);
    const result = stmt.all();
    return result;
}
// Récupère un utilisateur par son ID
export function getUserById(id) {
    const query = `SELECT * FROM users WHERE id = ?`;
    const stmt = db.prepare(query)
    return stmt.get(id)
}
// Récupère un utilisateur par son email
export function getUserByEmail(email) {
    const query = `SELECT * FROM users WHERE email = ?`;
    const stmt = db.prepare(query)
    return stmt.get(email)
}
// Récupère un utilisateur par son nom d'utilisateur
export function getUserByUsername(username) {
    const query = `SELECT * FROM users WHERE username = ?`;
    const stmt = db.prepare(query)
    return stmt.get(username)
}
// Met à jour le profil d'un utilisateur
export function updateUserProfile(id, fields) {
    const cols = [];
    const values = [];
    if (fields.username !== undefined) { cols.push('username = ?'); values.push(fields.username); }
    if (fields.town !== undefined) { cols.push('town = ?'); values.push(fields.town); }
    if (fields.promo !== undefined) { cols.push('promo = ?'); values.push(fields.promo); }
    if (fields.avatar !== undefined) { cols.push('avatar = ?'); values.push(fields.avatar); }
    if (fields.password !== undefined) { cols.push('password = ?'); values.push(fields.password); }
    if (fields.is_email_verified !== undefined) { cols.push('is_email_verified = ?'); values.push(fields.is_email_verified ? 1 : 0); }
    if (fields.is_verified !== undefined) { cols.push('is_verified = ?'); values.push(fields.is_verified ? 1 : 0); }
    if (fields.role !== undefined) { cols.push('role = ?'); values.push(fields.role); }
    if (!cols.length) return 0;
    const query = `UPDATE users SET ${cols.join(', ')} WHERE id = ?`;
    const stmt = db.prepare(query);
    const res = stmt.run(...values, id);
    return res.changes;
}
// Vérifie l'email d'un utilisateur via un token
export function verifyEmailByToken(token) {
    const getStmt = db.prepare(`SELECT id FROM users WHERE email_verification_token = ?`);
    const row = getStmt.get(token);
    if (!row) return 0;
    const upd = db.prepare(`UPDATE users SET is_email_verified = 1, email_verification_token = NULL WHERE id = ?`);
    const res = upd.run(row.id);
    return res.changes;
}
// Valide un utilisateur par un administrateur
export function setUserValidatedByAdmin(id) {
    const stmt = db.prepare(`UPDATE users SET is_verified = 1, is_email_verified = 1 WHERE id = ?`);
    const res = stmt.run(id);
    return res.changes;
}
// Liste les utilisateurs en attente de validation
export function listPendingUsers() {
    const stmt = db.prepare(`SELECT id, username, email, role, is_verified, is_email_verified, created_at FROM users WHERE is_verified = 0 ORDER BY created_at DESC`);
    return stmt.all();
}
// Supprime un utilisateur par son ID
export function deleteUserById(id) {
    const query = `DELETE FROM users WHERE id = ?`;
    const stmt = db.prepare(query);
    const result = stmt.run(id);
    return result.changes;
}
// Compte le nombre total d'administrateurs
export function countAdmins() {
    const row = db.prepare(`SELECT COUNT(*) AS c FROM users WHERE role = 'admin'`).get();
    return row?.c || 0;
}
// Liste les utilisateurs dont l'email n'est pas vérifié
export function listUnverifiedEmailUsers() {
    const stmt = db.prepare(`SELECT id, username, email, role, is_verified, is_email_verified, created_at FROM users WHERE is_email_verified = 0 ORDER BY created_at DESC`);
    return stmt.all();
}
// Comptage des challenges pour les statistiques
export function countChallengesByUser(userId) {
    const row = db.prepare(`SELECT COUNT(*) AS c FROM challenges WHERE user_id = ?`).get(userId);
    return row?.c || 0;
}
// Comptage des commentaires pour les statistiques
export function countCommentsByUser(userId) {
    const row = db.prepare(`SELECT COUNT(*) AS c FROM comments WHERE user_id = ?`).get(userId);
    return row?.c || 0;
}
// Comptage des likes sur les challenges pour les statistiques
export function countLikesOnChallengesByUser(userId) {
    const row = db.prepare(`
        SELECT COUNT(*) AS c
        FROM likes l
        JOIN challenges ch ON ch.id = l.target_id
        WHERE l.target_type = 'challenge' AND ch.user_id = ?
    `).get(userId);
    return row?.c || 0;
}
// Comptage des likes sur les commentaires pour les statistiques
export function countLikesOnCommentsByUser(userId) {
    const row = db.prepare(`
        SELECT COUNT(*) AS c
        FROM likes l
        JOIN comments cm ON cm.id = l.target_id
        WHERE l.target_type = 'comment' AND cm.user_id = ?
    `).get(userId);
    return row?.c || 0;
}
// Comptage des participations approuvées pour les statistiques
export function countApprovedParticipationsByUser(userId) {
    const row = db.prepare(`SELECT COUNT(*) AS c FROM participations WHERE user_id = ? AND status = 'approved'`).get(userId);
    return row?.c || 0;
}
// Calcul du total des points d'un utilisateur
export function computeUserPoints(userId) {
    const challenges = countChallengesByUser(userId);
    const comments = countCommentsByUser(userId);
    const likesCh = countLikesOnChallengesByUser(userId);
    const likesCm = countLikesOnCommentsByUser(userId);
    const parts = countApprovedParticipationsByUser(userId);
    // Barème : 3 points par défi, 1 point par commentaire, 2 points par like sur défi, 1 point par like sur commentaire, 5 points par participation approuvée
    return (challenges * 3) + (comments * 1) + (likesCh * 2) + (likesCm * 1) + (parts * 5);
}
// Calcul du score de reconnaissance d'un utilisateur
export function computeUserRecognitionScore(userId) {
    const challenges = countChallengesByUser(userId);
    const likesCh = countLikesOnChallengesByUser(userId);
    const likesCm = countLikesOnCommentsByUser(userId);
    // Barème : 1 point par défi, 1 point par like sur défi, 1 point par like sur commentaire
    return (challenges * 1) + (likesCh * 1) + (likesCm * 1);
}
