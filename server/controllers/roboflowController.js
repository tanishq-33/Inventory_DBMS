import pool from "../config/db.js";
import axios from "axios";

const ROBOFLOW_WORKFLOW_URL = "https://serverless.roboflow.com/odinventorymanagement/workflows/detect-count-and-visualize-4";
const ROBOFLOW_API_KEY = "BwfEWXWHiHm2hFEtZm1T";
const LOW_STOCK_THRESHOLD = 5;

export const detectProducts = async (req, res) => {
  console.log("=== DETECTION REQUEST RECEIVED ===");
  
  try {
    console.log("1. Checking request body...");
    const { image, shop_id } = req.body;
    console.log("   - Has image:", !!image);
    console.log("   - Image length:", image?.length);
    console.log("   - Shop ID:", shop_id);

    if (!image) {
      console.log("❌ No image provided");
      return res.status(400).json({ message: "Image is required" });
    }

    console.log("2. Preparing image for Roboflow...");
    const imageDataUrl = `data:image/jpeg;base64,${image}`;

    console.log("3. Calling Roboflow API...");
    const roboflowResponse = await axios.post(
      ROBOFLOW_WORKFLOW_URL,
      {
        api_key: ROBOFLOW_API_KEY,
        inputs: {
          image: { 
            type: "base64", 
            value: imageDataUrl 
          }
        }
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    console.log("4. Roboflow response received!");
    const workflowResult = roboflowResponse.data;
    console.log("   - Response structure:", Object.keys(workflowResult));
    
    // Extract predictions
    let predictions = [];
    
    console.log("5. Extracting predictions...");
    if (workflowResult?.outputs && Array.isArray(workflowResult.outputs)) {
      console.log("   - Outputs is array, length:", workflowResult.outputs.length);
      
      for (let i = 0; i < workflowResult.outputs.length; i++) {
        const output = workflowResult.outputs[i];
        console.log(`   - Output[${i}] keys:`, Object.keys(output));
        
        if (output.predictions && Array.isArray(output.predictions)) {
          predictions = output.predictions;
          console.log(`   ✓ Found ${predictions.length} predictions in outputs[${i}]`);
          break;
        }
      }
    }

    if (predictions.length === 0) {
      console.log("⚠️ No predictions found!");
      console.log("Full response:", JSON.stringify(workflowResult, null, 2));
    } else {
      console.log(`✓ Total predictions before filtering: ${predictions.length}`);
      console.log("Sample prediction:", predictions[0]);
    }

    // Filter by confidence threshold (95%)
    console.log("6. Filtering by confidence (>= 95%)...");
    const CONFIDENCE_THRESHOLD = 0.95;
    const highConfidencePredictions = predictions.filter(pred => {
      const confidence = pred.confidence;
      const passes = confidence >= CONFIDENCE_THRESHOLD;
      if (!passes) {
        console.log(`   - Filtered out: ${pred.class} (${(confidence * 100).toFixed(1)}%)`);
      }
      return passes;
    });
    
    console.log(`   ✓ After confidence filter: ${highConfidencePredictions.length} predictions`);
    predictions = highConfidencePredictions;

    // Count products by class
    console.log("7. Counting products...");
    const productCounts = {};
    predictions.forEach((pred) => {
      const className = pred.class;
      productCounts[className] = (productCounts[className] || 0) + 1;
    });
<<<<<<< Updated upstream

    // Check for low stock and create alerts
=======
    console.log("   Product counts:", productCounts);

    // Check for low stock
    console.log("7. Checking for low stock...");
>>>>>>> Stashed changes
    const alerts = [];
    const lowStockProducts = [];

    for (const [productName, count] of Object.entries(productCounts)) {
<<<<<<< Updated upstream
      if (count < LOW_STOCK_THRESHOLD) {
        // Find product in database
=======
      console.log(`   - ${productName}: ${count} items`);
      
      if (count < LOW_STOCK_THRESHOLD) {
        console.log(`     → Below threshold (${LOW_STOCK_THRESHOLD}), creating alert`);
        
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
          // Create alert in database
=======
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
=======
          
          console.log(`     ✓ Alert created for ${product.name}`);
        } else {
          console.log(`     ⚠️ Product "${productName}" not found in database`);
>>>>>>> Stashed changes
        }
      }
    }

    // Save detection history
<<<<<<< Updated upstream
    const detectionData = {
      shop_id: shop_id || null,
      total_items_detected: predictions.length,
      unique_products: Object.keys(productCounts).length,
      detection_results: JSON.stringify(productCounts),
      low_stock_alerts: alerts.length,
    };

=======
    console.log("8. Saving detection history...");
>>>>>>> Stashed changes
    const [detectionResult] = await pool.query(
      `INSERT INTO detection_history (shop_id, total_items_detected, unique_products, detection_results, low_stock_alerts, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [
<<<<<<< Updated upstream
        detectionData.shop_id,
        detectionData.total_items_detected,
        detectionData.unique_products,
        detectionData.detection_results,
        detectionData.low_stock_alerts,
      ]
    );

    res.json({
=======
        shop_id || null,
        predictions.length,
        Object.keys(productCounts).length,
        JSON.stringify(productCounts),
        alerts.length,
      ]
    );
    console.log("   ✓ Saved with ID:", detectionResult.insertId);

    console.log("9. Sending response...");
    const response = {
>>>>>>> Stashed changes
      success: true,
      detection_id: detectionResult.insertId,
      total_items: predictions.length,
      product_counts: productCounts,
      low_stock_alerts: alerts,
      low_stock_products: lowStockProducts,
      predictions: predictions,
<<<<<<< Updated upstream
    });
  } catch (err) {
    console.error("Roboflow detection error:", err.message);
=======
    };
    console.log("✅ DETECTION COMPLETE");
    
    res.json(response);
  } catch (err) {
    console.error("❌ ERROR:", err.message);
    if (err.response) {
      console.error("Response status:", err.response.status);
      console.error("Response data:", err.response.data);
    }
    console.error("Stack:", err.stack);
    
>>>>>>> Stashed changes
    res.status(500).json({
      error: "Failed to process image",
      details: err.response?.data || err.message,
    });
  }
};

<<<<<<< Updated upstream
// Get all alerts for owner
export const getAlerts = async (req, res) => {
  try {
    const { shop_id, is_read } = req.query;
=======
export const getAlerts = async (req, res) => {
  try {
    const { shop_id, is_read } = req.query;
    const ownerId = req.owner.ownerId;
>>>>>>> Stashed changes

    let query = `
      SELECT a.*, p.name as product_name, s.shop_name
      FROM alerts a
      LEFT JOIN product p ON a.product_id = p.product_id
      LEFT JOIN shop s ON a.shop_id = s.shop_id
<<<<<<< Updated upstream
      WHERE 1=1
    `;
    const params = [];
=======
      WHERE s.owner_id = ?
    `;
    const params = [ownerId];
>>>>>>> Stashed changes

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

<<<<<<< Updated upstream
// Mark alert as read
=======
>>>>>>> Stashed changes
export const markAlertAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("UPDATE alerts SET is_read = 1 WHERE alert_id = ?", [id]);
    res.json({ message: "Alert marked as read" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

<<<<<<< Updated upstream
// Mark all alerts as read
export const markAllAlertsAsRead = async (req, res) => {
  try {
    const { shop_id } = req.body;
    
    if (shop_id) {
      await pool.query("UPDATE alerts SET is_read = 1 WHERE shop_id = ?", [shop_id]);
    } else {
      await pool.query("UPDATE alerts SET is_read = 1");
=======
export const markAllAlertsAsRead = async (req, res) => {
  try {
    const { shop_id } = req.body;
    const ownerId = req.owner.ownerId;
    
    if (shop_id) {
      await pool.query(
        "UPDATE alerts a JOIN shop s ON a.shop_id = s.shop_id SET a.is_read = 1 WHERE s.owner_id = ? AND a.shop_id = ?",
        [ownerId, shop_id]
      );
    } else {
      await pool.query(
        "UPDATE alerts a JOIN shop s ON a.shop_id = s.shop_id SET a.is_read = 1 WHERE s.owner_id = ?",
        [ownerId]
      );
>>>>>>> Stashed changes
    }
    
    res.json({ message: "All alerts marked as read" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

<<<<<<< Updated upstream
// Delete alert
=======
>>>>>>> Stashed changes
export const deleteAlert = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM alerts WHERE alert_id = ?", [id]);
    res.json({ message: "Alert deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

<<<<<<< Updated upstream
// Get detection history
export const getDetectionHistory = async (req, res) => {
  try {
    const { shop_id } = req.query;
=======
export const getDetectionHistory = async (req, res) => {
  try {
    const { shop_id } = req.query;
    const ownerId = req.owner.ownerId;
>>>>>>> Stashed changes

    let query = `
      SELECT dh.*, s.shop_name
      FROM detection_history dh
      LEFT JOIN shop s ON dh.shop_id = s.shop_id
<<<<<<< Updated upstream
      WHERE 1=1
    `;
    const params = [];
=======
      WHERE s.owner_id = ?
    `;
    const params = [ownerId];
>>>>>>> Stashed changes

    if (shop_id) {
      query += " AND dh.shop_id = ?";
      params.push(shop_id);
    }

    query += " ORDER BY dh.created_at DESC LIMIT 50";

    const [history] = await pool.query(query, params);
    
<<<<<<< Updated upstream
    // Parse detection_results JSON string
=======
>>>>>>> Stashed changes
    const parsedHistory = history.map(record => ({
      ...record,
      detection_results: JSON.parse(record.detection_results)
    }));

    res.json(parsedHistory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

<<<<<<< Updated upstream
// Get unread alert count
export const getUnreadAlertCount = async (req, res) => {
  try {
    const { shop_id } = req.query;

    let query = "SELECT COUNT(*) as count FROM alerts WHERE is_read = 0";
    const params = [];

    if (shop_id) {
      query += " AND shop_id = ?";
=======
export const getUnreadAlertCount = async (req, res) => {
  try {
    const { shop_id } = req.query;
    const ownerId = req.owner.ownerId;

    let query = `
      SELECT COUNT(*) as count 
      FROM alerts a 
      JOIN shop s ON a.shop_id = s.shop_id 
      WHERE a.is_read = 0 AND s.owner_id = ?
    `;
    const params = [ownerId];

    if (shop_id) {
      query += " AND a.shop_id = ?";
>>>>>>> Stashed changes
      params.push(shop_id);
    }

    const [result] = await pool.query(query, params);
    res.json({ unread_count: result[0].count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
<<<<<<< Updated upstream
};
=======
};



/**ok so it has stopped giving me any prediction now, remove the changes made to roboflowconntroller.js, i have made some changes to the project now, they are as follows:
1. when a user registers he should first fill out a form to enter his shop details
2. after doing that, we will ask the owner to enter manually the stock count he has in his inventory and in his shelf(he can add shelf data manually or can do it by uploading the images,)
3. for each owner we should get info about their own shop, right now, for any user we are getting the same data
4. on the dashboard, show the analysis and statistics, and show the products whose stock count is low
5. add another page, manage, where we can change the number of products on shelf, if we add more products to shelf the number should decrease in inventory, and when we remove from it, inventory count should increase.



follow the same page layout, same pages, make changes to them if you want */
>>>>>>> Stashed changes
