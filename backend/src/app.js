import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import apiRoutes from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  app.use(cors({ origin: config.clientOrigin, credentials: true }));
  app.use(express.json({ strict: false, limit: '10mb' }));
  app.use(express.text({ type: ['text/*', 'application/hl7-v2', 'application/x-hl7', 'application/octet-stream'], limit: '10mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'St. Michael Medium Clinic API', time: new Date().toISOString() });
  });

  app.use('/api', apiRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
