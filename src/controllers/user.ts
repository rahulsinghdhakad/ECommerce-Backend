import { NextFunction, Request, Response } from "express";
import { User } from "../models/user.js";
import { NewUserRequestBody } from "../types/types.js";
import { TryCatch } from "../middlewares/error.js";
import ErrorHandler from "../utils/utility-classes.js";

export const newUser = TryCatch(
    async (req: Request, res: Response, next: NextFunction) => 
    {
        const { _id, name, email, photo, gender, dob } = req.body;
        let user = await User.findById(_id);
        if(user){
            return res.status(201).json({
                success: true,
                message: `welcome back, ${user.name}`
            })
        }  
        if(!_id|| !name||!email||!photo||!gender||!dob) return next(new Error("fill all field"));
        
        user = await User.create({ _id, name, email, photo, gender, dob:new Date(dob) })

        return res.status(201).json({
            success: true,
            message: `welcome ${user.name}`
        })
    }
)

export const getAllUsers=TryCatch(async(req,res,next)=>{
    const users=await User.find({});

    return res.status(200).json({
        success:true,
        users,
    });
});

export const getUser=TryCatch(async(req,res,next)=>{
    const id=req.params.id;

    const user=await User.findById(id);

    if(user){
    return res.status(200).json({
        success:true,
        user,
    });
    }
    else return next(new ErrorHandler("no user found",400))
});

export const deleteUser=TryCatch(async(req,res,next)=>{
    const id=req.params.id;

    const user=await User.findById(id);

    if(!user) return next(new ErrorHandler(`no user found with id ${id}`,400))

    await user.deleteOne();

    return res.status(200).json({
        success:true,
        message:"user deleted",
    });
});