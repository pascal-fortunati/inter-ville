import db from "../config/database.mjs"

export function createChannel(name, ownerId, type) {
    const query = "INSERT INTO channels (name,type,owner_user_id) VALUES (?,?,?)";
    const stmt = db.prepare(query);
    const result = stmt.run(name, type, ownerId);
    return result
}

export function deleteChannel(id) {
    const query = "DELETE FROM channels where id = ?";
    const stmt = db.prepare(query);
    const result = stmt.run(id);
    return result.changes;
}

export function updateChannel(id, name, ownerId, type) {
    const query = "UPDATE channels SET name = ?, type = ? , owner_user_id = ?  WHERE id = ?";
    const stmt = db.prepare(query);
    const result = stmt.run(name, type, ownerId, id);
    return result.changes;
}

export function addUserToChannel(userId, channelId) {

}

export function removeUserFromChannel(userId, channelId) {

}

export function changeUserRoleOnChannel(userId, channelId, role) {

}