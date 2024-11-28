import { NextFunction, Request, Response } from "express"
import ErrorHandler from "../utils/utility-classes.js";
import { ControllerType } from "../types/types.js";

export const errorMiddleWare = (err: ErrorHandler, req: Request, res: Response, next: NextFunction) => {
    err.message ||= "server error";
    err.statusCode ||= 500;

    if(err.name==="CastError") err.message="invalid ID"
    res.status(err.statusCode).json({
        success: false,
        message: err.message,
    });
    return ;
}

export const TryCatch =
    (func: ControllerType) =>
    (req:Request,res:Response,next:NextFunction)=> { 
        Promise.resolve(func(req,res,next)).catch(next);
    };

