import express from "express";
import {
  addStockCount,
  getStockCounts,
  updateStockCount,
  deleteStockCount
} from "../controllers/stockCountController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", verifyToken, addStockCount);
router.get("/", verifyToken, getStockCounts);
router.put("/:id", verifyToken, updateStockCount);
router.delete("/:id", verifyToken, deleteStockCount);

export default router;
