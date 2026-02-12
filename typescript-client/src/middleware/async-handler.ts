/**
 * Async route handler wrapper to catch errors
 */
import type { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps async route handlers to properly catch and forward errors
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
