import express, { Express } from 'express';
import cors from 'cors';
import path from 'path';
import { ChatService } from '../chat';
import { LLMService } from '../llm';
import { createChatRoutes } from './routes/chat.routes';
import { createHealthRoutes } from './routes/health.routes';
import { requestLogger } from './middleware/logger';
import { errorHandler, notFoundHandler } from './middleware/error-handler';

/**
 * Create and configure Express application
 */
export function createApp(chatService: ChatService, llmService: LLMService): Express {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);

  // Serve static files (frontend)
  const publicPath = path.join(__dirname, '..', '..', '..', 'public');
  app.use(express.static(publicPath));

  // API Routes
  app.use('/health', createHealthRoutes(llmService));
  app.use('/chat', createChatRoutes(chatService));

  // Serve index.html for root
  app.get('/', (_req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
  });

  // 404 handler for API routes
  app.use('/api/*', notFoundHandler);
  app.use('/chat/*', notFoundHandler);
  app.use('/health/*', notFoundHandler);

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}
