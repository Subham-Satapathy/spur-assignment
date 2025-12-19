import { Request, Response, NextFunction } from 'express';
import { TooManyRequestsError } from '../../../shared/errors';
import { redisClient } from '../../../shared/redis';
import logger from '../../../shared/logger';

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

  /**
   * Check rate limit using Redis (fallback to in-memory)
   */
  async check(identifier: string, maxRequests: number, windowMs: number): Promise<boolean> {
    // Try Redis first (distributed rate limiting for multi-instance deployments)
    const redisKey = `ratelimit:${identifier}`;
    const ttlSeconds = Math.ceil(windowMs / 1000);
    
    const count = await redisClient.increment(redisKey, ttlSeconds);
    
    if (count !== null) {
      // Redis available
      logger.debug('Rate limit check (Redis)', { identifier, count, max: maxRequests });
      return count <= maxRequests;
    }
    
    // Fallback to in-memory
    logger.debug('Rate limit check (in-memory fallback)', { identifier });
    return this.checkInMemory(identifier, maxRequests, windowMs);
  }

  /**
   * In-memory rate limit check (fallback when Redis unavailable)
   */
  private checkInMemory(identifier: string, maxRequests: number, windowMs: number): boolean {
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

  async getRetryAfter(identifier: string): Promise<number> {
    // Try getting TTL from Redis
    const redisKey = `ratelimit:${identifier}`;
    try {
      const client = await redisClient.getClient();
      if (client) {
        const ttl = await client.ttl(redisKey);
        if (ttl > 0) return ttl;
      }
    } catch (error) {
      logger.debug('Redis TTL check failed, using in-memory');
    }

    // Fallback to in-memory
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
export async function chatRateLimit(req: Request, res: Response, next: NextFunction): Promise<void> {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const identifier = `chat:${ip}`;
  
  // Allow 20 messages per hour per IP
  const allowed = await rateLimiter.check(identifier, 20, 60 * 60 * 1000);

  if (!allowed) {
    const retryAfter = await rateLimiter.getRetryAfter(identifier);
    res.setHeader('Retry-After', retryAfter);
    res.setHeader('X-RateLimit-Limit', '20');
    res.setHeader('X-RateLimit-Remaining', '0');
    res.setHeader('X-RateLimit-Reset', new Date(Date.now() + retryAfter * 1000).toISOString());
    
    throw new TooManyRequestsError(
      `Rate limit exceeded. You can send 20 messages per hour. Try again in ${retryAfter} seconds.`
    );
  }

  // Set rate limit headers
  res.setHeader('X-RateLimit-Limit', '20');
  res.setHeader('X-RateLimit-Remaining', '0'); // Actual count in Redis, placeholder for now
  
  next();
}

// Aggressive rate limiting for new conversations (prevent spam)
export async function conversationRateLimit(req: Request, res: Response, next: NextFunction): Promise<void> {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const identifier = `conversation:${ip}`;
  
  // Allow 5 new conversations per hour per IP
  const allowed = await rateLimiter.check(identifier, 5, 60 * 60 * 1000);

  if (!allowed) {
    const retryAfter = await rateLimiter.getRetryAfter(identifier);
    res.setHeader('Retry-After', retryAfter);
    throw new TooManyRequestsError(
      `Too many conversations created. Limit: 5 per hour. Try again in ${retryAfter} seconds.`
    );
  }

  next();
}

// Global API rate limiting
export async function globalRateLimit(req: Request, res: Response, next: NextFunction): Promise<void> {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const identifier = `global:${ip}`;
  
  // Allow 100 requests per 15 minutes per IP
  const allowed = await rateLimiter.check(identifier, 100, 15 * 60 * 1000);

  if (!allowed) {
    const retryAfter = await rateLimiter.getRetryAfter(identifier);
    res.setHeader('Retry-After', retryAfter);
    throw new TooManyRequestsError(
      `Too many requests. Please slow down and try again in ${retryAfter} seconds.`
    );
  }

  next();
}

export default rateLimiter;
