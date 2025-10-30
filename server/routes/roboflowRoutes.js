import express from "express";
import {
  detectProducts,
  getAlerts,
  markAlertAsRead,
  markAllAlertsAsRead,
  deleteAlert,
  getDetectionHistory,
  getUnreadAlertCount,
} from "../controllers/roboflowController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Detection endpoint
router.post("/detect", verifyToken, detectProducts);

// Alert management
router.get("/alerts", verifyToken, getAlerts);
router.get("/alerts/unread-count", verifyToken, getUnreadAlertCount);
router.put("/alerts/:id/read", verifyToken, markAlertAsRead);
router.put("/alerts/read-all", verifyToken, markAllAlertsAsRead);
router.delete("/alerts/:id", verifyToken, deleteAlert);

// Detection history
router.get("/history", verifyToken, getDetectionHistory);

export default router;