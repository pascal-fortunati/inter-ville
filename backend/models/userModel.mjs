import db from "../config/database.mjs"


export function createUser(username, email, password, town, promo) {

    const query = "INSERT INTO users (username,email,password,town,promo) VALUES (?,?,?,?,?)";

    const stmt = db.prepare(query);
    const result = stmt.run(username, email, password, town, promo);
    return result.lastInsertRowid;
}

export function getAllUsers() {
    const query = "SELECT id, username, email, town, promo, created_at FROM users";
    const stmt = db.prepare(query);
    const result = stmt.all();
    return result;
}

export function getUserById(id) {
    const query = `SELECT id, username, email, town, promo, created_at FROM users WHERE id = ?`;
    const stmt = db.prepare(query)
    return stmt.get(id)
}