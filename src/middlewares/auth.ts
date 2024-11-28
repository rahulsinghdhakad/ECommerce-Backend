import { User } from "../models/user.js";
import ErrorHandler from "../utils/utility-classes.js";
import { TryCatch } from "./error.js";

export const adminOnly=TryCatch(
    async (req,res,next)=>{
        const {id}=req.query;

        const user=await User.findById(id);

        if(!user) return next(new ErrorHandler("login kar le",401));

        if(user.role!="admin") return next(new ErrorHandler("not admin",402));

        next();
    }
);