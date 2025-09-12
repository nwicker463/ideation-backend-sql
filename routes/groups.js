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
    const result = await db.query('SELECT * FROM groups ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get('/:groupId/time', async (req, res) => {
  const { groupId } = req.params;
  const result = await db.query(
    'SELECT created_at FROM groups WHERE id = $1',
    [groupId]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Group not found' });
  }

  const startTime = result.rows[0].created_at;
  const duration = 10 * 60 * 1000; // 10 minutes in ms
  const endTime = new Date(startTime).getTime() + duration;

  res.json({ endTime });
});


module.exports = router;
