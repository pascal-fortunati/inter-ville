import db from "../config/database.mjs";

export function addMessage(userId, content, channelId) {
    const query = "INSERT INTO messages (content, user_id,channel_id) VALUES (?,?,?)";
    const stmt = db.prepare(query);
    const result = stmt.run(content, userId, channelId)
    return result.changes;
}

export function deleteMessage(messageId, userId) {
    const query = "DELETE FROM messages WHERE id = ? AND user_id = ?";
    const stmt = db.prepare(query);
    const result = stmt.run(messageId, userId)
    return result.changes;
};

export function getAllMessagesByChannelId(channelId, offset = 0) {
    const query = `SELECT *FROM messages WHERE channel_id = ? ORDER BY created_at DESC LIMIT 20 OFFSET ? `;
    const stmt = db.prepare(query);
    return stmt.all(channelId, offset);
}

export function updateMessageById(content, messageId, userId) {
    const query = "UPDATE messages SET content = ? WHERE id = ? AND user_id = ?";
    const stmt = db.prepare(query);
    const result = stmt.run(content, messageId, userId);
    return result.changes;
}