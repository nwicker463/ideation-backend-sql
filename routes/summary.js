const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/summary/group/:groupId', async (req, res) => {
  const { groupId } = req.params;
  try {
    const result = await db.query(
      `
      SELECT w.label AS username, COUNT(*) as idea_count
      FROM ideas i
      JOIN waiting_users w ON i.user_id = w.user_id
      WHERE i.group_id = $1
      GROUP BY w.label
      `,
      [groupId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Summary query error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;