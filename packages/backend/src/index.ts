import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'MoneyQuest Backend Development Server' });
});

// API routes placeholder
app.get('/api', (req, res) => {
  res.json({
    message: 'MoneyQuest API Development Server',
    version: '0.1.0',
    endpoints: [
      '/health',
      '/api'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 MoneyQuest Backend running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 Development mode enabled`);
});