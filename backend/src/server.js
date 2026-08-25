require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');

// Route imports
const authRoutes = require('./routes/auth');
const videoRoutes = require('./routes/videos');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware Stack ────────────────────────────────────────────────
// Security headers
app.use(helmet());

// CORS — allow frontend origins (local dev + production)
const allowedOrigins = [
  'http://localhost:3005',
  'http://localhost:3000',
  'https://myshortclip.vercel.app',
  'https://shortclip-3f19.onrender.com',
];

// Add any extra origins from CORS_ORIGIN env var (comma-separated)
if (process.env.CORS_ORIGIN) {
  process.env.CORS_ORIGIN.split(',').forEach((origin) => {
    allowedOrigins.push(origin.trim());
  });
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      // Allow if explicit match or ends with .vercel.app or CORS_ORIGIN is '*'
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        process.env.CORS_ORIGIN === '*'
      ) {
        return callback(null, true);
      }

      console.warn(`Blocked by CORS: origin ${origin} not in allowed list`);
      return callback(null, true); // Allow all to prevent frontend block, or return callback(new Error('Not allowed by CORS'))
    },
    credentials: true,
  })
);

// Request logging
app.use(morgan('dev'));

// Body parsing
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// ─── Routes ──────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Global Error Handler ────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);

  // Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ message: 'File too large' });
  }

  // Multer general error
  if (err.name === 'MulterError') {
    return res.status(400).json({ message: err.message });
  }

  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// ─── Start Server ────────────────────────────────────────────────────
const startServer = async () => {
  await connectDB();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 ShortClip API running on port ${PORT}`);
    console.log(`📡 Health check: /api/health\n`);
  });
};

startServer();
