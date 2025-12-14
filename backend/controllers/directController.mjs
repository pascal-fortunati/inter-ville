// Contrôleur Messages directs
// - getDirectMessages: récupère le fil entre deux utilisateurs
// - postDirectMessage: envoie un DM et émet 'dm:receive'
import { getOrCreateDirectChannel, listDirectMessages, addDirectMessage } from "../models/directModel.mjs";
// GET /direct/:userId/messages
export function getDirectMessages(req, res) {
  try {
    const otherId = Number(req.params.userId);
    const me = req.userId;
    const channelId = getOrCreateDirectChannel(me, otherId);
    const rows = listDirectMessages(channelId);
    return res.status(200).json({ channelId, messages: rows });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
// POST /direct/:userId/messages
export function postDirectMessage(io) {
  return (req, res) => {
    try {
      const otherId = Number(req.params.userId);
      const me = req.userId;
      const channelId = getOrCreateDirectChannel(me, otherId);
      const text = (req.body?.text || "").trim();
      if (!text) return res.status(400).json({ message: "Contenu requis" });
      const id = addDirectMessage(channelId, me, text);
      const payload = { id, text, channelId, fromUserId: me, toUserId: otherId };
      io?.emit('dm:receive', payload);
      return res.status(201).json(payload);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  };
}
