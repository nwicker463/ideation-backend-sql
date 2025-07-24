const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const allowedOrigins = [
  'http://localhost:5173',
  'https://ideation-vite-frontend.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow undefined origin for mobile apps or curl requests
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

const ideaRoutes = require('./routes/ideas');
const groupRoutes = require('./routes/groups');
const messageRoutes = require('./routes/messages');
const summaryRoutes = require('./routes/summary');
const waitingRoutes = require('./routes/waiting');

app.use('/api/ideas', ideaRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/summary', summaryRoutes);
app.use('/api/waiting', waitingRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
