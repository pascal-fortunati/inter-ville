import {
    getMessagesByChannel,
    updateMessage,
    removeMessage,
    createMessage
} from "../controllers/messagesController.mjs"
import express from "express"

const router = express.Router();

router.post("/add/:id", createMessage);
router.get("/all/:id/:offset", getMessagesByChannel);
router.put("/update/:id", updateMessage);
router.delete("/delete/:id", removeMessage);

export default router