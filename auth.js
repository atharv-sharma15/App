const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const connection = require("../models/database"); // Make sure this is correct

// Register Route
router.post("/register", async (req, res) => {
  const { username, email, passkey } = req.body;

  if (!username || !email || !passkey) {
    return res.status(400).json({ message: "Username, email, and passkey are required" });
  }

  try {
    // Check if user already exists
    connection.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
      if (err) {
        return res.status(500).json({ message: "Database query error" });
      }

      if (results.length > 0) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash the password before saving
      const hashedPassword = await bcrypt.hash(passkey, 10);

      // Insert the new user
      connection.query("INSERT INTO users SET ?", { username, email, passkey: hashedPassword }, (err, result) => {
        if (err) {
          return res.status(500).json({ message: "Error creating user" });
        }

        // Generate JWT token
        const token = jwt.sign({ userId: result.insertId }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(201).json({ message: "User registered successfully", token });
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Login Route
router.post("/login", (req, res) => {
  const { email, passkey } = req.body;

  if (!email || !passkey) {
    return res.status(400).json({ message: "Email and passkey are required" });
  }

  connection.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Database query error" });
    }

    if (results.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    const user = results[0];

    // Compare hashed password with the input
    const isMatch = await bcrypt.compare(passkey, user.passkey);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ message: "Login successful", token });
  });
});

module.exports = router;
