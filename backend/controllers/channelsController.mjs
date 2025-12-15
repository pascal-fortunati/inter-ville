import {
    createChannel,
    updateChannel,
    addUserToChannel,
    deleteChannel,
    removeUserFromChannel,
    changeUserRoleOnChannel,
    getAllChannel,
    getAllUsersFromChannelId
} from "../models/channelModel.mjs";


const sendErrors = (res, errors, status = 400) => {
    return res.status(status).json({ errors });
};

function catchError(res, err) {
    return sendErrors(res, { global: err.message }, 500);
}

export function createChan(req, res) {
    try {
        const userId = req.user.id;
        const { name, type } = req.body;

        if (!name || !type) {
            return sendErrors(res, { global: "Tous les champs sont obligatoires." }, 400);
        }

        const created = createChannel(name, userId, type);

        if (!created) {
            return sendErrors(res, { global: "Impossible de créer le channel." }, 500);
        }

        return res.status(201).json({ message: "Channel créé avec succès !" });
    } catch (err) {
        return catchError(res, err);
    }
}

export function updateChan(req, res) {
    try {
        const ownerId = req.user.id;
        const channelId = Number(req.params.channelId);
        const { name, type } = req.body;

        if (!channelId || !name || !type) {
            return sendErrors(res, { global: "Tous les champs sont obligatoires." }, 400);
        }

        const updated = updateChannel(channelId, name, ownerId, type);

        if (updated === 0) {
            return sendErrors(
                res,
                { global: "Channel introuvable ou vous n'avez pas l'autorisation." },
                404
            );
        }

        return res.status(200).json({ message: "Channel mis à jour avec succès !" });
    } catch (err) {
        return catchError(res, err);
    }
}

export function deleteChan(req, res) {
    try {
        const ownerId = req.user.id;
        const channelId = Number(req.params.channelId);

        if (!channelId) {
            return sendErrors(res, { global: "Le channelId est obligatoire." }, 400);
        }

        const deleted = deleteChannel(channelId, ownerId);

        if (deleted === 0) {
            return sendErrors(
                res,
                { global: "Channel introuvable ou vous n'avez pas l'autorisation." },
                404
            );
        }

        return res.status(200).json({ message: "Channel supprimé avec succès !" });
    } catch (err) {
        return catchError(res, err);
    }
}

export function addUserToChan(req, res) {
    try {
        const channelId = Number(req.params.channelId);
        const userId = Number(req.params.userId);

        if (!channelId || !userId) {
            return sendErrors(res, { global: "Tous les champs sont obligatoires." }, 400);
        }

        const added = addUserToChannel(userId, channelId);

        if (added === 0) {
            return sendErrors(res, { global: "Impossible d'ajouter l'utilisateur." }, 400);
        }

        return res.status(200).json({ message: "Utilisateur ajouté avec succès !" });
    } catch (err) {
        return catchError(res, err);
    }
}

export function removeUserFromChan(req, res) {
    try {
        const channelId = Number(req.params.channelId);
        const userId = Number(req.params.userId);

        if (!channelId || !userId) {
            return sendErrors(res, { global: "Tous les champs sont obligatoires." }, 400);
        }

        const removed = removeUserFromChannel(userId, channelId);

        if (removed === 0) {
            return sendErrors(res, { global: "Impossible de supprimer l'utilisateur." }, 400);
        }

        return res.status(200).json({ message: "Utilisateur supprimé avec succès !" });
    } catch (err) {
        return catchError(res, err);
    }
}

export function changeUserRoleOnChan(req, res) {
    try {
        const channelId = Number(req.params.channelId);
        const userId = Number(req.params.userId);
        const { role } = req.body;

        if (!channelId || !userId || !role) {
            return sendErrors(res, { global: "Tous les champs sont obligatoires." }, 400);
        }

        const changed = changeUserRoleOnChannel(userId, channelId, role);

        if (changed === 0) {
            return sendErrors(
                res,
                { global: "Impossible de changer le rôle (introuvable ou non autorisé)." },
                404
            );
        }

        return res.status(200).json({ message: "Rôle changé avec succès !" });
    } catch (err) {
        return catchError(res, err);
    }
}

export function getAllChan(req, res) {
    try {
        const channels = getAllChannel();

        if (!channels) {
            return sendErrors(res, { global: "Aucun channels pour le moment" }, 400)
        }


        return res.status(200).json(channels);
    } catch (err) {
        return catchError(res, err)
    }
}

export function getAllUsersFromChannel(req, res) {
    try {
        const channelId = req.params.channelId;

        if (!channelId) {
            return sendErrors(res, { global: "Id obligatoire" }, 400);
        }

        const users = getAllUsersFromChannelId(channelId);

        if (!users) {
            return sendErrors(res, { global: "Aucun utilisateur" }, 400)
        }

        return res.status(200).json(users);
    } catch (err) {
        return catchError(res, err)
    }
}