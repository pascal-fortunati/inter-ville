import {
    getAllUsers,
    getUserById,
    getUserByEmail,
    getUserByUsername,
    createUser,
} from "../models/userModel.mjs";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.PRIVATE_JWT_KEY;

const sendErrors = (res, errors, status = 400) => {
    return res.status(status).json({ errors });
};

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

export async function register(req, res) {
    try {
        const { username, email, password, confirmPassword, town, promo } = req.body;

        if (!username || !email || !password || !confirmPassword || !town || !promo) {
            return sendErrors(res, { global: "Tous les champs sont nécessaires." }, 400);
        }

        const existingUsername = getUserByUsername(username);

        if (existingUsername) {
            return sendErrors(res, { username: "Nom d'utilisateur déjà pris." }, 400);
        }

        const existingEmail = getUserByEmail(email);

        if (existingEmail) {
            return sendErrors(res, { email: "Email déjà pris." }, 400);
        }

        if (password !== confirmPassword) {
            return sendErrors(res, { password: "Les mots de passe ne correspondent pas." }, 400);
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        createUser(username, email, hashedPassword, town, promo);

        return res.status(201).json({ message: "Inscription réussie !" });
    } catch (err) {
        return catchError(res, err);
    }
}

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

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "1h" });

        res.cookie("token", token, {
            httpOnly: true,
            secure: false, // Mettre true en prod
            sameSite: "lax",
        });

        const { password: passwordUser, ...safeUser } = user;

        return res.status(200).json({ message: "Connexion réussie !", user: safeUser });
    } catch (err) {
        return catchError(res, err);
    }
}

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

export function updateUser(req, res) {
    try {
    } catch (err) {
        return catchError(res, err);
    }
}

export function deleteUser(req, res) {
    try {
    } catch (err) {
        return catchError(res, err);
    }
}
