const express = require('express');
const router = express.Router();
const db = require('../db');


// Get all ideas for a specific group
router.get('/group/:groupId', async (req, res) => {
  const { groupId } = req.params;
  try {
    const result = await db.query(
      'SELECT * FROM ideas WHERE group_id = $1 ORDER BY created_at ASC',
      [groupId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Post a new idea to a specific group
router.post('/group/:groupId', async (req, res) => {
  const { content, parentId, username } = req.body;
  const { groupId } = req.params;
  try {
    const result = await db.query(
      'INSERT INTO ideas (content, parent_id, group_id, username) VALUES ($1, $2, $3, $4) RETURNING *',
      [content, parentId || null, groupId, username]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;