import {
    getUsers,
} from "../controllers/userController.mjs"
import express from "express";


const router = express.router();

router.get("/all", getUsers);


export default routeur;