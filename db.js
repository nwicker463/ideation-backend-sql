const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const DB_PATH = process.env.DB_PATH || './ideas.db';
const db = new sqlite3.Database(DB_PATH);

// Load schema if not already present
const schema = fs.readFileSync(path.join(__dirname, 'db', 'schema.sql'), 'utf-8');
db.exec(schema, (err) => {
  if (err) console.error('Schema setup error:', err.message);
});

module.exports = db;
