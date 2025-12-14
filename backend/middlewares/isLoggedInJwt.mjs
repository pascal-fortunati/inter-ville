// Middleware Authentification JWT
// - récupère le token depuis l'en-tête Authorization ou le cookie
// - vérifie le token et hydrate req.userId et req.user
import dotenv from "dotenv"
import jwt from "jsonwebtoken";
import { getUserById } from "../models/userModel.mjs";
// - charge les variables d'environnement
dotenv.config();
// - middleware
export function isLoggedInJWT() {
  return async (req, res, next) => {
    const authHeader = req.headers.authorization || "";
    const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const cookieToken = req.cookies?.token;
    const token = bearerToken || cookieToken;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }
    try {
      const secret = process.env.PRIVATE_JWT_KEY || process.env.JWT_SECRET || 'dev-secret';
      const decoded = jwt.verify(token, secret);
      req.userId = decoded.userId;

      req.user = getUserById(req.userId);
      if (!req.user) {
        return res.status(401).json({ message: "Utilisateur introuvable" });
      }

      next();
    } catch (err) {
      return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }
  };
}
