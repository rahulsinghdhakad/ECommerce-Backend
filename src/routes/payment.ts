import express from "express"
import { adminOnly } from "../middlewares/auth.js";
import { allCoupons, applyDiscount, createPaymentIntent, deleteCoupon, newCoupon } from "../controllers/payment.js";

const app = express.Router();

// route /api/vi/payment/create
app.post("/create",createPaymentIntent);

// route /api/vi/payment/discount
app.get("/discount", applyDiscount);

// route /api/vi/payment/coupon/new
app.post("/coupon/new",adminOnly, newCoupon);

// route /api/vi/payment/coupon/all
app.get("/coupon/all",adminOnly, allCoupons);

// route /api/vi/payment/coupon/all
app.delete("/coupon/:id",adminOnly, deleteCoupon);

export default app;