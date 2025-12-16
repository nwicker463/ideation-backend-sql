const express = require('express');
const cors = require('cors');
const db = require('../db');
require('dotenv').config();

const app = express();
const allowedOrigins = [
  'http://localhost:5173',
  'https://ideation-vite-frontend.vercel.app'
];

/* app.use(cors({
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
app.use(express.json()); */

app.use(cors({
  origin: [
    "http://localhost:5173", // local dev
    "https://ideation-vite-frontend.vercel.app" // deployed frontend
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json());

const ideaRoutes = require('./routes/ideas');
const groupRoutes = require('./routes/groups');
const messageRoutes = require('./routes/messages');
const summaryRoutes = require('./routes/summary');
const waitingRoutes = require('./routes/waiting');
const PORT = process.env.PORT || 5000;

app.use('/api/ideas', ideaRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/summary', summaryRoutes);
app.use('/api/waiting', waitingRoutes);

setInterval(async () => {
  try {
    const result = await db.query(`
      DELETE FROM waiting_users
      WHERE last_heartbeat < NOW() - INTERVAL '30 seconds'
        AND group_id IS NULL
      RETURNING user_id
    `);

    if (result.rows.length > 0) {
      console.log(
        '🧹 Removed inactive users:',
        result.rows.map(r => r.user_id)
      );
    }
  } catch (err) {
    console.error('Heartbeat cleanup failed:', err);
  }
}, 5000);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
