import db from "../config/database.mjs"


export function createChannel(name, ownerId, type) {
    const insertChannelStmt = db.prepare(
        "INSERT INTO channels (name, type, owner_user_id) VALUES (?, ?, ?)"
    );

    const insertChannelUserStmt = db.prepare(
        "INSERT INTO channels_users (channel_id, user_id, role) VALUES (?, ?, ?)"
    );

    const transac = db.transaction(() => {
        const result = insertChannelStmt.run(name, type, ownerId);
        const channelId = Number(result.lastInsertRowid);

        insertChannelUserStmt.run(channelId, ownerId, "owner");

        return channelId;
    })

    return transac();
}

export function deleteChannel(id, ownerId) {
    const query = "DELETE FROM channels WHERE id = ? AND owner_user_id = ?";
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
    const query = "DELETE FROM channel_users WHERE user_id = ? AND channel_id = ?";
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

export function getAllChannel() {
    const query = "SELECT * FROM channels";
    const stmt = db.prepare(query);
    const result = stmt.all();
    return result
}

export function getAllUsersFromChannelId(channelId) {
    const query = `
        SELECT 
            users.id,
            users.username,
            users.name,
            users.lastname,
            users.email,
            users.town,
            users.promo,
            users.avatar,
            users.role AS app_role,
            channels_users.role AS channel_role,
            channels_users.joined_at
        FROM channels_users
        INNER JOIN users ON users.id = channels_users.user_id
        WHERE channels_users.channel_id = ?`
    const stmt = db.prepare(query);
    const result = stmt.all(channelId);
    return result;

}