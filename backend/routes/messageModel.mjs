import {
    getMessagesByChannel,
    updateMessage,
    removeMessage,
    createMessage
} from "../controllers/messagesController.mjs"
import { isLoggedInJWT } from "../middlewares/isLoggedInJwt.mjs";
import express from "express"

const router = express.Router();

router.post("/add/:id", isLoggedInJWT(), createMessage);
router.get("/all/:id/:offset", isLoggedInJWT(), getMessagesByChannel);
router.put("/update/:id", isLoggedInJWT(), updateMessage);
router.delete("/delete/:id", isLoggedInJWT(), removeMessage);

export default router