import {
    getUsers,
    register,
    login,
} from "../controllers/userController.mjs"
import express from "express";


const router = express.Router();

router.get("/all", getUsers);
router.post("/register", register);
router.post("/login", login)


export default router;