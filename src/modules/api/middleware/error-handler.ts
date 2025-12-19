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
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    errorType: err.constructor.name,
  });

  // Handle domain-specific errors
  if (err instanceof DomainError) {
    return res.status(err.statusCode).json(err.toJSON());
  }

  // Handle validation errors from zod or other validators
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Invalid request data.',
      details: (err as any).errors,
    });
  }

  // Handle JSON parsing errors
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({
      error: 'INVALID_JSON',
      message: 'Invalid JSON in request body.',
    });
  }

  // Generic server error - don't leak internal details
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
