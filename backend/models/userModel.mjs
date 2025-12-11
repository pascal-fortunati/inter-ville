import db from "../config/database.mjs"


export function createUser(username, email, password, town, promo) {

    const query = "INSERT INTO users (username,email,password,town,promo) VALUES (?,?,?,?,?)";

    const stmt = db.prepare(query);
    const result = stmt.run(username, email, password, town, promo);
    return result
}

export function getAllUsers() {
    const query = "SELECT * FROM users";
    const stmt = db.prepare(query);
    const result = stmt.all();
    return result;
}

export function getUserById(id) {
    const query = `SELECT * FROM users WHERE id = ?`;
    const stmt = db.prepare(query)
    return stmt.get(id)
}

export function getUserByEmail(email) {
    const query = `SELECT * FROM users WHERE email = ?`;
    const stmt = db.prepare(query)
    return stmt.get(email)
}

export function getUserByUsername(username) {
    const query = `SELECT * FROM users WHERE username = ?`;
    const stmt = db.prepare(query)
    return stmt.get(username)
}