import pool from "../config/db.js";

// CREATE SHOP
export const createShop = async (req, res) => {
  try {
    const { shop_name, type, location, city, street, state, country, shelf_depth, owner_id } = req.body;

    // If owner_id is not provided in the body, use the id from the verified token
    // (authMiddleware sets req.owner = decoded token payload).
    const resolvedOwnerId = owner_id || (req.owner && (req.owner.ownerId || req.owner.owner_id));

    // Normalize optional fields to null if undefined to avoid SQL errors for missing columns
    const streetVal = street === undefined ? null : street;
    const shelfDepthVal = shelf_depth === undefined ? null : shelf_depth;

    // Validate owner id before attempting DB insert
    if (!resolvedOwnerId) {
      console.warn("createShop: missing owner_id. req.body:", req.body, "req.owner:", req.owner);
      return res.status(400).json({ message: "Missing owner_id. Ensure you're authenticated." });
    }

    console.log("createShop: inserting shop. req.body:", req.body, "resolvedOwnerId:", resolvedOwnerId);

    const [result] = await pool.query(
      `INSERT INTO shop (shop_name, type, location, city, street, state, country, shelf_depth, owner_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [shop_name, type, location, city, streetVal, state, country, shelfDepthVal, resolvedOwnerId]
    );
    res.status(201).json({ message: "Shop created successfully", shop_id: result.insertId });
  } catch (err) {
    console.error("createShop error:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET ALL SHOPS
export const getShops = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM shop");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET SHOP BY ID
export const getShopById = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM shop WHERE shop_id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: "Shop not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE SHOP
export const updateShop = async (req, res) => {
  try {
    const { shop_name, type, location, city, street, state, country, shelf_depth } = req.body;
    await pool.query(
      `UPDATE shop SET shop_name=?, type=?, location=?, city=?, street=?, state=?, country=?, shelf_depth=? 
       WHERE shop_id=?`,
      [shop_name, type, location, city, street, state, country, shelf_depth, req.params.id]
    );
    res.json({ message: "Shop updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE SHOP
export const deleteShop = async (req, res) => {
  try {
    await pool.query("DELETE FROM shop WHERE shop_id = ?", [req.params.id]);
    res.json({ message: "Shop deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
