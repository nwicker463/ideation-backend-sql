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
    // Insert only if not already present
    const existing = await db.query(
      'SELECT id FROM waiting_users WHERE user_id = $1',
      [userId]
    );

    if (existing.rows.length === 0) {
      await db.query(
        'INSERT INTO waiting_users (user_id) VALUES ($1)',
        [userId]
      );
      console.log(`Added ${userId} to waiting_users`);
    } else {
      console.log(`${userId} was already in waiting_users`);
    }

        // ✅ Group formation logic
    const waiting = await db.query(`
      SELECT id, user_id
      FROM waiting_users
      WHERE group_id IS NULL 
      AND last_heartbeat > NOW() - INTERVAL '3 seconds'
      ORDER BY created_at ASC
    `);

    if (waiting.rows.length >= 3) {
      const group = await db.query(
        `INSERT INTO groups DEFAULT VALUES RETURNING id`
      );
      const groupId = group.rows[0].id;
      const selected = waiting.rows.slice(0, 3);
      const labels = ['User A', 'User B', 'User C'];

      for (let i = 0; i < selected.length; i++) {
        await db.query(
          `UPDATE waiting_users 
           SET group_id = $1, label = $2 
           WHERE id = $3`,
          [groupId, labels[i], selected[i].id]
        );
      }

      console.log(`🎉 Formed group ${groupId}:`, selected.map(u => u.user_id));
    }
    // Always respond OK
    return res.json({ success: true });

  } catch (err) {
    console.error('Failed inserting user:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user's heartbeat (last seen time)
router.post('/:userId/heartbeat', async (req, res) => {
  const { userId } = req.params;
  try {
    await db.query(
      'UPDATE waiting_users SET last_heartbeat = NOW() WHERE user_id = $1',
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
      WHERE group_id IS NULL AND last_heartbeat > NOW() - INTERVAL '3 seconds'
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

    if (result.rows.length === 0) {
      // User not found → return "not yet registered", NOT an error
      return res.json({ groupId: null, label: null });
    }

    const { group_id, label } = result.rows[0];

    res.json({
      groupId: group_id || null,
      label: label || null
    });

  } catch (err) {
    console.error("Error reading waiting user:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


module.exports = router;