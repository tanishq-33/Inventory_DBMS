import pool from "../config/db.js";

// CREATE PRODUCT
export const createProduct = async (req, res) => {
  try {
    const { name, type, company, dimensions, price } = req.body;
    const [result] = await pool.query(
      "INSERT INTO product (name, type, company, dimensions, price) VALUES (?, ?, ?, ?, ?)",
      [name, type, company, dimensions, price]
    );
    res.status(201).json({ message: "Product created", product_id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET ALL PRODUCTS (OWNER-FILTERED - only products in owner's inventory)
export const getProducts = async (req, res) => {
  try {
    const ownerId = req.owner.ownerId;
    console.log("getProducts: fetching for owner:", ownerId);
    
    // Get only products that exist in the owner's shops' inventory
    const [rows] = await pool.query(
      `SELECT DISTINCT p.* 
       FROM product p
       INNER JOIN inventory i ON p.product_id = i.product_id
       INNER JOIN shop s ON i.shop_id = s.shop_id
       WHERE s.owner_id = ?
       ORDER BY p.name`,
      [ownerId]
    );
    
    res.json(rows);
  } catch (err) {
    console.error("getProducts error:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET PRODUCT BY ID (OWNER-FILTERED)
export const getProductById = async (req, res) => {
  try {
    const ownerId = req.owner.ownerId;
    
    // Verify this product exists in owner's inventory
    const [rows] = await pool.query(
      `SELECT DISTINCT p.* 
       FROM product p
       INNER JOIN inventory i ON p.product_id = i.product_id
       INNER JOIN shop s ON i.shop_id = s.shop_id
       WHERE p.product_id = ? AND s.owner_id = ?`,
      [req.params.id, ownerId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        message: "Product not found or not in your inventory" 
      });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error("getProductById error:", err);
    res.status(500).json({ error: err.message });
  }
};

// UPDATE PRODUCT
export const updateProduct = async (req, res) => {
  try {
    const { name, type, company, dimensions, price } = req.body;
    const ownerId = req.owner.ownerId;
    
    // Verify this product exists in owner's inventory
    const [existing] = await pool.query(
      `SELECT DISTINCT p.product_id 
       FROM product p
       INNER JOIN inventory i ON p.product_id = i.product_id
       INNER JOIN shop s ON i.shop_id = s.shop_id
       WHERE p.product_id = ? AND s.owner_id = ?`,
      [req.params.id, ownerId]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ 
        message: "Product not found or not in your inventory" 
      });
    }
    
    await pool.query(
      "UPDATE product SET name=?, type=?, company=?, dimensions=?, price=? WHERE product_id=?",
      [name, type, company, dimensions, price, req.params.id]
    );
    res.json({ message: "Product updated successfully" });
  } catch (err) {
    console.error("updateProduct error:", err);
    res.status(500).json({ error: err.message });
  }
};

// DELETE PRODUCT (OWNER-FILTERED)
export const deleteProduct = async (req, res) => {
  try {
    const ownerId = req.owner.ownerId;
    
    // Verify this product exists in owner's inventory
    const [existing] = await pool.query(
      `SELECT DISTINCT p.product_id 
       FROM product p
       INNER JOIN inventory i ON p.product_id = i.product_id
       INNER JOIN shop s ON i.shop_id = s.shop_id
       WHERE p.product_id = ? AND s.owner_id = ?`,
      [req.params.id, ownerId]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ 
        message: "Product not found or not in your inventory" 
      });
    }
    
    // Note: This will delete the product globally, which will cascade delete
    // all inventory entries due to ON DELETE CASCADE.
    // Consider if you want this behavior or just remove from owner's inventory
    await pool.query("DELETE FROM product WHERE product_id = ?", [req.params.id]);
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("deleteProduct error:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET ALL PRODUCTS (UNFILTERED - for admin or product selection)
// Use this endpoint when adding products to inventory
export const getAllProductsCatalog = async (req, res) => {
  try {
    // Returns ALL products in the system - useful for product catalog
    // when owner wants to add new products to their inventory
    const [rows] = await pool.query("SELECT * FROM product ORDER BY name");
    res.json(rows);
  } catch (err) {
    console.error("getAllProductsCatalog error:", err);
    res.status(500).json({ error: err.message });
  }
};
