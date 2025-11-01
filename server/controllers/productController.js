import pool from "../config/db.js";

// CREATE PRODUCT
export const createProduct = async (req, res) => {
  try {
    const { name, type, company, price } = req.body;
    const [result] = await pool.query(
      "INSERT INTO product (name, type, company, price) VALUES (?, ?, ?, ?)",
      [name, type, company, price]
    );
    res.status(201).json({ message: "Product created", product_id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET ALL PRODUCTS
export const getProducts = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM product");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET PRODUCT BY ID
export const getProductById = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM product WHERE product_id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: "Product not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE PRODUCT
export const updateProduct = async (req, res) => {
  try {
    const { name, type, company, price } = req.body;
    await pool.query(
      "UPDATE product SET name=?, type=?, company=?, price=? WHERE product_id=?",
      [name, type, company, price, req.params.id]
    );
    res.json({ message: "Product updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE PRODUCT
export const deleteProduct = async (req, res) => {
  try {
    await pool.query("DELETE FROM product WHERE product_id = ?", [req.params.id]);
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
