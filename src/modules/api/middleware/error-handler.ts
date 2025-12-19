import { Request, Response, NextFunction } from 'express';
import { DomainError } from '../../../shared/errors';
import logger from '../../../shared/logger';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  logger.error('Request error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  if (err instanceof DomainError) {
    return res.status(err.statusCode).json(err.toJSON());
  }

  return res.status(500).json({
    error: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred. Please try again later.',
  });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: `Route ${req.method} ${req.path} not found`,
  });
}
