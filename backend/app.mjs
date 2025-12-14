// Point d'entrée du serveur Inter‑Ville
// - Configure Express, CORS, cookies et JSON
// - Initialise Socket.io pour le temps réel (statuts en ligne, chat, likes)
// - Monte toutes les routes API et expose les objets partagés (io, onlineUsers)
// - Lance le serveur HTTP sur le port défini
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import jwt from "jsonwebtoken";
import "./config/database.mjs";
import authRoutes from "./routes/authRoutes.mjs";
import likesRoutesFactory from "./routes/likesRoutes.mjs";
import challengesRoutes from "./routes/challengesRoutes.mjs";
import meRoutes from "./routes/meRoutes.mjs";
import adminRoutes from "./routes/adminRoutes.mjs";
import chatRoutesFactory from "./routes/chatRoutes.mjs";
import directMessagesRoutesFactory from "./routes/directMessagesRoutes.mjs";
import directoryRoutes from "./routes/directoryRoutes.mjs";

dotenv.config();

// Création des dossiers d'uploads si inexistants
const app = express();
// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
// Socket.io setup
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});
// Map pour suivre les utilisateurs en ligne et leur nombre de connexions
const onlineUsers = new Map();
// Middleware d'authentification Socket.io
function parseCookies(cookieHeader) {
  const out = {};
  if (!cookieHeader) return out;
  cookieHeader.split(';').forEach(part => {
    const [k, v] = part.trim().split('=');
    out[k] = decodeURIComponent(v || '');
  });
  return out;
}
// Vérifie le token JWT dans les cookies ou l'authentification de la poignée de main
io.use((socket, next) => {
  try {
    const cookies = parseCookies(socket.request.headers.cookie || '');
    const token = cookies.token || socket.handshake.auth?.token;
    if (token) {
      const secret = process.env.PRIVATE_JWT_KEY || process.env.JWT_SECRET || 'dev-secret';
      const decoded = jwt.verify(token, secret);
      if (decoded?.userId) socket.userId = decoded.userId;
    }
    next();
  } catch (err) {
    next();
  }
});
// Gestion des connexions Socket.io
io.on('connection', (socket) => {
  if (socket.userId) {
    const count = onlineUsers.get(socket.userId) || 0;
    onlineUsers.set(socket.userId, count + 1);
    io.emit('user:online', { userId: socket.userId });
  }

  // Indicateurs de saisie (Chat public)
  socket.on('typing:start', (payload = {}) => {
    if (!socket.userId) return;
    const username = typeof payload.username === 'string' ? payload.username : undefined;
    socket.broadcast.emit('typing:start', { userId: socket.userId, username });
  });

  socket.on('typing:stop', () => {
    if (!socket.userId) return;
    socket.broadcast.emit('typing:stop', { userId: socket.userId });
  });

  // Indicateurs de saisie (DM) – diffusion à tous, filtrage côté client par channelId
  socket.on('dm:typing:start', (payload = {}) => {
    if (!socket.userId) return;
    const channelId = Number(payload.channelId);
    if (!channelId) return;
    const username = typeof payload.username === 'string' ? payload.username : undefined;
    socket.broadcast.emit('dm:typing:start', { userId: socket.userId, channelId, username });
  });

  socket.on('dm:typing:stop', (payload = {}) => {
    if (!socket.userId) return;
    const channelId = Number(payload.channelId);
    if (!channelId) return;
    socket.broadcast.emit('dm:typing:stop', { userId: socket.userId, channelId });
  });

  socket.on('disconnect', () => {
    if (socket.userId) {
      const count = (onlineUsers.get(socket.userId) || 1) - 1;
      if (count <= 0) {
        onlineUsers.delete(socket.userId);
        io.emit('user:offline', { userId: socket.userId });
      } else {
        onlineUsers.set(socket.userId, count);
      }
    }
  });
});
// Montage des routes
app.use("/api/auth", authRoutes);
app.use("/api", challengesRoutes);
app.use("/api", meRoutes);
app.use("/api", likesRoutesFactory(io));
app.use("/api", adminRoutes);
app.use("/api", chatRoutesFactory(io));
app.use("/api", directMessagesRoutesFactory(io));
app.use("/api", directoryRoutes);
// Service des fichiers uploadés
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use("/uploads", express.static(path.join(__dirname, 'uploads')));
// Exposition des objets partagés
app.set('io', io);
app.set('onlineUsers', onlineUsers);
// Lancement du serveur
async function main() {
  try {
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Serveur lancé sur le port : ${PORT}`);
    });
  } catch (err) {
    console.error(err);
  }
}

main();
