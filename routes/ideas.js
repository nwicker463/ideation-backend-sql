const express = require('express');
const cors = require('cors');
const router = express.Router();
const db = require('../db');

router.use(cors({
  origin: 'https://ideation-vite-frontend.vercel.app',
  methods: ['GET', 'POST'],
  credentials: true
}));

// your GET & POST routes...



// Get all ideas for a specific group, with label
router.get('/group/:groupId', async (req, res) => {
  const { groupId } = req.params;
  try {
    const result = await db.query(
      `SELECT i.id, i.content, i.parent_id, i.group_id, i.user_id, w.label AS contributor_label
       FROM ideas i
       LEFT JOIN waiting_users w ON i.user_id = w.user_id
       WHERE i.group_id = $1
       ORDER BY i.id ASC`,
      [groupId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching ideas:", err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// New tree-structured endpoint
router.get('/group/:groupId/tree', async (req, res) => {
  const { groupId } = req.params;

  try {
    const result = await db.query(
      `
      SELECT ideas.*, waiting_users.label AS contributor_label
      FROM ideas
      JOIN waiting_users ON ideas.user_id = waiting_users.user_id
      WHERE ideas.group_id = $1
      ORDER BY ideas.created_at ASC
      `,
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
  console.log('POST /group/:groupId called');
  console.log('Body:', req.body);
  console.log('Group ID param:', req.params.groupId);
  
  const { content, parentId, userId } = req.body;
  const { groupId } = req.params;

  /*try {
    const result = await db.query(
      'INSERT INTO ideas (content, parent_id, group_id, user_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [content, parentId || null, groupId, userId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error inserting idea:', err);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(500).json({ error: err.message });
  }*/

    try {
    const result = await db.query(
      'INSERT INTO ideas (content, parent_id, group_id, contributor_label, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [content, parentId || null, groupId, currentUserLabel, userId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error inserting idea:', err);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(500).json({ error: err.message });
  }
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