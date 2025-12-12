import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import express from "express";
import "./config/database.mjs"
import userRoutes from "./routes/userRoutes.mjs"

dotenv.config();

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: "http://localhost:5173", // Mettre le "serveur react"
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

//routes global 

app.use("/users",userRoutes);




//lancement du serveur
async function main() {
    try {
        app.listen(process.env.PORT, () => {
            console.log(`Serveur lancé sur le port : ${process.env.PORT}`);
        })
    } catch (err) {
        console.error(err)
    }
}

main();