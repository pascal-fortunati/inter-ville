// Script à exécuter pour ajouter des données de démonstration à la base de données
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import bcrypt from "bcrypt";
import https from "https";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, "..", "database", "database.sqlite");
const db = new Database(dbPath);
db.pragma("foreign_keys = ON");
const schema = fs.readFileSync(path.join(__dirname, "..", "database", "schema.sql"), "utf8");
db.exec(schema);

function insert(sql, params) { return db.prepare(sql).run(...params).lastInsertRowid; }
function run(sql, params) { return db.prepare(sql).run(...params); }

run("DELETE FROM likes", []);
run("DELETE FROM comments", []);
run("DELETE FROM participations", []);
run("DELETE FROM messages", []);
run("DELETE FROM channels_users", []);
run("DELETE FROM channels", []);
run("DELETE FROM challenges", []);
run("DELETE FROM users", []);

const avatarsDir = path.join(__dirname, "..", "uploads", "avatars");
if (!fs.existsSync(avatarsDir)) fs.mkdirSync(avatarsDir, { recursive: true });

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode !== 200) { file.close(); fs.unlink(dest, () => {}); return reject(new Error(`HTTP ${response.statusCode}`)); }
      response.pipe(file);
      file.on('finish', () => file.close(() => resolve(dest)));
    }).on('error', (err) => {
      file.close();
      try { fs.unlinkSync(dest); } catch { /* noop */ }
      reject(err);
    });
  });
}

const adminId = insert(
  "INSERT INTO users (username,email,password,town,promo,role,avatar,is_verified,is_email_verified) VALUES (?,?,?,?,?,?,?,?,?)",
  ["admin", "admin@laplateforme.io", bcrypt.hashSync("P@ssord123!", 10), "Toulon", "CDPI", "admin", "/uploads/avatars/1765708225734-799885935.png", 1, 1]
);

const janeAvatar = path.join(avatarsDir, "jane.jpg");
const johnAvatar = path.join(avatarsDir, "john.jpg");
const aliceAvatar = path.join(avatarsDir, "alice.jpg");
const bobAvatar = path.join(avatarsDir, "bob.jpg");
const claraAvatar = path.join(avatarsDir, "clara.jpg");

try {
  await download("https://i.pravatar.cc/256?img=23", janeAvatar);
} catch { void 0; }
try { await download("https://i.pravatar.cc/256?img=14", johnAvatar); } catch { void 0; }
try { await download("https://i.pravatar.cc/256?img=24", aliceAvatar); } catch { void 0; }
try { await download("https://i.pravatar.cc/256?img=52", bobAvatar); } catch { void 0; }
try { await download("https://i.pravatar.cc/256?img=47", claraAvatar); } catch { void 0; }

const janeId = insert(
  "INSERT INTO users (username,email,password,town,promo,role,avatar,is_verified,is_email_verified) VALUES (?,?,?,?,?,?,?,?,?)",
  ["jane", "jane.doe@laplateforme.io", bcrypt.hashSync("Student123!", 10), "Marseille", 2025, "user", "/uploads/avatars/jane.jpg", 1, 1]
);
const johnId = insert(
  "INSERT INTO users (username,email,password,town,promo,role,avatar,is_verified,is_email_verified) VALUES (?,?,?,?,?,?,?,?,?)",
  ["john", "john.smith@laplateforme.io", bcrypt.hashSync("Student123!", 10), "Nice", 2025, "user", "/uploads/avatars/john.jpg", 1, 1]
);
const aliceId = insert(
  "INSERT INTO users (username,email,password,town,promo,role,avatar,is_verified,is_email_verified) VALUES (?,?,?,?,?,?,?,?,?)",
  ["alice", "alice.w@laplateforme.io", bcrypt.hashSync("Student123!", 10), "Aix-en-Provence", 2025, "user", "/uploads/avatars/alice.jpg", 1, 1]
);
const bobId = insert(
  "INSERT INTO users (username,email,password,town,promo,role,avatar,is_verified,is_email_verified) VALUES (?,?,?,?,?,?,?,?,?)",
  ["bob", "bob.m@laplateforme.io", bcrypt.hashSync("Student123!", 10), "Toulon", 2026, "user", "/uploads/avatars/bob.jpg", 1, 1]
);
const claraId = insert(
  "INSERT INTO users (username,email,password,town,promo,role,avatar,is_verified,is_email_verified) VALUES (?,?,?,?,?,?,?,?,?)",
  ["clara", "clara.p@laplateforme.io", bcrypt.hashSync("Student123!", 10), "Cannes", 2026, "user", "/uploads/avatars/clara.jpg", 1, 1]
);

const generalId = insert("INSERT INTO channels (name,type,owner_user_id) VALUES (?,?,?)", ["General", "general", adminId]);

insert("INSERT INTO messages (content,user_id,channel_id) VALUES (?,?,?)", ["Bienvenue sur Challenges !", adminId, generalId]);
insert("INSERT INTO messages (content,user_id,channel_id) VALUES (?,?,?)", ["Salut tout le monde 👋", janeId, generalId]);
insert("INSERT INTO messages (content,user_id,channel_id) VALUES (?,?,?)", ["Hâte de voir vos défis !", johnId, generalId]);

