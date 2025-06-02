const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all ideas
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM ideas ORDER BY created_at ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST a new idea
router.post('/', async (req, res) => {
  const { content, parentId } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO ideas (content, parent_id) VALUES ($1, $2) RETURNING *',
      [content, parentId || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});
