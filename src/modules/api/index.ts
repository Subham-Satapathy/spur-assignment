import express, { Express } from 'express';
import cors from 'cors';
import path from 'path';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { ChatService } from '../chat';
import { LLMService } from '../llm';
import { createChatRoutes } from './routes/chat.routes';
import { createHealthRoutes } from './routes/health.routes';
import { createChannelWebhookRoutes } from './routes/webhook.routes';
import { requestLogger } from './middleware/logger';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { globalRateLimit } from './middleware/rate-limiter';
import { swaggerOptions } from '../../shared/config/swagger';

export function createApp(chatService: ChatService, llmService: LLMService): Express {
  const app = express();

  // Trust proxy - needed for rate limiting by IP on Render
  app.set('trust proxy', 1);

  app.use(cors());
  app.use(express.json({ limit: '10kb' })); // Limit payload size
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));
  app.use(requestLogger);
  
  // Swagger documentation
  const swaggerSpec = swaggerJsdoc(swaggerOptions);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'AI Chat Support API Documentation',
  }));
  
  // Apply global rate limiting to all API routes
  app.use('/chat', globalRateLimit);

  // Serve API routes first
  app.use('/health', createHealthRoutes(llmService));
  app.use('/chat', createChatRoutes(chatService));
  app.use('/webhooks', createChannelWebhookRoutes(chatService)); // Channel webhooks

  // Serve frontend static files from build output
  const frontendPath = path.join(__dirname, '..', '..', '..', 'frontend', 'dist');
  const publicPath = path.join(__dirname, '..', '..', '..', 'public');
  
  // Try to serve from built frontend first, fallback to public
  app.use(express.static(frontendPath));
  app.use(express.static(publicPath));

  // Serve index.html for root and any non-API routes (SPA fallback)
  app.get('*', (_req, res, next) => {
    // Skip API routes
    if (_req.path.startsWith('/health') || _req.path.startsWith('/chat')) {
      return next();
    }
    // Try frontend build first
    const frontendIndex = path.join(frontendPath, 'index.html');
    const publicIndex = path.join(publicPath, 'index.html');
    
    res.sendFile(frontendIndex, (err) => {
      if (err) {
        res.sendFile(publicIndex);
      }
    });
  });

  app.use('/api/*', notFoundHandler);
  app.use('/chat/*', notFoundHandler);
  app.use('/health/*', notFoundHandler);

  app.use(errorHandler);

  return app;
}
