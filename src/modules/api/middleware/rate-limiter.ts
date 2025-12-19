import { Request, Response, NextFunction } from 'express';
import { TooManyRequestsError } from '../../../shared/errors';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class RateLimiter {
  private store: RateLimitStore = {};
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const key in this.store) {
      if (this.store[key].resetTime < now) {
        delete this.store[key];
      }
    }
  }

  check(identifier: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const record = this.store[identifier];

    if (!record || record.resetTime < now) {
      // New window
      this.store[identifier] = {
        count: 1,
        resetTime: now + windowMs,
      };
      return true;
    }

    if (record.count >= maxRequests) {
      return false;
    }

    record.count++;
    return true;
  }

  getRetryAfter(identifier: string): number {
    const record = this.store[identifier];
    if (!record) return 0;
    return Math.ceil((record.resetTime - Date.now()) / 1000);
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
  }
}

const rateLimiter = new RateLimiter();

// IP-based rate limiting for chat endpoint
export function chatRateLimit(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const identifier = `chat:${ip}`;
  
  // Allow 20 messages per hour per IP
  const allowed = rateLimiter.check(identifier, 20, 60 * 60 * 1000);

  if (!allowed) {
    const retryAfter = rateLimiter.getRetryAfter(identifier);
    res.setHeader('Retry-After', retryAfter);
    res.setHeader('X-RateLimit-Limit', '20');
    res.setHeader('X-RateLimit-Remaining', '0');
    res.setHeader('X-RateLimit-Reset', new Date(Date.now() + retryAfter * 1000).toISOString());
    
    throw new TooManyRequestsError(
      `Rate limit exceeded. You can send 20 messages per hour. Try again in ${retryAfter} seconds.`
    );
  }

  // Set rate limit headers
  const record = (rateLimiter as any).store[identifier];
  res.setHeader('X-RateLimit-Limit', '20');
  res.setHeader('X-RateLimit-Remaining', Math.max(0, 20 - record.count));
  res.setHeader('X-RateLimit-Reset', new Date(record.resetTime).toISOString());

  next();
}

// Aggressive rate limiting for new conversations (prevent spam)
export function conversationRateLimit(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const identifier = `conversation:${ip}`;
  
  // Allow 5 new conversations per hour per IP
  const allowed = rateLimiter.check(identifier, 5, 60 * 60 * 1000);

  if (!allowed) {
    const retryAfter = rateLimiter.getRetryAfter(identifier);
    res.setHeader('Retry-After', retryAfter);
    throw new TooManyRequestsError(
      `Too many conversations created. Limit: 5 per hour. Try again in ${retryAfter} seconds.`
    );
  }

  next();
}

// Global API rate limiting
export function globalRateLimit(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const identifier = `global:${ip}`;
  
  // Allow 100 requests per 15 minutes per IP
  const allowed = rateLimiter.check(identifier, 100, 15 * 60 * 1000);

  if (!allowed) {
    const retryAfter = rateLimiter.getRetryAfter(identifier);
    res.setHeader('Retry-After', retryAfter);
    throw new TooManyRequestsError(
      `Too many requests. Please slow down and try again in ${retryAfter} seconds.`
    );
  }

  next();
}

export default rateLimiter;
