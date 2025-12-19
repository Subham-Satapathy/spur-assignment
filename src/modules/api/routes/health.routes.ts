import { Router, Request, Response } from 'express';
import { LLMService } from '../../llm';
import { testDatabaseConnection } from '../../../shared/database';
import { redisClient } from '../../../shared/redis';

export function createHealthRoutes(llmService: LLMService): Router {
  const router = Router();

  router.get('/', async (_req: Request, res: Response) => {
    const dbHealthy = await testDatabaseConnection();
    const llmHealthy = await llmService.healthCheck();
    const redisHealthy = await redisClient.isAvailable();
    
    // Get Redis stats if available
    const redisStats = redisHealthy ? await redisClient.getStats() : null;

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
  });

  return router;
}
