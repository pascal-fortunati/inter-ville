import {
    addMessage,
    deleteMessage,
    getAllMessagesByChannelId,
    updateMessageById,
} from "../models/messageModel.mjs";

const sendErrors = (res, errors, status = 400) => {
    return res.status(status).json({ errors });
};

function catchError(res, err) {
    return sendErrors(res, { global: err.message }, 500);
}

export function createMessage(req, res) {
    try {
        const userId = req.user.id;
        const { content } = req.body;
        const channelId = Number(req.params.id);

        if (!content || !channelId) {
            return sendErrors(res, { global: "Tous les champs sont obligatoires." }, 400);
        }

        if (!content.trim()) {
            return sendErrors(res, { global: "Le message ne peut pas être vide." }, 400);
        }

        const created = addMessage(userId, content.trim(), channelId);

        return res.status(201).json({ message: "Message envoyé avec succès !" });
    } catch (err) {
        return catchError(res, err);
    }
}

export function getMessagesByChannel(req, res) {
    try {
        const channelId = Number(req.params.id);
        const offset = Number(req.params.offset);

        if (!channelId) {
            return sendErrors(res, { global: "channelId est obligatoire." }, 400);
        }

        const messages = getAllMessagesByChannelId(channelId, offset);

        return res.status(200).json(messages);
    } catch (err) {
        return catchError(res, err);
    }
}

export function updateMessage(req, res) {
    try {
        const userId = req.user.id;
        const messageId = Number(req.params.id);
        const { content } = req.body;

        if (!messageId || !content) {
            return sendErrors(res, { global: "Tous les champs sont obligatoires." }, 400);
        }

        if (!content.trim()) {
            return sendErrors(res, { global: "Le message ne peut pas être vide." }, 400);
        }

        const updated = updateMessageById(content.trim(), messageId, userId);

        return res.status(200).json({ message: "Message modifié avec succès !" });
    } catch (err) {
        return catchError(res, err);
    }
}

export function removeMessage(req, res) {
    try {
        const userId = req.user.id;
        const messageId = Number(req.params.id);

        if (!messageId) {
            return sendErrors(res, { global: "messageId est obligatoire." }, 400);
        }

        const deleted = deleteMessage(messageId, userId);

        return res.status(200).json({ message: "Message supprimé avec succès !" });
    } catch (err) {
        return catchError(res, err);
    }
}
