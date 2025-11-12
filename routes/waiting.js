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

    // Always respond OK
    return res.json({ success: true });

  } catch (err) {
    console.error('Failed inserting user:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user's heartbeat (last seen time)
/*router.post('/:userId/heartbeat', async (req, res) => {
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
});*/

// Check whether enough users are waiting to form a group
/*router.post("/check-group", async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT user_id FROM waiting_users
       WHERE group_id IS NULL
       ORDER BY created_at ASC`
    );

    if (rows.length < 3) {
      return res.json({ groupFormed: false });
    }

    // Take the first three
    const groupUsers = rows.slice(0, 3);
    const groupId = Math.floor(Date.now() / 1000); // simple integer group id

    // Assign labels
    await db.query(
      `UPDATE waiting_users
       SET group_id = $1, label = CASE
         WHEN user_id = $2 THEN 'User A'
         WHEN user_id = $3 THEN 'User B'
         WHEN user_id = $4 THEN 'User C'
       END
       WHERE user_id IN ($2, $3, $4)`,
      [groupId, groupUsers[0].user_id, groupUsers[1].user_id, groupUsers[2].user_id]
    );

    console.log(`🎉 GROUP FORMED: ${groupId}`);
    console.log("Users:", groupUsers.map(u => u.user_id));

    return res.json({ groupFormed: true });
  } catch (err) {
    console.error("❌ Error forming group:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});*/

// Get all users in the waiting list
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM waiting_users 
      WHERE group_id IS NULL
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

  /*try {
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
  }*/
 // FORM GROUPS OF EXACTLY 3 USERS
  try {
    // Get all waiting users who don't have a group yet
    const waiting = await db.query(`
      SELECT id, user_id
      FROM waiting_users
      WHERE group_id IS NULL
      ORDER BY created_at ASC
    `);

    if (waiting.rows.length >= 3) {
      // Create a new group
      const groupResult = await db.query(
        `INSERT INTO groups (name) VALUES ($1) RETURNING id`,
        [`Group ${Date.now()}`]
      );
      const newGroupId = groupResult.rows[0].id;

      // Assign labels based on join order
      const labels = ["User A", "User B", "User C"];

      for (let i = 0; i < 3; i++) {
        await db.query(
          `UPDATE waiting_users
          SET group_id = $1, label = $2
          WHERE id = $3`,
          [newGroupId, labels[i], waiting.rows[i].id]
        );
      }

      console.log(`✅ Formed group ${newGroupId} with users:`, waiting.rows.slice(0, 3));
    }
    res.json({
      group_id: group_id || null,
      label: label || null
    });
  } catch (err) {
    console.error("❌ Error forming group:", err);
    res.status(500).json({ error: "Internal server error" });
  }

});

module.exports = router;