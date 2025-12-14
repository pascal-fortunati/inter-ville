// Routes Messages directs (factory)
// - GET/POST messages entre deux utilisateurs
import express from "express";
import { isLoggedInJWT } from "../middlewares/isLoggedInJwt.mjs";
import { getDirectMessages, postDirectMessage } from "../controllers/directController.mjs";
// Initialisation du routeur
const routerFactory = (io) => {
  const router = express.Router();
  router.get('/chat/direct/:userId/messages', isLoggedInJWT(), getDirectMessages);
  router.post('/chat/direct/:userId/messages', isLoggedInJWT(), postDirectMessage(io));
  return router;
};

export default routerFactory;
