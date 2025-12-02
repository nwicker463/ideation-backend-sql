const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/messages/group/:groupId
router.get('/group/:groupId', async (req, res) => {
  const { groupId } = req.params;
  try {
    const result = await db.query(
      `SELECT m.id, m.message, m.created_at, m.user_id, w.label AS contributor_label
       FROM messages m
       LEFT JOIN waiting_users w ON m.user_id = w.user_id
       WHERE m.group_id = $1
       ORDER BY m.created_at ASC`,
      [groupId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch chat error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/messages/group/:groupId
router.post('/group/:groupId', async (req, res) => {
  const { groupId } = req.params;
  const { userId, message } = req.body;

  if (!message || !userId) {
    return res.status(400).json({ error: 'userId and message are required' });
  }

  try {
    const result = await db.query(
      `INSERT INTO messages (group_id, user_id, message, created_at) 
       VALUES ($1, $2, $3, NOW()) 
       RETURNING *`,
      [groupId, userId, message]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Insert chat error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
