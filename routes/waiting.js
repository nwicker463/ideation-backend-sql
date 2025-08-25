const express = require('express');
const router = express.Router();
const db = require('../db');

// Add a user to the waiting list
router.post('/', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  try {
    const result = await db.query(
      'INSERT INTO waiting_users (user_id) VALUES ($1) RETURNING *',
      [userId]
    );

    // Check if a group can be formed
    const waiting = await db.query(
      'SELECT * FROM waiting_users WHERE group_id IS NULL ORDER BY created_at ASC'
    );

    // Count ACTIVE users (heartbeat within 10s, not yet in group)
    const activeUsers = await db.query(
      `SELECT * FROM waiting_users 
       WHERE group_id IS NULL 
       AND last_seen > NOW() - INTERVAL '10 seconds'
       ORDER BY created_at ASC`
    );

    // Require exactly 3 users before creating group
    if (activeUsers.rows.length >= 3) {
      const group = await db.query(
        'INSERT INTO groups (name) VALUES ($1) RETURNING id',
        [`Group ${Date.now()}`]
      );
      const groupId = group.rows[0].id;

      // Assign the first 3 users into this new group
      const usersToAssign = activeUsers.rows.slice(0, 3);
      for (const [i, user] of usersToAssign.entries()) {
        const label = i === 0 ? "User A" : i === 1 ? "User B" : "User C";
        await db.query(
          'UPDATE waiting_users SET group_id = $1, label = $2 WHERE id = $3',
          [groupId, label, user.id]
        );
      }
    }


    return res.status(201).json({ success: true });
  } catch (err) {
    console.error('Failed to add user to waiting list:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user's heartbeat (last seen time)
router.post('/:userId/heartbeat', async (req, res) => {
  const { userId } = req.params;
  try {
    await db.query(
      'UPDATE waiting_users SET last_seen = NOW() WHERE user_id = $1',
      [userId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Failed to update heartbeat:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users in the waiting list
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM waiting_users 
      WHERE group_id IS NULL AND last_seen > NOW() - INTERVAL '10 seconds'
      ORDER BY created_at ASC`
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Failed to fetch waiting users:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await db.query(
      'SELECT group_id, label FROM waiting_users WHERE user_id = $1',
      [userId]
    );

    console.log('Fetched user info:', result.rows[0]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found in waiting list' });
    }

    const { group_id, label } = result.rows[0];
    res.json({ groupId: group_id, label });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


module.exports = router;