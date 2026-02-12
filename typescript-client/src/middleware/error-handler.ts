/**
 * Global error handling middleware for Express
 */
import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { QuivrClientError } from '../client/quivr-client.js';

export const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  // Validation errors
  if (error instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation error',
      details: error.errors,
    });
  }

  // Quivr client errors
  if (error instanceof QuivrClientError) {
    return res.status(error.statusCode ?? 500).json({
      error: error.message,
      details: error.details,
    });
  }

  // Generic errors
  console.error('Unhandled error:', error);
  return res.status(500).json({
    error: 'Internal server error',
    message: error.message,
  });
};
