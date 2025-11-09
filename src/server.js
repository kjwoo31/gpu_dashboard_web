const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const apiRouter = require('./routes/api');
const { loadData } = require('./utils/dataService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Session configuration
app.use(session({
  secret: 'gpu-control-hub-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// API routes
app.use('/api', apiRouter);

// Main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start server
async function startServer() {
  await loadData();
  app.listen(PORT, () => {
    console.log(`GPU Control Hub running on http://localhost:${PORT}`);
  });
}

startServer();
