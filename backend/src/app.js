import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import apiRoutes from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import { isPostgresConnected } from './db/index.js';

export function createApp() {
  const app = express();

  app.use(cors({ origin: config.clientOrigin, credentials: true }));
  app.use(express.json({ strict: false, limit: '10mb' }));
  app.use(express.text({ type: ['text/*', 'application/hl7-v2', 'application/x-hl7', 'application/octet-stream'], limit: '10mb' }));

  const healthHandler = (_req, res) => {
    const memory = process.memoryUsage();
    res.json({
      status: 'HEALTHY',
      service: 'St. Michael Medium Clinic HMS Core API',
      version: '1.0.0',
      uptimeSeconds: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'production',
      database: {
        mode: isPostgresConnected ? 'PostgreSQL (Prisma)' : 'In-Memory Engine (Active)',
        connected: true,
      },
      memory: {
        rssMb: Math.round(memory.rss / (1024 * 1024)),
        heapUsedMb: Math.round(memory.heapUsed / (1024 * 1024)),
        heapTotalMb: Math.round(memory.heapTotal / (1024 * 1024)),
      },
      timestamp: new Date().toISOString(),
    });
  };

  app.get('/health', healthHandler);
  app.get('/api/health', healthHandler);

  app.use('/api', apiRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
