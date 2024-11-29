import { disconnect } from "process";
import { myCache } from "../app.js";
import { TryCatch } from "../middlewares/error.js";
import { Order } from "../models/order.js";
import { Product } from "../models/product.js";
import { User } from "../models/user.js";
import {  getCategories, getMonthlyCount, percentage } from "../utils/feature.js";

export const getDashboardStats = TryCatch(
    async (req, res, next) => {
        let stats;
        const key="admin-stats"

        if (myCache.has(key)) {
            stats = JSON.parse(myCache.get(key)!);
        }
        else {
            const today = new Date();
            const sixMonthAgo = new Date();
            sixMonthAgo.setMonth(today.getMonth() - 6);

            const thisMonth = {
                start: new Date(today.getFullYear(), today.getMonth(), 1),
                end: today
            }

            const lastMonth = {
                start: new Date(today.getFullYear(), today.getMonth() - 1, 1),
                end: new Date(today.getFullYear(), today.getMonth(), 0),
            }

            const thisMonthProductPromise = Product.find({
                createdAt: {
                    $gte: thisMonth.start,
                    $lte: thisMonth.end,
                }
            })

            const lastMonthProductPromise = Product.find({
                createdAt: {
                    $gte: lastMonth.start,
                    $lte: lastMonth.end,
                }
            })
            const thisMonthUserPromise = User.find({
                createdAt: {
                    $gte: thisMonth.start,
                    $lte: thisMonth.end,
                }
            })

            const lastMonthUserPromise = User.find({
                createdAt: {
                    $gte: lastMonth.start,
                    $lte: lastMonth.end,
                }
            })
            const thisMonthOrderPromise = Order.find({
                createdAt: {
                    $gte: thisMonth.start,
                    $lte: thisMonth.end,
                }
            })

            const lastMonthOrderPromise = Order.find({
                createdAt: {
                    $gte: lastMonth.start,
                    $lte: lastMonth.end,
                }
            })

            const lastSixMonthOrderPromise = Order.find({
                createdAt: {
                    $gte: sixMonthAgo,
                    $lte: today,
                }
            })


            const latestTransactionPromise = Order.find({}).select(["discount", "total", "status", "orderItems"]).limit(4);


            const [
                thisMonthProduct,
                thisMonthUser,
                thisMonthOrder,
                lastMonthProduct,
                lastMonthUser,
                lastMonthOrder,
                productCount,
                userCount,
                allOrders,
                lastSixMonthOrder,
                categories,
                femaleUserCount,
                latestTransaction,
            ] = await Promise.all([

                thisMonthProductPromise,
                thisMonthUserPromise,
                thisMonthOrderPromise,
                lastMonthProductPromise,
                lastMonthUserPromise,
                lastMonthOrderPromise,
                Product.countDocuments(),
                User.countDocuments(),
                Order.find({}).select("total"),
                lastSixMonthOrderPromise,
                Product.distinct("category"),
                User.countDocuments({ gender: "female" }),
                latestTransactionPromise,
            ]);

            const thisMonthRevenue = thisMonthOrder.reduce((total, order) => total += order.total, 0);
            const lastMonthRevenue = lastMonthOrder.reduce((total, order) => total += order.total, 0);

            const changePercentage = {
                revenue: percentage(thisMonthRevenue, lastMonthRevenue),
                product: percentage(thisMonthProduct.length, lastMonthProduct.length),
                user: percentage(thisMonthUser.length, lastMonthUser.length),
                order: percentage(thisMonthOrder.length, lastMonthOrder.length),
            }

            const totalRevenue = allOrders.reduce((total, order) => total += order.total, 0)

            const count = {
                revenue: totalRevenue,
                product: productCount,
                user: userCount,
                order: allOrders.length,
            }

            const monthlyRevenue = Array(6).fill(0);
            const monthlyOrderCount = Array(6).fill(0);

            lastSixMonthOrder.forEach((i: any) => {
                const creationMonth = i.createdAt.getMonth();
                const monthdiff = (today.getMonth() - creationMonth + 12) % 12;

                if (monthdiff < 6) {
                    const monthIndex = 5 - monthdiff;

                    monthlyRevenue[monthIndex] += i.total;
                    monthlyOrderCount[monthIndex] += 1;
                }
            })

            const categoryAndCount = await getCategories(categories, productCount);

            const UserRation = {
                male: userCount - femaleUserCount,
                female: femaleUserCount,
            }

            let newLatestTransaction = latestTransaction.map((i) => ({
                _id: i._id,
                status: i.status,
                total: i.total,
                disconnect: i.discount,
                orderItems: i.orderItems.length,
            }))

            stats = {
                categoryCount: categoryAndCount,
                changePercentage,
                count,
                chart: {
                    revenue: monthlyRevenue,
                    order: monthlyOrderCount,
                },
                UserRation,
                latestTransaction: newLatestTransaction,
            }

            myCache.set(key, JSON.stringify(stats));
        }

        res.status(200).json({
            success: true,
            stats,
        })
    }
)
export const getPieCharts = TryCatch(
    async (req, res, next) => {
        let charts;
        const key="admin-charts";

        if (myCache.has(key)) {
            charts = JSON.parse(myCache.get(key)!);
        }
        else {

            const [
                processingOrder,
                shippedOrder,
                deliveredOrder,
                categories,
                productCount,
                outStock,
                allOrders,
                allUsers,
                adminUsers,
                customerUsers,
            ] = await Promise.all([
                Order.countDocuments({ status: "Processing" }),
                Order.countDocuments({ status: "Shipped" }),
                Order.countDocuments({ status: "Delivered" }),
                Product.distinct("category"),
                Product.countDocuments(),
                Product.countDocuments({ stock: 0 }),
                Order.find({}).select(["subTotal", "tax", "shippingCharges", "discount", "total"]),
                User.find({}).select("dob"),
                User.countDocuments({ role: "admin" }),
                User.countDocuments({ role: "user" }),
            ])

            const status = {
                processing: processingOrder,
                shipped: shippedOrder,
                delivered: deliveredOrder,
            }

            const categoryCount = await getCategories(categories, productCount);

            const stockAvailability = {
                inStock: productCount - outStock,
                outStock,
            }

            const grossRevenue = allOrders.reduce((prev, order) => (prev + order.total || 0), 0)

            const discount = allOrders.reduce((prev, order) => (prev + order.discount || 0), 0)

            const burnt = allOrders.reduce((prev, order) => (prev + order.tax || 0), 0)

            const productionCost = allOrders.reduce((prev, order) => (prev + order.shippingCharges || 0), 0)

            const marketingCost = Math.round(grossRevenue * 0.3
            )
            const netMargin = grossRevenue - discount - burnt - marketingCost;

            const revenueDistibution = {
                productionCost,
                discount,
                burnt,
                marketingCost,
                netMargin,
            }

            const userAgeGroup = {
                teen: allUsers.filter(i => i.age < 20).length,
                adult: allUsers.filter(i => i.age >= 20 && i.age < 40).length,
                old: allUsers.filter(i => i.age >= 40).length,
            }

            const AdminCustomer = {
                admin: adminUsers,
                customer: customerUsers,
            }

            charts = {
                status,
                categoryCount,
                stockAvailability,
                revenueDistibution,
                userAgeGroup,
                AdminCustomer,
            }

            myCache.set(key, JSON.stringify(charts));
        }

        res.status(200).json({
            success: true,
            charts,
        })
    }
)
export const getBarCharts = TryCatch(
    async (req,res,next) => {
        let charts;
        const key="admin-bar-charts";

        if(myCache.has(key)){
            charts= JSON.parse(myCache.get(key)!);
        }
        else{
            const today = new Date();

            const sixMonthAgo = new Date();
            sixMonthAgo.setMonth(today.getMonth() - 6);

            const twelveMonthAgo = new Date();
            twelveMonthAgo.setMonth(today.getMonth() - 12);

            const productPromise= Product.find({createdAt:{
                $gte:sixMonthAgo,
                $lte:today,
            }}).select("createdAt");

            const userPromise= User.find({createdAt:{
                $gte:sixMonthAgo,
                $lte:today,
            }}).select("createdAt");

            const orderPromise= Order.find({createdAt:{
                $gte:twelveMonthAgo,
                $lte:today,
            }}).select("createdAt");

            const [
                product,
                user,
                order,
            ]= await Promise.all([
                productPromise,
                userPromise,
                orderPromise
            ]);

            const ProductCount= getMonthlyCount({length:6, arr:product})
            const userCount= getMonthlyCount({length:6, arr:user})
            const ordereCount= getMonthlyCount({length:12, arr:order})

            charts={
                product:ProductCount,
                user:userCount,
                order:ordereCount,
            }

            myCache.set(key,JSON.stringify(charts));
        }
        res.status(200).json({
            success:true,
            charts
        })
    }
)
export const getLineCharts = TryCatch(
    async (req,res,next) => {
        let charts;
        const key="admin-line-charts";

        if(myCache.has(key)){
            charts= JSON.parse(myCache.get(key)!);
        }
        else{
            const today = new Date();

            const twelveMonthAgo = new Date();
            twelveMonthAgo.setMonth(today.getMonth() - 12);

            const baseQuery={
                createdAt:{
                    $gte:twelveMonthAgo,
                    $lte:today,
            }};

            const productPromise= Product.find(baseQuery).select("createdAt");

            const userPromise= User.find(baseQuery).select("createdAt");

            const orderPromise= Order.find(baseQuery).select(["createdAt","discount","total"]);

            const [
                product,
                user,
                order,
            ]= await Promise.all([
                productPromise,
                userPromise,
                orderPromise
            ]);

            const ProductCount= getMonthlyCount({length:12, arr:product})
            const userCount= getMonthlyCount({length:12, arr:user})
            const revenue= getMonthlyCount({length:12, arr:order,property:"total"});
            const discount= getMonthlyCount({length:12, arr:order,property:"discount"});

            charts={
                product:ProductCount,
                user:userCount,
                revenue,
                discount,
            }

            myCache.set(key,JSON.stringify(charts));
        }
        res.status(200).json({
            success:true,
            charts
        })
    }
)