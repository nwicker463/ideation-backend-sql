const express = require('express');
const router = express.Router();
const db = require('../db');

// Create a new group
router.post('/', async (req, res) => {
  const { name } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO groups (name) VALUES ($1) RETURNING *',
      [name]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('POST /api/groups error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get all groups (optional convenience route)
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM groups ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get group timer start time
/*router.get('/:id/timer', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query(
      'SELECT timer_start FROM groups WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Group not found' });

    res.json({ timerStart: result.rows[0].timer_start });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start the timer for a group
router.post('/:id/timer/start', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query(
      'UPDATE groups SET timer_start = NOW() WHERE id = $1 RETURNING timer_start',
      [id]
    );
    res.json({ timerStart: result.rows[0].timer_start });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start timer when first user joins
router.post('/:groupId/start', async (req, res) => {
  const { groupId } = req.params;

  try {
    // Check if timer already exists
    const existing = await db.query(
      'SELECT * FROM group_timers WHERE group_id = $1',
      [groupId]
    );

    if (existing.rows.length > 0) {
      return res.json(existing.rows[0]); // Already started
    }

    // Start new timer
    const result = await db.query(
      'INSERT INTO group_timers (group_id, start_time) VALUES ($1, CURRENT_TIMESTAMP) RETURNING *',
      [groupId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error starting timer:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});*/

router.get('/:groupId/time', async (req, res) => {
  const { groupId } = req.params;
  const result = await db.query(
    'SELECT created_at FROM groups WHERE id = $1',
    [groupId]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Group not found' });
  }

  const startTime = result.rows[0].created_at;
  const duration = 10 * 60 * 1000; // 10 minutes in ms
  const endTime = new Date(startTime).getTime() + duration;

  res.json({ endTime });
});


module.exports = router;
