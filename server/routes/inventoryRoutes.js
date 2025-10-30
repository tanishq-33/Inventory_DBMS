import express from "express";
import {
  addInventory,
  getAllInventory,
  updateInventory,
  deleteInventory
} from "../controllers/inventoryController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", verifyToken, addInventory);
router.get("/", verifyToken, getAllInventory);
router.put("/:id", verifyToken, updateInventory);
router.delete("/:id", verifyToken, deleteInventory);

export default router;
