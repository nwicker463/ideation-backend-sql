require('dotenv').config();
const express = require('express');
const cors = require('cors');
const ideasRoutes = require('./routes/ideas');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/ideas', ideasRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`SQL backend running on port ${PORT}`);
});

app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url}`, req.body);
  next();
});
