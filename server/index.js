import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import ownerRoutes from "./routes/ownerRoutes.js";
import shopRoutes from "./routes/shopRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import stockCountRoutes from "./routes/stockCountRoutes.js";
import roboflowRoutes from "./routes/roboflowRoutes.js";

import { errorHandler } from "./middleware/errorHandler.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" })); // Increased limit for base64 images
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// API Routes
app.use("/api/owners", ownerRoutes);
app.use("/api/shops", shopRoutes);
app.use("/api/products", productRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/stock", stockCountRoutes);
app.use("/api/roboflow", roboflowRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));