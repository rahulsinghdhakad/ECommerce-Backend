import express from "express"
import { adminOnly } from "../middlewares/auth.js";
import { deleteOrder, getAllOrders, getSingleOrder, myOrders, newOrder, updateOrder } from "../controllers/order.js";
import { deleteProduct } from "../controllers/product.js";

const app = express.Router();

// route /api/vi/order/new
app.post("/new", newOrder);

app.get("/my", myOrders);

app.get("/all", adminOnly, getAllOrders);

app.route("/:id")
    .get(getSingleOrder)
    .put(adminOnly,updateOrder)
    .delete(adminOnly,deleteOrder);

export default app;