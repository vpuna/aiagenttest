// server.js changes in main branch
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

/*
Note: The 'address' column was removed from the DB table according to metadata changes.
This codebase does not reference the 'address' column, so no code changes were necessary.
*/

// CREATE
app.post("/users", async (req, res) => {
  try {
    const { fname, lname, age, occupation } = req.body;

    if (typeof fname !== "string" || !fname.trim()) {
      return res.status(400).json({ error: "fname is required (string)" });
    }
    if (typeof lname !== "string" || !lname.trim()) {
      return res.status(400).json({ error: "lname is required (string)" });
    }
    if (typeof age !== "number" || !Number.isFinite(age)) {
      return res.status(400).json({ error: "age is required (number)" });
    }
    if (typeof occupation !== "string" || !occupation.trim()) {
      return res.status(400).json({ error: "occupation is required (string)" });
    }

    const result = await pool.query(
      "INSERT INTO users (fname, lname, age, occupation) VALUES ($1, $2, $3, $4) RETURNING *",
      [fname.trim(), lname.trim(), age, occupation.trim()]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// READ ALL
app.get("/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT id, fname, lname, age, occupation FROM users ORDER BY id ASC");


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

    const result = await pool.query("SELECT id, fname, lname, age, occupation FROM users WHERE id = $1", [id]);

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

    const { fname, lname, age, occupation } = req.body;

    if (typeof fname !== "string" || !fname.trim()) {
      return res.status(400).json({ error: "fname is required (string)" });
    }
    if (typeof lname !== "string" || !lname.trim()) {
      return res.status(400).json({ error: "lname is required (string)" });
    }
    if (typeof age !== "number" || !Number.isFinite(age)) {
      return res.status(400).json({ error: "age is required (number)" });
    }
    if (typeof occupation !== "string" || !occupation.trim()) {
      return res.status(400).json({ error: "occupation is required (string)" });
    }

    const result = await pool.query(
      "UPDATE users SET fname = $1, lname = $2, age = $3, occupation = $4 WHERE id = $5 RETURNING *",
      [fname.trim(), lname.trim(), age, occupation.trim(), id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PARTIAL UPDATE
app.patch("/users/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "id must be an integer" });
    }

    const { fname, lname, age, occupation } = req.body;
    const updates = [];
    const values = [];
    let parameterIndex = 1;

    if (fname !== undefined) {
      if (typeof fname !== "string" || !fname.trim()) {
        return res.status(400).json({ error: "fname must be a non-empty string" });
      }
      updates.push(`fname = $${parameterIndex}`);
      values.push(fname.trim());
      parameterIndex += 1;
    }

    if (lname !== undefined) {
      if (typeof lname !== "string" || !lname.trim()) {
        return res.status(400).json({ error: "lname must be a non-empty string" });
      }
      updates.push(`lname = $${parameterIndex}`);
      values.push(lname.trim());
      parameterIndex += 1;
    }

    if (age !== undefined) {
      if (typeof age !== "number" || !Number.isFinite(age)) {
        return res.status(400).json({ error: "age must be a number" });
      }
      updates.push(`age = $${parameterIndex}`);
      values.push(age);
      parameterIndex += 1;
    }

    if (occupation !== undefined) {
      if (typeof occupation !== "string" || !occupation.trim()) {
        return res.status(400).json({ error: "occupation must be a non-empty string" });
      }
      updates.push(`occupation = $${parameterIndex}`);
      values.push(occupation.trim());
      parameterIndex += 1;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "at least one field (fname, lname, age, occupation) is required" });
    }

    values.push(id);

    const result = await pool.query(
      `UPDATE users SET ${updates.join(", ")} WHERE id = $${parameterIndex} RETURNING *`,
      values
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
