import express, { NextFunction, Request, Response } from "express"
import { connectDB } from "./utils/feature.js";
import { errorMiddleWare } from "./middlewares/error.js";
import NodeCache from "node-cache";
import {config} from "dotenv"
import morgan from "morgan";
import Stripe from "stripe";

// importing Routes
import userRoute from "./routes/user.js"
import productRoute from "./routes/product.js"
import orderRoute from "./routes/order.js"
import paymentRoute from "./routes/payment.js"
import dashboardRoute from "./routes/stats.js"
import cors from "cors"

config({
    path:"./.env"
})


const port = process.env.PORT || 4000;

const mongoURI = process.env.MONGO_URI || "";

const stripeKey = process.env.STRIPE_KEY || "";

connectDB(mongoURI);

export const stripe= new Stripe(stripeKey);

export const myCache= new NodeCache();

const app = express();

app.use(express.json())

app.use(morgan("dev"))

app.use(cors())

app.get("/", (req,res,next)=>{
    res.send("Working yes")
})

// using Routes
app.use("/api/vi/user", userRoute);

app.use("/api/vi/product",productRoute);

app.use("/api/vi/order",orderRoute);

app.use("/api/vi/payment",paymentRoute);

app.use("/api/vi/dashboard",dashboardRoute);

app.use("/uploads",express.static("uploads"))

app.use(errorMiddleWare);

app.listen(port, () => {
    console.log(`server is working at http://localhost:${port}`)
})
