import db from "../config/database.mjs"

export function getAllUsers(){
    return db.prepare("SELECT * FROM users").all();
}