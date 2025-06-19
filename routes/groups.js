const express = require('express');
const router = express.Router();
const db = require('../db');

// Create a new group
router.post('/', async (req, res) => {
  const { name } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO groups (name) VALUES ($1) RETURNING *',
      [name]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('POST /api/groups error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get all groups (optional convenience route)
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM groups ORDER BY created_at ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
