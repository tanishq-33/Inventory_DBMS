import pool from "../config/db.js";
import axios from "axios";
import FormData from "form-data";

// Roboflow Configuration
const ROBOFLOW_API_KEY = process.env.ROBOFLOW_API_KEY;
const ROBOFLOW_MODEL_ENDPOINT = `https://detect.roboflow.com/inventory_management-2-zh743/1`;
const LOW_STOCK_THRESHOLD = parseInt(process.env.LOW_STOCK_THRESHOLD) || 5;

// Process image with Roboflow model
export const detectProducts = async (req, res) => {
  try {
    const { image, shop_id } = req.body;

    if (!image) {
      return res.status(400).json({ message: "Image is required" });
    }

    if (!ROBOFLOW_API_KEY) {
      return res.status(500).json({ message: "Roboflow API key not configured" });
    }

    // Call Roboflow API
    const roboflowResponse = await axios.post(
      `${ROBOFLOW_MODEL_ENDPOINT}?api_key=${ROBOFLOW_API_KEY}`,
      image,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const predictions = roboflowResponse.data.predictions || [];

    // Count products by class
    const productCounts = {};
    predictions.forEach((pred) => {
      const className = pred.class;
      productCounts[className] = (productCounts[className] || 0) + 1;
    });

    // Check for low stock and create alerts
    const alerts = [];
    const lowStockProducts = [];

    for (const [productName, count] of Object.entries(productCounts)) {
      if (count < LOW_STOCK_THRESHOLD) {
        // Find product in database
        const [productRows] = await pool.query(
          "SELECT product_id, name FROM product WHERE LOWER(name) = LOWER(?)",
          [productName]
        );

        if (productRows.length > 0) {
          const product = productRows[0];
          lowStockProducts.push({
            product_id: product.product_id,
            product_name: product.name,
            detected_count: count,
            threshold: LOW_STOCK_THRESHOLD,
          });

          // Create alert in database
          await pool.query(
            `INSERT INTO alerts (shop_id, product_id, alert_type, message, detected_count, threshold_count, is_read, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
              shop_id || null,
              product.product_id,
              "LOW_STOCK",
              `Low stock detected for ${product.name}. Only ${count} item(s) found (threshold: ${LOW_STOCK_THRESHOLD})`,
              count,
              LOW_STOCK_THRESHOLD,
              false,
            ]
          );

          alerts.push({
            product_name: product.name,
            detected_count: count,
            threshold: LOW_STOCK_THRESHOLD,
            message: `Low stock alert: ${product.name}`,
          });
        }
      }
    }

    // Save detection history
    const detectionData = {
      shop_id: shop_id || null,
      total_items_detected: predictions.length,
      unique_products: Object.keys(productCounts).length,
      detection_results: JSON.stringify(productCounts),
      low_stock_alerts: alerts.length,
    };

    const [detectionResult] = await pool.query(
      `INSERT INTO detection_history (shop_id, total_items_detected, unique_products, detection_results, low_stock_alerts, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [
        detectionData.shop_id,
        detectionData.total_items_detected,
        detectionData.unique_products,
        detectionData.detection_results,
        detectionData.low_stock_alerts,
      ]
    );

    res.json({
      success: true,
      detection_id: detectionResult.insertId,
      total_items: predictions.length,
      product_counts: productCounts,
      low_stock_alerts: alerts,
      low_stock_products: lowStockProducts,
      predictions: predictions,
    });
  } catch (err) {
    console.error("Roboflow detection error:", err.message);
    res.status(500).json({
      error: "Failed to process image",
      details: err.response?.data || err.message,
    });
  }
};

// Get all alerts for owner
export const getAlerts = async (req, res) => {
  try {
    const { shop_id, is_read } = req.query;

    let query = `
      SELECT a.*, p.name as product_name, s.shop_name
      FROM alerts a
      LEFT JOIN product p ON a.product_id = p.product_id
      LEFT JOIN shop s ON a.shop_id = s.shop_id
      WHERE 1=1
    `;
    const params = [];

    if (shop_id) {
      query += " AND a.shop_id = ?";
      params.push(shop_id);
    }

    if (is_read !== undefined) {
      query += " AND a.is_read = ?";
      params.push(is_read === "true" ? 1 : 0);
    }

    query += " ORDER BY a.created_at DESC";

    const [alerts] = await pool.query(query, params);
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Mark alert as read
export const markAlertAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("UPDATE alerts SET is_read = 1 WHERE alert_id = ?", [id]);
    res.json({ message: "Alert marked as read" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Mark all alerts as read
export const markAllAlertsAsRead = async (req, res) => {
  try {
    const { shop_id } = req.body;
    
    if (shop_id) {
      await pool.query("UPDATE alerts SET is_read = 1 WHERE shop_id = ?", [shop_id]);
    } else {
      await pool.query("UPDATE alerts SET is_read = 1");
    }
    
    res.json({ message: "All alerts marked as read" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete alert
export const deleteAlert = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM alerts WHERE alert_id = ?", [id]);
    res.json({ message: "Alert deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get detection history
export const getDetectionHistory = async (req, res) => {
  try {
    const { shop_id } = req.query;

    let query = `
      SELECT dh.*, s.shop_name
      FROM detection_history dh
      LEFT JOIN shop s ON dh.shop_id = s.shop_id
      WHERE 1=1
    `;
    const params = [];

    if (shop_id) {
      query += " AND dh.shop_id = ?";
      params.push(shop_id);
    }

    query += " ORDER BY dh.created_at DESC LIMIT 50";

    const [history] = await pool.query(query, params);
    
    // Parse detection_results JSON string
    const parsedHistory = history.map(record => ({
      ...record,
      detection_results: JSON.parse(record.detection_results)
    }));

    res.json(parsedHistory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get unread alert count
export const getUnreadAlertCount = async (req, res) => {
  try {
    const { shop_id } = req.query;

    let query = "SELECT COUNT(*) as count FROM alerts WHERE is_read = 0";
    const params = [];

    if (shop_id) {
      query += " AND shop_id = ?";
      params.push(shop_id);
    }

    const [result] = await pool.query(query, params);
    res.json({ unread_count: result[0].count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};