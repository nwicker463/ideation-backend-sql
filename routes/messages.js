const express = require('express');
const router = express.Router();
const db = require('../db');

// Get messages for a group
router.get('/group/:groupId', async (req, res) => {
  const { groupId } = req.params;
  try {
    const result = await db.query(
      'SELECT * FROM messages WHERE group_id = $1 ORDER BY created_at ASC',
      [groupId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Post a message to a group
router.post('/group/:groupId', async (req, res) => {
  const { content, userId, username } = req.body;
  const { groupId } = req.params;
  try {
    db.query(
      'INSERT INTO messages (group_id, user_id, username, content) VALUES ($1, $2, $3, $4)',
      [groupId, userId, username, content]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
