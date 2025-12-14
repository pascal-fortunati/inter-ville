// Routes Chat public
// - GET messages, POST message (protégé)
import express from "express";
import { isLoggedInJWT } from "../middlewares/isLoggedInJwt.mjs";
import { getMessages, postMessage } from "../controllers/chatController.mjs";
// Initialisation du routeur
const routerFactory = (io) => {
  const router = express.Router();
  router.get('/chat/messages', getMessages);
  router.post('/chat/messages', isLoggedInJWT(), postMessage(io));
  return router;
};

export default routerFactory;
