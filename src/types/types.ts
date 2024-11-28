import { NextFunction, Request, Response } from "express";

export interface NewUserRequestBody {
    _id: string;
    name: string;
    email: string;
    photo: string;
    gender: string;
    dob: string;
}

export interface NewProductRequestBody {
    name: string;
    category: string;
    stock: number;
    price: number;
}

export type ControllerType = (
    req: Request,
    res: Response,
    next: NextFunction
) => Promise<void | Response<any, Record<string, any>>>

export interface AllProductRequestQuery {
    search?: string,
    sort?: string,
    category?: string,
    price?: string,
    page?: string,
}

export type BaseQueryType = {
    name?: {
        $regex: string;
        $options: string;
    },
    price?: {
        $lte: number;
    },
    category?: string,
}

export type invalidateCachePropType = {
    product?: boolean,
    order?: boolean,
    admin?: boolean,
    userID?: string,
    orderID?: string,
    productID?: string | string[];
}

export type orderItemType={
    name: string,
    photo: string,
    price: number,
    quantity: number,
    productID:string,
}

export type ShippingInfoType={
    address:string,
    city:string,
    state:string,
    country:string,
    pinCode:number,
}

export type NewOrderRequestBody={
    shippingInfo: ShippingInfoType;
    user: string,
    subTotal: number,
    tax: number,
    shippingCharges: number,
    discount: number,
    total: number,
    orderItems: orderItemType[],
}