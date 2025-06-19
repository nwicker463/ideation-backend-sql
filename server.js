const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const ideaRoutes = require('./routes/ideas');
const groupRoutes = require('./routes/groups');

//console.log('groupRoutes is:', groupRoutes);

app.use('/api/ideas', ideaRoutes);
app.use('/api/groups', groupRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
