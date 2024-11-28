import mongoose from "mongoose";

const schema= new  mongoose.Schema({
    code:{
        type:String,
        required:[true,"please enter coupen code"],
        unique:true,
    },
    amount:{
        type:Number,
        required:[true,"please enter coupen amount"],
    }
});

export const Coupon= mongoose.model("Coupon",schema)