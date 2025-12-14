// Routes Likes
// - POST/DELETE /likes
// - compte des likes sur challenge/comment
// - vérifie si un utilisateur a liké une cible
import express from "express";
import { isLoggedInJWT } from "../middlewares/isLoggedInJwt.mjs";
import { postLike, deleteLike, getChallengeLikes, getCommentLikes, getUserLiked } from "../controllers/likesController.mjs";
// Initialisation du routeur
const routerFactory = (io) => {
  const router = express.Router();
  router.post("/likes", isLoggedInJWT(), postLike(io));
  router.delete("/likes/:id", isLoggedInJWT(), deleteLike(io));
  router.get("/challenges/:id/likes", getChallengeLikes);
  router.get("/comments/:id/likes", getCommentLikes);
  router.get("/likes/user/:userId", isLoggedInJWT(), getUserLiked);
  return router;
};

export default routerFactory;
