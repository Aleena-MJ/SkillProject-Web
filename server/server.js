require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Initialize database
const db = require('./config/db');

// Import route modules
const authRoutes = require('./routes/authRoutes');
const skillRoutes = require('./routes/skillRoutes');
const requestRoutes = require('./routes/requestRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PUBLIC_DIR = path.resolve(__dirname, '../public');

// Serve static frontend files from 'public' directory
app.use(express.static(PUBLIC_DIR));

// Explicit homepage root route
app.get('/', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/requests', requestRoutes);

// Catch-all for undefined API routes
app.all('/api/{*splat}', (req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found' });
});

// Fallback to index.html for client-side routing
app.get('/{*splat}', (req, res) => {
  res.sendFile('index.html', { root: PUBLIC_DIR });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    message: 'An internal server error occurred.'
  });
});

// Start Server
const server = app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 SkillProject-Web Server is running!`);
  console.log(`📍 Local URL:    http://localhost:${PORT}`);
  console.log(`📍 IPv4 URL:     http://127.0.0.1:${PORT}`);
  console.log(`⚙️  Environment:  ${process.env.NODE_ENV || 'development'}`);
  console.log(`=========================================`);
});

module.exports = { app, server };
