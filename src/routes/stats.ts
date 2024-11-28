import express from "express"
import { adminOnly } from "../middlewares/auth.js";
import { getBarCharts, getDashboardStats, getLineCharts, getPieCharts } from "../controllers/stats.js";

const app = express.Router();

// route /api/vi/dashboard/stats
app.get("/stats", adminOnly, getDashboardStats);

// route /api/vi/dashboard/pie
app.get("/pie", adminOnly, getPieCharts);

// route /api/vi/dashboard/bar
app.get("/bar", adminOnly, getBarCharts);

// route /api/vi/dashboard/line
app.get("/line", adminOnly, getLineCharts);

export default app;