import { Request, Response, NextFunction } from 'express';
import logger from '../../../shared/logger';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();

  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
  });

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
    });
  });

  next();
}
