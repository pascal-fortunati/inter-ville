// Modèle Messages directs
// - gestion des canaux 'direct' et des messages associés
// - findDirectChannel/createDirectChannel/getOrCreateDirectChannel
// - listDirectMessages/addDirectMessage
import db from "../config/database.mjs";
//
export function findDirectChannel(userA, userB) {
  const stmt = db.prepare(
    `SELECT c.id FROM channels c
     JOIN channels_users cu1 ON cu1.channel_id = c.id AND cu1.user_id = ?
     JOIN channels_users cu2 ON cu2.channel_id = c.id AND cu2.user_id = ?
     WHERE c.type = 'direct'
     LIMIT 1`
  );
  return stmt.get(userA, userB);
}
// Crée un canal direct entre deux utilisateurs
export function createDirectChannel(userA, userB) {
  const owner = Math.min(userA, userB);
  const stmt = db.prepare("INSERT INTO channels (name, type, owner_user_id) VALUES (?,?,?)");
  const res = stmt.run(`DM ${userA}-${userB}`, 'direct', owner);
  const channelId = res.lastInsertRowid;
  db.prepare("INSERT INTO channels_users (channel_id, user_id, role) VALUES (?,?, 'member')").run(channelId, userA);
  db.prepare("INSERT INTO channels_users (channel_id, user_id, role) VALUES (?,?, 'member')").run(channelId, userB);
  return channelId;
}
// Récupère ou crée un canal direct entre deux utilisateurs
export function getOrCreateDirectChannel(userA, userB) {
  const found = findDirectChannel(userA, userB);
  if (found?.id) return found.id;
  return createDirectChannel(userA, userB);
}
// Liste les messages d'un canal direct
export function listDirectMessages(channelId) {
  const stmt = db.prepare(
    "SELECT m.id, m.content as text, m.created_at, u.username as author, u.id as user_id FROM messages m JOIN users u ON u.id = m.user_id WHERE m.channel_id = ? ORDER BY m.created_at DESC"
  );
  return stmt.all(channelId);
}
// Ajoute un message à un canal direct
export function addDirectMessage(channelId, userId, content) {
  const stmt = db.prepare("INSERT INTO messages (content, user_id, channel_id) VALUES (?,?,?)");
  const res = stmt.run(content, userId, channelId);
  return res.lastInsertRowid;
}
