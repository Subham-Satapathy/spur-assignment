import { Router, Request, Response } from 'express';
import { LLMService } from '../../llm';
import { testDatabaseConnection } from '../../../shared/database';

export function createHealthRoutes(llmService: LLMService): Router {
  const router = Router();

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
