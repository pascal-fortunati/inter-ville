import db from "../config/database.mjs"


export function createUser(){
    return db.prepare("INSERT INTO users ()")
}



export function getAllUsers(){
    return db.prepare("SELECT * FROM users").all();
}