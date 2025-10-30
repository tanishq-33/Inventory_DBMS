import pool from "../config/db.js";

// ADD STOCK COUNT
export const addStockCount = async (req, res) => {
  try {
    const { product_id, shop_id, inventory_id, count } = req.body;
    const [result] = await pool.query(
      "INSERT INTO stock_count (product_id, shop_id, inventory_id, count) VALUES (?, ?, ?, ?)",
      [product_id, shop_id, inventory_id, count]
    );
    res.status(201).json({ message: "Stock count added", stock_id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET ALL STOCK COUNTS
export const getStockCounts = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT sc.*, p.name AS product_name, s.shop_name
       FROM stock_count sc
       JOIN product p ON sc.product_id = p.product_id
       JOIN shop s ON sc.shop_id = s.shop_id`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE STOCK COUNT
export const updateStockCount = async (req, res) => {
  try {
    const { count } = req.body;
    await pool.query("UPDATE stock_count SET count=? WHERE stock_id=?", [count, req.params.id]);
    res.json({ message: "Stock count updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE STOCK RECORD
export const deleteStockCount = async (req, res) => {
  try {
    await pool.query("DELETE FROM stock_count WHERE stock_id=?", [req.params.id]);
    res.json({ message: "Stock count deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
