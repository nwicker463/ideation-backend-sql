const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all ideas
router.get('/', (req, res) => {
  db.all('SELECT * FROM ideas ORDER BY created_at ASC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Add a new idea
router.post('/', (req, res) => {
  const { content, parentId } = req.body;
  db.run(
    'INSERT INTO ideas (content, parent_id) VALUES (?, ?)',
    [content, parentId || null],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID, content, parent_id: parentId });
    }
  );
});

module.exports = router;
