// Connexion SQLite et chargement du schéma
// - Ouvre la base `database.sqlite` via better-sqlite3
// - Active les clés étrangères et applique le fichier SQL `schema.sql`
// - Exporte l'instance `db` pour les modèles et contrôleurs
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Charger les variables d'environnement depuis le fichier .env
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger le schéma SQL
const schemaPath = path.join(__dirname, "../database/schema.sql");
const schema = fs.readFileSync(schemaPath, "utf-8");

// Déterminer le chemin de la base de données
const dbPath = process.env.DATABASE_PATH
  ? (path.isAbsolute(process.env.DATABASE_PATH)
    ? process.env.DATABASE_PATH
    : path.join(__dirname, "../", process.env.DATABASE_PATH))
  : path.join(__dirname, "../database/database.sqlite");
const db = new Database(dbPath);

db.pragma("foreign_keys = ON"); // ne pas oublier 

db.exec(schema);

export default db;
