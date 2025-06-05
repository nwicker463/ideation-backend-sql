require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const ideasRoutes = require('./routes/ideas');
app.use('/api/ideas', ideasRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


const db = require('./db');

db.query(`
  CREATE TABLE IF NOT EXISTS ideas (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    parent_id INTEGER REFERENCES ideas(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).then(() => {
  console.log("Table created");
}).catch(err => {
  console.error("Error creating table:", err);
});
