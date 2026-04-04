require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { connectDatabase } = require('./config/db');
const errorHandler = require('./middlewares/errorHandler');
const indexRoutes = require('./routes/index.routes');
const { initializeAdminAccount } = require('./config/bootstrap');
const auditLogger = require("./middlewares/auditLogger");

const app = express();
const PORT = process.env.PORT;
const HOST = process.env.HOST;

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});

const corsOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(
  cors({
    origin: corsOrigins.length ? corsOrigins : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

app.use('/uploads', express.static('uploads'));
// app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Audit log middleware (logs successful non-GET writes)
app.use("/api", auditLogger);

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// All REST routes under /api (matches Vite proxy + frontend fetch paths)
app.use('/api', indexRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

app.use(errorHandler);

async function startServer() {
  try {
    await connectDatabase();
    await initializeAdminAccount();

    app.listen(PORT, HOST, () => {
      console.log(`🚀 Server is running on http://${HOST}:${PORT}`);
      console.log(`📊 Health: http://${HOST}:${PORT}/health`);
      console.log(`🔐 Auth login: POST http://${HOST}:${PORT}/api/auth/login`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();
