import db from "../config/database.mjs";

export function addMessage(userId, content, channelId) {
    const query = "INSERT INTO messages (content, user_id,channel_id) VALUES (?,?,?)";
    const stmt = db.prepare(query);
    const result = stmt.run(content, userId, channelId)
    return result.changes;
}

export function deleteMessage(userId, messageId, channelId) {

};

export function getAllMessagesByChannelId(channelId) {

}