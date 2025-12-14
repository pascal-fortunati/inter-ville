// Contrôleur Chat public
// - getMessages: liste les messages du canal général
// - postMessage: ajoute un message et diffuse via Socket.io
import { listGeneralMessages, addGeneralMessage } from "../models/chatModel.mjs";
// GET /messages - Récupère les messages du canal général
export function getMessages(req, res) {
  try {
    const rows = listGeneralMessages();
    return res.status(200).json(rows);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
// POST /messages - Ajoute un message au canal général et diffuse via Socket.io
export function postMessage(io) {
  return (req, res) => {
    try {
      const userId = req.userId;
      const text = (req.body?.text || "").trim();
      if (!text) return res.status(400).json({ message: "Contenu requis" });
      if (text.length > 500) return res.status(400).json({ message: "Contenu trop long" });
      const id = addGeneralMessage(userId, text);
      const payload = { id, text, user_id: userId };
      io?.emit('message:receive', payload);
      return res.status(201).json(payload);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  };
}
