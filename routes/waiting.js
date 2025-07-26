const express = require('express');
const router = express.Router();
const db = require('../db');

// Add a user to the waiting list
router.post('/', async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    // Add user to waiting list
    const insertResult = await db.query(
      'INSERT INTO waiting_users (user_id) VALUES ($1) RETURNING *',
      [userId]
    );

    // Count users waiting without a group
    const waitingResult = await db.query(
      'SELECT * FROM waiting_users WHERE group_id IS NULL ORDER BY created_at ASC'
    );

    let groupAssigned = false;

    // If there are 3 waiting users, assign a group
    if (waitingResult.rows.length >= 3) {
      const group = await db.query(
        'INSERT INTO groups (name) VALUES ($1) RETURNING id',
        [`Group ${Date.now()}`]
      );
      const groupId = group.rows[0].id;

      const usersToAssign = waitingResult.rows.slice(0, 3);
      for (const user of usersToAssign) {
        await db.query(
          'UPDATE waiting_users SET group_id = $1 WHERE id = $2',
          [groupId, user.id]
        );
      }

      groupAssigned = true;
    }

    // ✅ Respond only once
    res.status(201).json({
      user: insertResult.rows[0],
      groupAssigned
    });
  } catch (err) {
    console.error('Failed to add user to waiting list:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users in the waiting list
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM waiting_users');
    res.json(result.rows);
  } catch (err) {
    console.error('Failed to fetch waiting users:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get group assignment for a user
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await db.query(
      'SELECT group_id FROM waiting_users WHERE user_id = $1',
      [userId]
    );

    console.log('Fetched user info:', result.rows[0]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found in waiting list' });
    }

    res.json({ groupId: result.rows[0].group_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


module.exports = router;