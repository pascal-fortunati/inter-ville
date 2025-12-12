import dotenv from "dotenv"
import jwt from "jsonwebtoken";
import { getUserById } from "../models/userModel.mjs";



dotenv.config();

export function isLoggedInJWT() {
    return async (req, res, next) => {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ message: "Unauthorized: No token provided" });
        }
        try {
            const decoded = jwt.verify(token, process.env.PRIVATE_JWT_KEY);
            req.userId = decoded.userId;

            req.user = getUserById(req.userId)
            if (!req.user) {
                return res.status(401).json({ message: "Utilisateur introuvable" })
            };

            next();
        } catch (err) {
            return res.status(401).json({ message: `Unauthorized: Invalid token` })
        }
    }
}