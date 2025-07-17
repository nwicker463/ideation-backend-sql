const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/waiting
router.post('/waiting', async (req, res) => {
  const { userId } = req.body;

  // Add user to queue
  await db.query(
    'INSERT INTO waiting_users (user_id) VALUES ($1)',
    [userId]
  );

  // Count users waiting without a group
  const result = await db.query(
    'SELECT * FROM waiting_users WHERE group_id IS NULL ORDER BY created_at ASC'
  );

  // If there are 3 waiting users, assign a group
  if (result.rows.length >= 3) {
    const group = await db.query(
      'INSERT INTO groups (name) VALUES ($1) RETURNING id',
      [`Group ${Date.now()}`]
    );
    const groupId = group.rows[0].id;

    // Assign the group to the first 3 users
    const usersToAssign = result.rows.slice(0, 3);
    for (const user of usersToAssign) {
      await db.query(
        'UPDATE waiting_users SET group_id = $1 WHERE id = $2',
        [groupId, user.id]
      );
    }
  }

  res.json({ success: true });
});

// GET /api/waiting/:userId
router.get('/waiting/:userId', async (req, res) => {
  const { userId } = req.params;
  const result = await db.query(
    'SELECT group_id FROM waiting_users WHERE user_id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'User not found in waiting list' });
  }

  const groupId = result.rows[0].group_id;
  if (groupId) {
    res.json({ groupId });
  } else {
    res.json({ groupId: null });
  }
});

module.exports = router;