import pool from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";

export const registerOwner = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      name,
      phone_number,
      gender,
      dob,
      age,
      aadhar_number,
    } = req.body;

    // basic required fields
    if (!username || !email || !password) {
      return res.status(400).json({ message: "username, email and password are required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // normalize optional values
    const nameVal = name === undefined ? null : name;
    const phoneVal = phone_number === undefined ? null : phone_number;
    const genderVal = gender === undefined ? null : gender;
    const dobVal = dob === undefined || dob === "" ? null : dob; // expected YYYY-MM-DD or null
    const ageVal = age === undefined || age === "" ? null : Number(age);
    // If aadhar number is provided, store a deterministic hash (SHA-256) so the raw number is not stored.
    // Use an optional server-side pepper from env for extra protection while keeping the hash deterministic.
    const aadharVal = (() => {
      if (aadhar_number === undefined || aadhar_number === null || String(aadhar_number).trim() === "") return null;
      const pepper = process.env.AADHAR_PEPPER || "";
      const normalized = String(aadhar_number).replace(/\D/g, ""); // keep digits only
      return crypto.createHash("sha256").update(normalized + pepper).digest("hex");
    })();

    const [result] = await pool.query(
      `INSERT INTO owner (username, email, password, name, phone_number, gender, dob, age, aadhar_number)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [username, email, hashedPassword, nameVal, phoneVal, genderVal, dobVal, ageVal, aadharVal]
    );

    res.status(201).json({ message: "Owner registered successfully", ownerId: result.insertId });
  } catch (err) {
    // handle unique constraint / duplicate key more clearly
    if (err && err.code === "ER_DUP_ENTRY") {
      // MySQL error message contains the duplicate key; keep response concise
      return res.status(409).json({ message: "Duplicate entry: username, email or aadhar_number already exists" });
    }
    console.error("registerOwner error:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
};

export const loginOwner = async (req, res) => {
  try {
    const { email, password } = req.body;
    const [owners] = await pool.query("SELECT * FROM owner WHERE email = ?", [email]);
    if (owners.length === 0) return res.status(404).json({ message: "Owner not found" });

    const owner = owners[0];
    const isMatch = await bcrypt.compare(password, owner.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ ownerId: owner.owner_id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({ token, ownerId: owner.owner_id, username: owner.username });
  } catch (err) {
    console.error("loginOwner error:", err);
    res.status(500).json({ error: err.message });
  }
};
