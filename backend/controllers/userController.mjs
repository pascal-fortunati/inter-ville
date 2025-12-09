import { getAllUsers } from "../models/userModel.mjs";

const sendErrors = (res, errors, status = 400) => {
    return res.status(status).json({ errors });
};

function catchError(res, err) {
    if (err.name === "SequelizeValidationError") {
        const errors = err.errors.map((e) => ({
            field: e.path,
            message: e.message,
        }));
        return sendErrors(res, errors, 400);
    }
    return sendErrors(res, [{ field: "global", message: err.message }], 500);
}


export function getUsers(req, res) {
    try {
        const users = getAllUsers();
        res.status(200).json(users)
    } catch (err) {
        return catchError(res,err)
    }
}

export async function register(req,res) {
    try{

    } catch(err){
        return catchError(res,err)
    }
}

export async function login(req,res) {
    try{

    } catch(err){
        return catchError(res,err)
    }
}