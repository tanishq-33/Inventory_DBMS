import pool from "../config/db.js";

// CREATE SHOP
export const createShop = async (req, res) => {
  try {
    const { shop_name, type, location, city, street, state, country, shelf_depth, owner_id } = req.body;

    // Get owner_id from JWT token (set by authMiddleware)
    const resolvedOwnerId = owner_id || req.owner?.ownerId;

    const streetVal = street === undefined ? null : street;
    const shelfDepthVal = shelf_depth === undefined ? null : shelf_depth;

    if (!resolvedOwnerId) {
      console.warn("createShop: missing owner_id");
      return res.status(400).json({ message: "Missing owner_id. Ensure you're authenticated." });
    }

    console.log("createShop: inserting shop for owner:", resolvedOwnerId);

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

// GET ALL SHOPS (OWNER-FILTERED)
export const getShops = async (req, res) => {
  try {
    const ownerId = req.owner.ownerId;
    console.log("getShops: fetching for owner:", ownerId);
    
    const [rows] = await pool.query(
      "SELECT * FROM shop WHERE owner_id = ?",
      [ownerId]
    );
    res.json(rows);
  } catch (err) {
    console.error("getShops error:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET SHOP BY ID (OWNER-FILTERED)
export const getShopById = async (req, res) => {
  try {
    const ownerId = req.owner.ownerId;
    console.log("getShopById: fetching shop", req.params.id, "for owner:", ownerId);
    
    const [rows] = await pool.query(
      "SELECT * FROM shop WHERE shop_id = ? AND owner_id = ?",
      [req.params.id, ownerId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: "Shop not found or access denied" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error("getShopById error:", err);
    res.status(500).json({ error: err.message });
  }
};

// UPDATE SHOP (OWNER-FILTERED)
export const updateShop = async (req, res) => {
  try {
    const ownerId = req.owner.ownerId;
    const { shop_name, type, location, city, street, state, country, shelf_depth } = req.body;
    
    // First verify ownership
    const [existing] = await pool.query(
      "SELECT * FROM shop WHERE shop_id = ? AND owner_id = ?",
      [req.params.id, ownerId]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ message: "Shop not found or access denied" });
    }
    
    await pool.query(
      `UPDATE shop SET shop_name=?, type=?, location=?, city=?, street=?, state=?, country=?, shelf_depth=? 
       WHERE shop_id=? AND owner_id=?`,
      [shop_name, type, location, city, street, state, country, shelf_depth, req.params.id, ownerId]
    );
    res.json({ message: "Shop updated successfully" });
  } catch (err) {
    console.error("updateShop error:", err);
    res.status(500).json({ error: err.message });
  }
};

// DELETE SHOP (OWNER-FILTERED)
export const deleteShop = async (req, res) => {
  try {
    const ownerId = req.owner.ownerId;
    
    // First verify ownership
    const [existing] = await pool.query(
      "SELECT * FROM shop WHERE shop_id = ? AND owner_id = ?",
      [req.params.id, ownerId]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ message: "Shop not found or access denied" });
    }
    
    await pool.query(
      "DELETE FROM shop WHERE shop_id = ? AND owner_id = ?",
      [req.params.id, ownerId]
    );
    res.json({ message: "Shop deleted successfully" });
  } catch (err) {
    console.error("deleteShop error:", err);
    res.status(500).json({ error: err.message });
  }
};
