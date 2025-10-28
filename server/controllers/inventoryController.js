import pool from "../config/db.js";

// ADD INVENTORY ITEM
export const addInventory = async (req, res) => {
  try {
    const { shop_id, product_id, total_quantity, shelf_quantity } = req.body;

    // validate that provided shop and product exist to give clearer errors for FK constraints
    const [shopRows] = await pool.query("SELECT shop_id FROM shop WHERE shop_id = ?", [shop_id]);
    if (shopRows.length === 0) return res.status(400).json({ message: `Shop with id ${shop_id} does not exist` });

    const [productRows] = await pool.query("SELECT product_id FROM product WHERE product_id = ?", [product_id]);
    if (productRows.length === 0) return res.status(400).json({ message: `Product with id ${product_id} does not exist` });

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

// GET INVENTORY (ALL)
export const getAllInventory = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT i.*, s.shop_name, p.name AS product_name 
       FROM inventory i
       JOIN shop s ON i.shop_id = s.shop_id
       JOIN product p ON i.product_id = p.product_id`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE INVENTORY QUANTITY
export const updateInventory = async (req, res) => {
  try {
    const { total_quantity, shelf_quantity } = req.body;
    await pool.query(
      "UPDATE inventory SET total_quantity=?, shelf_quantity=? WHERE inventory_id=?",
      [total_quantity, shelf_quantity, req.params.id]
    );
    res.json({ message: "Inventory updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE INVENTORY ITEM
export const deleteInventory = async (req, res) => {
  try {
    await pool.query("DELETE FROM inventory WHERE inventory_id = ?", [req.params.id]);
    res.json({ message: "Inventory deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
