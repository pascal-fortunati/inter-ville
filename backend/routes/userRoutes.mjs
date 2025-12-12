import {
    getUsers,
    register,
    login,
    getUser
} from "../controllers/userController.mjs"
import express from "express";


const router = express.Router();

router.get("/get/all", getUsers);
router.post("/register", register);
router.post("/login", login);
router.get("/get/:id", getUser);


export default router;