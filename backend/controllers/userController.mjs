// Contrôleur Utilisateurs & Authentification
// - register: inscription (email @laplateforme.io + token de vérification)
// - login: connexion (JWT en cookie + header)
// - logout: déconnexion (clear cookie)
// - verifyEmail: vérifie l'email via token
// - getUsers/getUser: lecture des utilisateurs (version sans mot de passe)
// - updateUser/deleteUser: réservés pour évolutions
// Les erreurs sont normalisées via sendErrors/catchError
import {
  getAllUsers,
  getUserById,
  getUserByEmail,
  getUserByUsername,
  createUser,
  verifyEmailByToken,
  countAdmins,
  updateUserProfile
} from "../models/userModel.mjs";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
// Charger les variables d'environnement
dotenv.config();
// Clé secrète pour JWT
const JWT_SECRET = process.env.PRIVATE_JWT_KEY || process.env.JWT_SECRET || 'dev-secret';
// Fonction utilitaire pour envoyer les erreurs formatées
const sendErrors = (res, errors, status = 400) => {
  return res.status(status).json({ errors });
};
// Fonction utilitaire pour gérer les erreurs
function catchError(res, err) {
  if (err.name === "SequelizeValidationError") {
    const formattedErrors = {};

    err.errors.forEach((e) => {
      formattedErrors[e.path] = e.message;
    });

    return sendErrors(res, formattedErrors, 400);
  }

  return sendErrors(res, { global: err.message }, 500);
}
// Contrôleur pour obtenir tous les utilisateurs (sans mot de passe)
export function getUsers(req, res) {
  try {
    const users = getAllUsers();

    if (users.length === 0) {
      return sendErrors(res, { global: "Aucun utilisateur trouvé." }, 400);
    }

    const safeUsers = users.map((user) => {
      const { password: passwordUser, ...safeUser } = user;
      return safeUser;
    });

    return res.status(200).json(safeUsers);
  } catch (err) {
    return catchError(res, err);
  }
}
// Contrôleur pour l'inscription d'un nouvel utilisateur
export async function register(req, res) {
  try {
    const username = String(req.body.username || req.body.pseudo || '').trim();
    const email = String(req.body.email || '').trim();
    const password = String(req.body.password || '');
    const town = String(req.body.town || req.body.ville || '').trim();
    const promo = String(req.body.promo || '').trim();

    if (!username || !email || !password || !town || !promo) {
      return sendErrors(res, { global: "Tous les champs sont nécessaires." }, 400);
    }

    if (!/@laplateforme\.io$/i.test(email)) {
      return sendErrors(res, { email: "Email @laplateforme.io requis." }, 400);
    }

    if (username.length < 3 || username.length > 24) {
      return sendErrors(res, { username: "Pseudo entre 3 et 24 caractères." }, 400);
    }
    if (password.length < 8) {
      return sendErrors(res, { password: "Mot de passe minimum 8 caractères." }, 400);
    }
    if (town.length < 2 || town.length > 48) {
      return sendErrors(res, { town: "Ville entre 2 et 48 caractères." }, 400);
    }
    const promoIsYear = /^\d{2,4}$/.test(promo);
    const promoIsCode = /^[A-Za-z0-9_-]{2,16}$/.test(promo);
    if (!promoIsYear && !promoIsCode) {
      return sendErrors(res, { promo: "Promo alphanumérique (ex: 2025, CDPI)." }, 400);
    }

    const existingUsername = getUserByUsername(username);
    if (existingUsername) {
      return sendErrors(res, { username: "Nom d'utilisateur déjà pris." }, 400);
    }

    const existingEmail = getUserByEmail(email);
    if (existingEmail) {
      return sendErrors(res, { email: "Email déjà pris." }, 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = createUser(username, email, hashedPassword, town, promo);
    let newUser = getUserById(result.lastInsertRowid);
    if (countAdmins() === 0) {
      updateUserProfile(newUser.id, { role: 'admin', is_verified: 1, is_email_verified: 1 });
      newUser = getUserById(newUser.id);
    }
    try {
      const io = req.app?.get('io');
      io?.emit('user:registered', {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        is_verified: newUser.is_verified,
        is_email_verified: newUser.is_email_verified,
        created_at: newUser.created_at,
      });
    } catch {}
    return res.status(201).json({ message: "Inscription réussie !", dev_token: newUser.email_verification_token });
  } catch (err) {
    return catchError(res, err);
  }
}
// Contrôleur pour la connexion d'un utilisateur
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendErrors(res, { global: "Tous les champs sont nécessaires." }, 400);
    }

    const user = getUserByEmail(email);
    if (!user) {
      return sendErrors(res, { global: "Email ou mot de passe incorrect." }, 401);
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return sendErrors(res, { global: "Email ou mot de passe incorrect." }, 401);
    }

    if (!user.is_email_verified) {
      const allowEmail = (process.env.ALLOW_UNVERIFIED_LOGIN === 'true') || (countAdmins() === 0);
      if (!allowEmail) {
        return sendErrors(res, { global: "Email non vérifié" }, 401);
      }
    }
    if (!user.is_verified) {
      const allow = (process.env.ALLOW_UNVERIFIED_LOGIN === 'true') || (countAdmins() === 0);
      if (!allow) {
        try {
          const io = req.app?.get('io');
          io?.emit('user:login_unvalidated', {
            id: user.id,
            username: user.username,
            email: user.email,
            created_at: user.created_at,
            attempt_at: new Date().toISOString(),
          });
        } catch {}
        return sendErrors(res, { global: "Compte en attente de validation admin" }, 401);
      }
    }
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "2h" });

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });

    const { password: passwordUser, ...safeUser } = user;
    return res.status(200).json({ message: "Connexion réussie !", user: safeUser, token });
  } catch (err) {
    return catchError(res, err);
  }
}
// Contrôleur pour la déconnexion d'un utilisateur
export function logout(req, res) {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    return catchError(res, err);
  }
}
// Contrôleur pour la vérification de l'email via token
export function verifyEmail(req, res) {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: "Token requis" });
    const changes = verifyEmailByToken(token);
    if (!changes) return res.status(400).json({ message: "Token invalide" });
    return res.status(200).json({ ok: true });
  } catch (err) {
    return catchError(res, err);
  }
}
// Contrôleur pour obtenir un utilisateur par ID (sans mot de passe)
export function getUser(req, res) {
  try {
    const id = req.params.id;

    const user = getUserById(id);

    if (!user) {
      return sendErrors(res, { global: "Utilisateur introuvable." }, 400);
    }

    const { password: passwordUser, ...safeUser } = user;

    return res.status(200).json(safeUser);
  } catch (err) {
    return catchError(res, err);
  }
}
// Contrôleur pour mettre à jour un utilisateur (réservé pour évolutions)
export function updateUser(req, res) {
  try {
  } catch (err) {
    return catchError(res, err);
  }
}
// Contrôleur pour supprimer un utilisateur (réservé pour évolutions)
export function deleteUser(req, res) {
  try {
  } catch (err) {
    return catchError(res, err);
  }
}
