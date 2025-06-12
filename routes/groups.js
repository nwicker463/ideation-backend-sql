const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.send('Groups route works');
});

module.exports = router;
