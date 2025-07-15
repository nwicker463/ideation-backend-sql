const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/group/:groupId', async (req, res) => {
  const { groupId } = req.params;

  try {
    const result = await db.query(`
      SELECT 
        username,
        COUNT(*) FILTER (WHERE parent_id IS NULL) AS parent_count,
        COUNT(*) FILTER (WHERE parent_id IS NOT NULL) AS child_count
      FROM ideas
      WHERE group_id = $1
      GROUP BY username
    `, [groupId]);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;