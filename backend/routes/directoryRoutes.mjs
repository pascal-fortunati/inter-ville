// Routes Annuaire & Classement
// - /directory/users: liste avec points
// - /users/online: ids en ligne via Socket.io
// - /leaderboard: classement par points ou reconnaissance
import express from "express";
import { getAllUsers, computeUserPoints, computeUserRecognitionScore } from "../models/userModel.mjs";
import { isLoggedInJWT } from "../middlewares/isLoggedInJwt.mjs";
// Initialisation du routeur
const router = express.Router();
// Route pour obtenir la liste des utilisateurs avec leurs points
router.get('/directory/users', isLoggedInJWT(), (req, res) => {
  const rows = getAllUsers().map(u => {
    const { password, ...safe } = u;
    const points = computeUserPoints(u.id);
    return { ...safe, points };
  });
  return res.status(200).json(rows);
});
// Route pour obtenir les utilisateurs en ligne via Socket.io
router.get('/users/online', isLoggedInJWT(), (req, res) => {
  const online = req.app.get('onlineUsers');
  const ids = Array.from(online?.keys() || []);
  return res.status(200).json({ ids });
});
// Route pour le classement des utilisateurs
router.get('/leaderboard', (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const pageSize = Math.max(1, Number(req.query.pageSize || 20));
    const metric = String(req.query.metric || 'points');
    const users = getAllUsers().map(u => {
      const { password, ...safe } = u;
      const points = computeUserPoints(u.id);
      const recognition = computeUserRecognitionScore(u.id);
      return { ...safe, points, recognition };
    });
    users.sort((a, b) => {
      const diff = metric === 'recognition'
        ? (b.recognition || 0) - (a.recognition || 0)
        : (b.points || 0) - (a.points || 0);
      if (diff !== 0) return diff;
      return a.username.localeCompare(b.username);
    });
    const total = users.length;
    const offset = (page - 1) * pageSize;
    const items = users.slice(offset, offset + pageSize).map((u, i) => ({ ...u, rank: offset + i + 1 }));
    return res.status(200).json({ items, total, page, pageSize, metric });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

export default router;
