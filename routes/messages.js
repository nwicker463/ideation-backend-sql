const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/messages/group/:groupId
router.get('/group/:groupId', async (req, res) => {
  const { groupId } = req.params;
  try {
    const result = await db.query(
      `SELECT m.id, m.content, m.created_at, m.contributor_label, w.label AS contributor_label
       FROM messages m
       LEFT JOIN waiting_users w ON m.contributor_label = w.contributor_label
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
  const { userId, content } = req.body;

  if (!content || !userId) {
    return res.status(400).json({ error: 'userId and content are required' });
  }

  try {
    const result = await db.query(
      `INSERT INTO messages (group_id, contributor_label, content, created_at) 
       VALUES ($1, $2, $3, NOW()) 
       RETURNING *`,
      [groupId, userId, content]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Insert chat error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
