import { getAllUsers } from "../models/userModel.mjs";

export function getUsers(req,res){
    try{
        const users = getAllUsers();
        res.status(200).json(users)
    } catch(err){
        return res.status(500).json(err);
    }
}