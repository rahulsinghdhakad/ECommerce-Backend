import express from "express"
import { deleteUser, getAllUsers, getUser, newUser } from "../controllers/user.js";
import { adminOnly } from "../middlewares/auth.js";

const app=express.Router();

// route /api/vi/user/new
app.post("/new",newUser);

// route /api/vi/user/all
app.get("/all",adminOnly,getAllUsers)

// route /api/vi/user/dynamicID
app.route("/:id").get(getUser).delete(adminOnly,deleteUser)

export default app;