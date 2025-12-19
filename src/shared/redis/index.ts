import Redis, { RedisOptions } from 'ioredis';
import { config } from '../config';
import logger from '../logger';

/**
 * Redis client optimized for Render free tier
 * - 25MB RAM limit
 * - 50 connection limit
 * - Handles cold starts and disconnections
 */
class RedisClient {
  private client: Redis | null = null;
  private isConnecting = false;
  private connectionError = false;

  /**
   * Get Redis client with lazy initialization
   */
  async getClient(): Promise<Redis | null> {
    if (!config.redis.enabled) {
      return null;
    }

    // Return existing connection
    if (this.client && this.client.status === 'ready') {
      return this.client;
    }

    // Don't retry if we had a connection error
    if (this.connectionError) {
      return null;
    }

    // Avoid concurrent connection attempts
    if (this.isConnecting) {
      await this.waitForConnection();
      return this.client;
    }

    return this.connect();
  }

  /**
   * Initialize Redis connection with Render free tier optimizations
   */
  private async connect(): Promise<Redis | null> {
    if (!config.redis.url) {
      logger.warn('Redis URL not configured');
      return null;
    }

    this.isConnecting = true;

    try {
      const options: RedisOptions = {
        // Render free tier: limit connections (max 50, we use 5)
        maxRetriesPerRequest: 1,
        retryStrategy: (times: number) => {
          // Give up after 3 retries
          if (times > 3) {
            logger.error('Redis connection failed after 3 retries');
            this.connectionError = true;
            return null;
          }
          // Exponential backoff: 100ms, 200ms, 400ms
          return Math.min(times * 100, 1000);
        },
        // Fast timeout for free tier (handles cold starts)
        connectTimeout: 5000,
        // Smaller command timeout
        commandTimeout: 3000,
        // Keep connection alive during inactivity
        keepAlive: 30000,
        // Lazy connect
        lazyConnect: true,
        // Enable offline queue (small size to save memory)
        enableOfflineQueue: true,
        maxLoadingRetryTime: 3000,
      };

      this.client = new Redis(config.redis.url, options);

      // Connection events
      this.client.on('connect', () => {
        logger.info('Redis connected');
        this.connectionError = false;
      });

      this.client.on('ready', () => {
        logger.info('Redis ready');
      });

      this.client.on('error', (err) => {
        logger.error('Redis error', { error: err.message });
        this.connectionError = true;
      });

      this.client.on('close', () => {
        logger.warn('Redis connection closed');
      });

      this.client.on('reconnecting', () => {
        logger.info('Redis reconnecting...');
      });

      // Attempt connection
      await this.client.connect();

      this.isConnecting = false;
      return this.client;
    } catch (error) {
      this.isConnecting = false;
      this.connectionError = true;
      logger.error('Failed to connect to Redis', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  /**
   * Wait for ongoing connection attempt
   */
  private async waitForConnection(maxWait = 5000): Promise<void> {
    const startTime = Date.now();
    while (this.isConnecting && Date.now() - startTime < maxWait) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  /**
   * Get value from cache
   */
  async get(key: string): Promise<string | null> {
    const client = await this.getClient();
    if (!client) return null;

    try {
      return await client.get(key);
    } catch (error) {
      logger.error('Redis GET error', { key, error });
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   * @param key Cache key
   * @param value Value to cache
   * @param ttlSeconds TTL in seconds (keep short for 25MB RAM limit)
   */
  async set(key: string, value: string, ttlSeconds: number): Promise<boolean> {
    const client = await this.getClient();
    if (!client) return false;

    try {
      await client.setex(key, ttlSeconds, value);
      return true;
    } catch (error) {
      logger.error('Redis SET error', { key, error });
      return false;
    }
  }

  /**
   * Delete key from cache
   */
  async del(key: string): Promise<boolean> {
    const client = await this.getClient();
    if (!client) return false;

    try {
      await client.del(key);
      return true;
    } catch (error) {
      logger.error('Redis DEL error', { key, error });
      return false;
    }
  }

  /**
   * Increment counter (for rate limiting)
   */
  async increment(key: string, ttlSeconds: number): Promise<number | null> {
    const client = await this.getClient();
    if (!client) return null;

    try {
      const value = await client.incr(key);
      // Set TTL only on first increment
      if (value === 1) {
        await client.expire(key, ttlSeconds);
      }
      return value;
    } catch (error) {
      logger.error('Redis INCR error', { key, error });
      return null;
    }
  }

  /**
   * Check if Redis is available
   */
  async isAvailable(): Promise<boolean> {
    const client = await this.getClient();
    if (!client) return false;

    try {
      await client.ping();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Gracefully close connection
   */
  async close(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
  }

  /**
   * Get cache statistics (for monitoring)
   */
  async getStats(): Promise<{ memoryUsed: string; connectedClients: number } | null> {
    const client = await this.getClient();
    if (!client) return null;

    try {
      const info = await client.info('memory');
      const clients = await client.info('clients');
      
      const memoryMatch = info.match(/used_memory_human:(.+)/);
      const clientsMatch = clients.match(/connected_clients:(\d+)/);

      return {
        memoryUsed: memoryMatch ? memoryMatch[1].trim() : 'unknown',
        connectedClients: clientsMatch ? parseInt(clientsMatch[1]) : 0,
      };
    } catch (error) {
      logger.error('Redis stats error', { error });
      return null;
    }
  }
}

// Singleton instance
export const redisClient = new RedisClient();
