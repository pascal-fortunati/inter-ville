// Routes Authentification
// - register/login/logout/verify-email
// - get/:id: lecture d'un utilisateur par id
import {
  getUsers,
  register,
  login,
  getUser,
  logout,
  verifyEmail
} from "../controllers/userController.mjs"
import express from "express";
// Initialisation du routeur
const router = express.Router();
// Définition des routes
router.get("/get/all", getUsers);
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/get/:id", getUser);
router.post("/verify-email", verifyEmail);

export default router;
