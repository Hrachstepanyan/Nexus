/**
 * Health check routes
 */
import type { Request, Response } from 'express';
import { Router } from 'express';
import { quivrClient } from '../client/quivr-client.js';
import { asyncHandler } from '../middleware/async-handler.js';

export const healthRouter = Router();

/**
 * GET /health - Service health check
 */
healthRouter.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    try {
      const pythonHealth = await quivrClient.health();
      res.json({
        typescript_service: 'healthy',
        python_service: pythonHealth.status,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(503).json({
        typescript_service: 'healthy',
        python_service: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
  }),
);
