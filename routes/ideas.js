const express = require('express');
const router = express.Router();
const db = require('../db');



// Original flat list endpoint
router.get('/group/:groupId', async (req, res) => {
  const { groupId } = req.params;
  try {
    const result = await db.query(
      'SELECT * FROM ideas WHERE group_id = $1 ORDER BY created_at ASC',
      [groupId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// New tree-structured endpoint
router.get('/group/:groupId/tree', async (req, res) => {
  const { groupId } = req.params;

  try {
    const result = await db.query(
      'SELECT * FROM ideas WHERE group_id = $1 ORDER BY created_at ASC',
      [groupId]
    );

    const ideas = result.rows;

    const ideaMap = {};
    ideas.forEach(idea => {
      idea.children = [];
      ideaMap[idea.id] = idea;
    });

    const tree = [];
    ideas.forEach(idea => {
      if (idea.parent_id) {
        ideaMap[idea.parent_id]?.children.push(idea);
      } else {
        tree.push(idea);
      }
    });

    res.json(tree);
  } catch (err) {
    console.error('Error building idea tree:', err);
    res.status(500).json({ error: err.message });
  }
});

// Post a new idea to a specific group
router.post('/group/:groupId', async (req, res) => {
  const { groupId } = req.params;
  const { content, parentId, label } = req.body;
  await db.query(
    'INSERT INTO ideas (content, parent_id, group_id, contributor_label) VALUES ($1, $2, $3, $4) RETURNING *',
    [content, parentId || null, groupId, label]
  );
});

router.get('/summary/group/:groupId', async (req, res) => {
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
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;