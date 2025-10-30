import express from "express";
import {
  createShop,
  getShops,
  getShopById,
  updateShop,
  deleteShop
} from "../controllers/shopController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Protected routes
router.post("/", verifyToken, createShop);
router.get("/", verifyToken, getShops);
router.get("/:id", verifyToken, getShopById);
router.put("/:id", verifyToken, updateShop);
router.delete("/:id", verifyToken, deleteShop);

export default router;
