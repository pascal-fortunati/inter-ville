import db from "../config/database.mjs"

export function createChannel(name, ownerId, type) {
    const query = "INSERT INTO channels (name,type,owner_user_id) VALUES (?,?,?)";
    const stmt = db.prepare(query);
    const result = stmt.run(name, type, ownerId);
    return result
}

export function deleteChannel(id, ownerId) {
    const query = "DELETE FROM channels WHERE id = ? AND user_id = ?";
    const stmt = db.prepare(query);
    const result = stmt.run(id, ownerId);
    return result.changes;
}

export function updateChannel(channelId, name, ownerId, type) {
    const query = "UPDATE channels SET name = ?, type = ? , owner_user_id = ?  WHERE id = ?";
    const stmt = db.prepare(query);
    const result = stmt.run(name, type, ownerId, channelId);
    return result.changes;
}

export function addUserToChannel(userId, channelId) {
    const query = "INSERT INTO channels_users (channel_id,user_id) VALUES (?,?)";
    const stmt = db.prepare(query);
    const result = stmt.run(channelId, userId);
    return result;
}

export function removeUserFromChannel(userId, channelId) {
    const query = "DELETE FROM channel_users WHERE user_id = ? AND channel_id = ? AND ";
    const stmt = db.prepare(query);
    const result = stmt.run(userId, channelId)
    return result.changes;
}

export function changeUserRoleOnChannel(userId, channelId, role) {
    const query = "UPDATE channels_users SET role = ? WHERE channel_id = ? AND user_id = ?";
    const stmt = db.prepare(query);
    const result = stmt.run(role, channelId, userId);
    return result.changes;
}