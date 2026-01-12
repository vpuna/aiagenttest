// server.js
"use strict";

const express = require("express");
const { Pool } = require("pg");

const app = express();
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  host: process.env.PGHOST || "localhost",
  user: process.env.PGUSER || "postgres",
  password: process.env.PGPASSWORD || "your_password",
  database: process.env.PGDATABASE || "your_database",
  port: Number(process.env.PGPORT) || 5432,
});

// Optional: quick connectivity check on startup
pool
  .query("SELECT 1")
  .then(() => console.log("PostgreSQL connected"))
  .catch((err) => {
    console.error("PostgreSQL connection error:", err.message);
    process.exit(1);
  });

// CREATE
app.post("/users", async (req, res) => {
  try {
    const { name, age, address, address2 } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "name is required (string)" });
    }
    if (typeof age !== "number" || !Number.isFinite(age)) {
      return res.status(400).json({ error: "age is required (number)" });
    }
    if (typeof address !== "string" || !address.trim()) {
      return res.status(400).json({ error: "address is required (string)" });
    }
    if (address2 && typeof address2 !== "string") {
      return res.status(400).json({ error: "address2 must be a string if provided" });
    }

    const result = await pool.query(
      "INSERT INTO users (name, age, address, address2) VALUES ($1, $2, $3, $4) RETURNING *",
      [name.trim(), age, address.trim(), address2 ? address2.trim() : null]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// READ ALL
app.get("/users", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, age, address, address2 FROM users ORDER BY id ASC"
    );
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// READ ONE
app.get("/users/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "id must be an integer" });
    }

    const result = await pool.query(
      "SELECT id, name, age, address, address2 FROM users WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// UPDATE
app.put("/users/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "id must be an integer" });
    }

    const { name, age, address, address2 } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "name is required (string)" });
    }
    if (typeof age !== "number" || !Number.isFinite(age)) {
      return res.status(400).json({ error: "age is required (number)" });
    }
    if (typeof address !== "string" || !address.trim()) {
      return res.status(400).json({ error: "address is required (string)" });
    }
    if (address2 && typeof address2 !== "string") {
      return res.status(400).json({ error: "address2 must be a string if provided" });
    }

    const result = await pool.query(
      "UPDATE users SET name = $1, age = $2, address = $3, address2 = $4 WHERE id = $5 RETURNING *",
      [name.trim(), age, address.trim(), address2 ? address2.trim() : null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// DELETE
app.delete("/users/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "id must be an integer" });
    }

    const result = await pool.query(
      "DELETE FROM users WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ message: "User deleted successfully" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Start server
const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