const ch1 = insert(
  "INSERT INTO challenges (user_id,title,description,category,image_url,video_url) VALUES (?,?,?,?,?,?)",
  [janeId, "Clone Todo App en React", "Crée une todo app avec React, filtrage, persistance et animations.", "Code", null, null]
);
const ch2 = insert(
  "INSERT INTO challenges (user_id,title,description,category,image_url,video_url) VALUES (?,?,?,?,?,?)",
  [bobId, "Torpedo Panisse Challenge", "Réalise des panisses croustillantes avec une présentation moderne.", "Cuisine", null, null]
);
const ch3 = insert(
  "INSERT INTO challenges (user_id,title,description,category,image_url,video_url) VALUES (?,?,?,?,?,?)",
  [johnId, "Speedrun Mario Niveau 1", "Termine le niveau 1 de Mario en moins de 60s.", "Gaming", null, null]
);
const ch4 = insert(
  "INSERT INTO challenges (user_id,title,description,category,image_url,video_url) VALUES (?,?,?,?,?,?)",
  [aliceId, "5km Run Marseille", "Cours 5 km et partage ta trace Strava.", "Sport", null, null]
);
const ch5 = insert(
  "INSERT INTO challenges (user_id,title,description,category,image_url,video_url) VALUES (?,?,?,?,?,?)",
  [claraId, "Clip de 30s Campus", "Tourne un clip vidéo de 30 secondes sur le campus.", "Vidéo", null, null]
);
const ch6 = insert(
  "INSERT INTO challenges (user_id,title,description,category,image_url,video_url) VALUES (?,?,?,?,?,?)",
  [janeId, "Reprise en 1 minute", "Fais une reprise musicale en 60 secondes.", "Musique", null, null]
);
const ch7 = insert(
  "INSERT INTO challenges (user_id,title,description,category,image_url,video_url) VALUES (?,?,?,?,?,?)",
  [johnId, "Photo urbaine: Bleu", "Prends une photo urbaine où le bleu domine.", "Photo", null, null]
);
const ch8 = insert(
  "INSERT INTO challenges (user_id,title,description,category,image_url,video_url) VALUES (?,?,?,?,?,?)",
  [aliceId, "Affiche Inter‑Ville", "Crée une affiche stylée de l’événement.", "Art", null, null]
);
const ch9 = insert(
  "INSERT INTO challenges (user_id,title,description,category,image_url,video_url) VALUES (?,?,?,?,?,?)",
  [bobId, "Quiz Cinéma", "10 questions sur le cinéma français.", "Culture", null, null]
);
const ch10 = insert(
  "INSERT INTO challenges (user_id,title,description,category,image_url,video_url) VALUES (?,?,?,?,?,?)",
  [claraId, "Support smartphone DIY", "Fabrique un support de smartphone avec du carton.", "DIY", null, null]
);

insert("INSERT INTO comments (challenge_id,user_id,content) VALUES (?,?,?)", [ch1, adminId, "Super idée, hâte de voir les résultats !"]);
insert("INSERT INTO comments (challenge_id,user_id,content) VALUES (?,?,?)", [ch1, aliceId, "Je participe ce week‑end."]);
insert("INSERT INTO comments (challenge_id,user_id,content) VALUES (?,?,?)", [ch2, johnId, "Team panisse ✨"]);
insert("INSERT INTO comments (challenge_id,user_id,content) VALUES (?,?,?)", [ch3, bobId, "Je tente le speedrun ce soir."]);

insert("INSERT INTO likes (user_id,target_type,target_id) VALUES (?,?,?)", [adminId, "challenge", ch1]);
insert("INSERT INTO likes (user_id,target_type,target_id) VALUES (?,?,?)", [johnId, "challenge", ch1]);
insert("INSERT INTO likes (user_id,target_type,target_id) VALUES (?,?,?)", [aliceId, "challenge", ch1]);
insert("INSERT INTO likes (user_id,target_type,target_id) VALUES (?,?,?)", [bobId, "challenge", ch2]);
insert("INSERT INTO likes (user_id,target_type,target_id) VALUES (?,?,?)", [claraId, "challenge", ch3]);

const cm1 = insert("INSERT INTO comments (challenge_id,user_id,content) VALUES (?,?,?)", [ch4, claraId, "Beau parcours !"]);
insert("INSERT INTO likes (user_id,target_type,target_id) VALUES (?,?,?)", [adminId, "comment", cm1]);
insert("INSERT INTO likes (user_id,target_type,target_id) VALUES (?,?,?)", [janeId, "comment", cm1]);

insert("INSERT INTO participations (challenge_id,user_id,proof_url,status) VALUES (?,?,?,?)", [ch1, aliceId, null, "approved"]);
insert("INSERT INTO participations (challenge_id,user_id,proof_url,status) VALUES (?,?,?,?)", [ch4, johnId, null, "pending"]);
insert("INSERT INTO participations (challenge_id,user_id,proof_url,status) VALUES (?,?,?,?)", [ch5, bobId, null, "approved"]);

const dm1 = insert("INSERT INTO channels (name,type,owner_user_id) VALUES (?,?,?)", ["DM alice-john", "direct", Math.min(aliceId, johnId)]);
run("INSERT INTO channels_users (channel_id,user_id,role) VALUES (?,?,'member')", [dm1, aliceId]);
run("INSERT INTO channels_users (channel_id,user_id,role) VALUES (?,?,'member')", [dm1, johnId]);
insert("INSERT INTO messages (content,user_id,channel_id) VALUES (?,?,?)", ["Yo !", aliceId, dm1]);
insert("INSERT INTO messages (content,user_id,channel_id) VALUES (?,?,?)", ["Salut !", johnId, dm1]);

console.log(JSON.stringify({ ok: true, users: { adminId, janeId, johnId, aliceId, bobId, claraId }, generalId, challenges: [ch1, ch2, ch3, ch4, ch5, ch6, ch7, ch8, ch9, ch10] }));

