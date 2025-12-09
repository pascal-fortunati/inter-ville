import {
    getUsers,
} from "../controllers/userController.mjs"
import express from "express";


const router = express.Router();

router.get("/all", getUsers);


export default router;