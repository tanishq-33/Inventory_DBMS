import express from "express";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getAllProductsCatalog
} from "../controllers/productController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get owner's products (filtered by inventory)
router.get("/", verifyToken, getProducts);

// Get full product catalog (for adding to inventory)
router.get("/catalog", verifyToken, getAllProductsCatalog);

// Other product routes
router.post("/", verifyToken, createProduct);
router.get("/:id", verifyToken, getProductById);
router.put("/:id", verifyToken, updateProduct);
router.delete("/:id", verifyToken, deleteProduct);

export default router;
