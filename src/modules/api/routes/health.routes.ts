import { Router, Request, Response } from 'express';
import { LLMService } from '../../llm';
import { testDatabaseConnection } from '../../../shared/database';
import { redisClient } from '../../../shared/redis';

export function createHealthRoutes(llmService: LLMService): Router {
  const router = Router();

  /**
   * @swagger
   * /health:
   *   get:
   *     summary: Check API health status
   *     description: Returns the health status of all services including database, LLM provider, and Redis
   *     tags: [Health]
   *     responses:
   *       200:
   *         description: All services are healthy
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/HealthStatus'
   *             example:
   *               status: healthy
   *               timestamp: '2025-12-20T10:30:00.000Z'
   *               services:
   *                 database: up
   *                 llm: up
   *                 redis: up
   *       503:
   *         description: One or more services are unhealthy
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/HealthStatus'
   *             example:
   *               status: unhealthy
   *               timestamp: '2025-12-20T10:30:00.000Z'
   *               services:
   *                 database: up
   *                 llm: down
   *                 redis: up
   */
  router.get('/', async (_req: Request, res: Response) => {
    try {
      const dbHealthy = await testDatabaseConnection();
      const llmHealthy = await llmService.healthCheck();
      const redisHealthy = await redisClient.isAvailable();
      
      // Get Redis stats if available
      const redisStats = redisHealthy ? await redisClient.getStats() : null;

      // Core services must be healthy; Redis is optional
      const healthy = dbHealthy && llmHealthy;

      res.status(healthy ? 200 : 503).json({
        status: healthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        services: {
          database: dbHealthy ? 'up' : 'down',
          llm: llmHealthy ? 'up' : 'down',
          redis: redisHealthy ? 'up' : 'down (optional)',
        },
        ...(redisStats && {
          redis_stats: redisStats,
        }),
      });
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        services: {
          database: 'unknown',
          llm: 'unknown',
          redis: 'unknown',
        },
      });
    }
  });

  return router;
}
