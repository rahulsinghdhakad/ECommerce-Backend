import mongoose from "mongoose";
import { myCache } from "../app.js";
import { Product } from "../models/product.js";
import { invalidateCachePropType, orderItemType } from "../types/types.js";
import { Document } from "mongoose";

export const connectDB = (uri:string) => {
    mongoose.connect(uri, {
        dbName: "E-commerce24"
    }).then(c => console.log(`DB connected to ${c.connection.host}`))
        .catch(e => console.log(e))
}

export const invalidateCache = ({
    product,
    order,
    admin,
    userID,
    orderID,
    productID,
}:invalidateCachePropType) => {

    if(product){
        const productKeys:string[]=[];

        productKeys.push(
            "categories",
            "allProducts",
            "latest-product",
        );

        if(typeof productID==="string") 
            productKeys.push(`product-${productID}`)
        if(typeof productID==="object")
            productID.forEach(i=>productKeys.push(`product-${i}`))

        myCache.del(productKeys)
    }
    if(order){
        const orderKeys:string[]=[];

        orderKeys.push(
            "all-orders",
        );

        orderKeys.push(`my-orders-${userID}`);

        orderKeys.push(`order-${orderID}`);

        myCache.del(orderKeys)
    }
    if(admin){
        myCache.del([
            "admin-stats",
            "admin-charts",
            "admin-bar-charts",
            "admin-line-charts",
        ]);
    }
}

export const reduceStock=async(orderItems:orderItemType[])=>{
    for(let i=0; i<orderItems.length; i++){
        const order=orderItems[i];
        const product= await Product.findById(order.productID);

        if(!product) throw new Error("Product Not Found");

        product.stock-=order.quantity;

        await product.save();
    }
} 


export const percentage=(thisMonth:number, lastMonth:number)=>{
    if(lastMonth===0) return thisMonth*100;
    else return (((thisMonth)/lastMonth)*100).toFixed(0);
}

export const getCategories=async(categories:string[],productCount:number)=>{
    const categoryCountPromise = categories.map((category) => Product.countDocuments({ category }));
    const categoryCount = await Promise.all(categoryCountPromise);

    const categoryAndCount: Record<string, number>[] = [];

    for (let i = 0; i < categories.length; i++) {
        categoryAndCount.push({
            [categories[i]]: Math.round((categoryCount[i] / productCount) * 100)
        })
    }
    return categoryAndCount;
}

interface MyDocument extends Document{
    createdAt:Date,
    discount?:number,
    total?:number,
}

interface Func1Type {
    length:number,
    arr:MyDocument[],
    property?:"discount"|"total",
}

export const getMonthlyCount= ({length,arr,property}:Func1Type)=>{
    const today=new Date();

    const monthlyCount:number[] = Array(length).fill(0);

    arr.forEach((i) => {
        const creationMonth = i.createdAt.getMonth();
        const monthdiff = (today.getMonth() - creationMonth + 12) % 12;

        if (monthdiff < length) {
            if(property)
                monthlyCount[(length-1) - monthdiff] += i[property]!;
            else
                monthlyCount[(length-1) - monthdiff] += 1;
        }
    })
    return monthlyCount;
}