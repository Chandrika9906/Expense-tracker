require('dotenv').config();
const express = require('express'); 
const cors = require('cors');
const connectDB = require('./config/database');

const app = express();

// Connect to database
// Connect to database
connectDB();

// Init Cron Jobs
require('./utils/cronJobs')();

// Middleware
app.use(cors());
app.use(express.json()); 
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/budgets', require('./routes/budgets'));
app.use('/api/bills', require('./routes/bills'));
app.use('/api/goals', require('./routes/goals'));
app.use('/api/ocr', require('./routes/ocr'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/ai', require('./routes/smartFeatures'));
app.use('/api/incomes', require('./routes/incomes'));
app.use('/api/export', require('./routes/export'));
app.use('/api/test', require('./routes/test'));
app.use('/api/advanced', require('./routes/advanced'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ message: 'Expense Tracker API is running!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use.`);
      const nextPort = parseInt(port) + 1;
      if (nextPort <= 5010) {
        console.log(`Attempting to start on fallback port ${nextPort}...`);
        startServer(nextPort);
      } else {
        console.error('All fallback ports (5001-5010) are busy. Please kill existing node processes.');
        process.exit(1);
      }
    } else {
      console.error('Server error:', err);
    }
  });
};

const INITIAL_PORT = process.env.PORT || 5001;
startServer(INITIAL_PORT);