const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');

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
      WHERE group_id IS NULL AND last_heartbeat > NOW() - INTERVAL '10 seconds'
      ORDER BY created_at ASC`
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Failed to fetch waiting users:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Automatically form groups of 3
router.post('/check-group', async (req, res) => {
  try {
    // Find users whose last heartbeat is fresh
    const freshUsers = await db.query(`
      SELECT user_id FROM waiting_users
      WHERE group_id IS NULL
      AND last_heartbeat > NOW() - INTERVAL '5 seconds'
      ORDER BY created_at ASC
      LIMIT 3;
    `);

    if (freshUsers.rows.length === 3) {
      const groupId = uuidv4();
      const labels = ['A','B','C']; // or however you label

      for (let i = 0; i < 3; i++) {
        await db.query(
          `UPDATE waiting_users
          SET group_id = $1, label = $2
          WHERE user_id = $3`,
          [groupId, labels[i], freshUsers.rows[i].user_id]
        );
      }

      console.log("✅ Group formed:", groupId, freshUsers.rows.map(r => r.user_id));
    }

    res.json({ formed: false });

  } catch (err) {
    console.error("❌ Group formation error:", err);
    res.status(500).json({ error: "Internal server error" });
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