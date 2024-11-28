import { Request } from "express";
import { TryCatch } from "../middlewares/error.js";
import { AllProductRequestQuery, BaseQueryType, NewProductRequestBody } from "../types/types.js";
import { Product } from "../models/product.js";
import multer from "multer";
import ErrorHandler from "../utils/utility-classes.js";
import { rm } from "fs";
import { myCache } from "../app.js";
import { json } from "stream/consumers";
import { invalidateCache } from "../utils/feature.js";
// import { faker } from "@faker-js/faker"


// revalidate on New,Update,Delete Product and New Order
export const getLatestProduct = TryCatch(
    async (req, res, next) => {
        let products;

        if(myCache.has("latest-product")){
            products = JSON.parse(myCache.get("latest-product")!)
        }
        else{
            products = await Product.find({}).sort({ createdAt: -1 }).limit(5);
            myCache.set("latest-product",JSON.stringify(products));
        }

        return res.send({
            success: true,
            products,
        });
    }
)


export const getAllProduct = TryCatch(
    async (req: Request<{}, {}, {}, AllProductRequestQuery>, res, next) => {

        const { search, sort, category, price } = req.query;

        const page = Number(req.query.page);
        const limit = 8;
        const skip = (page - 1) * limit;


        const baseQuery: BaseQueryType = {};

        if (search)
            baseQuery.name = {
                $regex: search,
                $options: "i",
            };

        if (price)
            baseQuery.price = {
                $lte: Number(price)
            };

        if (category)
            baseQuery.category = category;

        const products = await Product.find(baseQuery)
            .sort(sort && { price: sort === "asc" ? 1 : -1 })
            .limit(limit)
            .skip(skip);

        const allFilterProduct = await Product.find(baseQuery);

        const totalPages = Math.ceil(allFilterProduct.length / limit);

        return res.send({
            success: true,
            products,
            totalPages,
        });
    }
)

// revalidate on New,Update,Delete Product and New Order
export const getAllCategories = TryCatch(
    async (req, res, next) => {

        let categories;

        if(myCache.has("categories")){
            categories= JSON.parse(myCache.get("categories")!);
        }
        else{
            categories = await Product.distinct("category");
            myCache.set("categories",JSON.stringify(categories));
        }

        return res.send({
            success: true,
            categories,
        });
    }
)

// revalidate on New,Update,Delete Product and New Order
export const getAdminProduct = TryCatch(
    async (req, res, next) => {
        let products;

        if(myCache.has("allProducts")){
            products=JSON.parse(myCache.get("allProducts")!);
        }
        else{
            products = await Product.find({});
            myCache.set("allProducts",JSON.stringify(products))
        }

        return res.send({
            success: true,
            products,
        });
    }
)

// revalidate on New,Update,Delete Product and New Order
export const getSingleProduct = TryCatch(
    async (req, res, next) => {
        const id=req.params.id;

        let product;

        if(myCache.has(`product-${id}`)){
            product=JSON.parse(myCache.get(`product-${id}`)!);
        }
        else{
            product = await Product.findById(id);
            if (!product) return next(new ErrorHandler("invalid id", 404));

            myCache.set(`product-${id}`,JSON.stringify(product));
        }

        return res.send({
            success: true,
            product,
        });
    }
)

export const newProduct = TryCatch(
    async (req: Request<{}, {}, NewProductRequestBody>, res, next) => {
        const { name, category, price, stock } = req.body;

        const photo = req.file;

        if (!photo) return next(new ErrorHandler("add photo", 400));

        if (!name || !category || !price || !stock) {
            rm(photo.path, () => {
                console.log("deleted");
            })

            return next(new ErrorHandler("add all field", 400));
        }

        await Product.create({
            name,
            category: category.toLowerCase(),
            price,
            stock,
            photo: photo.path,
        });

        invalidateCache({product:true, admin:true});

        return res.send({
            success: true,
            message: "product created successfully"
        });
    }
)

export const updateProduct = TryCatch(
    async (req, res, next) => {
        const id = req.params.id;

        const product = await Product.findById(id);

        if (!product) return next(new ErrorHandler("invalid ID", 404))

        const { name, category, price, stock } = req.body;

        const photo = req.file;

        if (photo) {
            rm(product.photo, () => {
                console.log("photo deleted successfully");
            })
            product.photo = photo.path;
        };

        if (name) product.name = name;
        if (category) product.category = category;
        if (stock) product.stock = stock;
        if (price) product.price = price;

        await product.save();

        invalidateCache({product:true, productID:product.id, admin:true });

        return res.send({
            success: true,
            message: "product updated successfully"
        });
    }
)

export const deleteProduct = TryCatch(
    async (req, res, next) => {
        const product = await Product.findById(req.params.id);

        if (!product) return next(new ErrorHandler("invalid id", 404));

        rm(product.photo, () => {
            console.log("photo delete successfully")
        })

        invalidateCache({product:true, productID:product.id, admin:true});

        await Product.deleteOne({ _id: req.params.id });

        return res.send({
            success: true,
            message: "product deleted succesfully"
        });
    }
)

// const generateRandomProduct = async (count: number = 10) => {
//     const products = [];

//     for (let i = 0; i < count; i++) {
//         const product = {
//             name: faker.commerce.productName(),
//             photo: "uploads\\b71ec41c-4efd-42f1-a514-a09d8a305325.jpg",
//             price: faker.commerce.price({ min: 1500, max: 80000, dec: 0 }),
//             stock: faker.commerce.price({ min: 0, max: 200, dec: 0 }),
//             category: faker.commerce.department(),
//             createdAt: new Date(faker.date.past()),
//             updatedAt: new Date(faker.date.recent()),
//             __v: 0
//         }
//         products.push(product);
//     }
//     await Product.create(products);

//     console.log("product created");
// }

// const deleteRandomProduct = async (count: number = 10) => {
//     const products=await Product.find({}).skip(2);
    
//     for(let i=0; i<count; i++){
//         const product=products[i];
//         await product.deleteOne();
//     }

//     console.log({success:true})
// }


