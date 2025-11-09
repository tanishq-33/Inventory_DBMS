import pool from "../config/db.js";

// ADD INVENTORY ITEM
export const addInventory = async (req, res) => {
  try {
    const { shop_id, product_id, total_quantity, shelf_quantity } = req.body;
    const ownerId = req.owner.ownerId;

    // Verify shop belongs to owner
    const [shopRows] = await pool.query(
      "SELECT shop_id FROM shop WHERE shop_id = ? AND owner_id = ?",
      [shop_id, ownerId]
    );
    
    if (shopRows.length === 0) {
      return res.status(400).json({ 
        message: `Shop with id ${shop_id} does not exist or you don't have access to it` 
      });
    }

    // Verify product exists
    const [productRows] = await pool.query(
      "SELECT product_id FROM product WHERE product_id = ?",
      [product_id]
    );
    
    if (productRows.length === 0) {
      return res.status(400).json({ 
        message: `Product with id ${product_id} does not exist` 
      });
    }

    const [result] = await pool.query(
      "INSERT INTO inventory (shop_id, product_id, total_quantity, shelf_quantity) VALUES (?, ?, ?, ?)",
      [shop_id, product_id, total_quantity, shelf_quantity]
    );

    res.status(201).json({ message: "Inventory added", inventory_id: result.insertId });
  } catch (err) {
    console.error("addInventory error:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET INVENTORY (OWNER-FILTERED)
export const getAllInventory = async (req, res) => {
  try {
    const ownerId = req.owner.ownerId;
    console.log("getAllInventory: fetching for owner:", ownerId);
    
    const [rows] = await pool.query(
      `SELECT i.*, s.shop_name, p.name AS product_name, p.type AS product_type, p.price, p.company
       FROM inventory i
       JOIN shop s ON i.shop_id = s.shop_id
       JOIN product p ON i.product_id = p.product_id
       WHERE s.owner_id = ?`,
      [ownerId]
    );
    res.json(rows);
  } catch (err) {
    console.error("getAllInventory error:", err);
    res.status(500).json({ error: err.message });
  }
};

// UPDATE INVENTORY QUANTITY (OWNER-FILTERED)
export const updateInventory = async (req, res) => {
  try {
    const { total_quantity, shelf_quantity } = req.body;
    const ownerId = req.owner.ownerId;
    
    // Verify ownership through shop
    const [existing] = await pool.query(
      `SELECT i.* FROM inventory i
       JOIN shop s ON i.shop_id = s.shop_id
       WHERE i.inventory_id = ? AND s.owner_id = ?`,
      [req.params.id, ownerId]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ 
        message: "Inventory item not found or access denied" 
      });
    }
    
    await pool.query(
      "UPDATE inventory SET total_quantity=?, shelf_quantity=? WHERE inventory_id=?",
      [total_quantity, shelf_quantity, req.params.id]
    );
    res.json({ message: "Inventory updated" });
  } catch (err) {
    console.error("updateInventory error:", err);
    res.status(500).json({ error: err.message });
  }
};

// DELETE INVENTORY ITEM (OWNER-FILTERED)
export const deleteInventory = async (req, res) => {
  try {
    const ownerId = req.owner.ownerId;
    
    // Verify ownership through shop
    const [existing] = await pool.query(
      `SELECT i.* FROM inventory i
       JOIN shop s ON i.shop_id = s.shop_id
       WHERE i.inventory_id = ? AND s.owner_id = ?`,
      [req.params.id, ownerId]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ 
        message: "Inventory item not found or access denied" 
      });
    }
    
    await pool.query("DELETE FROM inventory WHERE inventory_id = ?", [req.params.id]);
    res.json({ message: "Inventory deleted" });
  } catch (err) {
    console.error("deleteInventory error:", err);
    res.status(500).json({ error: err.message });
  }
};
