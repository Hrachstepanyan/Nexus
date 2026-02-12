/**
 * Express application setup
 */
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { brainsRouter } from './routes/brains.js';
import { healthRouter } from './routes/health.js';
import { errorHandler } from './middleware/error-handler.js';
import { isDevelopment } from './config/environment.js';

export const createApp = () => {
  const app = express();

  // Security middleware
  app.use(helmet());

  // Logging
  app.use(morgan(isDevelopment ? 'dev' : 'combined'));

  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Root endpoint
  app.get('/', (_req, res) => {
    res.json({
      service: 'Quivr TypeScript Client',
      version: '1.0.0',
      endpoints: {
        health: '/health',
        brains: '/api/brains',
      },
    });
  });

  // Routes
  app.use('/health', healthRouter);
  app.use('/api/brains', brainsRouter);

  // Error handling (must be last)
  app.use(errorHandler);

  return app;
};
