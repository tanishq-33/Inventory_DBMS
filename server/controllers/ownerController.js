import pool from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const registerOwner = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const [rows] = await pool.query(
      "INSERT INTO owner (username, email, password) VALUES (?, ?, ?)",
      [username, email, hashedPassword]
    );
    res.status(201).json({ message: "Owner registered successfully", ownerId: rows.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const loginOwner = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Login attempt:", email);

    const [owners] = await pool.query("SELECT * FROM owner WHERE email = ?", [email]);
    console.log("DB result:", owners);

    if (owners.length === 0) return res.status(404).json({ message: "Owner not found" });

    const owner = owners[0];
    console.log("Owner found:", owner);

    const isMatch = await bcrypt.compare(password, owner.password);
    console.log("Password match:", isMatch);

    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { ownerId: owner.owner_id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    console.log("Generated token");
    res.json({ token, ownerId: owner.owner_id, username: owner.username });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: err.message });
  }
};

