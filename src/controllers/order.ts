import { Request } from "express";
import { TryCatch } from "../middlewares/error.js";
import { NewOrderRequestBody } from "../types/types.js";
import { Order } from "../models/order.js";
import { invalidateCache, reduceStock } from "../utils/feature.js";
import ErrorHandler from "../utils/utility-classes.js";
import { myCache } from "../app.js";

export const myOrders = TryCatch(
    async (req, res, next) => {
        const { id: user } = req.query;

        const key = `my-orders-${user}`;

        let orders;

        if (myCache.has(key)) {
            orders = JSON.parse(myCache.get(key)!);
        }
        else {
            orders = await Order.find({ user });
            myCache.set(key, JSON.stringify(orders));
        }

        res.status(200).json({
            success: true,
            orders,
        })
    }
)

export const getAllOrders = TryCatch(
    async (req, res, next) => {
        const key = "all-orders";
        let orders;

        if (myCache.has(key)) {
            orders = JSON.parse(myCache.get(key)!);
        }
        else {
            orders = await Order.find({}).populate("user", "name");
            myCache.set(key, JSON.stringify(orders));
        }

        res.status(200).json({
            success: true,
            orders,
        })
    }
)

export const getSingleOrder = TryCatch(
    async (req, res, next) => {
        const id = req.params.id;

        const key = `order-${id}`;
        let order;

        if (myCache.has(key)) {
            order = JSON.parse(myCache.get(key)!);
        }
        else {
            order = await Order.findById(id).populate("user", "name");
            if (!order) return next(new ErrorHandler("order not fount", 404));
            myCache.set(key, JSON.stringify(order));
        }

        res.status(200).json({
            success: true,
            order,
        })
    }
)

export const newOrder = TryCatch(
    async (req: Request<{}, {}, NewOrderRequestBody>, res, next) => {
        const { shippingInfo,
            user,
            subTotal,
            tax,
            shippingCharges,
            discount,
            total,
            orderItems,
        } = req.body;

        if (
            !shippingInfo ||
            !user ||
            !subTotal ||
            !total ||
            !orderItems
        ) return next(new ErrorHandler("provide all field", 400));

        const order= await Order.create({
            shippingInfo,
            user,
            subTotal,
            tax,
            shippingCharges,
            discount,
            total,
            orderItems,
        });

        await reduceStock(orderItems);

        invalidateCache({
            product: true,
            order: true,
            admin: true,
            userID: order.user,
            orderID: String(order._id),
            productID: order.orderItems.map(i=>String(i.productID)),
        });

        res.status(200).json({
            success: true,
            message: "order Placed successfully"
        })
    }
)

export const updateOrder = TryCatch(
    async (req, res, next) => {
        const id = req.params.id;

        const order = await Order.findById(id);

        if (!order) return next(new ErrorHandler("cannot find order", 404));

        switch (order.status) {
            case "Processing":
                order.status = "Shipped";
                break;
            case "Shipped":
                order.status = "Delivered";
                break;
            default:
                order.status = "Delivered";
                break;
        }

        await order.save();

        invalidateCache({
            product: false,
            order: true,
            admin: true,
            userID: order.user,
            orderID: String(order._id)
        });


        res.status(200).json({
            success: true,
            message: "order update successfully",
        })
    }
)

export const deleteOrder = TryCatch(
    async (req, res, next) => {
        const id = req.params.id;

        const order = await Order.findById(id);

        if (!order) return next(new ErrorHandler("cannot find order", 404));

        invalidateCache({
            product: false,
            order: true,
            admin: true,
            userID: order.user,
            orderID: String(order._id)
        });

        await order.deleteOne();

        res.status(200).json({
            success: true,
            message: "order deleted successfully"
        })
    }
)