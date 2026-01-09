
const express = require("express");
const { Pool } = require("pg");

const app = express();
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  host: "localhost",
  user: "postgres",
  password: "your_password",
  database: "your_database",
  port: 5432,
});

// CREATE
app.post("/users", async (req, res) => {
  try {
    const { id, name, age1 } = req.body;

    const result = await pool.query(
      "INSERT INTO users (id, name, age1) VALUES ($1, $2, $3) RETURNING *",
      [id, name, age1]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ ALL
app.get("/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ ONE
app.get("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "SELECT * FROM users WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE
app.put("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, age1 } = req.body;

    const result = await pool.query(
      "UPDATE users SET name = $1, age1 = $2 WHERE id = $3 RETURNING *",
      [name, age1, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE
app.delete("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM users WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
