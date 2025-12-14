// Contrôleur Participations
// - postParticipation: inscrit un utilisateur à un challenge
// - getParticipationCount: renvoie le nombre d'inscrits
// - getParticipationsForChallenge: liste (admin) les participations
// - updateParticipationStatus: modère une participation
import { addParticipation, countParticipations, hasParticipation, listParticipationsByChallenge, updateParticipationStatus as updStatus, getParticipationById, getParticipationByChallengeUser, updateParticipationProofByChallengeUser } from "../models/participationModel.mjs";
// - getParticipationStatus: renvoie le statut de participation de l'utilisateur courant
export function postParticipation(req, res) {
  try {
    const challengeId = Number(req.params.id);
    const userId = req.userId;
    const user = req.user;
    if (!user?.is_verified || !user?.is_email_verified) {
      return res.status(403).json({ message: 'Compte non validé par admin' });
    }
    if (hasParticipation(challengeId, userId)) {
      return res.status(409).json({ message: 'Déjà inscrit' });
    }
    const proofUrl = req.body?.proofUrl || null;
    const id = addParticipation(challengeId, userId, proofUrl);
    const count = countParticipations(challengeId);
    const io = req.app?.get('io');
    io?.emit('participation:new', { challengeId, count, userId });
    return res.status(201).json({ id, count });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
// - getParticipationCount: renvoie le nombre d'inscrits
export function getParticipationCount(req, res) {
  try {
    const challengeId = Number(req.params.id);
    const count = countParticipations(challengeId);
    return res.status(200).json({ count });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
// - getParticipationsForChallenge: liste (admin) les participations
export function getParticipationsForChallenge(req, res) {
  try {
    const challengeId = Number(req.params.id);
    const rows = listParticipationsByChallenge(challengeId);
    return res.status(200).json(rows);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
// - updateParticipationStatus: modère une participation
export function updateParticipationStatus(req, res) {
  try {
    const id = Number(req.params.id);
    const status = String(req.body?.status || "").trim();
    if (!id || !["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Paramètres invalides" });
    }
    const exists = getParticipationById(id);
    if (!exists) return res.status(404).json({ message: "Participation introuvable" });
    const changes = updStatus(id, status);
    if (!changes) return res.status(400).json({ message: "Aucune modification" });
    try {
      const count = countParticipations(exists.challenge_id);
      const io = req.app?.get('io');
      io?.emit('participation:updated', { challengeId: exists.challenge_id, approvedCount: count });
    } catch { }
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
// - getParticipationStatus: renvoie le statut de participation de l'utilisateur courant
export function getParticipationStatus(req, res) {
  try {
    const challengeId = Number(req.params.id);
    const userId = req.userId;
    const row = getParticipationByChallengeUser(challengeId, userId);
    return res.status(200).json({ joined: !!row, proof_url: row?.proof_url || null, status: row?.status || 'pending' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
// - putMyParticipationProof: met à jour la preuve de participation de l'utilisateur courant
export function putMyParticipationProof(req, res) {
  try {
    const challengeId = Number(req.params.id);
    const userId = req.userId;
    const proofUrlRaw = req.body?.proofUrl || null;
    const proofUrl = proofUrlRaw ? String(proofUrlRaw).trim() : null;
    if (proofUrl && proofUrl.length > 2048) {
      return res.status(400).json({ message: 'URL trop longue' });
    }
    const row = getParticipationByChallengeUser(challengeId, userId);
    if (!row) return res.status(404).json({ message: 'Non inscrit' });
    const changes = updateParticipationProofByChallengeUser(challengeId, userId, proofUrl);
    if (!changes) return res.status(200).json({ ok: true, proof_url: row.proof_url || null });
    const updated = getParticipationByChallengeUser(challengeId, userId);
    const io = req.app?.get('io');
    io?.emit('participation:updated', { challengeId, userId, proof_url: updated?.proof_url || null });
    return res.status(200).json({ ok: true, proof_url: updated?.proof_url || null });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
