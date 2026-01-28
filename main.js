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
    const { name, age, occupation } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "name is required (string)" });
    }
    if (typeof age !== "number" || !Number.isFinite(age)) {
      return res.status(400).json({ error: "age is required (number)" });
    }
    if (occupation !== undefined && occupation !== null) {
      if (typeof occupation !== "string" || !occupation.trim()) {
        return res
          .status(400)
          .json({ error: "occupation must be a non-empty string" });
      }
    }

    const result = await pool.query(
      "INSERT INTO users (name, age, occupation) VALUES ($1, $2, $3) RETURNING *",
      [name.trim(), age, occupation === undefined ? null : occupation?.trim()]
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
      "SELECT id, name, age, occupation FROM users ORDER BY id ASC"
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
      "SELECT id, name, age, occupation FROM users WHERE id = $1",
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

    const { name, age, occupation } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "name is required (string)" });
    }
    if (typeof age !== "number" || !Number.isFinite(age)) {
      return res.status(400).json({ error: "age is required (number)" });
    }
    if (occupation !== undefined && occupation !== null) {
      if (typeof occupation !== "string" || !occupation.trim()) {
        return res
          .status(400)
          .json({ error: "occupation must be a non-empty string" });
      }
    }

    const result = await pool.query(
      "UPDATE users SET name = $1, age = $2, occupation = $3 WHERE id = $4 RETURNING *",
      [name.trim(), age, occupation === undefined ? null : occupation?.trim(), id]
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

    const { name, age, occupation } = req.body;
    const updates = [];
    const values = [];
    let parameterIndex = 1;

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ error: "name must be a non-empty string" });
      }
      updates.push(`name = $${parameterIndex}`);
      values.push(name.trim());
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
      if (occupation !== null) {
        if (typeof occupation !== "string" || !occupation.trim()) {
          return res
            .status(400)
            .json({ error: "occupation must be a non-empty string" });
        }
        updates.push(`occupation = $${parameterIndex}`);
        values.push(occupation.trim());
      } else {
        updates.push(`occupation = $${parameterIndex}`);
        values.push(null);
      }
      parameterIndex += 1;
    }

    if (updates.length === 0) {
      return res
        .status(400)
        .json({ error: "at least one field (name, age, occupation) is required" });
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
