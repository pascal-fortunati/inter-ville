// Modèle Chat public
// - Canal général + messages associés
// - getGeneralChannel/createGeneralChannel/listGeneralMessages/addGeneralMessage
import db from "../config/database.mjs";
// Récupère le canal général
export function getGeneralChannel() {
  const stmt = db.prepare("SELECT * FROM channels WHERE type = 'general' LIMIT 1");
  return stmt.get();
}
// Crée le canal général
export function createGeneralChannel(ownerUserId) {
  const stmt = db.prepare("INSERT INTO channels (name, type, owner_user_id) VALUES (?,?,?)");
  const res = stmt.run('General', 'general', ownerUserId);
  return res.lastInsertRowid;
}
// Liste les messages du canal général
export function listGeneralMessages() {
  const ch = getGeneralChannel();
  if (!ch) return [];
  const stmt = db.prepare(
    "SELECT m.id, m.content as text, m.created_at, u.username as author, u.id as user_id FROM messages m JOIN users u ON u.id = m.user_id WHERE m.channel_id = ? ORDER BY m.created_at DESC"
  );
  return stmt.all(ch.id);
}
// Ajoute un message au canal général
export function addGeneralMessage(userId, content) {
  let ch = getGeneralChannel();
  if (!ch) {
    const id = createGeneralChannel(userId);
    ch = { id };
  }
  const stmt = db.prepare("INSERT INTO messages (content, user_id, channel_id) VALUES (?,?,?)");
  const res = stmt.run(content, userId, ch.id);
  return res.lastInsertRowid;
}
