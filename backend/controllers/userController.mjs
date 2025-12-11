import { getAllUsers, getUserById, getUserByEmail, getUserByUsername, createUser } from "../models/userModel.mjs";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.PRIVATE_JWT_KEY;

const sendErrors = (res, errors, status = 400) => {
    return res.status(status).json({ errors });
};

function catchError(res, err) {
    if (err.name === "SequelizeValidationError") {
        const errors = err.errors.map((e) => ({
            field: e.path,
            message: e.message,
        }));
        return sendErrors(res, errors, 400);
    }
    return sendErrors(res, [{ field: "global", message: err.message }], 500);
}


export function getUsers(req, res) {
    try {
        const users = getAllUsers();
        res.status(200).json(users)
    } catch (err) {
        return catchError(res, err)
    }
}

export async function register(req, res) {
    try {
        const { username, email, password, confirmPassword, town, promo } = req.body;

        if (!username || !email || !password || !confirmPassword || !town || !promo) {
            return sendErrors(res, [{ field: "global", message: "Tout les champs sont nécessaires" }], 400)
        }

        const existingUsername = getUserByUsername(username);

        if (existingUsername) {
            return sendErrors(res, [{ field: "username", message: "Nom d'utilisateur déja pris" }], 400)
        }

        const existingEmail = getUserByEmail(email);

        if (existingEmail) {
            return sendErrors(res, [{ field: "email", message: "Email déja pris" }], 400)
        }

        if (password !== confirmPassword) {
            return sendErrors(res, [{ field: "password", message: "Les mots de passe ne correspondent pas" }], 400)
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = createUser(username, email, hashedPassword, town, promo);

        return res.status(201).json({ message: "Inscription réussie !", })
    } catch (err) {
        return catchError(res, err)
    }
}

export async function login(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return sendErrors(res, [{ field: "global", message: "Tout les champs sont nécessaires" }], 400)
        }

        const user = getUserByEmail(email);


        if (!user) {
            return sendErrors(res, [{ field: "global", message: "Email ou mot de passe incorrect" }], 401)
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return sendErrors(res, [{ field: "global", message: "Email ou mot de passe incorrect." }], 401);
        }

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });

        res.cookie("token", token, {
            httpOnly: true,
            secure: false, // mettre true en prod 
            sameSite: "lax"
        });

        const data = {
            id: user.id,
            username: user.username,
            email: user.email,
            town: user.town,
            promo: user.promo,
            role: user.role,
            avatar: user.avatar || null,
            is_verified: user.is_verified,
            created_at: user.created_at
        }
        return res.status(200).json({ message: "Connexion réussie !", user: data });


    } catch (err) {
        return catchError(res, err)
    }
}

export function getUserById() {
    
}