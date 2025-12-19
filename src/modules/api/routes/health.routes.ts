import { Router, Request, Response } from 'express';
import { LLMService } from '../../llm';
import { testDatabaseConnection } from '../../../shared/database';

/**
 * Create health check routes
 */
export function createHealthRoutes(llmService: LLMService): Router {
  const router = Router();

  /**
   * GET /health
   * Basic health check
   */
  router.get('/', async (_req: Request, res: Response) => {
    const dbHealthy = await testDatabaseConnection();
    const llmHealthy = await llmService.healthCheck();

    const healthy = dbHealthy && llmHealthy;

    res.status(healthy ? 200 : 503).json({
      status: healthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealthy ? 'up' : 'down',
        llm: llmHealthy ? 'up' : 'down',
      },
    });
  });

  return router;
}
