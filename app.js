const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcrypt");
const connection = require("./models/database");

const app = express();


app.use(cors());
app.use(bodyParser.json());




app.post("/register", async (req, res) => {
  const { username, passkey } = req.body;

  if (!username || !passkey) {
    return res.status(400).json({ message: "Username and passkey are required" });
  }

  try {
 
    const hashedPassword = await bcrypt.hash(passkey, 10);

   
    const newUser = { username, passkey: hashedPassword };

    connection.query("INSERT INTO users SET ?", newUser, (err, result) => {
      if (err) {
        console.error("Error inserting user into database:", err);
        return res.status(500).json({ message: "Database error", error: err.message });
      }
      res.status(201).json({ message: "User registered successfully", userId: result.insertId });
    });
  } catch (err) {
    console.error("Error hashing passkey:", err);
    res.status(500).json({ message: "Error processing request" });
  }
});


app.post("/login", async (req, res) => {
  const { username, passkey } = req.body;

  if (!username || !passkey) {
    return res.status(400).json({ message: "Username and passkey are required" });
  }

  try {
   
    connection.query("SELECT * FROM users WHERE username = ?", [username], async (err, results) => {
      if (err) {
        console.error("Error fetching user:", err);
        return res.status(500).json({ message: "Database error" });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

   
      const user = results[0];
      const isMatch = await bcrypt.compare(passkey, user.passkey);

      if (isMatch) {
        res.status(200).json({ message: "Login successful", userId: user.id });
      } else {
        res.status(401).json({ message: "Invalid passkey" });
      }
    });
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ message: "Error processing request" });
  }
});


app.get("/users", (req, res) => {
  connection.query("SELECT id, username FROM users", (err, results) => {
    if (err) {
      console.error("Error fetching users:", err);
      return res.status(500).json({ message: "Error fetching users" });
    }
    res.status(200).json(results);
  });
});


const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
