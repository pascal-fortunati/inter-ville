import {
    createChan,
    updateChan,
    deleteChan,
    addUserToChan,
    removeUserFromChan,
    changeUserRoleOnChan
} from "../controllers/channelsController.mjs";
import isLoggedInJWT from "../middlewares/isLoggedInJwt.mjs"
import express from "express";

const router = express.Router();

router.post("/create", isLoggedInJWT(), createChan);
router.put("/update/:channelId", isLoggedInJWT(), updateChan);
router.delete("/delete/:channelId", isLoggedInJWT(), deleteChan);

router.post("/add/user/:channelId/:userId", isLoggedInJWT(), addUserToChan);
router.delete("/delete/user/:channelId/:userId", isLoggedInJWT(), removeUserFromChan);
router.put("/update/user/:channelId/:userId", isLoggedInJWT(), changeUserRoleOnChan);

export default router;
