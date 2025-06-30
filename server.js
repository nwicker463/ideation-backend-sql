const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const ideaRoutes = require('./routes/ideas');
const groupRoutes = require('./routes/groups');
const messageRoutes = require('./routes/messages');

app.use('/api/ideas', ideaRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/messages', messageRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
