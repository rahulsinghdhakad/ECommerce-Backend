import express from "express"
import { adminOnly } from "../middlewares/auth.js";
import { deleteProduct, getAdminProduct, getAllCategories, getAllProduct, getLatestProduct, getSingleProduct, newProduct, updateProduct } from "../controllers/product.js";
import { singleUpload } from "../middlewares/multer.js";

const app = express.Router();

// api/vi/product
app.post("/new", adminOnly, singleUpload, newProduct)

app.get("/latest", getLatestProduct)

app.get("/all", getAllProduct)

app.get("/categories", getAllCategories);

app.get("/admin-product",adminOnly, getAdminProduct);

app.route("/:id")
    .get(getSingleProduct)
    .put(adminOnly, singleUpload, updateProduct)
    .delete(adminOnly, deleteProduct);

export default app;